<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { folders, removeFolder, updateFolder } from '$lib/stores/folders';
	import { words, removeWord, moveWordsToFolder, removeWordsFromFolder } from '$lib/stores/words';
	import { selectedWordIds, toggleWordSelection, setSelectedWords, clearSelection } from '$lib/stores/studySession';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import FolderModal from '$lib/components/FolderModal.svelte';
	import WordSelectionModal from '$lib/components/WordSelectionModal.svelte';
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';
	import { filterWords } from '$lib/utils/word-search';
	import SearchInput from '$lib/components/SearchInput.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { FOLDER_COLORS, MY_WORDS_FOLDER_ID } from '$lib/constants';
	import { fade, fly } from 'svelte/transition';

	let folderId = $derived($page.params.id);
	let isProtected = $derived(folderId === MY_WORDS_FOLDER_ID);
	let showFolderModal = $state(false);
	let showAddWordsModal = $state(false);
	let showOptionsSheet = $state(false);
	let editName = $state('');
	let editColor = $state('');
	let itemToDelete = $state<{ type: 'word' | 'folder' | 'selection', id?: string, name?: string, ids?: string[] } | null>(null);

	let folder = $derived($folders.find((f) => f.id === folderId));

	function openOptions() {
		editName = folder?.name ?? '';
		editColor = folder?.color ?? '';
		showOptionsSheet = true;
	}

	function saveEdits() {
		if (!folderId) return;
		if (isProtected) {
			updateFolder(folderId, folder?.name ?? '', editColor || undefined);
			showOptionsSheet = false;
		} else if (editName.trim()) {
			updateFolder(folderId, editName.trim(), editColor || undefined);
			showOptionsSheet = false;
		}
	}

	function confirmDeleteFolder() {
		showOptionsSheet = false;
		if (folder) {
			itemToDelete = { type: 'folder', id: folderId, name: folder.name };
		}
	}

	function confirmDeleteSelected() {
		if ($selectedWordIds.size > 0) {
			itemToDelete = { type: 'selection', ids: Array.from($selectedWordIds) };
		}
	}

	function handleDeleteConfirm() {
		if (!itemToDelete) return;

		if (itemToDelete.type === 'word' && itemToDelete.id) {
			removeWord(itemToDelete.id);
		} else if (itemToDelete.type === 'selection' && itemToDelete.ids) {
			itemToDelete.ids.forEach(id => removeWord(id));
			clearSelection();
		} else if (itemToDelete.type === 'folder' && itemToDelete.id) {
			const parent = folder?.parentId;
			removeFolder(itemToDelete.id);
			goto(parent ? `/cartelle/${parent}` : '/cartelle');
		}

		itemToDelete = null;
	}

	function handleAddExistingWords(wordIds: string[]) {
		if (folderId) moveWordsToFolder(wordIds, folderId);
	}
	let subfolders = $derived(
		$folders.filter((f) => f.parentId === folderId).map((f) => ({
			...f,
			wordCount: $words.filter((w) => w.folderId === f.id).length
		})).sort((a, b) => b.createdAt - a.createdAt)
	);
	let folderWords = $derived($words.filter((w) => w.folderId === folderId).sort((a, b) => b.createdAt - a.createdAt));

	let searchQuery = $state('');

	let filteredWords = $derived(filterWords(folderWords, searchQuery));

	// Count how many selected words are in this specific folder
	let selectedInFolder = $derived(
		folderWords.filter(w => $selectedWordIds.has(w.id)).length
	);

	$effect(() => {
		if (showOptionsSheet) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
		return () => { document.body.style.overflow = ''; };
	});
</script>

<svelte:head>
	<title>Anki-jin — {folder?.name ?? 'Cartella'}</title>
</svelte:head>

