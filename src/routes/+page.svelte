<script lang="ts">
	import Heatmap from '$lib/components/Heatmap.svelte';
	import { afterNavigate } from '$app/navigation';
	import { consumeHeatmapReturnDate } from '$lib/stores/cronologiaNav';

	let heatmapExpanded = $state(false);
	let heatmapJumpDate = $state<string | null>(null);

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

	<!-- Nav Cards -->
	<div class="nav-grid hide-desktop">
		<a href="/cartelle" class="nav-card">
			<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
				<path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" />
			</svg>
			<span class="nav-card-label">Cartelle</span>
		</a>
		<a href="/cronologia" class="nav-card">
			<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
				<path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clip-rule="evenodd" />
			</svg>
			<span class="nav-card-label">Cronologia</span>
		</a>
	</div>
	<a href="/parole" class="nav-card nav-card-wide hide-desktop">
		<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
			<path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z"/>
		</svg>
		<span class="nav-card-label">Tutte le parole</span>
	</a>

</div>

<style>
	.page {
		padding: var(--spacing-page);
		padding-bottom: 1rem;
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

	/* ---- Nav Cards ---- */
	.nav-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.nav-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.6rem;
		aspect-ratio: 1;
		background: var(--color-surface);
		border-radius: var(--radius-lg);
		text-decoration: none;
		color: var(--color-text);
		-webkit-tap-highlight-color: transparent;
	}

	.nav-card-wide {
		aspect-ratio: unset;
		padding: 1.25rem;
		flex-direction: row;
		gap: 0.75rem;
	}

	.nav-card-label {
		font-size: 0.95rem;
		font-weight: 600;
	}


</style>
