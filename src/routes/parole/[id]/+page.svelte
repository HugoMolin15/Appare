<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { CATEGORIES, type CategoryValue } from '$lib/types/word';
	import { words, updateWord, removeWord } from '$lib/stores/words';
	import { folders } from '$lib/stores/folders';
	import { UNCATEGORIZED_TAG } from '$lib/constants';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import ClearableInput from '$lib/components/ClearableInput.svelte';
	import CategoryPicker from '$lib/components/CategoryPicker.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { fade, fly } from 'svelte/transition';

	let wordId = $derived($page.params.id);
	let word = $derived($words.find((w) => w.id === wordId));
	let createdAtFormatted = $derived(
		word ? new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(word.createdAt)) : ''
	);

	let italiano = $state('');
	let hiragana = $state('');
	let romaji = $state('');
	let kanji = $state('');
	let selectedTags = $state<string[]>([]);
	let wordType = $state<'word' | 'phrase'>('word');
	let destFolderId = $state<string | undefined>(undefined);
	let initialized = $state(false);

	$effect(() => {
		if (word && !initialized) {
			italiano = word.italiano;
			hiragana = word.hiragana || word.katakana;
			romaji = word.romaji;
			kanji = word.kanji;
			selectedTags = word.tags ?? (word.category ? [word.category] : []);
			wordType = word.wordType ?? 'word';
			destFolderId = word.folderId;
			initialized = true;
		}
	});

	// Build breadcrumb path for the current folder
	let folderPath = $derived.by(() => {
		if (!destFolderId) return null;
		const fs = $folders;
		const path: string[] = [];
		let current = fs.find(f => f.id === destFolderId);
		while (current) {
			path.unshift(current.name);
			current = current.parentId ? fs.find(f => f.id === current!.parentId) : undefined;
		}
		return path.length > 0 ? path : null;
	});

	// Move-to-folder sheet
	let showMoveSheet = $state(false);
	let moveBreadcrumb = $state<string[]>([]);
	let moveCurrentParent = $derived(moveBreadcrumb.length > 0 ? moveBreadcrumb[moveBreadcrumb.length - 1] : null);
	let moveFoldersAtLevel = $derived(
		$folders.filter(f => moveCurrentParent === null ? !f.parentId : f.parentId === moveCurrentParent)
	);

	function folderHasChildren(id: string) {
		return $folders.some(f => f.parentId === id);
	}
	function moveSheetDrillInto(id: string) { moveBreadcrumb = [...moveBreadcrumb, id]; }
	function moveSheetBack() { moveBreadcrumb = moveBreadcrumb.slice(0, -1); }
	function openMoveSheet() { moveBreadcrumb = []; showMoveSheet = true; }

	function selectDestFolder(id: string) {
		destFolderId = id;
		showMoveSheet = false;
		moveBreadcrumb = [];
	}

	$effect(() => {
		if (showMoveSheet) document.body.style.overflow = 'hidden';
		else document.body.style.overflow = '';
		return () => { document.body.style.overflow = ''; };
	});

	const allPresetValues = new Set(Object.values(CATEGORIES).flat() as string[]);

	// Duplicate detection (exclude self)
	let dupItaliano = $derived(
		italiano.trim().length > 0 &&
		$words.some(w => w.id !== wordId && w.italiano.toLowerCase() === italiano.trim().toLowerCase())
	);
	let dupHiragana = $derived(
		hiragana.trim().length > 0 &&
		$words.some(w => w.id !== wordId && (w.hiragana || w.katakana || '').toLowerCase() === hiragana.trim().toLowerCase())
	);
	let dupKanji = $derived(
		kanji.trim().length > 0 &&
		$words.some(w => w.id !== wordId && w.kanji?.trim().length > 0 && w.kanji.trim() === kanji.trim())
	);

	let isValid = $derived(
		italiano.trim().length > 0 &&
		hiragana.trim().length > 0 &&
		(wordType === 'phrase' || selectedTags.length > 0)
	);

	function handleSave() {
		if (!isValid || !wordId) return;
		// Drop the fallback tag if the user has assigned real tags
		const realTags = selectedTags.filter(t => t !== UNCATEGORIZED_TAG);
		const finalTags = realTags.length > 0 ? realTags : selectedTags;
		updateWord(wordId, {
			italiano: italiano.trim(),
			hiragana: hiragana.trim(),
			katakana: '',
			romaji: romaji.trim(),
			kanji: kanji.trim(),
			category: (finalTags.find(t => allPresetValues.has(t)) as CategoryValue | undefined),
			tags: finalTags.length > 0 ? finalTags : undefined,
			wordType,
			folderId: destFolderId
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
	<title>Anki-jin — Modifica parola</title>
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
				<label for="input-italiano" class="field-label">Italiano <span class="req">*</span></label>
				<ClearableInput bind:value={italiano} placeholder="es. grande" id="input-italiano" />
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
			</div>

			<div class="field">
				<label for="input-kanji" class="field-label">Kanji</label>
				<ClearableInput bind:value={kanji} placeholder="es. 大きい" id="input-kanji" japanese lang="ja" />
				{#if dupKanji}
					<span class="dup-warn">
						<Icon name="close" size={12} strokeWidth={3} />
						Attenzione: nel database è già presente una parola con questo campo
					</span>
				{/if}
			</div>

			<div class="field">
				<span class="field-label">Data creazione</span>
				<div class="date-field">{createdAtFormatted}</div>
			</div>

			<div class="field">
				<span class="field-label">Cartella</span>
				<div class="folder-path-field">
					{#if folderPath}
						<span class="folder-path">{folderPath.join(' / ')}</span>
					{:else}
						<span class="folder-path-none">Nessuna cartella</span>
					{/if}
					<button type="button" class="move-folder-btn" onclick={openMoveSheet}>Sposta</button>
				</div>
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
				Salva modifiche
			</button>
		</div>
	{/if}
</div>

{#if showMoveSheet}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="sheet-backdrop" transition:fade={{ duration: 200 }} onclick={() => showMoveSheet = false}></div>
	<div class="move-sheet" transition:fly={{ y: 300, duration: 300 }}>
		<div class="sheet-header">
			{#if moveBreadcrumb.length > 0}
				<button class="sheet-back" onclick={moveSheetBack}>
					<Icon name="chevron-left" size={20} strokeWidth={2.5} />
				</button>
			{/if}
			<h2 class="sheet-title">
				{moveBreadcrumb.length > 0
					? ($folders.find(f => f.id === moveCurrentParent)?.name ?? 'Cartella')
					: 'Sposta in cartella'}
			</h2>
			<button class="sheet-close" onclick={() => showMoveSheet = false}>Annulla</button>
		</div>

		<div class="move-folder-list">
			{#if moveBreadcrumb.length > 0}
				<button class="move-folder-row move-folder-leaf" onclick={() => selectDestFolder(moveCurrentParent!)}>
					<span class="move-folder-name">Metti qui</span>
				</button>
			{/if}
			{#each moveFoldersAtLevel as f}
				{#if folderHasChildren(f.id)}
					<button class="move-folder-row" onclick={() => moveSheetDrillInto(f.id)}>
						<span class="move-folder-name">{f.name}</span>
						<Icon name="chevron-right" size={18} />
					</button>
				{:else}
					<button class="move-folder-row move-folder-leaf" onclick={() => selectDestFolder(f.id)}>
						<span class="move-folder-name">{f.name}</span>
					</button>
				{/if}
			{/each}
			{#if moveFoldersAtLevel.length === 0 && moveBreadcrumb.length === 0}
				<p class="move-empty">Nessuna cartella disponibile.</p>
			{/if}
		</div>
	</div>
{/if}

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

	.req {
		color: var(--color-primary);
		font-weight: 700;
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

	.date-field {
		padding: 0.75rem 1rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		font-size: 0.95rem;
		color: var(--color-text-secondary);
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

	/* ---- Folder path field ---- */
	.folder-path-field {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}

	.folder-path {
		font-size: 0.9rem;
		color: var(--color-text);
		font-weight: 500;
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.folder-path-none {
		font-size: 0.9rem;
		color: var(--color-text-tertiary);
		flex: 1;
	}

	.move-folder-btn {
		background: none;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-full);
		padding: 0.3rem 0.75rem;
		font-size: 0.78rem;
		font-weight: 600;
		font-family: var(--font-sans);
		color: var(--color-text-secondary);
		cursor: pointer;
		white-space: nowrap;
		flex-shrink: 0;
	}

	/* ---- Move sheet ---- */
	.sheet-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(2px);
		z-index: 100;
	}

	.move-sheet {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		max-height: 75dvh;
		background: var(--color-bg);
		border-radius: var(--radius-xl) var(--radius-xl) 0 0;
		padding: 1.75rem;
		padding-bottom: calc(1rem + env(safe-area-inset-bottom));
		z-index: 101;
		box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.2);
		display: flex;
		flex-direction: column;
	}

	.sheet-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
		flex-shrink: 0;
	}

	.sheet-title {
		font-size: 1.1rem;
		font-weight: 700;
		margin: 0;
		flex: 1;
	}

	.sheet-close {
		background: none;
		border: none;
		color: var(--color-text-secondary);
		font-size: 0.9rem;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
	}

	.sheet-back {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		color: var(--color-text-secondary);
		display: flex;
		align-items: center;
		margin-right: 0.5rem;
	}

	.move-folder-list {
		display: flex;
		flex-direction: column;
		overflow-y: auto;
		flex: 1;
	}

	.move-folder-row {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 0;
		background: none;
		border: none;
		border-bottom: 1px solid var(--color-border);
		font-family: inherit;
		cursor: pointer;
		width: 100%;
		text-align: left;
		color: var(--color-text);
	}

	.move-folder-row:last-child { border-bottom: none; }

	.move-folder-leaf { color: var(--color-primary); }

	.move-folder-name {
		flex: 1;
		font-size: 0.95rem;
		font-weight: 600;
	}

	.move-empty {
		font-size: 0.9rem;
		color: var(--color-text-secondary);
		padding: 1.5rem 0;
		text-align: center;
	}
</style>
