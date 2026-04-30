import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { Word } from '$lib/types/word';
import { currentUserId } from '$lib/stores/auth';
import { pushWord, pushWords, deleteWord as dbDeleteWord } from '$lib/services/sync';
import { UNCATEGORIZED_TAG } from '$lib/constants';

const STORAGE_KEY = 'appare_words';
const SEEDED_KEY = 'appare_seeded';
const SEED_VERSION = '20';

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
	const seedMap = new Map(SEED_WORDS.map((w) => [w.id, w]));

	words.update((current) => {
		// Update categories of existing seed words
		const updated = current.map((w) => {
			const seed = seedMap.get(w.id);
			return seed ? { ...w, category: seed.category } : w;
		});
		const existingIds = new Set(updated.map((w) => w.id));
		const newSeeds = SEED_WORDS.filter((w) => !existingIds.has(w.id));
		return [...updated, ...newSeeds];
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