<div class="page page-enter">
	<PageHeader 
		title={folder?.name ?? 'Cartella'} 
		backHref={folder?.parentId ? `/cartelle/${folder.parentId}` : "/cartelle"}
	>
		{#snippet actions()}
			<button class="header-action-btn" onclick={openOptions} aria-label="Opzioni cartella">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="5" r="1" fill="currentColor" stroke="none" />
					<circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
					<circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
				</svg>
			</button>
		{/snippet}
	</PageHeader>

	{#if !folder}
		<div class="empty-state">
			<p class="empty-text">Cartella non trovata.</p>
		</div>
	{:else if folderWords.length === 0 && subfolders.length === 0}
		<div class="empty-state">
			<span class="empty-icon">📝</span>
			<p class="empty-text">Cartella vuota.</p>
			{#if !isProtected}
				<button class="study-folder-btn" style="width: auto; padding: 0.8rem 1.5rem; margin-top: 1rem;" onclick={() => showAddWordsModal = true}>
					Aggiungi la prima parola
				</button>
			{/if}
		</div>
	{:else}
		{#if subfolders.length > 0}
			<div class="folder-list">
				{#each subfolders as subfolder}
					<a href="/cartelle/{subfolder.id}" class="folder-item">
						<div class="folder-icon" style={subfolder.color ? `color: ${subfolder.color}` : ''}>
							<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
								<path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" />
							</svg>
						</div>
						<div class="folder-text">
							<span class="folder-name">{subfolder.name}</span>
							<span class="folder-count">{subfolder.wordCount} parole</span>
						</div>
						<Icon name="chevron-right" class="folder-chevron" />
					</a>
				{/each}
			</div>
		{/if}

		{#if folderWords.length > 0}
			<SearchInput bind:value={searchQuery} placeholder="Cerca in italiano, romaji, hiragana..." />

			<button class="study-folder-btn" style="margin-bottom: 1rem;" onclick={() => {
				if (selectedInFolder > 0) {
					const selected = folderWords.filter(w => $selectedWordIds.has(w.id)).map(w => w.id);
					setSelectedWords(selected);
				} else {
					setSelectedWords(folderWords.map(w => w.id));
				}
				goto('/studia');
			}}>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<polygon points="5 3 19 12 5 21 5 3" />
				</svg>
				{selectedInFolder > 0 ? `Studia ${selectedInFolder} selezionate` : 'Studia cartella'}
			</button>

			<div class="folder-controls">
				<div class="controls-left">
					<p class="word-count-label">{folderWords.length} parole in questa cartella</p>
					{#if selectedInFolder > 0}
						<button class="text-link delete" onclick={confirmDeleteSelected}>Elimina selezionate</button>
					{/if}
				</div>
				{#if selectedInFolder > 0}
					<div class="controls-right">
						<button class="text-link" onclick={clearSelection}>Deseleziona</button>
					</div>
				{/if}
			</div>

			<div class="word-list">
				{#each filteredWords as word (word.id)}
					<div class="word-row">
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div class="word-checkbox-area" onclick={() => toggleWordSelection(word.id)}>
							<div class="word-checkbox" class:checked={$selectedWordIds.has(word.id)}>
								<Icon name="check" strokeWidth={3} />
							</div>
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
			</div>
		{/if}
	{/if}

	{#if showAddWordsModal && folderId}
		<WordSelectionModal
			currentFolderId={folderId}
			onAdd={handleAddExistingWords}
			onClose={() => showAddWordsModal = false}
		/>
	{/if}

	{#if showOptionsSheet}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="sheet-backdrop" transition:fade={{ duration: 200 }} onclick={() => showOptionsSheet = false}></div>
		<div class="options-sheet" transition:fly={{ y: 300, duration: 300 }}>
			<div class="sheet-header">
				<h2 class="sheet-title">Opzioni cartella</h2>
				<button class="sheet-close" onclick={() => showOptionsSheet = false}>Annulla</button>
			</div>

			<div class="sheet-body">
				{#if !isProtected}
				<div class="sheet-section">
					<label class="sheet-label" for="edit-folder-name">Nome</label>
					<input
						id="edit-folder-name"
						type="text"
						class="sheet-input"
						bind:value={editName}
						onkeydown={(e) => e.key === 'Enter' && saveEdits()}
					/>
				</div>
				{/if}

				<div class="sheet-section">
					<span class="sheet-label">Colore</span>
					<div class="color-grid">
						{#each FOLDER_COLORS as color}
							<button
								type="button"
								class="color-swatch"
								class:selected={editColor === color}
								style="background-color: {color}"
								onclick={() => editColor = color}
								aria-label="Colore {color}"
							>
								{#if editColor === color}
									<Icon name="check" size={14} strokeWidth={4} stroke="white" />
								{/if}
							</button>
						{/each}
						<button
							type="button"
							class="color-swatch color-none"
							class:selected={editColor === ''}
							onclick={() => editColor = ''}
							aria-label="Nessun colore"
						>
							<Icon name="close" size={14} strokeWidth={2.5} />
						</button>
					</div>
				</div>
			</div>

			<div class="sheet-footer">
				<button class="save-btn" onclick={saveEdits} disabled={!isProtected && !editName.trim()}>
					Salva modifiche
				</button>

				{#if !isProtected}
				<div class="sheet-divider"></div>

				{#if folderWords.length > 0}
					<button class="sheet-action" onclick={() => { showOptionsSheet = false; showAddWordsModal = true; }}>
						<Icon name="plus" size={18} />
						Aggiungi parole
					</button>
				{/if}

				<button class="sheet-action danger" onclick={confirmDeleteFolder}>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<polyline points="3 6 5 6 21 6"></polyline>
						<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
					</svg>
					Elimina cartella
				</button>
				{/if}
			</div>
		</div>
	{/if}

	{#if folderWords.length === 0 && folder && !isProtected}
		<div class="fab-container">
			<button class="fab" onclick={() => showFolderModal = true}>
				<Icon name="plus" size={18} strokeWidth={2.5} />
				Nuova cartella
			</button>
		</div>
	{/if}

	{#if showFolderModal}
		<FolderModal parentId={folderId} onClose={() => showFolderModal = false} />
	{/if}

	{#if itemToDelete}
		<ConfirmationModal 
			title={itemToDelete.type === 'folder' ? 'Elimina cartella' : 'Elimina parole'}
			message={itemToDelete.type === 'folder' 
				? `Vuoi davvero eliminare la cartella "${itemToDelete.name}" e tutto il suo contenuto?` 
				: `Vuoi davvero eliminare le ${itemToDelete.ids?.length} parole selezionate?`}
			confirmLabel="Elimina"
			isDanger={true}
			onConfirm={handleDeleteConfirm}
			onCancel={() => itemToDelete = null}
		/>
	{/if}
</div>

<style>
	.page {
		padding: var(--spacing-page);
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
	}

	.header-action-btn {
		background: none;
		border: none;
		color: var(--color-text);
		cursor: pointer;
		padding: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-full);
	}

	.word-count-label {
		font-size: 0.82rem;
		font-weight: 500;
		color: var(--color-text-secondary);
		margin: 0;
	}

	/* ---- Folder Controls ---- */
	.folder-controls {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		margin-bottom: 2rem;
		gap: 1rem;
	}

	.controls-left {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.5rem;
	}

	.controls-right {
		display: flex;
		align-items: center;
		gap: 1.25rem;
	}

	.text-link {
		background: none;
		border: none;
		padding: 0;
		font-size: 0.82rem;
		font-weight: 700;
		color: var(--color-text-secondary);
		cursor: pointer;
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 2px;
	}

	.text-link.delete {
		color: var(--color-primary);
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
		user-select: none;
	}

	.word-row:last-child {
		border-bottom: none;
	}

	.word-checkbox-area {
		padding: 0.25rem;
		cursor: pointer;
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
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-width: 0;
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

	.study-folder-btn {
		width: 100%;
		padding: 0.9rem;
		background-color: var(--color-primary);
		color: white;
		border: none;
		border-radius: var(--radius-lg);
		font-size: 0.95rem;
		font-weight: 700;
		font-family: var(--font-sans);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		transition: all 0.2s ease;
	}

	.study-folder-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(139, 26, 26, 0.3);
	}

	.study-folder-btn:active {
		transform: translateY(0);
	}

	.empty-state {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: 0.5rem;
		padding: 4rem 0;
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

	.folder-list {
		display: flex;
		flex-direction: column;
		margin-bottom: 2rem;
	}

	.folder-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 0;
		text-decoration: none;
		color: inherit;
		transition: background-color 0.12s ease;
	}

	.folder-item:last-child {
		border-bottom: none;
	}

	.folder-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		color: var(--color-text-secondary);
		flex-shrink: 0;
	}

	.folder-text {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.folder-name {
		font-size: 1rem;
		font-weight: 600;
	}

	.folder-count {
		font-size: 0.82rem;
		color: var(--color-text-secondary);
		margin-top: 0.1rem;
	}

	.folder-chevron {
		color: var(--color-text-tertiary);
		flex-shrink: 0;
	}

	.fab-container {
		position: fixed;
		bottom: 2rem;
		right: var(--spacing-page);
		z-index: 50;
	}

	.fab {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.875rem 1.5rem;
		background-color: var(--color-accent);
		color: var(--color-text);
		border: none;
		border-radius: var(--radius-full);
		font-size: 0.95rem;
		font-weight: 700;
		font-family: var(--font-sans);
		cursor: pointer;
		white-space: nowrap;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	/* ---- Options Sheet ---- */
	.sheet-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(2px);
		z-index: 100;
	}

	.options-sheet {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: 90dvh;
		background-color: var(--color-bg);
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
		margin-bottom: 1.5rem;
		flex-shrink: 0;
	}

	.sheet-title {
		font-size: 1.35rem;
		font-weight: 800;
		color: var(--color-text-primary);
		margin: 0;
	}

	.sheet-close {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--color-text-secondary);
		font-size: 0.95rem;
		font-weight: 600;
		font-family: inherit;
	}

	.sheet-body {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 1.75rem;
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	.sheet-body::-webkit-scrollbar {
		display: none;
	}

	.sheet-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.sheet-label {
		font-size: 0.82rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-tertiary);
	}

	.sheet-input {
		width: 100%;
		padding: 0.75rem 1rem;
		border-radius: var(--radius-md);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		font-family: inherit;
		font-size: 1rem;
		color: var(--color-text);
		outline: none;
		box-sizing: border-box;
	}

	.sheet-input:focus {
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(139, 26, 26, 0.1);
	}

	.color-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1rem;
	}

	.color-swatch {
		aspect-ratio: 1;
		border-radius: var(--radius-lg);
		border: 3px solid transparent;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		transition: border-color 0.2s ease;
	}

	.color-swatch.selected {
		border-color: var(--color-text-primary);
	}

	.color-none {
		background: var(--color-surface);
		border-color: var(--color-border);
		color: var(--color-text-secondary);
	}

	.color-none.selected {
		border-color: var(--color-text-primary);
	}

	.sheet-footer {
		flex-shrink: 0;
		padding-top: 1rem;
		background-color: var(--color-bg);
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.save-btn {
		width: 100%;
		padding: 1.1rem;
		background-color: var(--color-border);
		color: var(--color-text-tertiary);
		border: none;
		border-radius: var(--radius-xl);
		font-size: 1.05rem;
		font-weight: 700;
		font-family: inherit;
		cursor: not-allowed;
		transition: all 0.2s ease;
		margin-bottom: 0.5rem;
	}

	.save-btn:not(:disabled) {
		background-color: var(--color-primary);
		color: white;
		cursor: pointer;
		box-shadow: 0 4px 12px rgba(139, 26, 26, 0.2);
	}

	.save-btn:not(:disabled):active {
		transform: scale(0.98);
	}

	.sheet-divider {
		height: 1px;
		background: var(--color-border);
		margin: 0.75rem 0;
	}

	.sheet-action {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.875rem 0;
		background: none;
		border: none;
		border-bottom: 1px solid var(--color-border);
		font-family: inherit;
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--color-text);
		cursor: pointer;
		text-align: left;
	}

	.sheet-action:last-child {
		border-bottom: none;
	}

	.sheet-action.danger {
		color: #C5221F;
	}
</style>
