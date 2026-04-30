import { persisted } from '$lib/stores/persisted';

// parentKey ('root' for top-level, folderId for subfolders) → ordered folder IDs
export type OrderMap = Record<string, string[]>;

export const folderOrder = persisted<OrderMap>('appare_folder_order', {});

export function moveFolderInOrder(parentKey: string, id: string, direction: 'up' | 'down', currentIds: string[]) {
	folderOrder.update(map => {
		const existing = map[parentKey] ?? [];
		const merged = [
			...existing.filter(x => currentIds.includes(x)),
			...currentIds.filter(x => !existing.includes(x))
		];
		const idx = merged.indexOf(id);
		if (idx === -1) return map;
		if (direction === 'up' && idx === 0) return map;
		if (direction === 'down' && idx === merged.length - 1) return map;
		const next = [...merged];
		const swap = direction === 'up' ? idx - 1 : idx + 1;
		[next[idx], next[swap]] = [next[swap], next[idx]];
		return { ...map, [parentKey]: next };
	});
}

export function snapshotFolderOrder(parentKey: string, ids: string[]) {
	folderOrder.update(map => ({ ...map, [parentKey]: ids }));
}

export function clearFolderOrder(parentKey: string) {
	folderOrder.update(map => {
		const next = { ...map };
		delete next[parentKey];
		return next;
	});
}

export function applyFolderOrder<T extends { id: string; createdAt: number }>(
	items: T[],
	orderMap: OrderMap,
	parentKey: string
): T[] {
	const order = orderMap[parentKey];
	if (!order || order.length === 0) return items;
	const indexMap = new Map(order.map((id, i) => [id, i]));
	return [...items].sort((a, b) => {
		const ai = indexMap.has(a.id) ? indexMap.get(a.id)! : Infinity;
		const bi = indexMap.has(b.id) ? indexMap.get(b.id)! : Infinity;
		if (ai !== bi) return ai - bi;
		return b.createdAt - a.createdAt;
	});
}
