<script lang="ts">
	import { words } from '$lib/stores/words';
	import { allStudiedWordIds } from '$lib/stores/history';
	import { selectedWordIds, toggleWordSelection, selectedCount } from '$lib/stores/studySession';
	import { goto } from '$app/navigation';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import WordRow from '$lib/components/WordRow.svelte';
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
	<title>Anki-jin — Seleziona parole</title>
</svelte:head>

<div class="page page-enter">
	<PageHeader title="Cosa vuoi studiare?" backHref="/">
		{#snippet actions()}
			<SearchInput bind:value={searchQuery} placeholder="Cerca in italiano, romaji, hiragana..." collapsible />
		{/snippet}
	</PageHeader>

	<p class="subtitle">Hai ancora {unstudiedWords.length} parole da imparare. Seleziona quelle che vuoi studiare oggi.</p>

	<div class="word-list">
		{#if filteredWords.length === 0}
			<div class="empty-state">
				<p>Nessuna parola trovata.</p>
			</div>
		{:else}
			{#each filteredWords as word (word.id)}
				<WordRow
					{word}
					selectable
					role="checkbox"
					ariaChecked={$selectedWordIds.has(word.id)}
					onclick={() => toggleWordSelection(word.id)}
				>
					{#snippet leading()}
						<div class="word-checkbox" class:checked={$selectedWordIds.has(word.id)}>
							<Icon name="check" size={14} strokeWidth={3} />
						</div>
					{/snippet}
				</WordRow>
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
		position: relative;
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

	.word-checkbox {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		border: 2px solid var(--color-border);
		display: flex;
		align-items: center;
		justify-content: center;
		color: transparent;
		transition: all 0.2s ease;
		flex-shrink: 0;
	}

	.word-checkbox.checked {
		background-color: #1A1A1A;
		border-color: #1A1A1A;
		color: white;
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
