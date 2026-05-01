import { browser } from '$app/environment';
import { get } from 'svelte/store';
import { persisted } from '$lib/stores/persisted';
import { currentUserId } from '$lib/stores/auth';
import { pushWordScoresUpdate } from '$lib/services/sync';
import type { WordScore } from '$lib/types/word';

const STORAGE_KEY = 'appare_word_scores';

const syncToCloud = () => {
	const uid = get(currentUserId);
	if (uid) pushWordScoresUpdate(uid);
};

export const wordScores = persisted<Record<string, WordScore>>(STORAGE_KEY, {}, { onChange: syncToCloud });

export function setWordScore(id: string, score: WordScore): void {
	wordScores.update(s => ({ ...s, [id]: score }));
}

export function clearWordScores(): void {
	wordScores.set({});
	if (browser) {
		try { localStorage.removeItem(STORAGE_KEY); } catch {}
	}
}
