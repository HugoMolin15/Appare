<script lang="ts">
	import { get } from 'svelte/store';
	import { goto, onNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { words } from '$lib/stores/words';
	import { selectedWordIds, clearSelection, skipExitGuard } from '$lib/stores/studySession';
	import { allStudiedWordIds, recordStudy } from '$lib/stores/history';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Flashcard from '$lib/components/Flashcard.svelte';
	import { shuffle } from '$lib/utils/shuffle';

	const allWordsData = get(words);
	const selectedIds = get(selectedWordIds);
	const studiedIds = get(allStudiedWordIds);
	const noGuard = get(skipExitGuard);
	skipExitGuard.set(false);

	let studySet = $state<typeof allWordsData>([]);
	
	if (selectedIds.size > 0) {
		// User selected specific words via checkboxes
		studySet = allWordsData.filter(w => selectedIds.has(w.id));
		// Clear selection so next time it doesn't persist forever
		clearSelection();
	} else {
		// Global study mode (from Home): Pick unstudied words
		const unstudiedWords = allWordsData.filter(w => !studiedIds.has(w.id));
		// Let's pick up to 10 random unstudied words per session
		studySet = shuffle(unstudiedWords).slice(0, 10);
	}

	let currentIndex = $state(0);
	let studiedCount = $state(0);
	let finished = $state(false);

	let currentWord = $derived(studySet[currentIndex]);
	let progress = $derived(`${currentIndex + 1} / ${studySet.length}`);
	let progressPercent = $derived(((currentIndex + 1) / studySet.length) * 100);

	function next() {
		recordStudy([studySet[currentIndex].id]);
		if (currentIndex < studySet.length - 1) {
			studiedCount++;
			currentIndex++;
		} else {
			studiedCount++;
			finished = true;
		}
	}

	function prev() {
		if (currentIndex > 0) currentIndex--;
	}

	function restart() {
		currentIndex = 0;
		studiedCount = 0;
		finished = false;
	}

	let showExitModal = $state(false);
	let pendingUrl = $state<string | null>(null);
	let bypassGuard = false;

	// Intercept internal navigation to warn user
	onNavigate((navigation) => {
		if (bypassGuard || noGuard) return;

		if (!finished && studySet.length > 0 && studiedCount < studySet.length) {
			showExitModal = true;
			pendingUrl = navigation.to?.url.pathname || '/';
			(navigation as any).cancel();
		}
	});

	function confirmExit() {
		showExitModal = false;
		bypassGuard = true;
		if (pendingUrl) {
			goto(pendingUrl);
		} else {
			goto('/');
		}
	}

	function cancelExit() {
		showExitModal = false;
		pendingUrl = null;
	}

	// Intercept browser refresh/close
	function handleBeforeUnload(e: BeforeUnloadEvent) {
		if (noGuard) return;
		if (!finished && studySet.length > 0 && studiedCount < studySet.length) {
			e.preventDefault();
			e.returnValue = '';
		}
	}

	// Trap browser back button and iOS swipe-back gesture
	onMount(() => {
		if (noGuard) return;

		// Push a dummy state so back button/swipe triggers popstate instead of navigating
		history.pushState(null, '', window.location.href);

		function onPopState() {
			if (!finished && studySet.length > 0 && studiedCount < studySet.length) {
				history.pushState(null, '', window.location.href);
				showExitModal = true;
				pendingUrl = '/';
			}
		}

		window.addEventListener('popstate', onPopState);
		return () => window.removeEventListener('popstate', onPopState);
	});
</script>

<svelte:window onbeforeunload={handleBeforeUnload} />

<svelte:head>
	<title>Appare — Studia</title>
</svelte:head>

<!-- Custom Modal -->
{#if showExitModal}
	<div class="modal-overlay">
		<div class="modal-content">
			<h3 class="modal-title">Vuoi uscire dalla sessione?</h3>
			<p class="modal-desc">
				Hai studiato <strong>{studiedCount}</strong> {studiedCount === 1 ? 'parola' : 'parole'} su {studySet.length}.<br>
				Solo i progressi completati verranno salvati.
			</p>
			<div class="modal-actions">
				<button class="modal-btn btn-secondary" onclick={cancelExit}>Rimani</button>
				<button class="modal-btn btn-primary" onclick={confirmExit}>Esci</button>
			</div>
		</div>
	</div>
{/if}

<div class="page page-enter">
	<PageHeader title="Studia" />

	{#if studySet.length === 0}
		<!-- No words available -->
		<div class="empty-state">
			<span class="empty-icon font-jp">📚</span>
			<p class="empty-text">Nessuna parola disponibile.</p>
			<p class="empty-sub">Aggiungi delle parole per iniziare a studiare.</p>
			<a href="/nuova-parola" class="empty-btn">Aggiungi parola</a>
		</div>

	{:else if finished}
		<!-- Completed -->
		<div class="finished-state">
			<h2 class="finished-title">Ottimo lavoro!</h2>
			<p class="finished-sub">Hai completato tutte le {studySet.length} parole di oggi.</p>

			<div class="finished-actions">
				<button type="button" class="action-btn action-restart" onclick={restart}>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
					Ricomincia
				</button>
				<a href="/" class="action-btn action-home">
					Torna alla home
				</a>
			</div>
		</div>

	{:else}
		<!-- Progress bar -->
		<div class="progress-row">
			<span class="progress-label">{progress}</span>
			<div class="progress-bar">
				<div class="progress-fill" style="width: {progressPercent}%"></div>
			</div>
		</div>

		<!-- Flashcard -->
		<div class="card-area">
			<Flashcard word={currentWord} />
		</div>

		<!-- Nav buttons -->
		<div class="next-area">
			<div class="nav-row">
				<button type="button" class="nav-btn nav-prev" onclick={prev} disabled={currentIndex === 0} aria-label="Parola precedente">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
						<polyline points="15 18 9 12 15 6" />
					</svg>
					Precedente
				</button>
				<button type="button" class="nav-btn nav-next" onclick={next}>
					{currentIndex < studySet.length - 1 ? 'Prossima' : 'Finisci'}
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
						<polyline points="9 18 15 12 9 6" />
					</svg>
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.page {
		padding: var(--spacing-page);
		height: calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px));
		max-height: calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px));
		overflow: hidden;
		display: flex;
		flex-direction: column;
		padding-bottom: 2rem;
		box-sizing: border-box;
	}

	/* ---- Progress ---- */
	.progress-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.progress-label {
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		white-space: nowrap;
		min-width: 3rem;
	}

	.progress-bar {
		flex: 1;
		height: 5px;
		background: var(--color-border);
		border-radius: var(--radius-full);
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: var(--color-primary);
		border-radius: var(--radius-full);
		transition: width 0.3s ease;
	}

