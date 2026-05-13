let _jumpDate: string | null = null;
let _savedPath: string[] = [];
let _fromHeatmap = false;
let _heatmapReturnDate: string | null = null;

export function setCronologiaJumpDate(date: string) {
	_jumpDate = date;
}

/** Use this when jumping from the heatmap — records the return context. */
export function setCronologiaJumpFromHeatmap(date: string) {
	_jumpDate = date;
	_fromHeatmap = true;
	_heatmapReturnDate = date;
}

export function consumeCronologiaJumpDate(): string | null {
	const d = _jumpDate;
	_jumpDate = null;
	return d;
}

/** Returns true (and clears the flag) if cronologia was opened from the heatmap. */
export function consumeFromHeatmap(): boolean {
	const v = _fromHeatmap;
	_fromHeatmap = false;
	return v;
}

/** Returns the heatmap date to restore on the home page (clears after reading). */
export function consumeHeatmapReturnDate(): string | null {
	const v = _heatmapReturnDate;
	_heatmapReturnDate = null;
	return v;
}

export function getCronologiaPath(): string[] {
	return _savedPath;
}

export function setCronologiaPath(path: string[]): void {
	_savedPath = [...path];
}

export function resetCronologiaNav(): void {
	_jumpDate = null;
	_savedPath = [];
	_fromHeatmap = false;
	_heatmapReturnDate = null;
}
