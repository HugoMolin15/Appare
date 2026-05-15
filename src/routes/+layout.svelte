<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { currentUser, authLoading } from '$lib/stores/auth';
	import { pullFromSupabase } from '$lib/services/sync';
	import { supabaseReady } from '$lib/supabase';
	import { browser } from '$app/environment';
	import { onMount, tick } from 'svelte';
	import { beforeNavigate, afterNavigate } from '$app/navigation';
	import { ensureSeeded } from '$lib/stores/words';
	import { appFontScale } from '$lib/stores/settings';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import { House, BookOpen, Folder, Clock, Plus, Gear } from 'phosphor-svelte';

	$effect(() => {
		if (!browser) return;
		document.documentElement.style.fontSize = $appFontScale + '%';
	});

	let { children } = $props();
	let path = $derived($page.url.pathname);
	let syncedUserId = $state<string | null>(null);

	// ---- Scroll restoration ----
	// Saves scroll position before every navigation and restores it when returning.
	// Handles both desktop (.main-content overflow container) and mobile (window).
	let mainContent = $state<HTMLElement | undefined>(undefined);
	const scrollHistory = new Map<string, number>();

	beforeNavigate(({ from }) => {
		if (!browser || !from) return;
		const pos = mainContent ? mainContent.scrollTop : window.scrollY;
		scrollHistory.set(from.url.href, pos);
	});

	afterNavigate(async ({ to, type }) => {
		if (!browser || !to || type === 'enter') return;
		await tick();
		const pos = scrollHistory.get(to.url.href) ?? 0;
		if (mainContent) {
			mainContent.scrollTop = pos;
		} else {
			window.scrollTo(0, pos);
		}
	});

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

		// Track the visual viewport via the VisualViewport API. When the on-screen
		// keyboard opens, vv.height shrinks but window.innerHeight may not (depending
		// on iOS' interactive-widget mode). We mirror vv.height to --visual-vh so the
		// study page can shrink its container, and toggle `keyboard-open` for the
		// CSS that hides the assess buttons.
		const vv = window.visualViewport;
		const updateVV = () => {
			const h = vv ? vv.height : window.innerHeight;
			document.documentElement.style.setProperty('--visual-vh', `${h}px`);
			document.documentElement.classList.toggle('keyboard-open', window.innerHeight - h > 100);
		};
		updateVV();
		vv?.addEventListener('resize', updateVV);
		window.addEventListener('resize', updateVV);

		function blockEdgeSwipe(e: TouchEvent) {
			if (e.touches[0].clientX < 30) e.preventDefault();
		}
		document.addEventListener('touchstart', blockEdgeSwipe, { passive: false });
		return () => {
			vv?.removeEventListener('resize', updateVV);
			window.removeEventListener('resize', updateVV);
			document.removeEventListener('touchstart', blockEdgeSwipe);
		};
	});

	let isLoginPage = $derived(path === '/login');
</script>

<div class="app-shell safe-top">
	<aside class="sidebar" class:hidden={isLoginPage}>
		<div class="sidebar-logo">
			<img src="/secondary_icon.png" alt="Appare logo" class="sidebar-icon" />
			<div class="sidebar-text">
				<span class="sidebar-title">Appare</span>
				<span class="sidebar-subtitle">Scuola di lingua Giapponese<br>di Tomoko Yamane</span>
			</div>
		</div>

		<nav class="sidebar-nav">
			<a href="/" class="sidebar-link" class:active={path === '/' || path.startsWith('/studia')}>
				<House size={20} weight="fill" />
				Home
			</a>
			<a href="/parole" class="sidebar-link" class:active={path.startsWith('/parole') || path.startsWith('/nuova-parola')}>
				<BookOpen size={20} weight="fill" />
				Tutte le parole
			</a>
			<a href="/cartelle" class="sidebar-link" class:active={path.startsWith('/cartelle')}>
				<Folder size={20} weight="fill" />
				Cartelle
			</a>
			<a href="/cronologia" class="sidebar-link" class:active={path.startsWith('/cronologia')}>
				<Clock size={20} weight="fill" />
				Cronologia
			</a>
		</nav>

		<div class="sidebar-bottom">
			<a href="/nuova-parola" class="sidebar-new-btn">
				<Plus size={16} weight="bold" />
				Nuova parola
			</a>
			<a href="/impostazioni" class="sidebar-link sidebar-settings" class:active={path === '/impostazioni'}>
				<Gear size={20} weight="fill" />
				Impostazioni
			</a>
		</div>
	</aside>

	<main class="main-content" bind:this={mainContent}>
		{@render children()}
	</main>

	<BottomNav />
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
		flex-direction: row;
		align-items: center;
		gap: 0.6rem;
		padding: 0 0.5rem;
		margin-bottom: 2rem;
	}

	.sidebar-icon {
		height: 44px;
		width: auto;
		flex-shrink: 0;
		object-fit: contain;
	}

	.sidebar-text {
		display: flex;
		flex-direction: column;
		justify-content: center;
		height: 44px;
	}

	.sidebar-title {
		font-size: 1.3rem;
		font-weight: 800;
		letter-spacing: -0.02em;
		line-height: 1.1;
		color: #E8192C;
	}

	.sidebar-subtitle {
		font-size: 0.58rem;
		font-weight: 500;
		color: var(--color-text-secondary);
		line-height: 1.3;
		letter-spacing: 0.01em;
		margin-top: 0.1rem;
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
