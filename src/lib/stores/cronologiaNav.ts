let _jumpDate: string | null = null;
let _savedPath: string[] = [];

export function setCronologiaJumpDate(date: string) {
	_jumpDate = date;
}

export function consumeCronologiaJumpDate(): string | null {
	const d = _jumpDate;
	_jumpDate = null;
	return d;
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
}