/* ---- Card area ---- */
	.card-area {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		justify-content: center;
		padding: 1rem 0;
	}

	/* ---- Nav buttons ---- */
	.next-area {
		padding-top: 1rem;
	}

	.nav-row {
		display: flex;
		gap: 0.65rem;
	}

	.nav-btn {
		padding: 0.9rem;
		border: none;
		border-radius: var(--radius-lg);
		font-size: 1rem;
		font-weight: 600;
		font-family: var(--font-sans);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.nav-prev {
		flex: 1;
		background-color: var(--color-primary);
		color: white;
	}

	.nav-prev:disabled {
		opacity: 0.3;
		cursor: default;
	}

	.nav-next {
		flex: 1;
		background-color: var(--color-primary);
		color: white;
	}

	/* ---- Empty state ---- */
	.empty-state {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: 0.5rem;
	}

	.empty-icon {
		font-size: 3rem;
		margin-bottom: 0.5rem;
	}

	.empty-text {
		font-size: 1.1rem;
		font-weight: 600;
		margin: 0;
	}

	.empty-sub {
		font-size: 0.85rem;
		color: var(--color-text-secondary);
		margin: 0 0 1rem 0;
	}

	.empty-btn {
		padding: 0.7rem 1.5rem;
		background: var(--color-primary);
		color: white;
		border-radius: var(--radius-lg);
		font-size: 0.9rem;
		font-weight: 600;
		text-decoration: none;
		font-family: var(--font-sans);
	}

	/* ---- Finished state ---- */
	.finished-state {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: 0.5rem;
	}

	.finished-title {
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0;
	}

	.finished-sub {
		font-size: 0.9rem;
		color: var(--color-text-secondary);
		margin: 0 0 1.5rem 0;
	}

	.finished-actions {
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
		width: 100%;
		max-width: 280px;
	}

	.action-btn {
		padding: 0.75rem 1rem;
		border-radius: var(--radius-lg);
		font-size: 0.9rem;
		font-weight: 600;
		font-family: var(--font-sans);
		cursor: pointer;
		text-decoration: none;
		text-align: center;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		border: none;
	}

	.action-restart {
		background: var(--color-primary);
		color: white;
	}

	.action-home {
		background: var(--color-surface);
		color: var(--color-text);
	}

	/* ---- Modal ---- */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1.5rem;
		animation: var(--animate-fade-in);
	}

	.modal-content {
		background: var(--color-bg);
		border-radius: var(--radius-xl);
		padding: 2rem;
		width: 100%;
		max-width: 320px;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
		animation: var(--animate-scale-in);
		text-align: center;
	}

	.modal-title {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-text-primary);
		margin: 0 0 0.75rem 0;
	}

	.modal-desc {
		font-size: 0.95rem;
		color: var(--color-text-secondary);
		line-height: 1.5;
		margin: 0 0 1.5rem 0;
	}

	.modal-actions {
		display: flex;
		gap: 0.75rem;
	}

	.modal-btn {
		flex: 1;
		padding: 0.85rem;
		border-radius: var(--radius-lg);
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
		border: none;
	}

	.btn-secondary {
		background: var(--color-surface);
		color: var(--color-text-primary);
	}

	.btn-primary {
		background: var(--color-primary);
		color: white;
	}
</style>
