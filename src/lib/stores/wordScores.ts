import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { currentUserId } from '$lib/stores/auth';
import type { WordScore } from '$lib/types/word';

const STORAGE_KEY = 'appare_word_scores';

function loadScores(): Record<string, WordScore> {
	if (!browser) return {};
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		return stored ? JSON.parse(stored) : {};
	} catch {
		return {};
	}
}

const store = writable<Record<string, WordScore>>(loadScores());

if (browser) {
	store.subscribe((value) => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
		} catch {}
	});
}

export const wordScores = store;

export function setWordScore(id: string, score: WordScore): void {
	wordScores.update(s => ({ ...s, [id]: score }));
}

export function clearWordScores(): void {
	wordScores.set({});
	if (browser) {
		try { localStorage.removeItem(STORAGE_KEY); } catch {}
	}
}
