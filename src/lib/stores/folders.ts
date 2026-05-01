import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { Folder } from '$lib/types/word';
import { currentUserId } from '$lib/stores/auth';
import { pushFolder, deleteFolder as dbDeleteFolder } from '$lib/services/sync';
import { MY_WORDS_FOLDER_ID } from '$lib/constants';

const STORAGE_KEY = 'appare_folders';
const SEEDED_KEY = 'appare_folders_seeded';
const SEED_VERSION = '20';

/** Seed folder IDs */
export const SEED_FOLDER_ID = 'seed-folder-luoghi';
export const SEED_FOLDER_GIORNI = 'seed-folder-giorni';
export const SEED_FOLDER_TEMPORALI = 'seed-folder-temporali';
export const SEED_FOLDER_AGG_PIANA_PARENT = 'seed-folder-agg-piana-parent';
export const SEED_FOLDER_AGG_P_PRES_AFF = 'seed-folder-agg-p-pres-aff';
export const SEED_FOLDER_AGG_P_PRES_NEG = 'seed-folder-agg-p-pres-neg';
export const SEED_FOLDER_AGG_P_PASS_AFF = 'seed-folder-agg-p-pass-aff';
export const SEED_FOLDER_AGG_P_PASS_NEG = 'seed-folder-agg-p-pass-neg';
export const SEED_FOLDER_AGGETTIVI = 'seed-folder-aggettivi';
export const SEED_FOLDER_AGG_PIANA = 'seed-folder-agg-piana';
export const SEED_FOLDER_AGG_PRES_AFF = 'seed-folder-agg-pres-aff';
export const SEED_FOLDER_AGG_PRES_NEG = 'seed-folder-agg-pres-neg';
export const SEED_FOLDER_AGG_PASS_AFF = 'seed-folder-agg-pass-aff';
export const SEED_FOLDER_AGG_PASS_NEG = 'seed-folder-agg-pass-neg';
export const SEED_FOLDER_VERBI = 'seed-folder-verbi';
export const SEED_FOLDER_VERBI_DIZIONARIO = 'seed-folder-verbi-dizionario';
export const SEED_FOLDER_VERBI_MASU = 'seed-folder-verbi-masu';
export const SEED_FOLDER_VERBI_TE = 'seed-folder-verbi-te';
export const SEED_FOLDER_VERBI_NAI = 'seed-folder-verbi-nai';
export const SEED_FOLDER_VERBI_TA = 'seed-folder-verbi-ta';
export const SEED_FOLDER_VERBI_PIANA = 'seed-folder-verbi-piana';
export const SEED_FOLDER_VP_AFFERMATIVA = 'seed-folder-vp-affermativa';
export const SEED_FOLDER_VP_NEGATIVA = 'seed-folder-vp-negativa';
export const SEED_FOLDER_VP_PASSATO_AFF = 'seed-folder-vp-passato-aff';
export const SEED_FOLDER_VP_PASSATO_NEG = 'seed-folder-vp-passato-neg';
export const SEED_FOLDER_LEZIONI = 'seed-folder-lezioni';
export const SEED_FOLDER_L04 = 'seed-folder-l04';
export const SEED_FOLDER_L05 = 'seed-folder-l05';
export const SEED_FOLDER_L07 = 'seed-folder-l07';
export const SEED_FOLDER_L08 = 'seed-folder-l08';
export const SEED_FOLDER_L09 = 'seed-folder-l09';
export const SEED_FOLDER_L10 = 'seed-folder-l10';
export const SEED_FOLDER_L11 = 'seed-folder-l11';
export const SEED_FOLDER_L12 = 'seed-folder-l12';
export const SEED_FOLDER_L13 = 'seed-folder-l13';
export const SEED_FOLDER_L14 = 'seed-folder-l14';
export const SEED_FOLDER_L15 = 'seed-folder-l15';
export const SEED_FOLDER_FAMIGLIA = 'seed-folder-famiglia';
export const SEED_FOLDER_SALUTI = 'seed-folder-saluti';
export const SEED_FOLDER_FRASI = 'seed-folder-frasi';
export const SEED_FOLDER_FRASI_L04 = 'seed-folder-frasi-l04';
export const SEED_FOLDER_FRASI_L05 = 'seed-folder-frasi-l05';
export const SEED_FOLDER_FRASI_L06 = 'seed-folder-frasi-l06';
export const SEED_FOLDER_FRASI_L07 = 'seed-folder-frasi-l07';
export const SEED_FOLDER_FRASI_L08 = 'seed-folder-frasi-l08';
export const SEED_FOLDER_FRASI_L09 = 'seed-folder-frasi-l09';
export const SEED_FOLDER_FRASI_L10 = 'seed-folder-frasi-l10';
export const SEED_FOLDER_FRASI_L11 = 'seed-folder-frasi-l11';
export const SEED_FOLDER_FRASI_L12 = 'seed-folder-frasi-l12';

