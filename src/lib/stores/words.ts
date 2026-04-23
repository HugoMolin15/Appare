import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { Word } from '$lib/types/word';
import { SEED_WORDS } from '$lib/data/seed-words';
import { supabase } from '$lib/supabase';
import { pushWord, pushWords, deleteWord as dbDeleteWord } from '$lib/services/sync';

const STORAGE_KEY = 'appare_words';
const SEEDED_KEY = 'appare_seeded';
const SEED_VERSION = '16';

function loadWords(): Word[] {
	if (!browser) return [];
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		let words: Word[] = raw ? (JSON.parse(raw) as Word[]) : [];

		// Seed pre-loaded words (versioned — bumps when new data is added)
		if (localStorage.getItem(SEEDED_KEY) !== SEED_VERSION) {
			const seedMap = new Map(SEED_WORDS.map(w => [w.id, w]));

			// Update categories of existing seed words
			words = words.map(w => {
				if (seedMap.has(w.id)) {
					return { ...w, category: seedMap.get(w.id)!.category };
				}
				return w;
			});

			const existingIds = new Set(words.map((w) => w.id));
			const newSeeds = SEED_WORDS.filter((w) => !existingIds.has(w.id));
			words = [...words, ...newSeeds];
			localStorage.setItem(SEEDED_KEY, SEED_VERSION);
			localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
		}

		return words;
	} catch {
		return [];
	}
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
export const words = writable<Word[]>(loadWords());

// Cache the current user ID to avoid a session round-trip on every write
let cachedUserId: string | null = null;
if (browser) {
	supabase.auth.getSession().then(({ data }) => {
		cachedUserId = data.session?.user.id ?? null;
	});
	supabase.auth.onAuthStateChange((_e, session) => {
		cachedUserId = session?.user.id ?? null;
	});
}

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
	if (cachedUserId) pushWord(newWord, cachedUserId);
}

/** Update an existing word's fields */
export function updateWord(id: string, updates: Omit<Word, 'id' | 'createdAt'>) {
	words.update((current) =>
		current.map((w) => (w.id === id ? { ...w, ...updates } : w))
	);
	if (cachedUserId) {
		const updated = get(words).find((w) => w.id === id);
		if (updated) pushWord(updated, cachedUserId);
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
	if (cachedUserId) {
		const toSync = get(words).filter((w) => wordIds.includes(w.id));
		pushWords(toSync, cachedUserId);
	}
}

/** Remove multiple words from their folders */
export function removeWordsFromFolder(wordIds: string[]) {
	words.update((current) =>
		current.map((w) => (wordIds.includes(w.id) ? { ...w, folderId: undefined } : w))
	);
	if (cachedUserId) {
		const toSync = get(words).filter((w) => wordIds.includes(w.id));
		pushWords(toSync, cachedUserId);
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
