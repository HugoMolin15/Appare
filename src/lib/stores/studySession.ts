import { writable, derived } from 'svelte/store';
import type { Word } from '$lib/types/word';

// IDs of words selected for the current study session
export const selectedWordIds = writable<Set<string>>(new Set());

export function toggleWordSelection(id: string) {
	selectedWordIds.update(current => {
		const next = new Set(current);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		return next;
	});
}

export function setSelectedWords(ids: string[]) {
	selectedWordIds.set(new Set(ids));
}

export function clearSelection() {
	selectedWordIds.set(new Set());
}

// Helper to check if any words are selected
export const hasSelectedWords = derived(selectedWordIds, $ids => $ids.size > 0);
export const selectedCount = derived(selectedWordIds, $ids => $ids.size);
