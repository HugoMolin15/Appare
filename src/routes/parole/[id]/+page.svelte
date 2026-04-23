<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import type { CategoryValue } from '$lib/types/word';
	import { words, updateWord, removeWord } from '$lib/stores/words';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import ClearableInput from '$lib/components/ClearableInput.svelte';
	import CategoryPicker from '$lib/components/CategoryPicker.svelte';

	let wordId = $derived($page.params.id);
	let word = $derived($words.find((w) => w.id === wordId));

	let italiano = $state('');
	let hiragana = $state('');
	let katakana = $state('');
	let romaji = $state('');
	let kanji = $state('');
	let selectedCategory = $state<CategoryValue | null>(null);
	let wordType = $state<'word' | 'phrase'>('word');
	let initialized = $state(false);

	$effect(() => {
		if (word && !initialized) {
			italiano = word.italiano;
			hiragana = word.hiragana;
			katakana = word.katakana;
			romaji = word.romaji;
			kanji = word.kanji;
			selectedCategory = word.category ?? null;
			wordType = word.wordType ?? 'word';
			initialized = true;
		}
	});

	let hasReading = $derived(
		hiragana.trim().length > 0 ||
		katakana.trim().length > 0 ||
		romaji.trim().length > 0
	);

	let isValid = $derived(
		italiano.trim().length > 0 &&
		(hasReading || kanji.trim().length > 0) &&
		(wordType === 'phrase' || selectedCategory !== null)
	);

	function handleSave() {
		if (!isValid || !wordId) return;
		if (wordType === 'word' && !selectedCategory) return;
		updateWord(wordId, {
			italiano: italiano.trim(),
			hiragana: hiragana.trim(),
			katakana: katakana.trim(),
			romaji: romaji.trim(),
			kanji: kanji.trim(),
			category: selectedCategory ?? undefined,
			wordType,
			folderId: word?.folderId
		});
		goto('/parole');
	}

	let showDeleteModal = $state(false);

	function handleDelete() {
		showDeleteModal = true;
	}

	function confirmDelete() {
		if (!wordId) return;
		removeWord(wordId);
		goto('/parole');
	}
</script>

<svelte:head>
	<title>Appare — Modifica parola</title>
</svelte:head>

