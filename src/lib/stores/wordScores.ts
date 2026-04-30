import { browser } from '$app/environment';
import { persisted } from '$lib/stores/persisted';
import type { WordScore } from '$lib/types/word';

const STORAGE_KEY = 'appare_word_scores';

export const wordScores = persisted<Record<string, WordScore>>(STORAGE_KEY, {});

export function setWordScore(id: string, score: WordScore): void {
	wordScores.update(s => ({ ...s, [id]: score }));
}

export function clearWordScores(): void {
	wordScores.set({});
	if (browser) {
		try { localStorage.removeItem(STORAGE_KEY); } catch {}
	}
}
