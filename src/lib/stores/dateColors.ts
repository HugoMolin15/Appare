import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { supabase } from '$lib/supabase';
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

if (browser) {
	dateColors.subscribe((v) => {
		try { localStorage.setItem(STORAGE_KEY, JSON.stringify(v)); } catch {}
	});
}

export function setDateColor(key: string, color: string | undefined) {
	dateColors.update((current) => {
		const next = { ...current };
		if (color) next[key] = color;
		else delete next[key];
		return next;
	});
	supabase.auth.getSession().then(({ data }) => {
		const uid = data.session?.user.id;
		if (uid) pushDateColor(uid, key, color);
	});
}
