import { browser } from '$app/environment';
import { persisted } from '$lib/stores/persisted';
import { setWordScore } from '$lib/stores/wordScores';
import type { WordScore } from '$lib/types/word';

const STORAGE_KEY = 'appare_word_attempts';

export interface WordAttempts {
	correct: number;
	incorrect: number;
}

// Local-only persistence (no cloud sync — requires a Supabase schema change)
export const wordAttempts = persisted<Record<string, WordAttempts>>(STORAGE_KEY, {});

function computeScore(correct: number, incorrect: number): WordScore {
	const total = correct + incorrect;
	if (total === 0) return 'none';
	const ratio = correct / total;
	if (ratio < 0.6) return 'unknown';
	if (ratio <= 0.8) return 'learning';
	return 'known';
}

export function recordAttempt(id: string, wasCorrect: boolean): void {
	wordAttempts.update(s => {
		const cur = s[id] ?? { correct: 0, incorrect: 0 };
		const next = wasCorrect
			? { correct: cur.correct + 1, incorrect: cur.incorrect }
			: { correct: cur.correct, incorrect: cur.incorrect + 1 };
		setWordScore(id, computeScore(next.correct, next.incorrect));
		return { ...s, [id]: next };
	});
}

export function clearWordAttempts(): void {
	wordAttempts.set({});
	if (browser) {
		try { localStorage.removeItem(STORAGE_KEY); } catch {}
	}
}
