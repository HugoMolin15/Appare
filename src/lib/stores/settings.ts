import { get } from 'svelte/store';
import { browser } from '$app/environment';
import { currentUserId } from '$lib/stores/auth';
import { pushSettingsUpdate } from '$lib/services/sync';
import { type CardField, type CardLayout, DEFAULT_CARD_FIELDS, DEFAULT_CARD_LAYOUT } from '$lib/types/word';
import { persisted } from '$lib/stores/persisted';

const syncToCloud = () => {
	const uid = get(currentUserId);
	if (uid) pushSettingsUpdate(uid);
};

/** Global font scale percentage (80–130, default 100) */
export const appFontScale = persisted<number>('appare_font_scale', 100, { onChange: syncToCloud });

/** Number of words the user aims to study each day */
export const studyGoal = persisted<number>('appare_study_goal', 10, { onChange: syncToCloud });

/** Order of flashcard sides (array of field keys) */
export const cardOrder = persisted<CardField[]>('appare_card_order', [...DEFAULT_CARD_FIELDS], { onChange: syncToCloud });

/** Whether to randomize flashcard side order each time */
export const randomCardOrder = persisted<boolean>('appare_random_card_order', false, { onChange: syncToCloud });

/** User-defined card layout: ordered list of cards, each with one or more fields */
export const cardLayout = persisted<CardLayout>('appare_card_layout', DEFAULT_CARD_LAYOUT, { onChange: syncToCloud });

/** Clear settings (used on logout) */
export function clearSettings() {
	appFontScale.set(100);
	studyGoal.set(10);
	cardOrder.set([...DEFAULT_CARD_FIELDS]);
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
