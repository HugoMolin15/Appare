<script lang="ts">
	import { page } from '$app/stores';
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
</script>

{#if !hidden}
	<nav class="bottom-nav hide-desktop">
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
		padding-bottom: env(safe-area-inset-bottom, 0px);
	}

	.nav-tab {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 56px;
		gap: 3px;
		text-decoration: none;
		color: var(--color-text-tertiary);
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
