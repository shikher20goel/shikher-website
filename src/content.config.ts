import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { loadExternalPosts } from './loaders/externalPosts';

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

export const collections = { blog, forbes, external };
