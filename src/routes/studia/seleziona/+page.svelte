<script lang="ts">
	import { words } from '$lib/stores/words';
	import { allStudiedWordIds } from '$lib/stores/history';
	import { selectedWordIds, toggleWordSelection, selectedCount } from '$lib/stores/studySession';
	import { goto } from '$app/navigation';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { filterWords } from '$lib/utils/word-search';
	import SearchInput from '$lib/components/SearchInput.svelte';
	import Icon from '$lib/components/Icon.svelte';

	let searchQuery = $state('');

	// Only show unstudied words
	let unstudiedWords = $derived(
		$words.filter(w => !$allStudiedWordIds.has(w.id))
	);

	let filteredWords = $derived(filterWords(unstudiedWords, searchQuery));

	function startStudy() {
		if ($selectedCount > 0) {
			goto('/studia');
		}
	}
</script>

<svelte:head>
	<title>Appare — Seleziona parole</title>
</svelte:head>

<div class="page page-enter">
	<PageHeader title="Cosa vuoi studiare?" backHref="/" />

	<p class="subtitle">Hai ancora {unstudiedWords.length} parole da imparare. Seleziona quelle che vuoi studiare oggi.</p>

	<SearchInput bind:value={searchQuery} placeholder="Cerca in italiano, romaji, hiragana..." />

	<div class="word-list">
		{#if filteredWords.length === 0}
			<div class="empty-state">
				<p>Nessuna parola trovata.</p>
			</div>
		{:else}
			{#each filteredWords as word (word.id)}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div class="word-row" onclick={() => toggleWordSelection(word.id)}>
					<div class="word-checkbox" class:checked={$selectedWordIds.has(word.id)}>
						<Icon name="check" strokeWidth={3} />
					</div>
					<div class="word-main">
						<span class="word-it">{word.italiano}</span>
						<span class="word-jp font-jp">
							{word.hiragana || word.katakana || word.romaji || word.kanji}
						</span>
					</div>
					<span class="word-cat" data-category={word.category}>{word.category}</span>
				</div>
			{/each}
		{/if}
	</div>

	<!-- Fixed bottom bar with CTA -->
	<div class="bottom-bar">
		<button class="cta-button" disabled={$selectedCount === 0} onclick={startStudy}>
			{#if $selectedCount === 0}
				Seleziona parole
			{:else}
				Studia {$selectedCount} {$selectedCount === 1 ? 'parola' : 'parole'}
			{/if}
		</button>
	</div>
</div>

<style>
	.page {
		padding: var(--spacing-page);
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		padding-bottom: 120px; /* Space for bottom bar */
	}

	.subtitle {
		font-size: 0.95rem;
		color: var(--color-text-secondary);
		margin-bottom: 1.5rem;
		line-height: 1.4;
	}

	.word-list {
		display: flex;
		flex-direction: column;
	}

	.word-row {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		gap: 1rem;
		padding: 1rem 0;
		border-bottom: 1px solid var(--color-border);
		cursor: pointer;
		user-select: none;
	}

	.word-row:last-child {
		border-bottom: none;
	}

	.word-checkbox {
		width: 24px;
		height: 24px;
		border-radius: 6px;
		border: 2px solid var(--color-border);
		display: flex;
		align-items: center;
		justify-content: center;
		color: transparent;
		transition: all 0.2s ease;
		flex-shrink: 0;
	}

	.word-checkbox svg {
		width: 14px;
		height: 14px;
	}

	.word-checkbox.checked {
		background-color: var(--color-primary);
		border-color: var(--color-primary);
		color: white;
	}

	.word-main {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex-grow: 1;
	}

	.word-it {
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.word-jp {
		font-size: 0.85rem;
		color: var(--color-text-secondary);
	}

	.word-cat {
		font-size: 0.65rem;
		font-weight: 700;
		padding: 0.35rem 0.6rem;
		border-radius: var(--radius-md);
		background: var(--color-surface);
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		white-space: nowrap;
	}

	.empty-state {
		text-align: center;
		color: var(--color-text-secondary);
		padding: 2rem 0;
	}

	.bottom-bar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 1rem var(--spacing-page);
		background: var(--color-bg);
		padding-bottom: calc(1rem + env(safe-area-inset-bottom, 20px));
		z-index: 100;
	}

	@media (min-width: 768px) {
		.bottom-bar {
			left: 220px;
		}
	}

	@media (min-width: 1280px) {
		.bottom-bar {
			left: 260px;
		}
	}

	.cta-button {
		width: 100%;
		padding: 1.1rem;
		background-color: var(--color-primary);
		color: white;
		border: none;
		border-radius: var(--radius-full);
		font-size: 1.05rem;
		font-weight: 700;
		font-family: var(--font-sans);
		cursor: pointer;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.cta-button:disabled {
		background-color: var(--color-surface);
		color: var(--color-text-secondary);
		cursor: not-allowed;
		opacity: 0.7;
	}
</style>
