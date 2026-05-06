let _jumpDate: string | null = null;

export function setCronologiaJumpDate(date: string) {
	_jumpDate = date;
}

export function consumeCronologiaJumpDate(): string | null {
	const d = _jumpDate;
	_jumpDate = null;
	return d;
}