const SEED_FOLDERS: Folder[] = [
	{
		id: SEED_FOLDER_ID,
		name: 'I luoghi, gli spazi, gli edifici',
		createdAt: 1713830400000
	},
	{
		id: SEED_FOLDER_GIORNI,
		name: 'I giorni della settimana e i giorni del mese ed i mesi',
		createdAt: 1713830400001
	},
	{
		id: SEED_FOLDER_TEMPORALI,
		name: 'Termini temporali',
		createdAt: 1713830400001
	},
	{
		id: SEED_FOLDER_AGG_PIANA_PARENT,
		name: 'Aggettivi - Forma piana',
		createdAt: 1713830400006
	},
	{
		id: SEED_FOLDER_AGG_P_PRES_AFF,
		name: 'Presente affermativa',
		createdAt: 1713830400006,
		parentId: SEED_FOLDER_AGG_PIANA_PARENT
	},
	{
		id: SEED_FOLDER_AGG_P_PRES_NEG,
		name: 'Presente negativa',
		createdAt: 1713830400006,
		parentId: SEED_FOLDER_AGG_PIANA_PARENT
	},
	{
		id: SEED_FOLDER_AGG_P_PASS_AFF,
		name: 'Passato affermativo',
		createdAt: 1713830400006,
		parentId: SEED_FOLDER_AGG_PIANA_PARENT
	},
	{
		id: SEED_FOLDER_AGG_P_PASS_NEG,
		name: 'Passato negativo',
		createdAt: 1713830400006,
		parentId: SEED_FOLDER_AGG_PIANA_PARENT
	},
	{
		id: SEED_FOLDER_AGGETTIVI,
		name: 'Aggettivi',
		createdAt: 1713830400005
	},
	{
		id: SEED_FOLDER_AGG_PIANA,
		name: 'Forma piana',
		createdAt: 1713830400005,
		parentId: SEED_FOLDER_AGGETTIVI
	},
	{
		id: SEED_FOLDER_AGG_PRES_AFF,
		name: 'Presente affermativa',
		createdAt: 1713830400005,
		parentId: SEED_FOLDER_AGGETTIVI
	},
	{
		id: SEED_FOLDER_AGG_PRES_NEG,
		name: 'Presente negativa',
		createdAt: 1713830400005,
		parentId: SEED_FOLDER_AGGETTIVI
	},
	{
		id: SEED_FOLDER_AGG_PASS_AFF,
		name: 'Passato affermativo',
		createdAt: 1713830400005,
		parentId: SEED_FOLDER_AGGETTIVI
	},
	{
		id: SEED_FOLDER_AGG_PASS_NEG,
		name: 'Passato negativo',
		createdAt: 1713830400005,
		parentId: SEED_FOLDER_AGGETTIVI
	},
	{
		id: SEED_FOLDER_VERBI,
		name: 'Verbi',
		createdAt: 1713830400004
	},
	{
		id: SEED_FOLDER_VERBI_DIZIONARIO,
		name: 'Forma dizionario',
		createdAt: 1713830400004,
		parentId: SEED_FOLDER_VERBI
	},
	{
		id: SEED_FOLDER_VERBI_MASU,
		name: 'Forma in masu',
		createdAt: 1713830400004,
		parentId: SEED_FOLDER_VERBI
	},
	{
		id: SEED_FOLDER_VERBI_TE,
		name: 'Forma in te',
		createdAt: 1713830400004,
		parentId: SEED_FOLDER_VERBI
	},
	{
		id: SEED_FOLDER_VERBI_NAI,
		name: 'Forma in nai',
		createdAt: 1713830400004,
		parentId: SEED_FOLDER_VERBI
	},
	{
		id: SEED_FOLDER_VERBI_TA,
		name: 'Forma in ta',
		createdAt: 1713830400004,
		parentId: SEED_FOLDER_VERBI
	},
	{
		id: SEED_FOLDER_VERBI_PIANA,
		name: 'Verbi - Forma piana',
		createdAt: 1713830400002
	},
	{
		id: SEED_FOLDER_VP_AFFERMATIVA,
		name: 'Presente affermativa',
		createdAt: 1713830400002,
		parentId: SEED_FOLDER_VERBI_PIANA
	},
	{
		id: SEED_FOLDER_VP_NEGATIVA,
		name: 'Presente negativa',
		createdAt: 1713830400002,
		parentId: SEED_FOLDER_VERBI_PIANA
	},
	{
		id: SEED_FOLDER_VP_PASSATO_AFF,
		name: 'Passato affermativo',
		createdAt: 1713830400002,
		parentId: SEED_FOLDER_VERBI_PIANA
	},
	{
		id: SEED_FOLDER_VP_PASSATO_NEG,
		name: 'Passato negativo',
		createdAt: 1713830400002,
		parentId: SEED_FOLDER_VERBI_PIANA
	},
	{
		id: SEED_FOLDER_LEZIONI,
		name: 'Quaderno di grammatica giapponese',
		createdAt: 1713830400003
	},
	{
		id: SEED_FOLDER_L04,
		name: 'Lezione 04',
		createdAt: 1713830400002,
		parentId: SEED_FOLDER_LEZIONI
	},
	{
		id: SEED_FOLDER_L05,
		name: 'Lezione 05',
		createdAt: 1713830400003,
		parentId: SEED_FOLDER_LEZIONI
	},
	{
		id: SEED_FOLDER_L07,
		name: 'Lezione 07',
		createdAt: 1713830400004,
		parentId: SEED_FOLDER_LEZIONI
	},
	{
		id: SEED_FOLDER_L08,
		name: 'Lezione 08',
		createdAt: 1713830400005,
		parentId: SEED_FOLDER_LEZIONI
	},
	{
		id: SEED_FOLDER_L09,
		name: 'Lezione 09',
		createdAt: 1713830400006,
		parentId: SEED_FOLDER_LEZIONI
	},
	{
		id: SEED_FOLDER_L10,
		name: 'Lezione 10',
		createdAt: 1713830400007,
		parentId: SEED_FOLDER_LEZIONI
	},
	{
		id: SEED_FOLDER_L11,
		name: 'Lezione 11',
		createdAt: 1713830400008,
		parentId: SEED_FOLDER_LEZIONI
	},
	{
		id: SEED_FOLDER_L12,
		name: 'Lezione 12',
		createdAt: 1713830400009,
		parentId: SEED_FOLDER_LEZIONI
	},
	{
		id: SEED_FOLDER_L13,
		name: 'Lezione 13',
		createdAt: 1713830400010,
		parentId: SEED_FOLDER_LEZIONI
	},
	{
		id: SEED_FOLDER_L14,
		name: 'Lezione 14',
		createdAt: 1713830400011,
		parentId: SEED_FOLDER_LEZIONI
	},
	{
		id: SEED_FOLDER_L15,
		name: 'Lezione 15',
		createdAt: 1713830400012,
		parentId: SEED_FOLDER_LEZIONI
	},
	{
		id: SEED_FOLDER_FAMIGLIA,
		name: 'La famiglia',
		createdAt: 1713830400013
	},
	{
		id: SEED_FOLDER_SALUTI,
		name: 'Saluti',
		createdAt: 1713830400014
	},
	{
		id: SEED_FOLDER_FRASI,
		name: 'Frasi',
		createdAt: 1713830400015
	},
	{
		id: SEED_FOLDER_FRASI_L04,
		name: 'Lezione 04',
		createdAt: 1713830400015,
		parentId: SEED_FOLDER_FRASI
	},
	{
		id: SEED_FOLDER_FRASI_L05,
		name: 'Lezione 05',
		createdAt: 1713830400016,
		parentId: SEED_FOLDER_FRASI
	},
	{
		id: SEED_FOLDER_FRASI_L06,
		name: 'Lezione 06',
		createdAt: 1713830400017,
		parentId: SEED_FOLDER_FRASI
	},
	{
		id: SEED_FOLDER_FRASI_L07,
		name: 'Lezione 07',
		createdAt: 1713830400018,
		parentId: SEED_FOLDER_FRASI
	},
	{
		id: SEED_FOLDER_FRASI_L08,
		name: 'Lezione 08',
		createdAt: 1713830400019,
		parentId: SEED_FOLDER_FRASI
	},
	{
		id: SEED_FOLDER_FRASI_L09,
		name: 'Lezione 09',
		createdAt: 1713830400020,
		parentId: SEED_FOLDER_FRASI
	},
	{
		id: SEED_FOLDER_FRASI_L10,
		name: 'Lezione 10',
		createdAt: 1713830400021,
		parentId: SEED_FOLDER_FRASI
	},
	{
		id: SEED_FOLDER_FRASI_L11,
		name: 'Lezione 11',
		createdAt: 1713830400022,
		parentId: SEED_FOLDER_FRASI
	},
	{
		id: SEED_FOLDER_FRASI_L12,
		name: 'Lezione 12',
		createdAt: 1713830400023,
		parentId: SEED_FOLDER_FRASI
	}
];

