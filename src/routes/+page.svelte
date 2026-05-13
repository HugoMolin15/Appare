<script lang="ts">
	import { onMount } from 'svelte';
	import { folderCount } from '$lib/stores/folders';
	import Heatmap from '$lib/components/Heatmap.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { afterNavigate } from '$app/navigation';
	import { consumeHeatmapReturnDate } from '$lib/stores/cronologiaNav';

	let heatmapExpanded = $state(false);
	let heatmapJumpDate = $state<string | null>(null);

	onMount(() => {
		document.body.style.overflow = 'hidden';
		return () => { document.body.style.overflow = ''; };
	});

	afterNavigate(() => {
		const date = consumeHeatmapReturnDate();
		if (date) {
			heatmapJumpDate = date;
			heatmapExpanded = true;
		}
	});
</script>

<svelte:head>
	<title>Anki-jin — Home</title>
</svelte:head>

<div class="page page-enter">
	<!-- Header -->
	<header class="header hide-desktop">
		<div class="header-left">
			<img src="/secondary_icon.png" alt="Appare logo" class="header-icon" />
			<div class="header-text">
				<span class="header-title">APPARE!</span>
				<span class="header-subtitle">Scuola di lingua Giapponese<br>di Tomoko Yamane</span>
			</div>
		</div>
	</header>

	<!-- Study Section (Heatmap will go here) -->
	<section class="daily-section">
		<div class="daily-title-row">
			<h1 class="daily-title">I tuoi progressi</h1>
			<button class="expand-toggle" onclick={() => heatmapExpanded = !heatmapExpanded} aria-label={heatmapExpanded ? 'Comprimi' : 'Espandi calendario'}>
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="transition: transform 0.25s ease; transform: rotate({heatmapExpanded ? 180 : 0}deg)">
					<polyline points="6 9 12 15 18 9" />
				</svg>
			</button>
		</div>

		<Heatmap bind:expanded={heatmapExpanded} jumpDate={heatmapJumpDate} />

		<a href="/studia/seleziona" class="cta-button" style="margin-top: 1rem;">
			Inizia a studiare
		</a>
	</section>

	<!-- Menu List -->
	<nav class="menu-list hide-desktop">
		<a href="/cartelle" class="menu-item">
			<div class="menu-icon">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
					<path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" />
				</svg>
			</div>
			<div class="menu-text">
				<span class="menu-label">Cartelle</span>
				<span class="menu-count">{$folderCount} {$folderCount === 1 ? 'cartella' : 'cartelle'}</span>
			</div>
			<Icon name="chevron-right" class="menu-chevron" />
		</a>

		<a href="/cronologia" class="menu-item">
			<div class="menu-icon">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
					<path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clip-rule="evenodd" />
				</svg>
			</div>
			<div class="menu-text">
				<span class="menu-label">Cronologia</span>
				<span class="menu-count">Vedi sessioni passate</span>
			</div>
			<Icon name="chevron-right" class="menu-chevron" />
		</a>
	</nav>

</div>

<style>
	.page {
		padding: var(--spacing-page);
		padding-bottom: calc(var(--bottom-nav-height) + 1rem);
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
	}

	/* ---- Header ---- */
	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 2rem;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.header-icon {
		height: 48px;
		width: auto;
		flex-shrink: 0;
		object-fit: contain;
	}

	.header-text {
		display: flex;
		flex-direction: column;
		justify-content: center;
		height: 48px;
	}

	.header-title {
		font-size: 1.45rem;
		font-weight: 800;
		line-height: 1.1;
		letter-spacing: -0.02em;
		color: #E8192C;
	}

	.header-subtitle {
		font-size: 0.62rem;
		font-weight: 500;
		color: var(--color-text-secondary);
		line-height: 1.3;
		letter-spacing: 0.01em;
		margin-top: 0.1rem;
	}


	/* ---- Daily Words ---- */
	.daily-section {
		margin-bottom: 1.5rem;
	}

	.daily-title-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.25rem;
	}

	.daily-title {
		font-size: 1.75rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		margin: 0;
	}

	.expand-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--color-text-secondary);
		padding: 0.25rem;
		border-radius: var(--radius-md);
		-webkit-tap-highlight-color: transparent;
		flex-shrink: 0;
	}

	.expand-toggle:active { opacity: 0.5; }

	.cta-button {
		display: block;
		width: 100%;
		padding: 1rem;
		background-color: var(--color-primary);
		color: white;
		border: none;
		border-radius: var(--radius-full);
		font-size: 1.05rem;
		font-weight: 600;
		font-family: var(--font-sans);
		cursor: pointer;
		text-decoration: none;
		text-align: center;
		box-sizing: border-box;
	}

	/* ---- Menu List ---- */
	.menu-list {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.menu-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 0.25rem;
		background: none;
		border: none;
		cursor: pointer;
		width: 100%;
		text-align: left;
		font-family: var(--font-sans);
		border-radius: var(--radius-md);
		text-decoration: none;
		color: inherit;
	}

	.menu-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		color: var(--color-text-secondary);
		flex-shrink: 0;
	}

	.menu-text {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.menu-label {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.menu-count {
		font-size: 0.82rem;
		color: var(--color-text-secondary);
		margin-top: 0.1rem;
	}

	.menu-chevron {
		color: var(--color-text-tertiary);
		flex-shrink: 0;
	}


</style>
