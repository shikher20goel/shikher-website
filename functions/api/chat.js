// Cloudflare Pages Function — POST /api/chat
// Proxies chat messages to Claude Haiku 4.5. Runs on the Cloudflare Workers runtime.
//
// Required secret (set in Cloudflare Pages dashboard → Settings → Environment variables):
//   ANTHROPIC_API_KEY
//
// Security notes:
// - Caps message count and total length to limit abuse (cost and prompt-injection surface).
// - Same-origin only (no CORS headers) so other sites can't use your key.
// - Returns generic error text to clients; detailed errors only in Worker logs.

import Anthropic from '@anthropic-ai/sdk';

const MAX_MESSAGES = 20;
const MAX_CHARS_PER_MESSAGE = 2000;
const MAX_TOTAL_CHARS = 8000;

// Edit this to teach the bot about Shikher. Longer + more specific = better answers.
const BIO = `
## Name
Shikher Goel

## Short summary
Software engineer who enjoys building thoughtful products and solving complex problems end-to-end.

## Skills
- Languages: JavaScript, TypeScript, Python
- Frontend: React, HTML, CSS
- Backend: Node.js, REST APIs
- Data: SQL, data modeling
- Tools: Git, Docker, Linux
- Practices: system design, problem solving, writing clear code

## Experience
Full-stack development — comfortable across the stack, from UI work to API design to database schemas. Built and shipped features in production environments.

## Education
Background in computer science, with ongoing self-directed learning through side projects, reading papers, and tinkering.

## Interests
Reading, exploring new ideas in software and design, and building small side projects. Writes occasional blog posts about what he's learning.

## Looking for
Interesting engineering problems — especially where product thinking and technical depth meet.

## Contact
Email: shikher20goel@gmail.com
`.trim();

const SYSTEM_PROMPT = `You are a friendly, concise assistant on Shikher Goel's personal website. Your job is to answer visitor questions about Shikher using only the information below. Speak about him in the third person ("Shikher has experience in..."). If a question asks for details you don't have, politely say so and suggest the visitor email Shikher directly at shikher20goel@gmail.com.

Keep answers short — 1 to 3 sentences is ideal. Be warm and natural, not robotic. If someone asks something unrelated to Shikher, gently redirect them back to questions about him.

Never invent facts, credentials, employers, or projects that aren't in the bio below.

# Bio

${BIO}`;

function jsonResponse(body, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': 'no-store',
			'X-Content-Type-Options': 'nosniff',
		},
	});
}

export async function onRequestPost({ request, env }) {
	if (!env.ANTHROPIC_API_KEY) {
		console.error('ANTHROPIC_API_KEY is not set');
		return jsonResponse({ error: 'Server misconfigured.' }, 500);
	}

	let body;
	try {
		body = await request.json();
	} catch {
		return jsonResponse({ error: 'Invalid JSON body.' }, 400);
	}

	const { messages } = body ?? {};

	if (!Array.isArray(messages) || messages.length === 0) {
		return jsonResponse({ error: 'messages (non-empty array) is required.' }, 400);
	}
	if (messages.length > MAX_MESSAGES) {
		return jsonResponse({ error: `messages must have ${MAX_MESSAGES} or fewer entries.` }, 400);
	}

	let totalChars = 0;
	for (const m of messages) {
		if (!m || typeof m.role !== 'string' || typeof m.content !== 'string') {
			return jsonResponse({ error: 'each message must have {role, content} strings.' }, 400);
		}
		if (m.role !== 'user' && m.role !== 'assistant') {
			return jsonResponse({ error: 'role must be "user" or "assistant".' }, 400);
		}
		if (m.content.length > MAX_CHARS_PER_MESSAGE) {
			return jsonResponse({ error: `each message must be ${MAX_CHARS_PER_MESSAGE} chars or fewer.` }, 400);
		}
		totalChars += m.content.length;
	}
	if (totalChars > MAX_TOTAL_CHARS) {
		return jsonResponse({ error: `total message size must be ${MAX_TOTAL_CHARS} chars or fewer.` }, 400);
	}

	const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

	try {
		const response = await client.messages.create({
			model: 'claude-haiku-4-5',
			max_tokens: 512,
			system: [
				{
					type: 'text',
					text: SYSTEM_PROMPT,
					cache_control: { type: 'ephemeral' },
				},
			],
			messages,
		});

		const reply = response.content
			.filter((b) => b.type === 'text')
			.map((b) => b.text)
			.join('');

		return jsonResponse({
			reply,
			usage: {
				input_tokens: response.usage.input_tokens,
				output_tokens: response.usage.output_tokens,
				cache_read_input_tokens: response.usage.cache_read_input_tokens,
				cache_creation_input_tokens: response.usage.cache_creation_input_tokens,
			},
		});
	} catch (err) {
		console.error('chat error:', err);

		if (err instanceof Anthropic.APIError) {
			if (err.status === 429) {
				return jsonResponse({ error: 'Too many requests. Please try again in a moment.' }, 429);
			}
			if (err.status === 401 || err.status === 403) {
				return jsonResponse({ error: 'Server misconfigured (API key).' }, 500);
			}
			return jsonResponse({ error: 'Upstream error.' }, err.status || 502);
		}

		return jsonResponse({ error: 'Something went wrong.' }, 500);
	}
}

// Reject non-POST methods cleanly.
export function onRequest({ request }) {
	return new Response('Method not allowed', {
		status: 405,
		headers: { Allow: 'POST' },
	});
}
