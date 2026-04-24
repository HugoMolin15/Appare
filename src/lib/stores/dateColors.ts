import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { currentUserId } from '$lib/stores/auth';
import { pushDateColor } from '$lib/services/sync';

const STORAGE_KEY = 'appare_date_colors';

function load(): Record<string, string> {
	if (!browser) return {};
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? (JSON.parse(raw) as Record<string, string>) : {};
	} catch {
		return {};
	}
}

export const dateColors = writable<Record<string, string>>(load());

// Debounce localStorage writes
let saveTimer: ReturnType<typeof setTimeout> | null = null;
if (browser) {
	dateColors.subscribe((v) => {
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(() => {
			try { localStorage.setItem(STORAGE_KEY, JSON.stringify(v)); } catch {}
		}, 400);
	});
}

// Debounce remote pushes per key so rapid color picks coalesce
const pendingPushes = new Map<string, ReturnType<typeof setTimeout>>();

export function setDateColor(key: string, color: string | undefined) {
	dateColors.update((current) => {
		const next = { ...current };
		if (color) next[key] = color;
		else delete next[key];
		return next;
	});
	const uid = get(currentUserId);
	if (!uid) return;
	const existing = pendingPushes.get(key);
	if (existing) clearTimeout(existing);
	pendingPushes.set(key, setTimeout(() => {
		pendingPushes.delete(key);
		pushDateColor(uid, key, color);
	}, 500));
}
/** Clear date colors (used on logout) */
export function clearDateColors() {
	dateColors.set({});
	if (browser) {
		localStorage.removeItem(STORAGE_KEY);
	}
}
