<script lang="ts">
	import { get } from 'svelte/store';
	import { goto, beforeNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { words } from '$lib/stores/words';
	import { selectedWordIds, clearSelection, studyReturnContext, setSelectedWords } from '$lib/stores/studySession';
	import { recordStudy } from '$lib/stores/history';
	import { recordAttempt } from '$lib/stores/wordAttempts';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Flashcard from '$lib/components/Flashcard.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import { shuffle } from '$lib/utils/shuffle';
	import { randomWordOrder } from '$lib/stores/settings';
	import { Folder, ArrowsCounterClockwise, CaretLeft, CaretRight } from 'phosphor-svelte';

	const SESSION_KEY = 'appare_study_session';

	function saveSession(ids: string[]) {
		try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(ids)); } catch {}
	}
	function loadSession(): string[] | null {
		try { const s = sessionStorage.getItem(SESSION_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
	}
	function clearSession() {
		try { sessionStorage.removeItem(SESSION_KEY); } catch {}
	}

	const allWordsData = get(words);
	const selectedIds = get(selectedWordIds);
	let studySet = $state<typeof allWordsData>([]);

	if (selectedIds.size > 0) {
		studySet = [...selectedIds]
			.map(id => allWordsData.find(w => w.id === id))
			.filter((w): w is (typeof allWordsData)[number] => w !== undefined);
		clearSelection();
		saveSession(studySet.map(w => w.id));
	} else {
		const saved = loadSession();
		if (saved && saved.length > 0) {
			studySet = saved
				.map(id => allWordsData.find(w => w.id === id))
				.filter((w): w is (typeof allWordsData)[number] => w !== undefined);
		}
		if (studySet.length === 0) {
			studySet = shuffle(allWordsData).slice(0, 10);
			saveSession(studySet.map(w => w.id));
		}
	}

	let currentIndex = $state(0);
	let studiedCount = $state(0);
	let finished = $state(false);
	let highWaterMark = $state(0);
	// Per-card answer: true = correct, false = incorrect, undefined = unanswered
	let answers = $state<Record<number, boolean>>({});
	// Cards whose answers have been committed to storage (can't re-commit)
	let committed = new Set<number>();

	let currentAnswer = $derived(answers[currentIndex]);
	let isAnswered = $derived(currentAnswer !== undefined);

	let currentWord = $derived(studySet[currentIndex]);
	let progress = $derived(`${currentIndex + 1} / ${studySet.length}`);
	let progressPercent = $derived(((currentIndex + 1) / studySet.length) * 100);

	// Note field — clears each time the word changes
	let noteText = $state('');
	$effect(() => {
		void currentWord?.id;
		noteText = '';
	});

	function commitCurrent() {
		if (committed.has(currentIndex)) return;
		const answer = answers[currentIndex];
		if (answer === undefined) return;
		recordAttempt(currentWord.id, answer);
		recordStudy([currentWord.id]);
		committed.add(currentIndex);
		studiedCount++;
	}

	function advanceFrom(idx: number) {
		if (idx < studySet.length - 1) {
			currentIndex = idx + 1;
		} else {
			finished = true;
		}
	}

	function assess(wasCorrect: boolean) {
		answers = { ...answers, [currentIndex]: wasCorrect };
		if (currentIndex >= highWaterMark) {
			highWaterMark = currentIndex + 1;
		}
		commitCurrent();
		advanceFrom(currentIndex);
	}

	function prev() {
		if (currentIndex > 0) currentIndex--;
	}

	function next() {
		if (currentIndex >= highWaterMark) return;
		commitCurrent();
		advanceFrom(currentIndex);
	}

	function restart() {
		if (get(randomWordOrder)) studySet = shuffle([...studySet]);
		currentIndex = 0;
		studiedCount = 0;
		highWaterMark = 0;
		answers = {};
		committed = new Set();
		finished = false;
	}

	function returnToOrigin() {
		const ctx = get(studyReturnContext);
		if (!ctx) return;
		setSelectedWords(ctx.wordIds);
		bypassGuard = true;
		clearSession();
		goto(ctx.href);
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
		clearSession();
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

	function exitToOrigin() {
		showExitModal = false;
		returnToOrigin();
	}

	function handleBack() {
		pendingUrl = '/';
		showExitModal = true;
	}

	$effect(() => {
		if (finished) clearSession();
	});

	// Intercept browser refresh/close
	function handleBeforeUnload(e: BeforeUnloadEvent) {
		if (!finished && studySet.length > 0 && studiedCount < studySet.length) {
			e.preventDefault();
			e.returnValue = '';
		}
	}

	// Trap browser back button and iOS swipe-back gesture
	let pageEl = $state<HTMLElement | undefined>(undefined);

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

		// Block the PAGE from scrolling vertically, but allow scroll inside the card.
		// Must use addEventListener with passive:false so we can call preventDefault.
		function blockPageScroll(e: TouchEvent) {
			if (e.target instanceof Element && (e.target.closest('.card') || e.target.closest('.note-area'))) return;
			e.preventDefault();
		}

		window.addEventListener('popstate', onPopState);
		pageEl?.addEventListener('touchmove', blockPageScroll, { passive: false });
		return () => {
			window.removeEventListener('popstate', onPopState);
			pageEl?.removeEventListener('touchmove', blockPageScroll);
		};
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
				{#if $studyReturnContext}
					<button class="modal-btn btn-folder" onclick={exitToOrigin}>
						<Folder size={16} weight="fill" />
						{$studyReturnContext.label}
					</button>
				{/if}
				<div class="modal-row">
					<button class="modal-btn btn-secondary" onclick={cancelExit}>Rimani</button>
					<button class="modal-btn btn-primary" onclick={confirmExit}>Esci</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<div class="page page-enter" bind:this={pageEl}>
	<PageHeader title="Studia" hideBack={finished} onback={handleBack} />

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
					<ArrowsCounterClockwise size={18} weight="bold" />
					Ricomincia
				</button>
				{#if $studyReturnContext}
					<button type="button" class="action-btn action-folder" onclick={returnToOrigin}>
						Modifica selezione
					</button>
				{/if}
				<a href="/" class="action-btn action-home" onclick={() => { bypassGuard = true; }}>
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
				<button
					type="button"
					class="assess-btn assess-incorrect"
					class:selected={isAnswered && currentAnswer === false}
					class:faded={isAnswered && currentAnswer !== false}
					class:locked={isAnswered}
					onclick={() => assess(false)}
				>
					Sbagliato
				</button>
				<button
					type="button"
					class="assess-btn assess-correct"
					class:selected={isAnswered && currentAnswer === true}
					class:faded={isAnswered && currentAnswer !== true}
					class:locked={isAnswered}
					onclick={() => assess(true)}
				>
					Corretto
				</button>
			</div>
			<div class="nav-row">
				<button type="button" class="nav-chevron" onclick={prev} disabled={currentIndex === 0} aria-label="Precedente">
					<CaretLeft size={20} weight="bold" />
				</button>
				<button type="button" class="nav-chevron" onclick={next} disabled={currentIndex >= highWaterMark} aria-label="Successivo">
					<CaretRight size={20} weight="bold" />
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.page {
		/* Height-based instead of bottom: 0 so the page shrinks with the visual
		   viewport when the keyboard opens (otherwise position:fixed sticks to
		   the layout viewport and the input ends up behind the keyboard). */
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: var(--app-height);
		background: var(--color-bg);
		z-index: 50;
		padding: var(--spacing-page);
		padding-top: calc(var(--spacing-page) + env(safe-area-inset-top, 0px));
		padding-bottom: calc(var(--spacing-page) + env(safe-area-inset-bottom, 0px));
		display: flex;
		flex-direction: column;
		gap: 0;
		box-sizing: border-box;
	}

	/* Reduce PageHeader margin so more height goes to the card */
	.page :global(.page-header) {
		margin-bottom: 0.75rem;
		flex-shrink: 0;
	}

	/* ---- Progress ---- */
	.progress-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
		flex-shrink: 0;
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
		min-height: 0;        /* allow shrinking below content size */
		display: flex;
		flex-direction: column;
		align-items: stretch;
		justify-content: center;
		padding: 0.5rem 0 0;
		overflow: hidden;     /* clip, inner Flashcard handles its own scroll */
	}

	/* ---- Note textarea ---- */
	.note-area {
		padding: 0.65rem 0 0;
		flex-shrink: 0;
	}

	.note-input {
		width: 100%;
		box-sizing: border-box;
		padding: 0.75rem 1rem;
		border: 1.5px solid var(--color-border);
		border-radius: 8px;
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
		flex-shrink: 0;  /* never compress — always fully visible */
	}

	/* When keyboard is open: hide assess buttons so the input sits right
	   above the keyboard with no dead space. Buttons reappear on dismiss.
	   Also drop the bottom safe-area inset since the keyboard occupies that area. */
	:global(html.keyboard-open) .page {
		padding-bottom: 0.5rem;
	}
	:global(html.keyboard-open) .page .assess-area {
		display: none;
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
		transition: opacity 0.2s ease;
	}

	.assess-btn:not(.locked):active {
		opacity: 0.8;
	}

	.assess-incorrect { background: #EF5350; }
	.assess-correct   { background: #66BB6A; }

	.assess-btn.locked { cursor: default; }

	/* Selected: full opacity, no size change */
	.assess-btn.selected {
		opacity: 1;
	}

	/* The other button dims out */
	.assess-btn.faded {
		opacity: 0.25;
	}

	.nav-row {
		display: flex;
		justify-content: center;
		gap: 1.5rem;
	}

	.nav-chevron {
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		padding: 0.3rem 0.75rem;
		color: var(--color-text-tertiary);
		cursor: pointer;
		border-radius: var(--radius-md);
		-webkit-tap-highlight-color: transparent;
	}

	.nav-chevron:disabled {
		opacity: 0.25;
		cursor: default;
	}

	.nav-chevron:not(:disabled):active {
		opacity: 0.5;
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
		border-radius: 8px;
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

	.action-folder {
		background: var(--color-surface);
		color: var(--color-text);
		border: 1.5px solid var(--color-border);
	}

	.action-select {
		background: var(--color-surface);
		color: var(--color-text);
		border: 1.5px solid var(--color-border);
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
		flex-direction: column;
		gap: 0.65rem;
	}

	.modal-row {
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
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		font-family: var(--font-sans);
	}

	.btn-secondary {
		background: var(--color-surface);
		color: var(--color-text-primary);
	}

	.btn-primary {
		background: var(--color-primary);
		color: white;
	}

	.btn-folder {
		background: var(--color-surface);
		color: var(--color-text);
		border: 1.5px solid var(--color-border);
	}
</style>
