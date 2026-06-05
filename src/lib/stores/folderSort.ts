import { get } from 'svelte/store';
import { persisted } from '$lib/stores/persisted';
import { currentUserId } from '$lib/stores/auth';
import { pushFolderSortUpdate } from '$lib/services/sync';

const syncToCloud = () => {
	const uid = get(currentUserId);
	if (uid) pushFolderSortUpdate(uid);
};

export type WordSort = 'newest' | 'oldest' | 'it-az' | 'jp-az';

// folderId -> chosen sort mode for that folder's contents
export type FolderSortMap = Record<string, WordSort>;

export const folderSort = persisted<FolderSortMap>('appare_folder_sort', {}, { onChange: syncToCloud });

export function setFolderSort(folderId: string, mode: WordSort) {
	folderSort.update((map) => {
		if (mode === 'newest') {
			const next = { ...map };
			delete next[folderId];
			return next;
		}
		return { ...map, [folderId]: mode };
	});
}

export function clearAllFolderSort() {
	folderSort.set({});
}
