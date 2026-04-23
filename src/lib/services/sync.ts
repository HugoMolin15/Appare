/**
 * Supabase sync service.
 *
 * Strategy: local-first.
 * - On login: pull from Supabase → merge into local stores (Supabase wins for conflicts).
 * - Write-through: store CRUD functions call push helpers after updating local state.
 * - Seed data (id starts with "seed-") is never synced — it's bundled in code.
 */

import { supabase } from '$lib/supabase';
import { words } from '$lib/stores/words';
import { folders } from '$lib/stores/folders';
import { studyHistory } from '$lib/stores/history';
import { dateColors } from '$lib/stores/dateColors';
import {
	studyGoal,
	japaneseFontSize,
	cardOrder,
	randomCardOrder,
	dailyWordsCount
} from '$lib/stores/settings';
import { get } from 'svelte/store';
import type { Word, Folder } from '$lib/types/word';
import type { StudyHistory } from '$lib/stores/history';

const LOCAL_SYNCED_KEY = 'appare_synced_user_id';

// ---------------------------------------------------------------------------
// Pull — called on login. Supabase → local stores.
// ---------------------------------------------------------------------------

export async function pullFromSupabase(userId: string): Promise<void> {
	const previousUserId = localStorage.getItem(LOCAL_SYNCED_KEY);
	const isNewDevice = previousUserId !== userId;

	if (isNewDevice) {
		// Check if this is a brand-new account (no data in Supabase yet)
		const { count } = await supabase
			.from('words')
			.select('*', { count: 'exact', head: true })
			.eq('user_id', userId);

		if ((count ?? 0) === 0) {
			// New account: push local data up so it isn't lost
			await pushAll(userId);
		} else {
			// Existing account on new device: pull server data
			await Promise.all([
				pullWords(userId),
				pullFolders(userId),
				pullHistory(userId),
				pullDateColors(userId),
				pullSettings(userId)
			]);
		}
		localStorage.setItem(LOCAL_SYNCED_KEY, userId);
	} else {
		// Same device: push any local changes that may have happened offline
		await pushAll(userId);
	}
}

async function pullWords(userId: string) {
	const { data, error } = await supabase
		.from('words')
		.select('*')
		.eq('user_id', userId);
	if (error || !data) return;

	const remoteWords: Word[] = data.map((r) => ({
		id: r.id,
		italiano: r.italiano,
		hiragana: r.hiragana,
		katakana: r.katakana,
		romaji: r.romaji,
		kanji: r.kanji,
		category: r.category ?? undefined,
		wordType: r.word_type ?? undefined,
		folderId: r.folder_id ?? undefined,
		createdAt: r.created_at
	}));

	words.update((local) => {
		const seedWords = local.filter((w) => w.id.startsWith('seed-'));
		return [...seedWords, ...remoteWords];
	});
}

async function pullFolders(userId: string) {
	const { data, error } = await supabase
		.from('folders')
		.select('*')
		.eq('user_id', userId);
	if (error || !data) return;

	const remoteFolders: Folder[] = data.map((r) => ({
		id: r.id,
		name: r.name,
		color: r.color ?? undefined,
		parentId: r.parent_id ?? undefined,
		createdAt: r.created_at
	}));

	folders.update((local) => {
		const seedFolders = local.filter((f) => f.id.startsWith('seed-'));
		return [...seedFolders, ...remoteFolders];
	});
}

async function pullHistory(userId: string) {
	const { data, error } = await supabase
		.from('study_history')
		.select('date, word_ids')
		.eq('user_id', userId);
	if (error || !data) return;

	const remote: StudyHistory = {};
	for (const row of data) {
		remote[row.date] = row.word_ids;
	}

	studyHistory.update((local) => {
		const merged: StudyHistory = { ...local };
		for (const [date, ids] of Object.entries(remote)) {
			const existing = merged[date] ?? [];
			merged[date] = Array.from(new Set([...existing, ...ids]));
		}
		return merged;
	});
}

async function pullDateColors(userId: string) {
	const { data, error } = await supabase
		.from('date_colors')
		.select('key, color')
		.eq('user_id', userId);
	if (error || !data) return;

	const remote: Record<string, string> = {};
	for (const row of data) {
		remote[row.key] = row.color;
	}
	dateColors.set(remote);
}

async function pullSettings(userId: string) {
	const { data, error } = await supabase
		.from('settings')
		.select('*')
		.eq('user_id', userId)
		.single();
	if (error || !data) return;

	studyGoal.set(data.study_goal);
	japaneseFontSize.set(data.japanese_font_size);
	cardOrder.set(data.card_order);
	randomCardOrder.set(data.random_card_order);
	dailyWordsCount.set(data.daily_words_count);
}

// ---------------------------------------------------------------------------
// Push all local data to Supabase (used when same device reconnects)
// ---------------------------------------------------------------------------

