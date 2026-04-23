// Global site metadata. Import from anywhere via `import { SITE_TITLE } from '../consts'`.

export const SITE_TITLE = 'Shikher Goel';
export const SITE_DESCRIPTION =
	'Enterprise architect, AI practitioner, and writer. Forbes Tech Council member. 19× Salesforce Certified. 2× AWS Certified. IEEE Senior Member.';
export const AUTHOR = 'Shikher Goel';
export const EMAIL = 'shikher20goel@gmail.com';

// Social / platform profiles
export const GITHUB_URL = 'https://github.com/shikher20goel';
export const LINKEDIN_URL = 'https://www.linkedin.com/in/shikhergoel/';
export const YOUTUBE_URL = 'https://www.youtube.com/@shikhergoel1700';
export const MEDIUM_URL = 'https://medium.com/@shikher20goel';
export const BLOGGER_URL = 'https://shikhergoel.blogspot.com/';
export const FORBES_URL = 'https://www.forbes.com/councils/forbestechcouncil/people/shikhergoel/';
export const TRAILBLAZER_URL = 'https://www.salesforce.com/trailblazer/sgoel2';

// YouTube channel ID (required for RSS auto-sync).
// Find it: YouTube Studio → Settings → Channel → Advanced settings → Channel ID.
// Format: UCxxxxxxxxxxxxxxxxxxxxxx (24 chars, starts with UC).
// Leave empty string until provided — the loader short-circuits and /videos shows an empty state.
export const YOUTUBE_CHANNEL_ID = '';

// Short, punchy credential pills used on the home hero.
export const HERO_CREDENTIALS = [
	'Forbes Tech Council',
	'19× Salesforce Certified',
	'2× AWS Certified',
	'IEEE Senior Member',
	'Salesforce CTA Candidate',
];

// Full, labeled membership + fellowship list used on /about and /credentials.
export const MEMBERSHIPS: {
	org: string;
	role: string;
	url?: string;
	year?: string;
}[] = [
	{ org: 'Forbes Technology Council', role: 'Member', url: FORBES_URL },
	{ org: 'IEEE', role: 'Senior Member' },
	{ org: 'Hackathon Raptors', role: 'Fellow' },
	{ org: 'IOSAD', role: 'Fellow' },
];
