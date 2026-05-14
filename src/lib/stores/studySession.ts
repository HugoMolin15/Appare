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

// Return context: set when starting a study session so the finished screen
// can offer a "go back" button to wherever the session was launched from.
export interface StudyReturnContext {
	href: string;       // URL to navigate back to
	label: string;      // button label
	wordIds: string[];  // to restore selection on return
	folderId?: string;  // set only for cartelle/[id] to re-enable selectMode
	folderIds?: string[]; // set only for cartelle to restore multi-folder selection
	subfolderIds?: string[]; // set only for cartelle/[id] to restore subfolder selection
	selectedKeys?: string[]; // set only for cronologia to restore date/period selection
}
export const studyReturnContext = writable<StudyReturnContext | null>(null);
