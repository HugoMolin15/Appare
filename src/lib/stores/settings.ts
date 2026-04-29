import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { currentUserId } from '$lib/stores/auth';
import { pushSettingsUpdate } from '$lib/services/sync';
import { type CardLayout, DEFAULT_CARD_LAYOUT } from '$lib/types/word';

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
			const uid = get(currentUserId);
			if (uid) pushSettingsUpdate(uid);
		});
	}

	return store;
}

/** Global font scale percentage (80–130, default 100) */
export const appFontScale = persisted<number>('appare_font_scale', 100);

/** Number of words the user aims to study each day */
export const studyGoal = persisted<number>('appare_study_goal', 10);

/** Order of flashcard sides (array of field keys) */
export const cardOrder = persisted<string[]>('appare_card_order', ['italiano', 'hiragana', 'katakana', 'romaji', 'kanji']);

/** Whether to randomize flashcard side order each time */
export const randomCardOrder = persisted<boolean>('appare_random_card_order', false);

/** User-defined card layout: ordered list of cards, each with one or more fields */
export const cardLayout = persisted<CardLayout>('appare_card_layout', DEFAULT_CARD_LAYOUT);

/** Clear settings (used on logout) */
export function clearSettings() {
	appFontScale.set(100);
	studyGoal.set(10);
	cardOrder.set(['italiano', 'hiragana', 'katakana', 'romaji', 'kanji']);
	randomCardOrder.set(false);
	cardLayout.set(DEFAULT_CARD_LAYOUT);

	if (browser) {
		localStorage.removeItem('appare_font_scale');
		localStorage.removeItem('appare_jp_font_size');
		localStorage.removeItem('appare_study_goal');
		localStorage.removeItem('appare_card_order');
		localStorage.removeItem('appare_random_card_order');
		localStorage.removeItem('appare_daily_words');
		localStorage.removeItem('appare_card_layout');
	}
}
