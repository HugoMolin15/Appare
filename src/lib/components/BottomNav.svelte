<script lang="ts">
	import { page } from '$app/stores';

	const HIDDEN_ROUTES = ['/login', '/studia', '/test-studia'];

	let pathname = $derived($page.url.pathname);
	let hidden = $derived(HIDDEN_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/')));

	const tabs = [
		{
			href: '/',
			label: 'Home',
			exact: true,
			icon: `<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>`,
		},
		{
			href: '/nuova-parola',
			label: 'Nuova parola',
			exact: false,
			icon: `<path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 9a.75.75 0 00-1.5 0v2.25H9a.75.75 0 000 1.5h2.25V15a.75.75 0 001.5 0v-2.25H15a.75.75 0 000-1.5h-2.25V9z" clip-rule="evenodd"/>`,
		},
		{
			href: '/parole',
			label: 'Parole',
			exact: false,
			icon: `<path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z"/>`,
		},
		{
			href: '/impostazioni',
			label: 'Impostazioni',
			exact: true,
			icon: `<path fill-rule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clip-rule="evenodd"/>`,
		},
	];

	function isActive(tab: typeof tabs[number], path: string): boolean {
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
				<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
					{@html tab.icon}
				</svg>
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
		padding-bottom: min(env(safe-area-inset-bottom, 0px), 34px);
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
