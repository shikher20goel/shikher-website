// YouTube video loader — fetches the channel's Atom feed at build time.
//
// YouTube provides a per-channel Atom feed at:
//   https://www.youtube.com/feeds/videos.xml?channel_id=UCxxxxxxxxxxxxxxxxxxxxxx
// It contains the 15 most-recent videos with title, link, publish date, thumbnail,
// and description. No API key required.

import { XMLParser } from 'fast-xml-parser';
import { YOUTUBE_CHANNEL_ID } from '../consts';

export interface Video {
	id: string;
	videoId: string;
	title: string;
	url: string;
	pubDate: Date;
	description: string;
	thumbnail: string;
}

const DESCRIPTION_CHARS = 280;

function trimText(s: string, max: number): string {
	if (!s) return '';
	const t = s.replace(/\s+/g, ' ').trim();
	if (t.length <= max) return t;
	const cut = t.slice(0, max);
	const lastSpace = cut.lastIndexOf(' ');
	return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut) + '…';
}

function unwrap(v: unknown): string {
	if (v == null) return '';
	if (typeof v === 'string' || typeof v === 'number') return String(v);
	if (typeof v === 'object') {
		const obj = v as Record<string, unknown>;
		if (typeof obj['#text'] === 'string') return obj['#text'];
		if (typeof obj.__cdata === 'string') return obj.__cdata;
	}
	return '';
}

export async function loadYouTubeVideos(): Promise<Video[]> {
	if (!YOUTUBE_CHANNEL_ID) {
		console.warn('[youtube] YOUTUBE_CHANNEL_ID is not set in src/consts.ts — skipping video feed');
		return [];
	}

	const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(YOUTUBE_CHANNEL_ID)}`;

	try {
		const res = await fetch(url, {
			headers: {
				'User-Agent': 'shikher-website-build/1.0',
				Accept: 'application/atom+xml, application/xml, text/xml, */*',
			},
		});
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const xml = await res.text();

		const parser = new XMLParser({
			ignoreAttributes: false,
			attributeNamePrefix: '@_',
			textNodeName: '#text',
			cdataPropName: '__cdata',
			trimValues: true,
		});
		const doc = parser.parse(xml);

		const feed = doc?.feed;
		if (!feed) throw new Error('no <feed> in YouTube Atom');

		const entries = feed.entry ? (Array.isArray(feed.entry) ? feed.entry : [feed.entry]) : [];
		const videos: Video[] = [];

		for (const e of entries) {
			const videoId = unwrap(e['yt:videoId']);
			const title = unwrap(e.title);
			// Atom has multiple <link> elements — grab the first with rel="alternate" (the watch URL)
			const linkAttr = Array.isArray(e.link) ? e.link : e.link ? [e.link] : [];
			const watchUrl =
				linkAttr.find((l: Record<string, unknown>) => l['@_rel'] === 'alternate')?.['@_href'] ||
				(videoId ? `https://www.youtube.com/watch?v=${videoId}` : '');
			const pubRaw = unwrap(e.published);
			const pubDate = pubRaw ? new Date(pubRaw) : new Date();
			if (Number.isNaN(pubDate.getTime())) continue;

			// description lives under media:group > media:description
			const mediaGroup = e['media:group'] || {};
			const rawDesc = unwrap(mediaGroup['media:description']);
			const thumbnail =
				mediaGroup['media:thumbnail']?.['@_url'] ||
				(videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '');

			if (!videoId || !title || !watchUrl) continue;

			videos.push({
				id: `yt-${videoId}`,
				videoId,
				title: String(title).trim(),
				url: String(watchUrl).trim(),
				pubDate,
				description: trimText(rawDesc, DESCRIPTION_CHARS),
				thumbnail: String(thumbnail),
			});
		}

		console.log(`[youtube] fetched ${videos.length} videos`);
		return videos;
	} catch (err) {
		console.warn(`[youtube] skipped (${(err as Error).message})`);
		return [];
	}
}
