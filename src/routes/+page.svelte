<script lang="ts">
	import Heatmap from '$lib/components/Heatmap.svelte';
	import { afterNavigate } from '$app/navigation';
	import { consumeHeatmapReturnDate } from '$lib/stores/cronologiaNav';
	import { Folder, Clock, Books, CaretDown } from 'phosphor-svelte';

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
				<CaretDown size={18} weight="bold" style="transition: transform 0.25s ease; transform: rotate({heatmapExpanded ? 180 : 0}deg)" />
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
			<Folder size={32} weight="fill" color="#0EA5E9" />
			<span class="nav-card-label">Cartelle</span>
		</a>
		<a href="/cronologia" class="nav-card">
			<Clock size={32} weight="fill" color="#F59E0B" />
			<span class="nav-card-label">Cronologia</span>
		</a>
	</div>
	<a href="/parole" class="nav-card nav-card-wide hide-desktop">
		<Books size={28} weight="fill" color="#10B981" />
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
		margin-bottom: 0.75rem;
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
		border-radius: var(--radius-lg);
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
