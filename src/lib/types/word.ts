/** All possible word categories */
export const CATEGORIES = {
	VERBI: ['Verbo Godan', 'Verbo Ichidan', 'Verbo Irregolare'],
	AGGETTIVI: ['Aggettivo I', 'Aggettivo Na'],
	'SOSTANTIVI E PRONOMI': ['Sostantivo', 'Pronome', 'Dimostrativo'],
	ALTRO: ['Avverbio', 'Particella', 'Espressione']
} as const;

/** Union of all category values */
export type CategoryValue =
	(typeof CATEGORIES)[keyof typeof CATEGORIES][number];

// ---- Flashcard layout ----
export type CardField = 'italiano' | 'hiragana' | 'katakana' | 'romaji' | 'kanji';
export interface CardDefinition { fields: CardField[]; }
export type CardLayout = CardDefinition[];

export const DEFAULT_CARD_LAYOUT: CardLayout = [
	{ fields: ['italiano'] },
	{ fields: ['hiragana'] },
	{ fields: ['katakana'] },
	{ fields: ['romaji'] },
	{ fields: ['kanji'] },
];

// ---- Word self-assessment score ----
export type WordScore = 'none' | 'unknown' | 'learning' | 'known';

/** A single vocabulary word */
export interface Word {
	id: string;
	italiano: string;
	hiragana: string;
	katakana: string;
	romaji: string;
	kanji: string;
	category?: CategoryValue;  // legacy single category — kept for seed words
	tags?: string[];           // multi-label support (includes category values + custom)
	wordType?: 'word' | 'phrase';
	folderId?: string;   // Optional folder assignment
	createdAt: number;   // Unix ms timestamp
}

/** A folder grouping vocabulary words by topic */
export interface Folder {
	id: string;
	name: string;
	color?: string;
	createdAt: number;
	parentId?: string;
}
