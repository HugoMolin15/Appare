import type { WordScore } from '$lib/types/word';

export type WordSort = 'newest' | 'oldest' | 'it-az' | 'jp-az';

export interface ParoleSaved {
	searchQuery: string;
	scoreFilter: 'all' | WordScore;
	sourceFilter: 'all' | 'app' | 'mine';
	typeFilter: 'all' | 'word' | 'phrase';
	selectedGroups: string[];
	sortMode: WordSort;
}

const DEFAULTS: ParoleSaved = {
	searchQuery: '',
	scoreFilter: 'all',
	sourceFilter: 'all',
	typeFilter: 'all',
	selectedGroups: [],
	sortMode: 'newest'
};

let _saved: ParoleSaved = { ...DEFAULTS };

export function getParoleSaved(): ParoleSaved {
	return _saved;
}

export function setParoleSaved(next: ParoleSaved): void {
	_saved = { ...next, selectedGroups: [...next.selectedGroups] };
}

export function resetParoleNav(): void {
	_saved = { ...DEFAULTS };
}
