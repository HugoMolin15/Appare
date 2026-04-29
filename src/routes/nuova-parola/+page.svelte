<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import type { CategoryValue } from '$lib/types/word';
	import { addWord } from '$lib/stores/words';
	import { folders } from '$lib/stores/folders';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import ClearableInput from '$lib/components/ClearableInput.svelte';
	import CategoryPicker from '$lib/components/CategoryPicker.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { MY_WORDS_FOLDER_ID } from '$lib/constants';

	const urlFolderId = $page.url.searchParams.get('folderId');

	let italiano = $state('');
	let hiragana = $state('');
	let romaji = $state('');
	let kanji = $state('');
	let selectedCategory = $state<CategoryValue | null>('Verbo Godan');
	let wordType = $state<'word' | 'phrase'>('word');
	let destFolderId = $state(urlFolderId ?? MY_WORDS_FOLDER_ID);

	let topFolders = $derived($folders.filter(f => !f.parentId));

	let isValid = $derived(
		italiano.trim().length > 0 &&
		hiragana.trim().length > 0 &&
		(wordType === 'phrase' || selectedCategory !== null)
	);

	function handleSave() {
		if (!isValid) return;
		if (wordType === 'word' && !selectedCategory) return;

		addWord({
			italiano: italiano.trim(),
			hiragana: hiragana.trim(),
			katakana: '',
			romaji: romaji.trim(),
			kanji: kanji.trim(),
			category: selectedCategory ?? undefined,
			wordType,
			folderId: destFolderId || undefined
		});

		goto(destFolderId ? `/cartelle/${destFolderId}` : '/');
	}
</script>

<svelte:head>
	<title>Anki-jin — Nuova parola</title>
</svelte:head>

<div class="page page-enter">
	<PageHeader title="Nuova parola" />

	<div class="fields">
		<div class="field">
			<label for="input-italiano" class="field-label">Italiano <span class="req">*</span></label>
			<ClearableInput bind:value={italiano} placeholder="es. grande" id="input-italiano" />
		</div>

		<div class="field">
			<label for="input-hiragana" class="field-label">Hiragana/Katakana <span class="req">*</span></label>
			<ClearableInput bind:value={hiragana} placeholder="es. おおきい / オオキイ" id="input-hiragana" japanese lang="ja" />
		</div>

		<div class="field">
			<label for="input-romaji" class="field-label">Romaji</label>
			<ClearableInput bind:value={romaji} placeholder="es. ookii" id="input-romaji" />
		</div>

		<div class="field">
			<label for="input-kanji" class="field-label">Kanji</label>
			<ClearableInput bind:value={kanji} placeholder="es. 大きい" id="input-kanji" japanese lang="ja" />
		</div>

		<div class="field">
			<label for="dest-folder" class="field-label">Cartella di destinazione</label>
			<select id="dest-folder" class="folder-select" bind:value={destFolderId}>
				{#each topFolders as f}
					<option value={f.id}>{f.name}</option>
				{/each}
				<option value="">Nessuna cartella</option>
			</select>
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
				<Icon name="check" strokeWidth={2.5} />
			{/if}
			Salva
		</button>
	</div>
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

	.req {
		color: var(--color-primary);
		font-weight: 700;
	}

	.folder-select {
		width: 100%;
		padding: 0.75rem 1rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		font-size: 0.95rem;
		font-weight: 500;
		font-family: var(--font-sans);
		color: var(--color-text);
		appearance: none;
		-webkit-appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 0.85rem center;
		padding-right: 2.5rem;
		cursor: pointer;
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
</style>
