<script lang="ts">
	import { get } from 'svelte/store';
	import { goto, beforeNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { words } from '$lib/stores/words';
	import { selectedWordIds, clearSelection } from '$lib/stores/studySession';
	import { recordStudy } from '$lib/stores/history';
	import { setWordScore } from '$lib/stores/wordScores';
	import type { WordScore } from '$lib/types/word';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Flashcard from '$lib/components/Flashcard.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import { shuffle } from '$lib/utils/shuffle';

	const allWordsData = get(words);
	const selectedIds = get(selectedWordIds);
	let studySet = $state<typeof allWordsData>([]);

	if (selectedIds.size > 0) {
		// Preserve insertion order of the Set (callers may shuffle before setSelectedWords)
		studySet = [...selectedIds]
			.map(id => allWordsData.find(w => w.id === id))
			.filter((w): w is (typeof allWordsData)[number] => w !== undefined);
		clearSelection();
	} else {
		// Global study mode (from Home): draw up to 10 random words from the full library
		studySet = shuffle(allWordsData).slice(0, 10);
	}

	let currentIndex = $state(0);
	let studiedCount = $state(0);
	let finished = $state(false);

	let currentWord = $derived(studySet[currentIndex]);
	let progress = $derived(`${currentIndex + 1} / ${studySet.length}`);
	let progressPercent = $derived(((currentIndex + 1) / studySet.length) * 100);

	// Note field — clears each time the word changes
	let noteText = $state('');
	$effect(() => {
		void currentWord?.id;
		noteText = '';
	});

	function assess(score: WordScore) {
		setWordScore(currentWord.id, score);
		recordStudy([currentWord.id]);
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
	beforeNavigate((navigation) => {
		if (bypassGuard) return;

		if (!finished && studySet.length > 0 && studiedCount < studySet.length) {
			showExitModal = true;
			pendingUrl = navigation.to?.url.pathname || '/';
			navigation.cancel();
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
		if (!finished && studySet.length > 0 && studiedCount < studySet.length) {
			e.preventDefault();
			e.returnValue = '';
		}
	}

	// Trap browser back button and iOS swipe-back gesture
	onMount(() => {
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
	<title>Anki-jin — Studia</title>
</svelte:head>

<!-- Exit Modal -->
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
		<EmptyState
			icon="📚"
			title="Nessuna parola disponibile."
			subtitle="Aggiungi delle parole per iniziare a studiare."
			ctaHref="/nuova-parola"
			ctaLabel="Aggiungi parola"
		/>

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

		<!-- Note textarea -->
		<div class="note-area">
			<textarea
				class="note-input"
				bind:value={noteText}
				placeholder="Scrivi qui la tua risposta…"
				rows="2"
			></textarea>
		</div>

		<!-- Assessment buttons -->
		<div class="assess-area">
			<div class="assess-row">
				<button type="button" class="assess-btn assess-unknown" onclick={() => assess('unknown')}>
					Difficile
				</button>
				<button type="button" class="assess-btn assess-learning" onclick={() => assess('learning')}>
					Buono
				</button>
				<button type="button" class="assess-btn assess-known" onclick={() => assess('known')}>
					Facile
				</button>
			</div>
			<button
				type="button"
				class="prev-link"
				onclick={prev}
				disabled={currentIndex === 0}
			>
				← Precedente
			</button>
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
		padding: 0.75rem 0 0;
	}

	/* ---- Note textarea ---- */
	.note-area {
		padding: 0.75rem 0 0;
	}

	.note-input {
		width: 100%;
		box-sizing: border-box;
		padding: 0.75rem 1rem;
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		color: var(--color-text);
		font-family: var(--font-sans);
		font-size: 0.95rem;
		line-height: 1.5;
		resize: none;
		outline: none;
		transition: border-color 0.15s ease;
	}

	.note-input:focus {
		border-color: #e0dce6;
	}

	.note-input::placeholder {
		color: var(--color-text-tertiary);
	}

	/* ---- Assessment buttons ---- */
	.assess-area {
		padding-top: 0.65rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.assess-row {
		display: flex;
		gap: 0.5rem;
	}

	.assess-btn {
		flex: 1;
		padding: 0.85rem 0.5rem;
		border: none;
		border-radius: var(--radius-lg);
		font-size: 0.9rem;
		font-weight: 700;
		font-family: var(--font-sans);
		cursor: pointer;
		color: white;
		transition: opacity 0.15s ease;
	}

	.assess-btn:active {
		opacity: 0.8;
	}

	.assess-unknown  { background: #C5221F; }
	.assess-learning { background: #D97706; }
	.assess-known    { background: #1D6FA4; }

	.prev-link {
		background: none;
		border: none;
		padding: 0.25rem 0;
		font-size: 0.8rem;
		font-weight: 500;
		font-family: var(--font-sans);
		color: var(--color-text-tertiary);
		cursor: pointer;
		text-align: center;
		width: 100%;
	}

	.prev-link:disabled {
		opacity: 0.3;
		cursor: default;
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
