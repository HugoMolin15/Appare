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

/** Japanese font size in px for flashcard display */
export const japaneseFontSize = persisted<number>('appare_jp_font_size', 48);

/** Number of words the user aims to study each day */
export const studyGoal = persisted<number>('appare_study_goal', 10);

/** Order of flashcard sides (array of field keys) */
export const cardOrder = persisted<string[]>('appare_card_order', ['italiano', 'hiragana', 'katakana', 'romaji', 'kanji']);

/** Whether to randomize flashcard side order each time */
export const randomCardOrder = persisted<boolean>('appare_random_card_order', false);
/** Clear settings (used on logout) */
export function clearSettings() {
	japaneseFontSize.set(48);
	studyGoal.set(10);
	cardOrder.set(['italiano', 'hiragana', 'katakana', 'romaji', 'kanji']);
	randomCardOrder.set(false);

	if (browser) {
		localStorage.removeItem('appare_jp_font_size');
		localStorage.removeItem('appare_study_goal');
		localStorage.removeItem('appare_card_order');
		localStorage.removeItem('appare_random_card_order');
		localStorage.removeItem('appare_daily_words');
	}
}
