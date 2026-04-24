<script lang="ts">
	import { words } from '$lib/stores/words';
	import { fade, fly } from 'svelte/transition';
	import ClearableInput from '$lib/components/ClearableInput.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { filterWords } from '$lib/utils/word-search';

	interface Props {
		currentFolderId: string;
		onAdd: (wordIds: string[]) => void;
		onClose: () => void;
	}

	let { currentFolderId, onAdd, onClose }: Props = $props();

	let searchQuery = $state('');
	let selectedIds = $state(new Set<string>());

	let availableWords = $derived(
		$words.filter(w => w.folderId !== currentFolderId)
	);

	let filteredWords = $derived(filterWords(availableWords, searchQuery));

	function toggleSelection(id: string) {
		if (selectedIds.has(id)) {
			selectedIds.delete(id);
		} else {
			selectedIds.add(id);
		}
		selectedIds = new Set(selectedIds);
	}

	function handleConfirm() {
		onAdd(Array.from(selectedIds));
		onClose();
	}
</script>

<!-- Backdrop -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="backdrop" transition:fade={{ duration: 200 }} onclick={onClose}></div>

<div class="sheet" transition:fly={{ y: 300, duration: 300 }}>
	<div class="sheet-header">
		<h2 class="sheet-title">Aggiungi parole</h2>
		<button class="close-btn" onclick={onClose}>Chiudi</button>
	</div>

	<div class="search-bar">
		<ClearableInput bind:value={searchQuery} placeholder="Cerca parole esistenti..." />
	</div>

	<div class="modal-content">
		{#if filteredWords.length === 0}
			<div class="empty-state">
				<p>Nessuna parola trovata</p>
			</div>
		{:else}
			<div class="selection-list">
				{#each filteredWords as word (word.id)}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div class="word-option" class:selected={selectedIds.has(word.id)} onclick={() => toggleSelection(word.id)}>
						<div class="checkbox" class:checked={selectedIds.has(word.id)}>
							{#if selectedIds.has(word.id)}
								<Icon name="check" size={12} strokeWidth={4} stroke="white" />
							{/if}
						</div>
						<div class="word-info">
							<span class="word-it">{word.italiano}</span>
							<span class="word-jp font-jp">{word.hiragana || word.kanji || word.romaji}</span>
						</div>
						<span class="word-cat" data-category={word.category}>{word.category}</span>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<div class="modal-footer">
		<button 
			class="confirm-btn" 
			class:ready={selectedIds.size > 0}
			disabled={selectedIds.size === 0}
			onclick={handleConfirm}
		>
			Aggiungi {selectedIds.size} {selectedIds.size === 1 ? 'parola' : 'parole'}
		</button>
	</div>
</div>

<style>
	.backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(2px);
		z-index: 200;
	}

	.sheet {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: 75dvh;
		background-color: var(--color-bg);
		border-radius: var(--radius-xl) var(--radius-xl) 0 0;
		padding: 1.5rem;
		padding-bottom: calc(1rem + env(safe-area-inset-bottom));
		z-index: 201;
		box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.2);
		display: flex;
		flex-direction: column;
	}

	.sheet-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.25rem;
	}

	.sheet-title {
		font-size: 1.25rem;
		font-weight: 800;
		margin: 0;
	}

	.close-btn {
		background: none;
		border: none;
		color: var(--color-text-secondary);
		font-weight: 600;
		cursor: pointer;
	}

	.search-bar {
		margin-bottom: 1rem;
	}

	.modal-content {
		flex: 1;
		overflow-y: auto;
		margin-bottom: 1rem;
		scrollbar-width: none;
	}

	.modal-content::-webkit-scrollbar {
		display: none;
	}

	.selection-list {
		display: flex;
		flex-direction: column;
	}

	.word-option {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 0;
		cursor: pointer;
		transition: background-color 0.12s ease;
	}

	.word-option:last-child {
		border-bottom: none;
	}

	.checkbox {
		width: 22px;
		height: 22px;
		border-radius: 6px;
		border: 2px solid var(--color-border);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: all 0.2s ease;
	}

	.checkbox.checked {
		background-color: var(--color-primary);
		border-color: var(--color-primary);
	}

	.word-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
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
		flex-shrink: 0;
	}

	.modal-footer {
		padding-top: 1rem;
	}

	.confirm-btn {
		width: 100%;
		padding: 1.1rem;
		border-radius: var(--radius-xl);
		background-color: var(--color-border);
		color: var(--color-text-tertiary);
		border: none;
		font-size: 1.05rem;
		font-weight: 700;
		cursor: not-allowed;
		transition: all 0.2s ease;
	}

	.confirm-btn.ready {
		background-color: var(--color-primary);
		color: white;
		cursor: pointer;
	}

	.confirm-btn.ready:active {
		transform: scale(0.98);
	}

	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
		color: var(--color-text-tertiary);
	}
</style>
