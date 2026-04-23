import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { supabase } from '$lib/supabase';
import { pushSettingsUpdate } from '$lib/services/sync';

async function getUserId(): Promise<string | null> {
	const { data } = await supabase.auth.getSession();
	return data.session?.user.id ?? null;
}

/**
 * Creates a writable store that persists to localStorage and syncs to Supabase
 * on change (debounced via pushSettingsUpdate).
 */
function persisted<T>(key: string, defaultValue: T) {
	const initial = browser
		? (() => {
				try {
					const stored = localStorage.getItem(key);
					return stored !== null ? (JSON.parse(stored) as T) : defaultValue;
				} catch {
					return defaultValue;
				}
			})()
		: defaultValue;

	const store = writable<T>(initial);

	if (browser) {
		let first = true;
		store.subscribe((value) => {
			try {
				localStorage.setItem(key, JSON.stringify(value));
			} catch {}

			// Skip the initial subscription fire — no need to sync on load
			if (first) { first = false; return; }
			getUserId().then((uid) => { if (uid) pushSettingsUpdate(uid); });
		});
	}

	return store;
}

/** Number of daily words to study (1–5) */
export const dailyWordsCount = persisted<number>('appare_daily_words', 5);

/** Japanese font size in px for flashcard display */
export const japaneseFontSize = persisted<number>('appare_jp_font_size', 48);

/** Number of words the user aims to study each day */
export const studyGoal = persisted<number>('appare_study_goal', 10);

/** Order of flashcard sides (array of field keys) */
export const cardOrder = persisted<string[]>('appare_card_order', ['italiano', 'hiragana', 'katakana', 'romaji', 'kanji']);

/** Whether to randomize flashcard side order each time */
export const randomCardOrder = persisted<boolean>('appare_random_card_order', false);
