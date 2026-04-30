<!--
  PageHeader — Reusable sub-page header with back arrow and centered title.
  Usage: <PageHeader title="Impostazioni" backHref="/" />
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		backHref?: string;
		onback?: () => void;
		actions?: Snippet;
		/** Hide the back button on desktop (≥768 px) — use for top-level pages in the sidebar nav */
		hideBackOnDesktop?: boolean;
	}

	let { title, backHref = '/', onback, actions, hideBackOnDesktop = false }: Props = $props();
</script>

<header class="page-header">
	<div class="back-wrap" class:hide-desktop={hideBackOnDesktop}>
		{#if onback}
			<button class="back-btn" onclick={onback} aria-label="Indietro">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="15 18 9 12 15 6" />
				</svg>
			</button>
		{:else}
			<a href={backHref} class="back-btn" aria-label="Indietro">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="15 18 9 12 15 6" />
				</svg>
			</a>
		{/if}
	</div>
	<h1 class="page-header-title">{title}</h1>
	<div class="header-actions">
		{#if actions}
			{@render actions()}
		{:else}
			<div class="header-spacer"></div>
		{/if}
	</div>
</header>

<style>
	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		min-height: 40px;
		margin-bottom: 1.5rem;
	}

	/* back-wrap keeps the 40px slot even when hidden so title stays centred */
	.back-wrap {
		width: 40px;
		flex-shrink: 0;
	}

	.back-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: var(--radius-full);
		color: var(--color-text);
		text-decoration: none;
		background: transparent;
		border: none;
		padding: 0;
		cursor: pointer;
	}

	.page-header-title {
		font-size: 1.125rem;
		font-weight: 700;
		margin: 0;
		letter-spacing: -0.01em;
	}

	.header-actions {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		width: 40px;
	}

	.header-spacer {
		width: 40px;
	}
</style>
