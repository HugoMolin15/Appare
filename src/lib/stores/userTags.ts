import { persisted } from '$lib/stores/persisted';

export const userTags = persisted<string[]>('appare_user_tags', []);

export function addUserTag(tag: string) {
	userTags.update(tags => tags.includes(tag) ? tags : [...tags, tag]);
}

export function removeUserTag(tag: string) {
	userTags.update(tags => tags.filter(t => t !== tag));
}