function loadFolders(): Folder[] {
	if (!browser) return [];
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		let folders: Folder[] = raw ? (JSON.parse(raw) as Folder[]) : [];

		if (localStorage.getItem(SEEDED_KEY) !== SEED_VERSION) {
			const seedMap = new Map(SEED_FOLDERS.map(f => [f.id, f]));
			
			// Update properties of existing seed folders
			folders = folders.map(f => {
				if (seedMap.has(f.id)) {
					const seed = seedMap.get(f.id)!;
					return { ...f, parentId: seed.parentId, name: seed.name };
				}
				return f;
			});

			const existingIds = new Set(folders.map((f) => f.id));
			const newSeeds = SEED_FOLDERS.filter((f) => !existingIds.has(f.id));
			folders = [...folders, ...newSeeds];
			localStorage.setItem(SEEDED_KEY, SEED_VERSION);
			localStorage.setItem(STORAGE_KEY, JSON.stringify(folders));
		}

		// Ensure the protected "Le mie parole" folder always exists
		if (!folders.find(f => f.id === MY_WORDS_FOLDER_ID)) {
			folders = [{ id: MY_WORDS_FOLDER_ID, name: 'Le mie parole', createdAt: Date.now() }, ...folders];
			localStorage.setItem(STORAGE_KEY, JSON.stringify(folders));
		}

		return folders;
	} catch {
		return [];
	}
}

