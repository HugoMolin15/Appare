import { writable, type Writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface PersistedOptions<T> {
	/** If set, debounce localStorage writes by this many ms. */
	debounceMs?: number;
	/** Called on every store change after the initial load (use for cloud sync). */
	onChange?: (value: T) => void;
}

/**
 * Writable store that persists to localStorage. SSR-safe (returns the default
 * value on the server). Optional debounce and onChange hook for cloud sync.
 */
export function persisted<T>(
	key: string,
	defaultValue: T,
	options: PersistedOptions<T> = {}
): Writable<T> {
	const initial = browser
		? (() => {
				try {
					const raw = localStorage.getItem(key);
					return raw !== null ? (JSON.parse(raw) as T) : defaultValue;
				} catch {
					return defaultValue;
				}
			})()
		: defaultValue;

	const store = writable<T>(initial);

	if (browser) {
		const { debounceMs, onChange } = options;
		let saveTimer: ReturnType<typeof setTimeout> | null = null;
		let first = true;

		store.subscribe((value) => {
			const write = () => {
				try {
					localStorage.setItem(key, JSON.stringify(value));
				} catch {}
			};
			if (debounceMs && debounceMs > 0) {
				if (saveTimer) clearTimeout(saveTimer);
				saveTimer = setTimeout(write, debounceMs);
			} else {
				write();
			}

			if (first) { first = false; return; }
			onChange?.(value);
		});
	}

	return store;
}
