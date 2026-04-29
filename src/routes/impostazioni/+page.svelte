<script lang="ts">
	import { studyGoal, appFontScale, cardOrder, randomCardOrder } from '$lib/stores/settings';
	import { manualWordCount } from '$lib/stores/words';
	import { currentUser, signOut } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import PageHeader from '$lib/components/PageHeader.svelte';

	async function handleSignOut() {
		await signOut();
	}

	// Slider progress percentage (80–130 range)
	let sliderProgress = $derived(Math.round((($appFontScale - 80) / (130 - 80)) * 100));

	function handleSliderInput(e: Event) {
		const target = e.target as HTMLInputElement;
		appFontScale.set(Number(target.value));
	}

	function handleGoalInput(e: Event) {
		const target = e.target as HTMLInputElement;
		let value = Number(target.value);
		if (value < 1) value = 1;
		if (value > 100) value = 100;
		studyGoal.set(value);
	}

	const SIDE_LABELS: Record<string, string> = {
		italiano: 'Italiano',
		hiragana: 'Hiragana',
		katakana: 'Katakana',
		romaji: 'Romaji',
		kanji: 'Kanji',
	};

	function moveUp(index: number) {
		if (index === 0) return;
		const next = [...$cardOrder];
		[next[index - 1], next[index]] = [next[index], next[index - 1]];
		cardOrder.set(next);
	}

	function moveDown(index: number) {
		if (index === $cardOrder.length - 1) return;
		const next = [...$cardOrder];
		[next[index], next[index + 1]] = [next[index + 1], next[index]];
		cardOrder.set(next);
	}
</script>

<svelte:head>
	<title>Anki-jin — Impostazioni</title>
</svelte:head>