{#if showDeleteModal}
	<div class="modal-overlay" onclick={() => showDeleteModal = false} role="button" tabindex="-1" onkeydown={() => {}}>
		<div class="modal-content" onclick={(e) => e.stopPropagation()} role="dialog">
			<h3 class="modal-title">Eliminare la parola?</h3>
			<p class="modal-desc">Questa azione non può essere annullata.</p>
			<div class="modal-actions">
				<button class="modal-btn btn-secondary" onclick={() => showDeleteModal = false}>Annulla</button>
				<button class="modal-btn btn-danger" onclick={confirmDelete}>Elimina</button>
			</div>
		</div>
	</div>
{/if}

<div class="page page-enter">
	{#if !word}
		<PageHeader title="Parola non trovata" backHref="/parole" />
		<div class="not-found">
			<p>Questa parola non esiste.</p>
		</div>
	{:else}
		<PageHeader title="Modifica parola" backHref="/parole">
			{#snippet actions()}
				<button class="delete-btn" onclick={handleDelete} aria-label="Elimina parola">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<polyline points="3 6 5 6 21 6"></polyline>
						<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
					</svg>
				</button>
			{/snippet}
		</PageHeader>

		<div class="fields">
			<div class="field">
				<label for="input-italiano" class="field-label">Italiano</label>
				<ClearableInput bind:value={italiano} placeholder="es. grande" id="input-italiano" />
			</div>

			<div class="field">
				<label for="input-hiragana" class="field-label">Hiragana</label>
				<ClearableInput bind:value={hiragana} placeholder="es. おおきい" id="input-hiragana" japanese lang="ja" />
			</div>

			<div class="field">
				<label for="input-katakana" class="field-label">Katakana</label>
				<ClearableInput bind:value={katakana} placeholder="es. オオキイ" id="input-katakana" japanese lang="ja" />
			</div>

			<div class="field">
				<label for="input-romaji" class="field-label">Romaji</label>
				<ClearableInput bind:value={romaji} placeholder="es. ookii" id="input-romaji" />
			</div>

			<div class="field">
				<label for="input-kanji" class="field-label">Kanji</label>
				<ClearableInput bind:value={kanji} placeholder="es. 大きい" id="input-kanji" japanese lang="ja" />
			</div>
		</div>

		<div class="type-picker">
			<button class="type-btn" class:active={wordType === 'word'} onclick={() => wordType = 'word'}>Parola</button>
			<button class="type-btn" class:active={wordType === 'phrase'} onclick={() => wordType = 'phrase'}>Frase</button>
		</div>

		{#if wordType === 'word'}
			<div class="category-area">
				<CategoryPicker bind:selected={selectedCategory} />
			</div>
		{/if}

		<div class="save-area">
			<button
				type="button"
				class="save-btn"
				class:ready={isValid}
				disabled={!isValid}
				onclick={handleSave}
			>
				{#if isValid}
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
						<polyline points="20 6 9 17 4 12" />
					</svg>
				{/if}
				Salva modifiche
			</button>
		</div>
	{/if}
</div>

<style>
	.page {
		padding: var(--spacing-page);
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		gap: 0;
		padding-bottom: 2rem;
	}

	.not-found {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-text-secondary);
	}

	.delete-btn {
		background: none;
		border: none;
		color: var(--color-text);
		cursor: pointer;
		padding: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-full);
		transition: all 0.2s ease;
	}

	.delete-btn:hover {
		background-color: #FCE8E6;
		color: #C5221F;
	}

	.fields {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 1.75rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.field-label {
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.type-picker {
		display: flex;
		background: var(--color-surface);
		border-radius: var(--radius-lg);
		padding: 0.25rem;
		gap: 0.25rem;
		margin-bottom: 1.25rem;
	}

	.type-btn {
		flex: 1;
		padding: 0.6rem;
		border: none;
		border-radius: var(--radius-md);
		font-size: 0.9rem;
		font-weight: 600;
		font-family: var(--font-sans);
		cursor: pointer;
		background: none;
		color: var(--color-text-secondary);
		transition: all 0.15s ease;
	}

	.type-btn.active {
		background: var(--color-bg);
		color: var(--color-text);
		box-shadow: 0 1px 3px rgba(0,0,0,0.1);
	}

	.category-area {
		margin-bottom: 2rem;
	}

	.save-area {
		margin-top: auto;
		padding-top: 0.5rem;
	}

	.save-btn {
		width: 100%;
		padding: 0.9rem;
		background-color: var(--color-border);
		color: var(--color-text-tertiary);
		border: none;
		border-radius: var(--radius-lg);
		font-size: 1rem;
		font-weight: 600;
		font-family: var(--font-sans);
		cursor: not-allowed;
		transition: all 0.25s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.save-btn.ready {
		background-color: var(--color-primary);
		color: white;
		cursor: pointer;
	}

	.save-btn.ready:hover {
		background-color: var(--color-primary-light);
	}

	.save-btn.ready:active {
		background-color: var(--color-primary-dark);
		transform: scale(0.98);
	}

	/* ---- Delete modal ---- */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1.5rem;
	}

	.modal-content {
		background: var(--color-bg);
		border-radius: var(--radius-xl);
		padding: 2rem;
		width: 100%;
		max-width: 320px;
		text-align: center;
	}

	.modal-title {
		font-size: 1.2rem;
		font-weight: 700;
		margin: 0 0 0.5rem;
	}

	.modal-desc {
		font-size: 0.9rem;
		color: var(--color-text-secondary);
		margin: 0 0 1.5rem;
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
		font-family: var(--font-sans);
		cursor: pointer;
		border: none;
	}

	.btn-secondary {
		background: var(--color-surface);
		color: var(--color-text);
	}

	.btn-danger {
		background: #C5221F;
		color: white;
	}
</style>
