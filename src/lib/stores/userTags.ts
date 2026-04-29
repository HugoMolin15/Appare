import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const STORAGE_KEY = 'appare_user_tags';

function load(): string[] {
	if (!browser) return [];
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch { return []; }
}

export const userTags = writable<string[]>(load());

if (browser) {
	userTags.subscribe(value => {
		try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); } catch {}
	});
}

export function addUserTag(tag: string) {
	userTags.update(tags => tags.includes(tag) ? tags : [...tags, tag]);
}

export function removeUserTag(tag: string) {
	userTags.update(tags => tags.filter(t => t !== tag));
}