function saveFolders(folders: Folder[]) {
	if (!browser) return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(folders));
	} catch {
		// silently fail
	}
}

/** Reactive store for folders */
export const folders = writable<Folder[]>(loadFolders());

// Debounce localStorage writes — store updates are still instant
let saveTimer: ReturnType<typeof setTimeout> | null = null;
if (browser) {
	folders.subscribe((value) => {
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(() => saveFolders(value), 400);
	});
}

/** Total folder count */
export const folderCount = derived(folders, ($f) => $f.length);

/** Add a new folder */
export function addFolder(name: string, color?: string, parentId?: string): string {
	const id = crypto.randomUUID();
	const folder: Folder = { id, name, color, parentId, createdAt: Date.now() };
	folders.update((current) => [...current, folder]);
	const uid = get(currentUserId);
	if (uid) pushFolder(folder, uid);
	return id;
}

/** Remove a folder by ID */
export function removeFolder(id: string) {
	folders.update((current) => current.filter((f) => f.id !== id));
	dbDeleteFolder(id);
}

/** Update a folder's name and/or color */
export function updateFolder(id: string, name: string, color?: string) {
	folders.update((current) =>
		current.map((f) => (f.id === id ? { ...f, name, color } : f))
	);
	const uid = get(currentUserId);
	if (uid) {
		const updated = get(folders).find((f) => f.id === id);
		if (updated) pushFolder(updated, uid);
	}
}
/** Clear all folders (used on logout) */
export function clearFolders() {
	folders.set([]);
	if (browser) {
		localStorage.removeItem(STORAGE_KEY);
		localStorage.removeItem(SEEDED_KEY);
	}
}