<div class="page page-enter">
	<PageHeader title="Impostazioni" />

	<!-- Study Goal Section -->
	<section class="section">
		<h2 class="section-heading">Obiettivo di studio</h2>
		<p class="section-subtitle">Quante parole vuoi imparare ogni giorno? Questo influenzerà i colori della tua heatmap.</p>

		<div class="goal-input-container">
			<input 
				type="number" 
				class="goal-input" 
				value={$studyGoal} 
				oninput={handleGoalInput}
				min="1"
				max="100"
			/>
			<span class="goal-unit">parole al giorno</span>
		</div>

		<div class="intensity-legend">
			<div class="legend-item">
				<div class="legend-color intensity-0"></div>
				<span class="legend-text">0</span>
			</div>
			<div class="legend-item">
				<div class="legend-color intensity-1"></div>
				<span class="legend-text">1-{Math.max(1, Math.floor($studyGoal * 0.5) - 1)}</span>
			</div>
			<div class="legend-item">
				<div class="legend-color intensity-2"></div>
				<span class="legend-text">{Math.floor($studyGoal * 0.5)}+</span>
			</div>
			<div class="legend-item">
				<div class="legend-color intensity-3"></div>
				<span class="legend-text">{Math.floor($studyGoal * 0.75)}+</span>
			</div>
			<div class="legend-item">
				<div class="legend-color intensity-4"></div>
				<span class="legend-text">{$studyGoal}+</span>
			</div>
		</div>
	</section>

	<!-- Divider -->
	<div class="divider"></div>

	<!-- Font Size Section -->
	<section class="section">
		<h2 class="section-heading">Dimensione testo</h2>
		<p class="section-subtitle">Regola la dimensione di tutto il testo nell'app.</p>

		<div class="preview-card">
			<div class="preview-inner">
				<span class="preview-label" style="font-size: {$appFontScale * 0.01 * 0.82}rem; color: var(--color-text-secondary);">Tutte le parole</span>
				<span class="preview-title" style="font-size: {$appFontScale * 0.01 * 1.75}rem;">I miei progressi</span>
				<span class="preview-jp font-jp" style="font-size: {$appFontScale * 0.01 * 3}rem; color: var(--color-primary);">大きい</span>
			</div>
		</div>

		<div class="slider-row">
			<span class="slider-label-sm">A</span>
			<div class="slider-container">
				<input
					type="range"
					min="80"
					max="130"
					step="1"
					value={$appFontScale}
					oninput={handleSliderInput}
					class="font-slider"
					style="--progress: {sliderProgress}%"
				/>
			</div>
			<span class="slider-label-lg">A</span>
		</div>
	</section>

	<!-- Divider -->
	<div class="divider"></div>

	<!-- Card Order Section -->
	<section class="section">
		<h2 class="section-heading">Ordine delle flashcard</h2>
		<p class="section-subtitle">Scegli in che ordine vuoi vedere i lati delle flashcard durante lo studio.</p>

		<div class="order-toggle" onclick={() => randomCardOrder.set(!$randomCardOrder)} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && randomCardOrder.set(!$randomCardOrder)}>
			<div class="order-toggle-left">
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="16 3 21 3 21 8" />
					<line x1="4" y1="20" x2="21" y2="3" />
					<polyline points="21 16 21 21 16 21" />
					<line x1="15" y1="15" x2="21" y2="21" />
				</svg>
				<span class="order-toggle-label">Ordine casuale</span>
			</div>
			<div class="toggle-switch" class:on={$randomCardOrder}>
				<div class="toggle-thumb"></div>
			</div>
		</div>

		{#if !$randomCardOrder}
			<div class="order-list">
				{#each $cardOrder as key, i}
					<div class="order-row">
						<div class="order-drag-handle">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<line x1="8" y1="6" x2="21" y2="6" />
								<line x1="8" y1="12" x2="21" y2="12" />
								<line x1="8" y1="18" x2="21" y2="18" />
								<line x1="3" y1="6" x2="3.01" y2="6" />
								<line x1="3" y1="12" x2="3.01" y2="12" />
								<line x1="3" y1="18" x2="3.01" y2="18" />
							</svg>
						</div>
						<span class="order-label">{SIDE_LABELS[key]}</span>
						<div class="order-arrows">
							<button class="arrow-btn" onclick={() => moveUp(i)} disabled={i === 0} aria-label="Sposta su">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
									<polyline points="18 15 12 9 6 15" />
								</svg>
							</button>
							<button class="arrow-btn" onclick={() => moveDown(i)} disabled={i === $cardOrder.length - 1} aria-label="Sposta giù">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
									<polyline points="6 9 12 15 18 9" />
								</svg>
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</section>

	<!-- Divider -->
	<div class="divider"></div>

	<!-- Archive Count -->
	<div class="archive-row">
		<div class="archive-left">
			<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
				<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
				<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
			</svg>
			<span class="archive-label">Parole inserite</span>
		</div>
		<span class="archive-count">{$manualWordCount}</span>
	</div>

	<!-- Divider -->
	<div class="divider" style="margin-top: 1.5rem;"></div>

	<!-- Account -->
	{#if $currentUser}
		<div class="account-row">
			<div class="account-info">
				<span class="account-label">Account</span>
				<span class="account-email">{$currentUser.email ?? ''}</span>
			</div>
			<button class="signout-btn" onclick={handleSignOut}>Esci</button>
		</div>
	{:else}
		<div class="login-cta">
			<div class="login-cta-text">
				<span class="login-cta-title">Salva i tuoi progressi</span>
				<span class="login-cta-sub">Crea un account per sincronizzare i dati su tutti i tuoi dispositivi.</span>
			</div>
			<a href="/login" class="login-cta-btn">Accedi / Registrati</a>
		</div>
	{/if}
</div>

<style>
	.page {
		padding: var(--spacing-page);
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
	}

	/* ---- Sections ---- */
	.section {
		margin-bottom: 1.5rem;
	}

	.section-heading {
		font-size: 1.35rem;
		font-weight: 700;
		margin: 0 0 0.35rem 0;
		letter-spacing: -0.015em;
	}

	.section-subtitle {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		margin: 0 0 1.25rem 0;
		line-height: 1.4;
	}

	/* ---- Goal Input ---- */
	.goal-input-container {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background-color: var(--color-surface);
		padding: 1.15rem 1.5rem;
		border-radius: var(--radius-xl);
		border: 1px solid var(--color-border);
		width: 100%;
		box-sizing: border-box;
		margin-bottom: 1.25rem;
	}

	.goal-input {
		width: 80px;
		background: none;
		border: none;
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--color-primary);
		text-align: center;
		padding: 0.25rem;
		outline: none;
	}

	.goal-input::-webkit-inner-spin-button,
	.goal-input::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	.goal-unit {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color-text-secondary);
	}

	/* Intensity Legend */
	.intensity-legend {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.5rem 0.25rem;
	}

	.legend-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
	}

	.legend-color {
		width: 100%;
		height: 10px;
		border-radius: 4px;
		border: 1px solid var(--color-border);
	}

	.legend-text {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-secondary);
	}

	/* ---- Divider ---- */
	.divider {
		height: 1px;
		background-color: var(--color-border-light);
		margin: 0.5rem 0 1.5rem 0;
	}

	/* ---- Preview Card ---- */
	.preview-card {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem 1rem;
		background-color: var(--color-surface);
		border-radius: var(--radius-xl);
		margin-bottom: 1rem;
		min-height: 100px;
	}

	.preview-inner {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
		user-select: none;
	}

	.preview-label {
		font-weight: 600;
		color: var(--color-text-secondary);
		line-height: 1.2;
	}

	.preview-title {
		font-weight: 700;
		line-height: 1.2;
	}

	.preview-jp {
		font-weight: 700;
		line-height: 1.2;
	}

	/* ---- Slider ---- */
	.slider-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.slider-label-sm {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		user-select: none;
	}

	.slider-label-lg {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-text-secondary);
		user-select: none;
	}

	.slider-container {
		flex: 1;
	}

	.font-slider {
		width: 100%;
		height: 6px;
		-webkit-appearance: none;
		appearance: none;
		background: linear-gradient(
			to right,
			var(--color-primary) 0%,
			var(--color-primary) var(--progress, 50%),
			var(--color-border) var(--progress, 50%),
			var(--color-border) 100%
		);
		border-radius: var(--radius-full);
		outline: none;
		cursor: pointer;
	}

	.font-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		background: var(--color-primary);
		border: 3px solid white;
		cursor: pointer;
		transition: transform 0.1s ease;
	}

	.font-slider::-webkit-slider-thumb:active {
		transform: scale(1.15);
	}

	.font-slider::-moz-range-thumb {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--color-primary);
		border: 3px solid white;
		cursor: pointer;
	}

	/* ---- Card Order ---- */
	.order-toggle {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.9rem 1rem;
		background: var(--color-surface);
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-border);
		cursor: pointer;
		margin-bottom: 0.75rem;
		user-select: none;
	}

	.order-toggle-left {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		color: var(--color-text);
	}

	.order-toggle-label {
		font-size: 0.95rem;
		font-weight: 600;
	}

	.toggle-switch {
		width: 44px;
		height: 26px;
		border-radius: 13px;
		background: var(--color-border);
		position: relative;
		transition: background 0.2s ease;
		flex-shrink: 0;
	}

	.toggle-switch.on {
		background: var(--color-primary);
	}

	.toggle-thumb {
		position: absolute;
		top: 3px;
		left: 3px;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: white;
		transition: transform 0.2s ease;
		box-shadow: 0 1px 3px rgba(0,0,0,0.2);
	}

	.toggle-switch.on .toggle-thumb {
		transform: translateX(18px);
	}

	.order-list {
		display: flex;
		flex-direction: column;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.order-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.85rem 1rem;
		background: var(--color-surface);
		border-bottom: 1px solid var(--color-border);
	}

	.order-row:last-child {
		border-bottom: none;
	}

	.order-drag-handle {
		color: var(--color-text-tertiary);
		flex-shrink: 0;
		display: flex;
		align-items: center;
	}

	.order-label {
		flex: 1;
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.order-arrows {
		display: flex;
		gap: 0.25rem;
	}

	.arrow-btn {
		background: none;
		border: none;
		padding: 0.3rem;
		cursor: pointer;
		color: var(--color-text-secondary);
		border-radius: var(--radius-md);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.arrow-btn:disabled {
		opacity: 0.25;
		cursor: default;
	}

	/* ---- Archive Row ---- */
	.archive-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0;
	}

	.archive-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		color: var(--color-text);
	}

	.archive-label {
		font-size: 1rem;
		font-weight: 600;
	}

	.archive-count {
		font-size: 1.05rem;
		font-weight: 700;
		color: var(--color-primary);
	}

	/* ---- Account ---- */
	.account-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0;
	}

	.account-info {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.account-label {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-text-secondary);
	}

	.account-email {
		font-size: 0.95rem;
		font-weight: 500;
		color: var(--color-text);
	}

	.signout-btn {
		background: none;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		font-weight: 600;
		font-family: var(--font-sans);
		color: #C5221F;
		cursor: pointer;
	}

	/* ---- Login CTA ---- */
	.login-cta {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}

	.login-cta-text {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.login-cta-title {
		font-size: 0.95rem;
		font-weight: 700;
	}

	.login-cta-sub {
		font-size: 0.82rem;
		color: var(--color-text-secondary);
		line-height: 1.4;
	}

	.login-cta-btn {
		display: block;
		text-align: center;
		padding: 0.75rem;
		background-color: var(--color-primary);
		color: white;
		border-radius: var(--radius-md);
		text-decoration: none;
		font-size: 0.9rem;
		font-weight: 700;
	}
</style>
