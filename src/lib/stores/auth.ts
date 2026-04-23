import { writable, derived } from 'svelte/store';
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

export async function signInWithEmail(email: string, password: string) {
	const { error } = await supabase.auth.signInWithPassword({ email, password });
	return error;
}

export async function signUpWithEmail(email: string, password: string) {
	const { error } = await supabase.auth.signUp({ email, password });
	return error;
}

export async function signInWithGoogle() {
	const { error } = await supabase.auth.signInWithOAuth({
		provider: 'google',
		options: { redirectTo: `${window.location.origin}/` }
	});
	return error;
}

export async function signInWithApple() {
	const { error } = await supabase.auth.signInWithOAuth({
		provider: 'apple',
		options: { redirectTo: `${window.location.origin}/` }
	});
	return error;
}

import { clearAllStores } from '$lib/services/sync';

export async function signOut() {
	await supabase.auth.signOut();
	clearAllStores();
}
