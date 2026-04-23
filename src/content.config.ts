import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { loadExternalPosts } from './loaders/externalPosts';
import { loadYouTubeVideos } from './loaders/youtube';

// Your own long-form posts, written as Markdown/MDX in src/content/blog/.
const blog = defineCollection({
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: z.optional(image()),
		}),
});

// Forbes articles — manually curated because Forbes blocks feeds and
// re-publishing the full text requires a license we don't have.
// Each entry: a short custom teaser paragraph + link out.
const forbes = defineCollection({
	loader: glob({ base: './src/content/forbes', pattern: '**/*.md' }),
	schema: z.object({
		title: z.string(),
		url: z.string().url(),
		pubDate: z.coerce.date(),
		excerpt: z.string(), // your own paragraph — NOT copied from Forbes
	}),
});

// Medium + Blogger — auto-fetched via RSS at build time.
const external = defineCollection({
	loader: async () => {
		const posts = await loadExternalPosts();
		return posts.map((p) => ({
			id: p.id,
			title: p.title,
			url: p.url,
			pubDate: p.pubDate.toISOString(),
			excerpt: p.excerpt,
			source: p.source,
		}));
	},
	schema: z.object({
		title: z.string(),
		url: z.string().url(),
		pubDate: z.coerce.date(),
		excerpt: z.string(),
		source: z.enum(['medium', 'blogger']),
	}),
});

// YouTube videos — auto-fetched via the channel's Atom feed at build time.
const videos = defineCollection({
	loader: async () => {
		const vids = await loadYouTubeVideos();
		return vids.map((v) => ({
			id: v.id,
			videoId: v.videoId,
			title: v.title,
			url: v.url,
			pubDate: v.pubDate.toISOString(),
			description: v.description,
			thumbnail: v.thumbnail,
		}));
	},
	schema: z.object({
		videoId: z.string(),
		title: z.string(),
		url: z.string().url(),
		pubDate: z.coerce.date(),
		description: z.string(),
		thumbnail: z.string().url(),
	}),
});

// Salesforce, AWS, and other certifications — manually curated markdown files.
const certifications = defineCollection({
	loader: glob({ base: './src/content/certifications', pattern: '**/*.md' }),
	schema: z.object({
		title: z.string(),
		issuer: z.enum(['Salesforce', 'AWS', 'Other']),
		dateEarned: z.coerce.date().optional(),
		credentialUrl: z.string().url().optional(),
		badgeUrl: z.string().url().optional(),
	}),
});

// LinkedIn projects / work highlights — manually curated.
const projects = defineCollection({
	loader: glob({ base: './src/content/projects', pattern: '**/*.md' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		url: z.string().url().optional(),
		role: z.string().optional(),
		dateRange: z.string().optional(), // e.g., "2022 – Present"
		tags: z.array(z.string()).default([]),
		featured: z.boolean().default(false),
	}),
});

export const collections = { blog, forbes, external, videos, certifications, projects };
