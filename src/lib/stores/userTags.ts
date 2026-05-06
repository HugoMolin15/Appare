import { browser } from '$app/environment';
import { persisted } from '$lib/stores/persisted';

const STORAGE_KEY = 'appare_user_tags';

export const userTags = persisted<string[]>(STORAGE_KEY, []);

export function addUserTag(tag: string) {
	userTags.update(tags => tags.includes(tag) ? tags : [...tags, tag]);
}

export function removeUserTag(tag: string) {
	userTags.update(tags => tags.filter(t => t !== tag));
}

export function clearUserTags(): void {
	userTags.set([]);
	if (browser) {
		try { localStorage.removeItem(STORAGE_KEY); } catch {}
	}
}
