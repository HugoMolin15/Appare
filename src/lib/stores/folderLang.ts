import { get } from 'svelte/store';
import { persisted } from '$lib/stores/persisted';
import { currentUserId } from '$lib/stores/auth';
import { pushFolderLangUpdate } from '$lib/services/sync';
import type { ListDisplayLang } from '$lib/stores/settings';

const syncToCloud = () => {
	const uid = get(currentUserId);
	if (uid) pushFolderLangUpdate(uid);
};

// folderId -> display language for that folder's word list
export type FolderLangMap = Record<string, ListDisplayLang>;

export const folderLang = persisted<FolderLangMap>('appare_folder_lang', {}, { onChange: syncToCloud });

export function setFolderLang(folderId: string, lang: ListDisplayLang) {
	folderLang.update((map) => {
		if (lang === 'italiano') {
			const next = { ...map };
			delete next[folderId];
			return next;
		}
		return { ...map, [folderId]: lang };
	});
}

export function clearAllFolderLang() {
	folderLang.set({});
}
