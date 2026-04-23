/**
 * Returns the local date string in YYYY-MM-DD format.
 * This avoids timezone issues where UTC might be a different day than local time.
 */
export function getLocalValue(date: Date = new Date()): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}
