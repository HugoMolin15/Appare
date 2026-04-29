<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { currentUser, authLoading } from '$lib/stores/auth';
	import { pullFromSupabase } from '$lib/services/sync';
	import { supabaseReady } from '$lib/supabase';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { ensureSeeded } from '$lib/stores/words';

	let { children } = $props();
	let path = $derived($page.url.pathname);
	let syncedUserId = $state<string | null>(null);

	$effect(() => {
		if (!browser || !supabaseReady) return;

		if ($currentUser && $currentUser.id !== syncedUserId) {
			syncedUserId = $currentUser.id;
			pullFromSupabase($currentUser.id).catch(() => {});
		}
	});

	// Block iOS left-edge swipe-back gesture globally
	onMount(() => {
		// Lazy-load and merge the seed word bundle (no-op after first launch at the current SEED_VERSION)
		ensureSeeded();

		function blockEdgeSwipe(e: TouchEvent) {
			if (e.touches[0].clientX < 30) e.preventDefault();
		}
		document.addEventListener('touchstart', blockEdgeSwipe, { passive: false });
		return () => document.removeEventListener('touchstart', blockEdgeSwipe);
	});

	let isLoginPage = $derived(path === '/login');
</script>

<div class="app-shell safe-top safe-bottom">
	<aside class="sidebar" class:hidden={isLoginPage}>
		<div class="sidebar-logo">
			<span class="sidebar-jp">日本語</span>
			<span class="sidebar-title">Anki-jin</span>
		</div>

		<nav class="sidebar-nav">
			<a href="/" class="sidebar-link" class:active={path === '/' || path.startsWith('/studia')}>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
				Home
			</a>
			<a href="/parole" class="sidebar-link" class:active={path.startsWith('/parole') || path.startsWith('/nuova-parola')}>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z"/></svg>
				Tutte le parole
			</a>
			<a href="/cartelle" class="sidebar-link" class:active={path.startsWith('/cartelle')}>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/></svg>
				Cartelle
			</a>
			<a href="/cronologia" class="sidebar-link" class:active={path.startsWith('/cronologia')}>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clip-rule="evenodd"/></svg>
				Cronologia
			</a>
		</nav>

		<div class="sidebar-bottom">
			<a href="/nuova-parola" class="sidebar-new-btn">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
				Nuova parola
			</a>
			<a href="/impostazioni" class="sidebar-link sidebar-settings" class:active={path === '/impostazioni'}>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clip-rule="evenodd"/></svg>
				Impostazioni
			</a>
		</div>
	</aside>

	<main class="main-content">
		{@render children()}
	</main>
</div>

<style>
	/* Phone: hide sidebar, no flex layout */
	.sidebar { display: none; }
	.main-content { flex: 1; min-width: 0; }

	.hidden { display: none !important; }

	@media (min-width: 768px) {
		.sidebar {
			display: flex;
			flex-direction: column;
			width: 220px;
			flex-shrink: 0;
			height: 100dvh;
			position: sticky;
			top: 0;
			border-right: 1px solid var(--color-border);
			padding: 1.75rem 1rem;
			box-sizing: border-box;
			overflow-y: auto;
			gap: 0;
		}

		.main-content {
			flex: 1;
			min-width: 0;
			height: 100dvh;
			overflow-y: auto;
		}
	}

	@media (min-width: 1280px) {
		.sidebar {
			width: 260px;
			padding: 2rem 1.25rem;
		}
	}

	.sidebar-logo {
		display: flex;
		flex-direction: column;
		padding: 0 0.5rem;
		margin-bottom: 2rem;
	}

	.sidebar-jp {
		font-size: 0.72rem;
		font-weight: 500;
		color: var(--color-text-secondary);
		letter-spacing: 0.02em;
		font-family: var(--font-jp);
	}

	.sidebar-title {
		font-size: 1.5rem;
		font-weight: 800;
		letter-spacing: -0.02em;
		line-height: 1.1;
		color: var(--color-text);
	}

	.sidebar-nav {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
	}

	.sidebar-link {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.65rem 0.75rem;
		border-radius: var(--radius-md);
		text-decoration: none;
		color: var(--color-text-secondary);
		font-size: 0.9rem;
		font-weight: 500;
		transition: background-color 0.15s ease, color 0.15s ease;
	}

	.sidebar-link:hover {
		background-color: var(--color-surface);
		color: var(--color-text);
	}

	.sidebar-link.active {
		background-color: var(--color-surface);
		color: var(--color-primary);
		font-weight: 700;
	}

	.sidebar-link.active svg {
		color: var(--color-primary);
	}

	.sidebar-bottom {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding-top: 1rem;
		border-top: 1px solid var(--color-border);
	}

	.sidebar-new-btn {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		padding: 0.75rem;
		background-color: var(--color-primary);
		color: white;
		border-radius: var(--radius-md);
		text-decoration: none;
		font-size: 0.9rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
		transition: background-color 0.15s ease;
	}

	.sidebar-new-btn:hover {
		background-color: var(--color-primary-light);
	}

	.sidebar-settings {
		color: var(--color-text-secondary);
	}
</style>
