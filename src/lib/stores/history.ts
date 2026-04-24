import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import { getLocalValue } from '$lib/utils/date';
import { currentUserId } from '$lib/stores/auth';
import { pushHistoryDate } from '$lib/services/sync';

const STORAGE_KEY = 'appare_study_history';

// A map of YYYY-MM-DD -> Array of Word IDs studied on that day
export type StudyHistory = Record<string, string[]>;

function loadHistory(): StudyHistory {
	if (!browser) return {};
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : {};
	} catch {
		return {};
	}
}

function saveHistory(history: StudyHistory) {
	if (!browser) return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
	} catch {
		// silently fail
	}
}

export const studyHistory = writable<StudyHistory>(loadHistory());

// Debounce localStorage writes
let saveTimer: ReturnType<typeof setTimeout> | null = null;
if (browser) {
	studyHistory.subscribe((value) => {
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(() => saveHistory(value), 400);
	});
}

// Debounce remote pushes per date — coalesces rapid recordStudy() calls
const pendingPushes = new Map<string, ReturnType<typeof setTimeout>>();
function schedulePush(uid: string, date: string, ids: string[]) {
	const existing = pendingPushes.get(date);
	if (existing) clearTimeout(existing);
	pendingPushes.set(date, setTimeout(() => {
		pendingPushes.delete(date);
		pushHistoryDate(uid, date, ids);
	}, 500));
}

/**
 * Record that a user studied a specific list of words today.
 */
export function recordStudy(wordIds: string[]) {
	if (!wordIds || wordIds.length === 0) return;

	const today = getLocalValue();
	let updatedIds: string[] = [];
	studyHistory.update(history => {
		const existing = history[today] || [];
		updatedIds = Array.from(new Set([...existing, ...wordIds]));
		return { ...history, [today]: updatedIds };
	});

	const uid = get(currentUserId);
	if (uid && updatedIds.length) schedulePush(uid, today, updatedIds);
}

/**
 * Helper to get all word IDs that have EVER been studied.
 * Useful for filtering the global "Inizia a studiare" pool.
 */
export const allStudiedWordIds = derived(studyHistory, ($history) => {
	const allIds = new Set<string>();
	Object.values($history).forEach(ids => {
		ids.forEach(id => allIds.add(id));
	});
	return allIds;
});
/** Clear history (used on logout) */
export function clearHistory() {
	studyHistory.set({});
	if (browser) {
		localStorage.removeItem(STORAGE_KEY);
	}
}
