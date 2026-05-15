<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { House, PlusCircle, Gear } from 'phosphor-svelte';

	const HIDDEN_ROUTES = ['/login', '/studia', '/test-studia', '/parole'];

	let pathname = $derived($page.url.pathname);
	let hidden = $derived(HIDDEN_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/')));

	type Tab = { href: string; label: string; exact: boolean; tab: 'home' | 'nuova' | 'settings' };
	const tabs: Tab[] = [
		{ href: '/', label: 'Home', exact: true, tab: 'home' },
		{ href: '/nuova-parola', label: 'Nuova parola', exact: false, tab: 'nuova' },
		{ href: '/impostazioni', label: 'Impostazioni', exact: true, tab: 'settings' },
	];

	function isActive(tab: Tab, path: string): boolean {
		if (tab.exact) return path === tab.href;
		return path === tab.href || path.startsWith(tab.href + '/');
	}

	// iOS env(safe-area-inset-bottom) sometimes evaluates as 0 on first paint in
	// standalone PWA, causing the nav to render at the wrong height until the user
	// interacts. We measure the value via a probe element and apply it directly to
	// the nav as an inline pixel value, sidestepping the CSS env() timing bug.
	function guessSafeBottom(): number {
		if (typeof window === 'undefined') return 0;
		// Heuristic for iPhones with a home indicator (notch generation onward).
		const ua = navigator.userAgent;
		const isIOS = /iPhone|iPad|iPod/.test(ua);
		if (!isIOS) return 0;
		return Math.max(window.screen.height, window.screen.width) >= 812 ? 34 : 0;
	}

	let safeBottom = $state(guessSafeBottom());

	onMount(() => {
		const probe = document.createElement('div');
		probe.style.cssText =
			'position:fixed;left:0;top:-1000px;width:0;height:env(safe-area-inset-bottom);' +
			'visibility:hidden;pointer-events:none;';
		document.body.appendChild(probe);

		function measure() {
			const h = probe.offsetHeight;
			// Only trust positive values — iOS sometimes reports 0 transiently.
			if (h > 0) {
				safeBottom = h;
				document.documentElement.style.setProperty('--bottom-nav-height', `${56 + h}px`);
			}
		}

		// Try multiple times to catch the value once iOS settles.
		measure();
		requestAnimationFrame(measure);
		setTimeout(measure, 100);
		setTimeout(measure, 500);

		const onResize = () => measure();
		window.addEventListener('resize', onResize);
		window.addEventListener('orientationchange', onResize);

		return () => {
			window.removeEventListener('resize', onResize);
			window.removeEventListener('orientationchange', onResize);
			probe.remove();
		};
	});
</script>

{#if !hidden}
	<nav
		class="bottom-nav hide-desktop"
		style="height: {56 + safeBottom}px; padding-bottom: {safeBottom}px;"
	>
		{#each tabs as tab}
			<a
				href={tab.href}
				class="nav-tab"
				class:active={isActive(tab, pathname)}
				aria-label={tab.label}
			>
				{#if tab.tab === 'home'}
					<House size={22} weight="fill" />
				{:else if tab.tab === 'nuova'}
					<PlusCircle size={22} weight="fill" />
				{:else if tab.tab === 'settings'}
					<Gear size={22} weight="fill" />
				{/if}
				<span class="nav-label">{tab.label}</span>
			</a>
		{/each}
	</nav>
{/if}

<style>
	.bottom-nav {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 40;
		display: flex;
		align-items: stretch;
		background: var(--color-bg);
		border-top: 1px solid var(--color-border);
		box-sizing: border-box;
	}

	.nav-tab {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 3px;
		text-decoration: none;
		color: var(--color-text-tertiary);
		padding: 0.25rem 0;
		transition: color 0.15s ease;
		-webkit-tap-highlight-color: transparent;
	}

	.nav-tab.active {
		color: var(--color-primary);
	}

	.nav-label {
		font-size: 0.6rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		line-height: 1;
	}
</style>
