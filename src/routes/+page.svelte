<script lang="ts">
	import Heatmap from '$lib/components/Heatmap.svelte';
	import Icon from '$lib/components/Icon.svelte';

	let heatmapExpanded = $state(false);
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

		<Heatmap bind:expanded={heatmapExpanded} />

		<a href="/studia/seleziona" class="cta-button" style="margin-top: 1rem;">
			Inizia a studiare
		</a>
	</section>

	<!-- Divider -->

	<!-- FAB -->
	<div class="fab-container hide-desktop">
		<a href="/nuova-parola" class="fab">
			<Icon name="plus" size={18} strokeWidth={2.5} />
			Nuova parola
		</a>
	</div>
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

	/* ---- FAB ---- */
	.fab-container {
		position: fixed;
		bottom: calc(var(--bottom-nav-height) + 1rem);
		right: var(--spacing-page);
		z-index: 50;
	}

	.fab {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.875rem 1.5rem;
		border: none;
		border-radius: var(--radius-full);
		font-size: 0.95rem;
		font-weight: 700;
		font-family: var(--font-sans);
		cursor: pointer;
		white-space: nowrap;
		text-decoration: none;
	}
</style>
