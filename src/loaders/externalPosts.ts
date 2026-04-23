// Astro content loader that pulls posts from external RSS feeds (Medium, Blogger)
// at build time. Entries are not written to disk — they live in Astro's content store.
//
// Safe-by-design:
// - A single feed failure logs a warning but does NOT break the build
// - HTML is stripped from excerpts (no script tags sneaking through)
// - Excerpts are capped; full text stays on the original site

import { XMLParser } from 'fast-xml-parser';

export type Source = 'medium' | 'blogger';

export interface ExternalPost {
	id: string;
	title: string;
	url: string;
	pubDate: Date;
	excerpt: string;
	source: Source;
}

interface FeedConfig {
	source: Source;
	url: string;
	label: string;
}

const FEEDS: FeedConfig[] = [
	{ source: 'medium', url: 'https://medium.com/feed/@shikher20goel', label: 'Medium' },
	{ source: 'blogger', url: 'https://shikhergoel.blogspot.com/feeds/posts/default?alt=rss', label: 'Blogger' },
];

const EXCERPT_CHARS = 360;

// Minimal, safe HTML -> plaintext. Good enough for excerpts.
function htmlToText(html: string): string {
	if (!html) return '';
	return html
		// drop <script> and <style> bodies entirely
		.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '')
		// collapse block boundaries to spaces so words don't run together
		.replace(/<\/(p|div|h[1-6]|li|br|blockquote)>/gi, ' ')
		.replace(/<br\s*\/?>/gi, ' ')
		// strip remaining tags
		.replace(/<[^>]+>/g, '')
		// decode a handful of common entities
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;|&apos;/g, "'")
		.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
		// collapse whitespace
		.replace(/\s+/g, ' ')
		.trim();
}

function firstParagraph(html: string, fallback: string): string {
	if (!html) return fallback;
	// Grab first <p>...</p> if present, otherwise fall back to full text
	const m = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
	const raw = m ? m[1] : html;
	const text = htmlToText(raw) || htmlToText(fallback);
	if (text.length <= EXCERPT_CHARS) return text;
	// Trim to last sentence boundary within cap
	const trimmed = text.slice(0, EXCERPT_CHARS);
	const lastDot = trimmed.lastIndexOf('. ');
	return (lastDot > EXCERPT_CHARS * 0.5 ? trimmed.slice(0, lastDot + 1) : trimmed) + '…';
}

function slugFromUrl(url: string, source: Source): string {
	try {
		const u = new URL(url);
		// Use pathname's last non-empty segment as the slug base
		const segs = u.pathname.split('/').filter(Boolean);
		const last = segs[segs.length - 1] || 'post';
		// Decode + strip query-ish chars
		const decoded = decodeURIComponent(last).replace(/\.html?$/i, '');
		return `${source}-${decoded}`.slice(0, 120);
	} catch {
		return `${source}-${Math.random().toString(36).slice(2, 10)}`;
	}
}

async function fetchFeed(cfg: FeedConfig): Promise<ExternalPost[]> {
	const res = await fetch(cfg.url, {
		headers: {
			'User-Agent': 'shikher-website-build/1.0 (+https://github.com/shikher20goel/shikher-website)',
			Accept: 'application/rss+xml, application/xml, text/xml, */*',
		},
	});
	if (!res.ok) {
		throw new Error(`HTTP ${res.status} ${res.statusText}`);
	}
	const xml = await res.text();

	const parser = new XMLParser({
		ignoreAttributes: false,
		attributeNamePrefix: '@_',
		// fast-xml-parser keeps namespace-prefixed tags with ':' in the key
		// so <content:encoded> shows up as 'content:encoded'
		textNodeName: '#text',
		cdataPropName: '__cdata',
		trimValues: true,
	});
	const doc = parser.parse(xml);

	const channel = doc?.rss?.channel ?? doc?.channel;
	if (!channel) throw new Error('no <channel> in feed');

	const items = channel.item ? (Array.isArray(channel.item) ? channel.item : [channel.item]) : [];
	const posts: ExternalPost[] = [];

	for (const item of items) {
		const title = unwrap(item.title);
		const link = unwrap(item.link);
		const pubDateRaw = unwrap(item.pubDate) || unwrap(item['dc:date']);
		const contentHtml = unwrap(item['content:encoded']) || unwrap(item.description) || '';
		const descriptionHtml = unwrap(item.description) || '';

		if (!title || !link) continue;
		const pubDate = pubDateRaw ? new Date(pubDateRaw) : new Date();
		if (Number.isNaN(pubDate.getTime())) continue;

		posts.push({
			id: slugFromUrl(link, cfg.source),
			title: String(title).trim(),
			url: String(link).trim(),
			pubDate,
			excerpt: firstParagraph(String(contentHtml), String(descriptionHtml)),
			source: cfg.source,
		});
	}

	return posts;
}

// Some fields come out as {#text, __cdata} depending on CDATA handling; normalize.
function unwrap(v: unknown): string {
	if (v == null) return '';
	if (typeof v === 'string' || typeof v === 'number') return String(v);
	if (typeof v === 'object') {
		const obj = v as Record<string, unknown>;
		if (typeof obj.__cdata === 'string') return obj.__cdata;
		if (typeof obj['#text'] === 'string') return obj['#text'];
	}
	return '';
}

export async function loadExternalPosts(): Promise<ExternalPost[]> {
	const all: ExternalPost[] = [];
	for (const cfg of FEEDS) {
		try {
			const posts = await fetchFeed(cfg);
			console.log(`[externalPosts] ${cfg.label}: ${posts.length} posts fetched`);
			all.push(...posts);
		} catch (err) {
			console.warn(`[externalPosts] ${cfg.label}: skipped (${(err as Error).message})`);
		}
	}
	// Dedupe by id (in case two feeds somehow return the same URL)
	const seen = new Set<string>();
	return all.filter((p) => {
		if (seen.has(p.id)) return false;
		seen.add(p.id);
		return true;
	});
}
