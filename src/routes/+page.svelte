<script lang="ts">
	import { wordCount } from '$lib/stores/words';
	import { folderCount } from '$lib/stores/folders';
	import Heatmap from '$lib/components/Heatmap.svelte';
</script>

<svelte:head>
	<title>Appare — Home</title>
</svelte:head>

<div class="page page-enter">
	<!-- Header -->
	<header class="header hide-desktop">
		<div class="header-left">
			<div class="header-text">
				<span class="header-label">日本語</span>
				<span class="header-title">Appare</span>
			</div>
		</div>
		<a href="/impostazioni" class="settings-btn" aria-label="Impostazioni">
			<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
				<path fill-rule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clip-rule="evenodd" />
			</svg>
		</a>
	</header>

	<!-- Study Section (Heatmap will go here) -->
	<section class="daily-section">
		<h1 class="daily-title">I tuoi progressi</h1>
		
		<Heatmap />

		<a href="/studia/seleziona" class="cta-button" style="margin-top: 1rem;">
			Inizia a studiare
		</a>
	</section>

	<!-- Divider -->
	<div class="divider hide-desktop"></div>

	<!-- Menu List -->
	<nav class="menu-list hide-desktop">
		<a href="/parole" class="menu-item">
			<div class="menu-icon">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
					<path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
				</svg>
			</div>
			<div class="menu-text">
				<span class="menu-label">Tutte le parole</span>
				<span class="menu-count">{$wordCount} parole</span>
			</div>
			<svg class="menu-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<polyline points="9 18 15 12 9 6" />
			</svg>
		</a>

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
			<svg class="menu-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<polyline points="9 18 15 12 9 6" />
			</svg>
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
			<svg class="menu-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<polyline points="9 18 15 12 9 6" />
			</svg>
		</a>
	</nav>

	<!-- FAB -->
	<div class="fab-container hide-desktop">
		<a href="/nuova-parola" class="fab">
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
				<line x1="12" y1="5" x2="12" y2="19" />
				<line x1="5" y1="12" x2="19" y2="12" />
			</svg>
			Nuova parola
		</a>
	</div>
</div>

<style>
	.page {
		padding: var(--spacing-page);
		padding-bottom: 100px;
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
		gap: 0.75rem;
	}

	.logo {
		flex-shrink: 0;
	}

	.header-text {
		display: flex;
		flex-direction: column;
	}

	.header-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-text-secondary);
		letter-spacing: 0.02em;
		font-family: var(--font-jp);
	}

	.header-title {
		font-size: 1.5rem;
		font-weight: 800;
		letter-spacing: -0.02em;
		line-height: 1.1;
	}

	.settings-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: var(--radius-full);
		color: var(--color-text);
		transition: background-color 0.15s ease, color 0.15s ease;
		text-decoration: none;
	}

	.settings-btn:hover {
		background-color: var(--color-surface);
	}

	.settings-btn:active {
		background-color: var(--color-surface-warm);
	}

	/* ---- Daily Words ---- */
	.daily-section {
		margin-bottom: 1.5rem;
	}

	.daily-title {
		font-size: 1.75rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		margin: 0 0 0.25rem 0;
	}

	.daily-subtitle {
		font-size: 0.9rem;
		color: var(--color-text-secondary);
		margin: 0 0 1.25rem 0;
	}

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
		transition: background-color 0.15s ease, transform 0.1s ease;
		text-decoration: none;
		text-align: center;
		box-sizing: border-box;
	}

	.cta-button:hover {
		background-color: var(--color-primary-light);
	}

	.cta-button:active {
		background-color: var(--color-primary-dark);
		transform: scale(0.98);
	}

	/* ---- Divider ---- */
	.divider {
		height: 1px;
		background-color: var(--color-border-light);
		margin: 0.5rem 0 0.75rem 0;
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
		transition: background-color 0.12s ease;
		border-radius: var(--radius-md);
		text-decoration: none;
		color: inherit;
	}

	.menu-item:hover {
		background-color: var(--color-surface);
	}

	.menu-item:active {
		background-color: var(--color-surface-warm);
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

	/* ---- FAB ---- */
	.fab-container {
		position: fixed;
		bottom: 2rem;
		right: var(--spacing-page);
		z-index: 50;
	}

	.fab {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.875rem 1.5rem;
		background-color: var(--color-accent);
		color: var(--color-text);
		border: none;
		border-radius: var(--radius-full);
		font-size: 0.95rem;
		font-weight: 700;
		font-family: var(--font-sans);
		cursor: pointer;
		transition: background-color 0.15s ease, transform 0.1s ease;
		white-space: nowrap;
		text-decoration: none;
	}

	.fab:hover {
		background-color: var(--color-accent-hover);
	}

	.fab:active {
		transform: scale(0.96);
	}
</style>
