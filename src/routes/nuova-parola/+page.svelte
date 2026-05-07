<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { CATEGORIES, type CategoryValue, type Word } from '$lib/types/word';
	import { addWord, words } from '$lib/stores/words';
	import { MY_WORDS_FOLDER_ID, UNCATEGORIZED_TAG } from '$lib/constants';
	import { folders } from '$lib/stores/folders';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import ClearableInput from '$lib/components/ClearableInput.svelte';
	import CategoryPicker from '$lib/components/CategoryPicker.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Flashcard from '$lib/components/Flashcard.svelte';
	import { fontSizeItaliano, fontSizeHiragana, fontSizeRomaji, fontSizeKanji } from '$lib/stores/settings';

	const FS_MIN = 0.5, FS_MAX = 5;
	function fsProgress(v: number) { return Math.round(((v - FS_MIN) / (FS_MAX - FS_MIN)) * 100); }
	let fsProgIt = $derived(fsProgress($fontSizeItaliano));
	let fsProgHi = $derived(fsProgress($fontSizeHiragana));
	let fsProgRo = $derived(fsProgress($fontSizeRomaji));
	let fsProgKa = $derived(fsProgress($fontSizeKanji));

	const urlFolderId = $page.url.searchParams.get('folderId');

	let italiano = $state('');
	let hiragana = $state('');
	let romaji = $state('');
	let kanji = $state('');
	let notes = $state('');
	let selectedTags = $state<string[]>(['Verbo Godan']);
	let wordType = $state<'word' | 'phrase'>('word');
	let destFolderId = $state(urlFolderId ?? MY_WORDS_FOLDER_ID);

	let topFolders = $derived($folders.filter(f => !f.parentId));

	const allPresetValues = new Set(Object.values(CATEGORIES).flat() as string[]);

	// Duplicate detection
	let dupItaliano = $derived(
		italiano.trim().length > 0 &&
		$words.some(w => w.italiano.toLowerCase() === italiano.trim().toLowerCase())
	);
	let dupHiragana = $derived(
		hiragana.trim().length > 0 &&
		$words.some(w => (w.hiragana || w.katakana || '').toLowerCase() === hiragana.trim().toLowerCase())
	);
	let dupKanji = $derived(
		kanji.trim().length > 0 &&
		$words.some(w => w.kanji?.trim().length > 0 && w.kanji.trim() === kanji.trim())
	);

	let isValid = $derived(
		italiano.trim().length > 0 &&
		hiragana.trim().length > 0 &&
		(wordType === 'phrase' || selectedTags.length > 0)
	);

	let previewWord = $derived<Word>({
		id: 'preview',
		italiano: italiano.trim(),
		hiragana: hiragana.trim(),
		katakana: '',
		romaji: romaji.trim(),
		kanji: kanji.trim(),
		notes: notes.trim() || undefined,
		wordType,
		createdAt: 0,
	});

	function saveWord() {
		const realTags = selectedTags.filter(t => t !== UNCATEGORIZED_TAG);
		const finalTags = realTags.length > 0 ? realTags : selectedTags;
		addWord({
			italiano: italiano.trim(),
			hiragana: hiragana.trim(),
			katakana: '',
			romaji: romaji.trim(),
			kanji: kanji.trim(),
			notes: notes.trim() || undefined,
			category: (finalTags.find(t => allPresetValues.has(t)) as CategoryValue | undefined),
			tags: finalTags.length > 0 ? finalTags : undefined,
			wordType,
			folderId: destFolderId || undefined
		});
	}

	function handleSave() {
		if (!isValid) return;
		saveWord();
		goto(destFolderId ? `/cartelle/${destFolderId}` : '/');
	}

	function handleSaveAndAddNew() {
		if (!isValid) return;
		saveWord();
		italiano = '';
		hiragana = '';
		romaji = '';
		kanji = '';
		notes = '';
		selectedTags = ['Verbo Godan'];
		wordType = 'word';
		// keep destFolderId so the user can keep adding to the same folder
	}
</script>

<svelte:head>
	<title>Anki-jin — Nuova parola</title>
</svelte:head>

