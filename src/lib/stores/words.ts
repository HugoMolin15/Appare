import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { Word } from '$lib/types/word';
import { SEED_WORDS } from '$lib/data/seed-words';
import { supabase } from '$lib/supabase';
import { pushWord, deleteWord as dbDeleteWord } from '$lib/services/sync';

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

async function getUserId(): Promise<string | null> {
	const { data } = await supabase.auth.getSession();
	return data.session?.user.id ?? null;
}

/** Reactive store holding all vocabulary words */
export const words = writable<Word[]>(loadWords());

// Auto-persist on every change
if (browser) {
	words.subscribe(saveWords);
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
	getUserId().then((uid) => { if (uid) pushWord(newWord, uid); });
}

/** Update an existing word's fields */
export function updateWord(id: string, updates: Omit<Word, 'id' | 'createdAt'>) {
	words.update((current) =>
		current.map((w) => (w.id === id ? { ...w, ...updates } : w))
	);
	getUserId().then((uid) => {
		if (!uid) return;
		const updated = get(words).find((w) => w.id === id);
		if (updated) pushWord(updated, uid);
	});
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
	getUserId().then((uid) => {
		if (!uid) return;
		const all = get(words);
		wordIds.forEach((id) => {
			const w = all.find((x) => x.id === id);
			if (w) pushWord(w, uid);
		});
	});
}

/** Remove multiple words from their folders */
export function removeWordsFromFolder(wordIds: string[]) {
	words.update((current) =>
		current.map((w) => (wordIds.includes(w.id) ? { ...w, folderId: undefined } : w))
	);
	getUserId().then((uid) => {
		if (!uid) return;
		const all = get(words);
		wordIds.forEach((id) => {
			const w = all.find((x) => x.id === id);
			if (w) pushWord(w, uid);
		});
	});
}
