import { writable, derived, get } from 'svelte/store';
import type { User } from '@supabase/supabase-js';
import { supabase, supabaseReady } from '$lib/supabase';
import { browser } from '$app/environment';

export const currentUser = writable<User | null>(null);
export const authLoading = writable(true);

if (browser) {
	if (!supabaseReady) {
		// Supabase not configured — skip auth, stay on app as guest
		authLoading.set(false);
	} else {
		supabase.auth.getSession().then(({ data }) => {
			currentUser.set(data.session?.user ?? null);
			authLoading.set(false);
		});

		supabase.auth.onAuthStateChange((_event, session) => {
			currentUser.set(session?.user ?? null);
		});
	}
}

export const isLoggedIn = derived(currentUser, ($u) => $u !== null);

/** Single source of truth for the current user's ID — derived from the one auth listener above. */
export const currentUserId = derived(currentUser, ($u) => $u?.id ?? null);

export async function signInWithEmail(email: string, password: string) {
	const { error } = await supabase.auth.signInWithPassword({ email, password });
	return error;
}

export async function signUpWithEmail(email: string, password: string) {
	const { error } = await supabase.auth.signUp({ email, password });
	return error;
}

import { clearAllStores, flushPendingSettingsPush } from '$lib/services/sync';

export async function signOut() {
	// Push any pending (debounced) settings change while still authenticated,
	// otherwise clearAllStores cancels it and the change is lost on next login.
	const uid = get(currentUserId);
	if (uid) {
		try { await flushPendingSettingsPush(uid); } catch {}
	}
	await supabase.auth.signOut();
	clearAllStores();
}