<div class="page page-enter">
	<PageHeader title="Nuova parola" />

	<div class="word-preview">
		<Flashcard word={previewWord} />
	</div>

	<div class="fields">
		<div class="field">
			<label for="input-italiano" class="field-label">Italiano <span class="req">*</span></label>
			{#if wordType === 'phrase'}
				<textarea
					id="input-italiano"
					class="phrase-textarea"
					bind:value={italiano}
					placeholder="Scrivi la frase, usa Invio per andare a capo…"
					rows="4"
					autocomplete="off"
					autocapitalize="off"
				></textarea>
			{:else}
				<ClearableInput bind:value={italiano} placeholder="es. grande" id="input-italiano" />
			{/if}
			<div class="fs-row">
				<span class="fs-a-sm">A</span>
				<input type="range" min={FS_MIN} max={FS_MAX} step="0.1" value={$fontSizeItaliano}
					oninput={(e) => fontSizeItaliano.set(+(e.target as HTMLInputElement).value)}
					class="fs-slider" style="--progress: {fsProgIt}%" />
				<span class="fs-a-lg">A</span>
			</div>
			{#if dupItaliano}
				<span class="dup-warn">
					<Icon name="close" size={12} strokeWidth={3} />
					Attenzione: nel database è già presente una parola con questo campo
				</span>
			{/if}
		</div>

		<div class="field">
			<label for="input-hiragana" class="field-label">Hiragana/Katakana <span class="req">*</span></label>
			<ClearableInput bind:value={hiragana} placeholder="es. おおきい / オオキイ" id="input-hiragana" japanese lang="ja" />
			<div class="fs-row">
				<span class="fs-a-sm font-jp">あ</span>
				<input type="range" min={FS_MIN} max={FS_MAX} step="0.1" value={$fontSizeHiragana}
					oninput={(e) => fontSizeHiragana.set(+(e.target as HTMLInputElement).value)}
					class="fs-slider" style="--progress: {fsProgHi}%" />
				<span class="fs-a-lg font-jp">あ</span>
			</div>
			{#if dupHiragana}
				<span class="dup-warn">
					<Icon name="close" size={12} strokeWidth={3} />
					Attenzione: nel database è già presente una parola con questo campo
				</span>
			{/if}
		</div>

		<div class="field">
			<label for="input-romaji" class="field-label">Romaji</label>
			<ClearableInput bind:value={romaji} placeholder="es. ookii" id="input-romaji" />
			<div class="fs-row">
				<span class="fs-a-sm">A</span>
				<input type="range" min={FS_MIN} max={FS_MAX} step="0.1" value={$fontSizeRomaji}
					oninput={(e) => fontSizeRomaji.set(+(e.target as HTMLInputElement).value)}
					class="fs-slider" style="--progress: {fsProgRo}%" />
				<span class="fs-a-lg">A</span>
			</div>
		</div>

		<div class="field">
			<label for="input-kanji" class="field-label">Kanji</label>
			<ClearableInput bind:value={kanji} placeholder="es. 大きい" id="input-kanji" japanese lang="ja" />
			<div class="fs-row">
				<span class="fs-a-sm font-jp">字</span>
				<input type="range" min={FS_MIN} max={FS_MAX} step="0.1" value={$fontSizeKanji}
					oninput={(e) => fontSizeKanji.set(+(e.target as HTMLInputElement).value)}
					class="fs-slider" style="--progress: {fsProgKa}%" />
				<span class="fs-a-lg font-jp">字</span>
			</div>
			{#if dupKanji}
				<span class="dup-warn">
					<Icon name="close" size={12} strokeWidth={3} />
					Attenzione: nel database è già presente una parola con questo campo
				</span>
			{/if}
		</div>

		<div class="field">
			<label for="input-notes" class="field-label">Note</label>
			<textarea
				id="input-notes"
				class="notes-textarea"
				bind:value={notes}
				placeholder="Aggiungi una nota personale…"
				rows="3"
				autocomplete="off"
				autocapitalize="off"
			></textarea>
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
			<CategoryPicker bind:selectedTags={selectedTags} />
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
		<button
			type="button"
			class="save-add-btn"
			class:ready={isValid}
			disabled={!isValid}
			onclick={handleSaveAndAddNew}
		>
			Salva e aggiungi nuova
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

	/* ---- Card preview ---- */
	.word-preview {
		background: var(--color-surface);
		border-radius: var(--radius-xl);
		margin-bottom: 1.25rem;
	}

	/* ---- Font-size slider row ---- */
	.fs-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.35rem;
	}

	.fs-a-sm {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		flex-shrink: 0;
	}

	.fs-a-lg {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--color-text-secondary);
		flex-shrink: 0;
	}

	.fs-slider {
		flex: 1;
		height: 5px;
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

	.fs-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: var(--color-primary);
		border: 3px solid white;
		cursor: pointer;
	}

	.fs-slider::-moz-range-thumb {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: var(--color-primary);
		border: 3px solid white;
		cursor: pointer;
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

	.phrase-textarea {
		width: 100%;
		padding: 0.8rem 0.9rem;
		border: none;
		border-radius: var(--radius-md);
		background: var(--color-surface);
		color: var(--color-text);
		font-size: 1rem;
		font-family: var(--font-sans);
		outline: none;
		resize: vertical;
		box-sizing: border-box;
		line-height: 1.5;
		transition: background-color 0.15s ease, box-shadow 0.2s ease;
	}

	.phrase-textarea::placeholder {
		color: var(--color-text-tertiary);
		font-weight: 400;
	}

	.phrase-textarea:focus {
		box-shadow: inset 0 0 0 1.5px #e0dce6;
	}

	.notes-textarea {
		width: 100%;
		padding: 0.8rem 0.9rem;
		border: none;
		border-radius: var(--radius-md);
		background: var(--color-surface);
		color: var(--color-text);
		font-size: 0.95rem;
		font-family: var(--font-sans);
		outline: none;
		resize: vertical;
		box-sizing: border-box;
		line-height: 1.5;
		transition: box-shadow 0.2s ease;
	}

	.notes-textarea::placeholder {
		color: var(--color-text-tertiary);
		font-weight: 400;
	}

	.notes-textarea:focus {
		box-shadow: inset 0 0 0 1.5px #e0dce6;
	}

	.dup-warn {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: #b45309;
		margin-top: 0.15rem;
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
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
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

	.save-add-btn {
		width: 100%;
		padding: 0.9rem;
		background-color: var(--color-surface);
		color: var(--color-text-tertiary);
		border: none;
		border-radius: var(--radius-lg);
		font-size: 0.9rem;
		font-weight: 600;
		font-family: var(--font-sans);
		cursor: not-allowed;
		transition: all 0.25s ease;
	}

	.save-add-btn.ready {
		color: var(--color-primary);
		cursor: pointer;
	}

	.save-add-btn.ready:active {
		opacity: 0.7;
		transform: scale(0.98);
	}
</style>