async function pushAll(userId: string) {
	await Promise.all([
		pushAllWords(userId),
		pushAllFolders(userId),
		pushAllHistory(userId),
		pushAllDateColors(userId),
		pushSettings(userId)
	]);
}

async function pushAllWords(userId: string) {
	const userWords = get(words).filter((w) => !w.id.startsWith('seed-'));
	if (!userWords.length) return;

	await supabase.from('words').upsert(
		userWords.map((w) => ({
			id: w.id,
			user_id: userId,
			italiano: w.italiano,
			hiragana: w.hiragana,
			katakana: w.katakana,
			romaji: w.romaji,
			kanji: w.kanji,
			category: w.category ?? null,
			word_type: w.wordType ?? null,
			folder_id: w.folderId ?? null,
			created_at: w.createdAt
		}))
	);
}

async function pushAllFolders(userId: string) {
	const userFolders = get(folders).filter((f) => !f.id.startsWith('seed-'));
	if (!userFolders.length) return;

	await supabase.from('folders').upsert(
		userFolders.map((f) => ({
			id: f.id,
			user_id: userId,
			name: f.name,
			color: f.color ?? null,
			parent_id: f.parentId ?? null,
			created_at: f.createdAt
		}))
	);
}

async function pushAllHistory(userId: string) {
	const history = get(studyHistory);
	const rows = Object.entries(history).map(([date, word_ids]) => ({
		user_id: userId,
		date,
		word_ids
	}));
	if (!rows.length) return;
	await supabase.from('study_history').upsert(rows);
}

async function pushAllDateColors(userId: string) {
	const colors = get(dateColors);
	const rows = Object.entries(colors).map(([key, color]) => ({
		user_id: userId,
		key,
		color
	}));
	if (!rows.length) return;
	await supabase.from('date_colors').upsert(rows);
}

async function pushSettings(userId: string) {
	await supabase.from('settings').upsert({
		user_id: userId,
		study_goal: get(studyGoal),
		japanese_font_size: get(japaneseFontSize),
		card_order: get(cardOrder),
		random_card_order: get(randomCardOrder),
		daily_words_count: get(dailyWordsCount)
	});
}

// ---------------------------------------------------------------------------
// Incremental push helpers — called from store CRUD functions
// ---------------------------------------------------------------------------

export async function pushWord(word: Word, userId: string) {
	if (word.id.startsWith('seed-')) return;
	await supabase.from('words').upsert({
		id: word.id,
		user_id: userId,
		italiano: word.italiano,
		hiragana: word.hiragana,
		katakana: word.katakana,
		romaji: word.romaji,
		kanji: word.kanji,
		category: word.category ?? null,
		word_type: word.wordType ?? null,
		folder_id: word.folderId ?? null,
		created_at: word.createdAt
	});
}

export async function deleteWord(wordId: string) {
	if (wordId.startsWith('seed-')) return;
	await supabase.from('words').delete().eq('id', wordId);
}

export async function pushFolder(folder: Folder, userId: string) {
	if (folder.id.startsWith('seed-')) return;
	await supabase.from('folders').upsert({
		id: folder.id,
		user_id: userId,
		name: folder.name,
		color: folder.color ?? null,
		parent_id: folder.parentId ?? null,
		created_at: folder.createdAt
	});
}

export async function deleteFolder(folderId: string) {
	if (folderId.startsWith('seed-')) return;
	await supabase.from('folders').delete().eq('id', folderId);
}

export async function pushHistoryDate(userId: string, date: string, wordIds: string[]) {
	await supabase.from('study_history').upsert({ user_id: userId, date, word_ids: wordIds });
}

export async function pushDateColor(userId: string, key: string, color: string | undefined) {
	if (color) {
		await supabase.from('date_colors').upsert({ user_id: userId, key, color });
	} else {
		await supabase.from('date_colors').delete().eq('user_id', userId).eq('key', key);
	}
}

let settingsDebounceTimer: ReturnType<typeof setTimeout> | null = null;

export function pushSettingsUpdate(userId: string) {
	if (settingsDebounceTimer) clearTimeout(settingsDebounceTimer);
	settingsDebounceTimer = setTimeout(() => {
		pushSettings(userId);
	}, 1000);
}

import { clearWords } from '$lib/stores/words';
import { clearFolders } from '$lib/stores/folders';
import { clearHistory } from '$lib/stores/history';
import { clearDateColors } from '$lib/stores/dateColors';
import { clearSettings } from '$lib/stores/settings';

/**
 * Reset all local stores and clear persistence.
 * Called during logout to prevent data leaking between accounts.
 */
export function clearAllStores() {
	clearWords();
	clearFolders();
	clearHistory();
	clearDateColors();
	clearSettings();
	if (browser) {
		localStorage.removeItem(LOCAL_SYNCED_KEY);
	}
}
