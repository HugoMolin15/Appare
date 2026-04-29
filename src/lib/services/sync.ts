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
	appFontScale,
	cardOrder,
	randomCardOrder
} from '$lib/stores/settings';
import { get } from 'svelte/store';
import { currentUserId } from '$lib/stores/auth';
import type { Word, Folder } from '$lib/types/word';
import type { StudyHistory } from '$lib/stores/history';

const LOCAL_SYNCED_KEY = 'appare_synced_user_id';

// ---------------------------------------------------------------------------
// Pull — called on login. Supabase → local stores.
// ---------------------------------------------------------------------------

export async function pullFromSupabase(userId: string): Promise<void> {
	// 1. Check server state
	const { count, error: countError } = await supabase
		.from('words')
		.select('*', { count: 'exact', head: true })
		.eq('user_id', userId);

	if (get(currentUserId) !== userId) return;

	if (countError) {
		console.error('Sync: Error checking server data', countError);
		return;
	}

	const serverHasData = (count ?? 0) > 0;
	const localUserWords = get(words).filter((w) => !w.id.startsWith('seed-')).length;

	if (serverHasData) {
		// Server has data: pull everything to sync local state
		await Promise.all([
			pullWords(userId),
			pullFolders(userId),
			pullHistory(userId),
			pullDateColors(userId),
			pullSettings(userId)
		]);
	} else if (localUserWords > 0) {
		// Server is empty but we have local data: push it up
		await pushAll(userId);
	}

	if (get(currentUserId) !== userId) return;
	localStorage.setItem(LOCAL_SYNCED_KEY, userId);
}

async function pullWords(userId: string) {
	const { data, error } = await supabase
		.from('words')
		.select('*')
		.eq('user_id', userId);
	if (error || !data) return;
	if (get(currentUserId) !== userId) return;

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
		const localUserWords = local.filter((w) => !w.id.startsWith('seed-'));
		
		// Merge local and remote: remote wins for the same ID
		const merged = new Map();
		localUserWords.forEach(w => merged.set(w.id, w));
		remoteWords.forEach(w => merged.set(w.id, w));
		
		return [...seedWords, ...Array.from(merged.values())];
	});
}

async function pullFolders(userId: string) {
	const { data, error } = await supabase
		.from('folders')
		.select('*')
		.eq('user_id', userId);
	if (error || !data) return;
	if (get(currentUserId) !== userId) return;

	const remoteFolders: Folder[] = data.map((r) => ({
		id: r.id,
		name: r.name,
		color: r.color ?? undefined,
		parentId: r.parent_id ?? undefined,
		createdAt: r.created_at
	}));

	folders.update((local) => {
		const seedFolders = local.filter((f) => f.id.startsWith('seed-'));
		const localUserFolders = local.filter((f) => !f.id.startsWith('seed-'));
		
		// Merge: remote folders win for the same ID
		const merged = new Map();
		localUserFolders.forEach(f => merged.set(f.id, f));
		remoteFolders.forEach(f => merged.set(f.id, f));
		
		return [...seedFolders, ...Array.from(merged.values())];
	});
}

async function pullHistory(userId: string) {
	const { data, error } = await supabase
		.from('study_history')
		.select('date, word_ids')
		.eq('user_id', userId);
	if (error || !data) return;
	if (get(currentUserId) !== userId) return;

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
	if (get(currentUserId) !== userId) return;

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
	if (get(currentUserId) !== userId) return;

	studyGoal.set(data.study_goal);
	// Guard against old 24–72 px values stored before the font-scale migration
	const scale = data.japanese_font_size >= 80 ? data.japanese_font_size : 100;
	appFontScale.set(scale);
	cardOrder.set(data.card_order);
	randomCardOrder.set(data.random_card_order);
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
		japanese_font_size: get(appFontScale),
		card_order: get(cardOrder),
		random_card_order: get(randomCardOrder)
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

export async function pushWords(wordList: Word[], userId: string) {
	const filtered = wordList.filter((w) => !w.id.startsWith('seed-'));
	if (!filtered.length) return;
	await supabase.from('words').upsert(
		filtered.map((w) => ({
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

export async function deleteWord(wordId: string) {
	if (wordId.startsWith('seed-')) return;
	const { error } = await supabase.from('words').delete().eq('id', wordId);
	if (error) console.error('Sync: word delete failed', wordId, error);
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
	const { error } = await supabase.from('folders').delete().eq('id', folderId);
	if (error) console.error('Sync: folder delete failed', folderId, error);
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
		if (get(currentUserId) === userId) pushSettings(userId);
	}, 1000);
}

import { clearWords } from '$lib/stores/words';
import { clearFolders } from '$lib/stores/folders';
import { clearHistory, cancelPendingPushes as cancelHistoryPushes } from '$lib/stores/history';
import { clearDateColors, cancelPendingPushes as cancelDateColorPushes } from '$lib/stores/dateColors';
import { clearSettings } from '$lib/stores/settings';
import { browser } from '$app/environment';

/**
 * Reset all local stores and clear persistence.
 * Called during logout to prevent data leaking between accounts.
 */
export function clearAllStores() {
	cancelHistoryPushes();
	cancelDateColorPushes();
	if (settingsDebounceTimer) {
		clearTimeout(settingsDebounceTimer);
		settingsDebounceTimer = null;
	}
	clearWords();
	clearFolders();
	clearHistory();
	clearDateColors();
	clearSettings();
	if (browser) {
		localStorage.removeItem(LOCAL_SYNCED_KEY);
	}
}
