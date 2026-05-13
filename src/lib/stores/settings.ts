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

/** Whether to randomize word order each time (which word comes next) */
export const randomWordOrder = persisted<boolean>('appare_random_word_order', false, { onChange: syncToCloud });

/** Whether to randomize flashcard card order each time (which card/side shows first) */
export const randomCardOrder = persisted<boolean>('appare_random_card_order', false, { onChange: syncToCloud });

/** User-defined card layout: ordered list of cards, each with one or more fields */
export const cardLayout = persisted<CardLayout>('appare_card_layout', DEFAULT_CARD_LAYOUT, { onChange: syncToCloud });

/** Which field to show as the primary text in word list rows */
export type ListDisplayLang = 'italiano' | 'hiragana' | 'romaji' | 'kanji';
export const listDisplayLang = persisted<ListDisplayLang>('appare_list_display_lang', 'italiano', { onChange: syncToCloud });

/** Per-field flashcard font sizes in rem (independent of global appFontScale) */
export const fontSizeItaliano  = persisted<number>('appare_fs_italiano',  3.0, { onChange: syncToCloud });
export const fontSizeHiragana  = persisted<number>('appare_fs_hiragana',  3.0, { onChange: syncToCloud });
export const fontSizeRomaji    = persisted<number>('appare_fs_romaji',    2.5, { onChange: syncToCloud });
export const fontSizeKanji     = persisted<number>('appare_fs_kanji',     3.0, { onChange: syncToCloud });
export const fontSizeNotes     = persisted<number>('appare_fs_notes',     1.2, { onChange: syncToCloud });

/** Clear settings (used on logout) */
export function clearSettings() {
	appFontScale.set(100);
	studyGoal.set(10);
	cardOrder.set([...DEFAULT_CARD_FIELDS]);
	randomWordOrder.set(false);
	randomCardOrder.set(false);
	cardLayout.set(DEFAULT_CARD_LAYOUT);
	listDisplayLang.set('italiano');
	fontSizeItaliano.set(3.0);
	fontSizeHiragana.set(3.0);
	fontSizeRomaji.set(2.5);
	fontSizeKanji.set(3.0);
	fontSizeNotes.set(1.2);

	if (browser) {
		localStorage.removeItem('appare_font_scale');
		localStorage.removeItem('appare_jp_font_size');
		localStorage.removeItem('appare_study_goal');
		localStorage.removeItem('appare_card_order');
		localStorage.removeItem('appare_random_word_order');
		localStorage.removeItem('appare_random_card_order');
		localStorage.removeItem('appare_daily_words');
		localStorage.removeItem('appare_card_layout');
		localStorage.removeItem('appare_list_display_lang');
		localStorage.removeItem('appare_fs_italiano');
		localStorage.removeItem('appare_fs_hiragana');
		localStorage.removeItem('appare_fs_romaji');
		localStorage.removeItem('appare_fs_kanji');
		localStorage.removeItem('appare_fs_notes');
	}
}
