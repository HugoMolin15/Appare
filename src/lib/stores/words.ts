import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { Word } from '$lib/types/word';
import { currentUserId } from '$lib/stores/auth';
import { pushWord, pushWords, deleteWord as dbDeleteWord } from '$lib/services/sync';
import { UNCATEGORIZED_TAG } from '$lib/constants';

const STORAGE_KEY = 'appare_words';
const SEEDED_KEY = 'appare_seeded';
const SEED_VERSION = '28';

function loadStoredWords(): Word[] {
	if (!browser) return [];
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? (JSON.parse(raw) as Word[]) : [];
	} catch {
		return [];
	}
}

/**
 * Lazy-load the 328KB seed word bundle and merge it into the store.
 * Only runs when the stored SEED_VERSION is out of date — on subsequent launches
 * this is a no-op and the dynamic chunk is never fetched.
 * Call once from the root layout after mount.
 */
let seedingPromise: Promise<void> | null = null;
export function ensureSeeded(): Promise<void> {
	if (seedingPromise) return seedingPromise;
	seedingPromise = doSeed();
	return seedingPromise;
}

async function doSeed(): Promise<void> {
	if (!browser) return;
	if (localStorage.getItem(SEEDED_KEY) === SEED_VERSION) return;

	const { SEED_WORDS } = await import('$lib/data/seed-words');

	words.update((current) => {
		// User-created words (random UUID ids) are never touched.
		const manual = current.filter((w) => !w.id.startsWith('seed-'));
		const localSeeds = current.filter((w) => w.id.startsWith('seed-'));

		// Index existing seed words by content (italiano + folder). This lets us
		// preserve each word's id/createdAt — and therefore its study score and
		// position — even when the bundle's positional ids shift (e.g. when a whole
		// folder like "La famiglia" is replaced). Matching by content rather than by
		// id also avoids the corruption that an id-first match causes after a shift.
		const localByContent = new Map<string, Word>();
		for (const w of localSeeds) {
			const key = `${w.italiano}||${w.folderId ?? ''}`;
			if (!localByContent.has(key)) localByContent.set(key, w);
		}

		// Rebuild the seed set from the current bundle. Seed words whose content no
		// longer exists (old "La famiglia" entries, removed verbi/aggettivi sections)
		// simply aren't reproduced here, so they're dropped.
		const usedIds = new Set<string>();
		const rebuiltSeeds = SEED_WORDS.map((s) => {
			const existing = localByContent.get(`${s.italiano}||${s.folderId ?? ''}`);
			if (existing && !usedIds.has(existing.id)) {
				usedIds.add(existing.id);
				return {
					...existing,
					italiano: s.italiano,
					hiragana: s.hiragana,
					katakana: s.katakana,
					romaji: s.romaji,
					kanji: s.kanji,
					category: s.category,
					wordType: s.wordType,
					folderId: s.folderId
				};
			}
			// Brand-new seed word. Guarantee its id is unique in the result so duplicate
			// content keys (or id shifts) can never produce two words with the same id.
			let id = s.id;
			if (usedIds.has(id)) {
				let n = 2;
				while (usedIds.has(`${s.id}-${n}`)) n++;
				id = `${s.id}-${n}`;
			}
			usedIds.add(id);
			return { ...s, id };
		});

		return [...rebuiltSeeds, ...manual];
	});

	localStorage.setItem(SEEDED_KEY, SEED_VERSION);
}

function saveWords(words: Word[]) {
	if (!browser) return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
	} catch {
		// localStorage full — silently fail
	}
}

/** Reactive store holding all vocabulary words */
export const words = writable<Word[]>(loadStoredWords());

// Debounce localStorage writes — store updates are still instant
let saveTimer: ReturnType<typeof setTimeout> | null = null;
if (browser) {
	words.subscribe((value) => {
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(() => saveWords(value), 400);
	});
}

/** Total word count (derived for reactivity) */
export const wordCount = derived(words, ($w) => $w.length);

/** Count of manually added words (excludes seed words) */
export const manualWordCount = derived(words, ($w) => $w.filter((w) => !w.id.startsWith('seed-')).length);

/** Add a new word to the store */
export function addWord(word: Omit<Word, 'id' | 'createdAt'>) {
	const newWord: Word = {
		...word,
		id: crypto.randomUUID(),
		createdAt: Date.now()
	};
	words.update((current) => [...current, newWord]);
	const uid = get(currentUserId);
	if (uid) pushWord(newWord, uid);
}

/** Update an existing word's fields */
export function updateWord(id: string, updates: Omit<Word, 'id' | 'createdAt'>) {
	words.update((current) =>
		current.map((w) => (w.id === id ? { ...w, ...updates } : w))
	);
	const uid = get(currentUserId);
	if (uid) {
		const updated = get(words).find((w) => w.id === id);
		if (updated) pushWord(updated, uid);
	}
}

/** Remove a word by ID */
export function removeWord(id: string) {
	words.update((current) => current.filter((w) => w.id !== id));
	dbDeleteWord(id);
}

/** Assign multiple words to a folder */
export function moveWordsToFolder(wordIds: string[], folderId: string) {
	words.update((current) =>
		current.map((w) => (wordIds.includes(w.id) ? { ...w, folderId } : w))
	);
	const uid = get(currentUserId);
	if (uid) {
		const toSync = get(words).filter((w) => wordIds.includes(w.id));
		pushWords(toSync, uid);
	}
}

/** Remove multiple words from their folders */
export function removeWordsFromFolder(wordIds: string[]) {
	words.update((current) =>
		current.map((w) => (wordIds.includes(w.id) ? { ...w, folderId: undefined } : w))
	);
	const uid = get(currentUserId);
	if (uid) {
		const toSync = get(words).filter((w) => wordIds.includes(w.id));
		pushWords(toSync, uid);
	}
}
/** Strip a custom tag from every word that has it; words left with no tags get UNCATEGORIZED_TAG */
export function removeTagFromAllWords(tag: string) {
	const affectedIds = get(words)
		.filter((w) => w.tags?.includes(tag))
		.map((w) => w.id);
	if (affectedIds.length === 0) return;
	words.update((current) =>
		current.map((w) => {
			if (!w.tags?.includes(tag)) return w;
			const tags = w.tags.filter((t) => t !== tag);
			return { ...w, tags: tags.length > 0 ? tags : [UNCATEGORIZED_TAG] };
		})
	);
	const uid = get(currentUserId);
	if (uid) {
		const idSet = new Set(affectedIds);
		const toSync = get(words).filter((w) => idSet.has(w.id));
		pushWords(toSync, uid);
	}
}

/** Clear all words (used on logout) */
export function clearWords() {
	words.set([]);
	if (browser) {
		localStorage.removeItem(STORAGE_KEY);
		localStorage.removeItem(SEEDED_KEY);
	}
}
