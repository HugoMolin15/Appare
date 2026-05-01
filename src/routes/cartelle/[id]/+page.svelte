<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { get } from 'svelte/store';
	import { folders, removeFolder, updateFolder } from '$lib/stores/folders';
	import { folderOrder, moveFolderInOrder, snapshotFolderOrder, clearFolderOrder, applyFolderOrder } from '$lib/stores/folderOrder';
	import { words, removeWord, moveWordsToFolder } from '$lib/stores/words';
	import { selectedWordIds, toggleWordSelection, setSelectedWords, clearSelection } from '$lib/stores/studySession';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import FolderModal from '$lib/components/FolderModal.svelte';
	import WordSelectionModal from '$lib/components/WordSelectionModal.svelte';
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';
	import WordRow from '$lib/components/WordRow.svelte';
	import { filterWords } from '$lib/utils/word-search';
	import SearchInput from '$lib/components/SearchInput.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { FOLDER_COLORS, MY_WORDS_FOLDER_ID } from '$lib/constants';
	import { shuffle } from '$lib/utils/shuffle';
	import SheetBackdrop from '$lib/components/SheetBackdrop.svelte';
	import { fly } from 'svelte/transition';

	let folderId = $derived($page.params.id as string);
	let isProtected = $derived(folderId === MY_WORDS_FOLDER_ID);
	let showFolderModal = $state(false);
	let showAddWordsModal = $state(false);
	let showOptionsSheet = $state(false);
	let showMoveSheet = $state(false);
	let editName = $state('');
	let editColor = $state('');
	let itemToDelete = $state<{ type: 'word' | 'folder' | 'selection', id?: string, name?: string, ids?: string[] } | null>(null);

	let folder = $derived($folders.find((f) => f.id === folderId));

	// ---- Select mode (words + subfolders) ----
	let selectMode = $state(false);
	let selectedSubfolderIds = $state(new Set<string>());

	function toggleSubfolderSelect(id: string) {
		const next = new Set(selectedSubfolderIds);
		if (next.has(id)) next.delete(id); else next.add(id);
		selectedSubfolderIds = next;
	}

	function enterSelectMode() {
		clearSelection();
		selectedSubfolderIds = new Set();
		selectMode = true;
	}

	function exitSelectMode() {
		selectMode = false;
		clearSelection();
		selectedSubfolderIds = new Set();
	}

	// ---- Options / folder edits ----
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
		if (folder) itemToDelete = { type: 'folder', id: folderId, name: folder.name };
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
			selectedSubfolderIds = new Set();
			selectMode = false;
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

	// ---- Subfolders ----
	let reorderSubfoldersMode = $state(false);

	let subfolders = $derived.by(() => {
		const base = $folders
			.filter((f) => f.parentId === folderId)
			.map((f) => ({ ...f, wordCount: $words.filter((w) => w.folderId === f.id).length }));
		// Default sort ('newest') honours the user's manual reorder if set;
		// any other sort mode overrides it.
		if (wordSortMode === 'newest' && $folderOrder[folderId]) {
			return applyFolderOrder(base, $folderOrder, folderId);
		}
		return applySortFolders(base, wordSortMode);
	});

	function enterSubfolderReorder() {
		snapshotFolderOrder(folderId, subfolders.map(f => f.id));
		reorderSubfoldersMode = true;
	}
	function exitSubfolderReorder() { reorderSubfoldersMode = false; }
	function resetSubfolderOrder() { clearFolderOrder(folderId); reorderSubfoldersMode = false; }

	// ---- Words + search ----
	type WordSort = 'newest' | 'oldest' | 'it-az' | 'jp-az';
	let wordSortMode = $state<WordSort>('newest');
	const wordSortLabels: Record<WordSort, string> = { newest: 'Più recenti', oldest: 'Meno recenti', 'it-az': 'A-Z Italiano', 'jp-az': 'A-Z Giapponese' };
	const wordSortCycle: WordSort[] = ['newest', 'oldest', 'it-az', 'jp-az'];
	function cycleWordSort() { wordSortMode = wordSortCycle[(wordSortCycle.indexOf(wordSortMode) + 1) % wordSortCycle.length]; }

	function applySortWords<T extends { createdAt: number; italiano: string; hiragana: string; katakana: string }>(list: T[], mode: WordSort): T[] {
		const arr = [...list];
		if (mode === 'oldest') return arr.sort((a, b) => a.createdAt - b.createdAt);
		if (mode === 'it-az') return arr.sort((a, b) => a.italiano.localeCompare(b.italiano, 'it'));
		if (mode === 'jp-az') return arr.sort((a, b) => (a.hiragana || a.katakana).localeCompare(b.hiragana || b.katakana, 'ja'));
		return arr.sort((a, b) => b.createdAt - a.createdAt);
	}

	function applySortFolders<T extends { createdAt: number; name: string }>(list: T[], mode: WordSort): T[] {
		const arr = [...list];
		if (mode === 'oldest') return arr.sort((a, b) => a.createdAt - b.createdAt);
		if (mode === 'it-az') return arr.sort((a, b) => a.name.localeCompare(b.name, 'it'));
		if (mode === 'jp-az') return arr.sort((a, b) => a.name.localeCompare(b.name, 'ja'));
		return arr.sort((a, b) => b.createdAt - a.createdAt);
	}

	let folderWords = $derived(applySortWords($words.filter((w) => w.folderId === folderId), wordSortMode));

	// All words reachable from this folder (this folder + every descendant subfolder)
	let allDescendantWordIds = $derived.by(() => {
		const ws = $words; const fs = $folders;
		function collect(fid: string): string[] {
			const direct = ws.filter(w => w.folderId === fid).map(w => w.id);
			const subs = fs.filter(f => f.parentId === fid).map(f => f.id);
			return [...direct, ...subs.flatMap(collect)];
		}
		return collect(folderId);
	});
	let searchQuery = $state('');
	let filteredSubfolders = $derived(
		searchQuery.trim()
			? subfolders.filter(f => f.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
			: subfolders
	);
	let filteredWords = $derived(filterWords(folderWords, searchQuery));

	// ---- Selection counts ----
	let selectedInFolder = $derived(folderWords.filter(w => $selectedWordIds.has(w.id)).length);
	let totalSelected = $derived(selectedInFolder + selectedSubfolderIds.size);

	// How many words are reachable from the current selection
	let selectedWordCount = $derived.by(() => {
		const ws = $words; const fs = $folders;
		function collect(fid: string): string[] {
			const direct = ws.filter(w => w.folderId === fid).map(w => w.id);
			const subs = fs.filter(f => f.parentId === fid).map(f => f.id);
			return [...direct, ...subs.flatMap(collect)];
		}
		const fromFolders = [...selectedSubfolderIds].flatMap(collect);
		const fromWords = folderWords.filter(w => $selectedWordIds.has(w.id)).map(w => w.id);
		return new Set([...fromFolders, ...fromWords]).size;
	});

	// Count label
	let countLabel = $derived.by(() => {
		const parts: string[] = [];
		if (subfolders.length > 0) parts.push(`${subfolders.length} ${subfolders.length === 1 ? 'cartella' : 'cartelle'}`);
		if (folderWords.length > 0) parts.push(`${folderWords.length} ${folderWords.length === 1 ? 'parola' : 'parole'}`);
		return parts.join(' · ');
	});

	// ---- Study ----
	function studyAll() {
		if (allDescendantWordIds.length === 0) return;
		setSelectedWords(shuffle(allDescendantWordIds));
		goto('/studia');
	}

	function studySelected() {
		const ws = get(words); const fs = get(folders); const sel = get(selectedWordIds);
		function collect(fid: string): string[] {
			const direct = ws.filter(w => w.folderId === fid).map(w => w.id);
			const subs = fs.filter(f => f.parentId === fid).map(f => f.id);
			return [...direct, ...subs.flatMap(collect)];
		}
		const fromFolders = [...selectedSubfolderIds].flatMap(collect);
		const fromWords = folderWords.filter(w => sel.has(w.id)).map(w => w.id);
		const ids = shuffle([...new Set([...fromFolders, ...fromWords])]);
		if (ids.length === 0) return;
		setSelectedWords(ids);
		goto('/studia');
	}

	// ---- Move sheet (Finder-style) ----
	let moveBreadcrumb = $state<string[]>([]);
	let moveCurrentParent = $derived(moveBreadcrumb.length > 0 ? moveBreadcrumb[moveBreadcrumb.length - 1] : null);
	let moveFoldersAtLevel = $derived(
		$folders.filter(f =>
			(moveCurrentParent === null ? !f.parentId : f.parentId === moveCurrentParent) &&
			f.id !== folderId
		)
	);
	function folderHasChildren(id: string) { return $folders.some(f => f.parentId === id); }
	function moveSheetDrillInto(id: string) { moveBreadcrumb = [...moveBreadcrumb, id]; }
	function moveSheetBack() { moveBreadcrumb = moveBreadcrumb.slice(0, -1); }
	function openMoveSheet() { moveBreadcrumb = []; showMoveSheet = true; }
	function moveSelected(targetFolderId: string) {
		const ids = folderWords.filter(w => $selectedWordIds.has(w.id)).map(w => w.id);
		moveWordsToFolder(ids, targetFolderId);
		clearSelection();
		selectedSubfolderIds = new Set();
		selectMode = false;
		showMoveSheet = false;
		moveBreadcrumb = [];
	}

	$effect(() => {
		if (showOptionsSheet) document.body.style.overflow = 'hidden';
		else document.body.style.overflow = '';
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

	{:else if subfolders.length === 0 && folderWords.length === 0}
		<div class="empty-state">
			<span class="empty-icon">📝</span>
			<p class="empty-text">Cartella vuota.</p>
			{#if !isProtected}
				<button class="study-btn" style="margin-top: 1.5rem; width: auto; padding: 0.8rem 1.5rem;" onclick={() => showAddWordsModal = true}>
					Aggiungi la prima parola
				</button>
			{/if}
		</div>

	{:else}
		<!-- ① Search — always at top -->
		<SearchInput bind:value={searchQuery} placeholder="Cerca cartelle e parole..." />

		<!-- ② Controls bar: count + Seleziona/Fine -->
		<div class="controls-bar">
			<span class="count-label">{countLabel}</span>
			<button class="select-toggle" onclick={selectMode ? exitSelectMode : enterSelectMode}>
				{selectMode ? 'Fine' : 'Seleziona'}
			</button>
		</div>

		<!-- ③ Action row — always visible -->
		{#if selectMode && totalSelected > 0}
			<div class="action-row">
				<button class="study-btn" onclick={studySelected} disabled={selectedWordCount === 0}>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
					Studia {selectedWordCount > 0 ? selectedWordCount : ''} {selectedWordCount === 1 ? 'parola' : selectedWordCount > 1 ? 'parole' : ''}
				</button>
				{#if selectedInFolder > 0}
					<button class="action-pill" onclick={openMoveSheet}>Sposta</button>
					<button class="action-pill danger" onclick={confirmDeleteSelected}>Elimina</button>
				{/if}
				<button class="action-pill muted" onclick={() => { clearSelection(); selectedSubfolderIds = new Set(); }}>Deseleziona</button>
			</div>
		{:else if allDescendantWordIds.length > 0}
			<div class="action-row">
				<button class="study-btn" onclick={studyAll}>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
					Studia tutto ({allDescendantWordIds.length})
				</button>
			</div>
		{/if}

		<!-- ④ Sort/reorder controls -->
		<div class="sort-row">
			{#if subfolders.length > 1 && !selectMode && !reorderSubfoldersMode}
				<button class="sort-btn" onclick={enterSubfolderReorder}>Riordina</button>
			{/if}
			{#if reorderSubfoldersMode}
				<button class="sort-btn reorder-active" onclick={exitSubfolderReorder}>Fine</button>
				{#if $folderOrder[folderId]}
					<button class="sort-btn" onclick={resetSubfolderOrder}>Reimposta</button>
				{/if}
			{/if}
			{#if folderWords.length > 0 || subfolders.length > 0}
				<button class="sort-btn" onclick={cycleWordSort}>↕ {wordSortLabels[wordSortMode]}</button>
			{/if}
		</div>

		<!-- ⑤ Subfolders -->
		{#if filteredSubfolders.length > 0}
			<div class="item-list">
				{#each filteredSubfolders as subfolder, i}
					{#if reorderSubfoldersMode}
						<div class="folder-item">
							<div class="folder-icon" style={subfolder.color ? `color: ${subfolder.color}` : ''}>
								<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/></svg>
							</div>
							<div class="item-text">
								<span class="item-title">{subfolder.name}</span>
								<span class="item-sub">{subfolder.wordCount} parole</span>
							</div>
							<div class="reorder-btns">
								<button class="reorder-btn" disabled={i === 0} onclick={() => moveFolderInOrder(folderId, subfolder.id, 'up', subfolders.map(f => f.id))} aria-label="Sposta su">↑</button>
								<button class="reorder-btn" disabled={i === subfolders.length - 1} onclick={() => moveFolderInOrder(folderId, subfolder.id, 'down', subfolders.map(f => f.id))} aria-label="Sposta giù">↓</button>
							</div>
						</div>
					{:else if selectMode}
						<!-- svelte-ignore a11y_interactive_supports_focus -->
						<div class="folder-item selectable" role="checkbox" aria-checked={selectedSubfolderIds.has(subfolder.id)} onclick={() => toggleSubfolderSelect(subfolder.id)}>
							<div class="item-checkbox" class:checked={selectedSubfolderIds.has(subfolder.id)}>
								<Icon name="check" strokeWidth={3} />
							</div>
							<div class="folder-icon" style={subfolder.color ? `color: ${subfolder.color}` : ''}>
								<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/></svg>
							</div>
							<div class="item-text">
								<span class="item-title">{subfolder.name}</span>
								<span class="item-sub">{subfolder.wordCount} parole</span>
							</div>
						</div>
					{:else}
						<a href="/cartelle/{subfolder.id}" class="folder-item">
							<div class="folder-icon" style={subfolder.color ? `color: ${subfolder.color}` : ''}>
								<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/></svg>
							</div>
							<div class="item-text">
								<span class="item-title">{subfolder.name}</span>
								<span class="item-sub">{subfolder.wordCount} parole</span>
							</div>
							<Icon name="chevron-right" class="item-chevron" />
						</a>
					{/if}
				{/each}
			</div>
		{/if}

		<!-- ⑥ Words -->
		{#if filteredWords.length > 0}
			<div class="item-list">
				{#each filteredWords as word (word.id)}
					{#if selectMode}
						<WordRow
							{word}
							selectable
							role="checkbox"
							ariaChecked={$selectedWordIds.has(word.id)}
							onclick={() => toggleWordSelection(word.id)}
						>
							{#snippet leading()}
								<div class="item-checkbox" class:checked={$selectedWordIds.has(word.id)}>
									<Icon name="check" strokeWidth={3} />
								</div>
							{/snippet}
						</WordRow>
					{:else}
						<WordRow {word} href="/parole/{word.id}?from=/cartelle/{folderId}" />
					{/if}
				{/each}
			</div>
		{:else if searchQuery.trim() && folderWords.length > 0 && filteredSubfolders.length === 0}
			<p class="no-results">Nessun risultato per "{searchQuery}"</p>
		{/if}
	{/if}

	<!-- Modals & sheets -->
	{#if showAddWordsModal && folderId}
		<WordSelectionModal currentFolderId={folderId} onAdd={handleAddExistingWords} onClose={() => showAddWordsModal = false} />
	{/if}

	{#if subfolders.length === 0 && folderWords.length === 0 && folder && !isProtected}
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

	<!-- Options sheet -->
	{#if showOptionsSheet}
		<SheetBackdrop onClose={() => showOptionsSheet = false} />
		<div class="options-sheet" transition:fly={{ y: 300, duration: 300 }}>
			<div class="sheet-header">
				<h2 class="sheet-title">Opzioni cartella</h2>
				<button class="sheet-close" onclick={() => showOptionsSheet = false}>Annulla</button>
			</div>
			<div class="sheet-body">
				{#if !isProtected}
					<div class="sheet-section">
						<label class="sheet-label" for="edit-folder-name">Nome</label>
						<input id="edit-folder-name" type="text" class="sheet-input" bind:value={editName} onkeydown={(e) => e.key === 'Enter' && saveEdits()} />
					</div>
				{/if}
				<div class="sheet-section">
					<span class="sheet-label">Colore</span>
					<div class="color-grid">
						{#each FOLDER_COLORS as color}
							<button type="button" class="color-swatch" class:selected={editColor === color} style="background-color: {color}" onclick={() => editColor = color} aria-label="Colore {color}">
								{#if editColor === color}<Icon name="check" size={14} strokeWidth={4} stroke="white" />{/if}
							</button>
						{/each}
						<button type="button" class="color-swatch color-none" class:selected={editColor === ''} onclick={() => editColor = ''} aria-label="Nessun colore">
							<Icon name="close" size={14} strokeWidth={2.5} />
						</button>
					</div>
				</div>
			</div>
			<div class="sheet-footer">
				<button class="save-btn" onclick={saveEdits} disabled={!isProtected && !editName.trim()}>Salva modifiche</button>
				{#if !isProtected}
					<div class="sheet-divider"></div>
					<button class="sheet-action" onclick={() => { showOptionsSheet = false; showAddWordsModal = true; }}>
						<Icon name="plus" size={18} /> Aggiungi parole
					</button>
					<button class="sheet-action danger" onclick={confirmDeleteFolder}>
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
						Elimina cartella
					</button>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Move sheet — Finder style -->
	{#if showMoveSheet}
		<SheetBackdrop onClose={() => showMoveSheet = false} />
		<div class="options-sheet" transition:fly={{ y: 300, duration: 300 }}>
			<div class="sheet-header">
				{#if moveBreadcrumb.length > 0}
					<button class="sheet-back" onclick={moveSheetBack}>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
					</button>
				{/if}
				<h2 class="sheet-title">
					{moveBreadcrumb.length > 0 ? ($folders.find(f => f.id === moveCurrentParent)?.name ?? 'Cartella') : 'Sposta in cartella'}
				</h2>
				<button class="sheet-close" onclick={() => showMoveSheet = false}>Annulla</button>
			</div>
			<div class="move-folder-list">
				{#if moveBreadcrumb.length > 0}
					<div class="move-folder-entry">
						<button class="move-folder-select metti-qui" onclick={() => moveSelected(moveCurrentParent!)}>Sposta qui</button>
					</div>
				{/if}
				{#each moveFoldersAtLevel as f}
					<div class="move-folder-entry">
						<button class="move-folder-select" onclick={() => moveSelected(f.id)}>
							<span class="move-folder-name">{f.name}</span>
						</button>
						{#if folderHasChildren(f.id)}
							<button class="move-folder-drill" onclick={() => moveSheetDrillInto(f.id)} aria-label="Apri {f.name}">
								<Icon name="chevron-right" size={18} />
							</button>
						{/if}
					</div>
				{/each}
				{#if moveFoldersAtLevel.length === 0 && moveBreadcrumb.length === 0}
					<p class="move-empty">Nessuna cartella disponibile.</p>
				{/if}
			</div>
		</div>
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

	/* ---- Controls bar ---- */
	.controls-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.65rem;
	}

	.count-label {
		font-size: 0.82rem;
		font-weight: 500;
		color: var(--color-text-secondary);
	}

	.select-toggle {
		background: none;
		border: none;
		font-size: 0.9rem;
		font-weight: 700;
		font-family: var(--font-sans);
		color: var(--color-primary);
		cursor: pointer;
		padding: 0.25rem 0;
	}

	/* ---- Action row ---- */
	.action-row {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		align-items: center;
		margin-bottom: 0.65rem;
	}

	.study-btn {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.6rem 1rem;
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: var(--radius-full);
		font-size: 0.88rem;
		font-weight: 700;
		font-family: var(--font-sans);
		cursor: pointer;
		white-space: nowrap;
	}

	.study-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.action-pill {
		padding: 0.5rem 0.85rem;
		border-radius: var(--radius-full);
		border: 1px solid var(--color-border);
		font-size: 0.82rem;
		font-weight: 700;
		font-family: var(--font-sans);
		cursor: pointer;
		background: var(--color-surface);
		color: var(--color-text);
	}

	.action-pill.danger { color: #C5221F; border-color: #C5221F; }
	.action-pill.muted { color: var(--color-text-secondary); }

	/* ---- Sort row ---- */
	.sort-row {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-bottom: 0.75rem;
	}

	.sort-btn {
		background: none;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-full);
		padding: 0.3rem 0.85rem;
		font-size: 0.78rem;
		font-weight: 600;
		font-family: var(--font-sans);
		color: var(--color-text-secondary);
		cursor: pointer;
	}

	.sort-btn.reorder-active { border-color: var(--color-primary); color: var(--color-primary); }

	/* ---- Item lists (shared folder + word styles) ---- */
	.item-list {
		display: flex;
		flex-direction: column;
		margin-bottom: 0.5rem;
	}

	.folder-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.85rem 0;
		border-bottom: 1px solid var(--color-border-light, var(--color-border));
		text-decoration: none;
		color: inherit;
	}

	.folder-item:last-child { border-bottom: none; }

	.folder-item.selectable {
		cursor: pointer;
		background: none;
		border: none;
		border-bottom: 1px solid var(--color-border-light, var(--color-border));
		width: 100%;
		text-align: left;
	}

	.folder-item.selectable:last-child { border-bottom: none; }

	.item-checkbox {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		border: 2px solid var(--color-border);
		display: flex;
		align-items: center;
		justify-content: center;
		color: transparent;
		transition: all 0.15s ease;
		flex-shrink: 0;
	}

	.item-checkbox :global(svg) { width: 14px; height: 14px; }

	.item-checkbox.checked {
		background-color: #1A1A1A;
		border-color: #1A1A1A;
		color: white;
	}

	.folder-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		color: var(--color-text-secondary);
		flex-shrink: 0;
	}

	.item-text {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.item-title {
		font-size: 1rem;
		font-weight: 600;
	}

	.item-sub {
		font-size: 0.82rem;
		color: var(--color-text-secondary);
		margin-top: 0.1rem;
	}

	:global(.item-chevron) { color: var(--color-text-tertiary); flex-shrink: 0; }

	.no-results {
		font-size: 0.9rem;
		color: var(--color-text-secondary);
		padding: 1.5rem 0;
		text-align: center;
	}

	/* ---- Empty state ---- */
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

	.empty-icon { font-size: 3rem; margin-bottom: 0.5rem; }
	.empty-text { font-size: 1.1rem; font-weight: 600; margin: 0; }

	/* ---- Reorder buttons ---- */
	.reorder-btns { display: flex; gap: 0.25rem; flex-shrink: 0; }

	.reorder-btn {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: 1rem;
		cursor: pointer;
		color: var(--color-text);
	}

	.reorder-btn:disabled { opacity: 0.3; cursor: not-allowed; }
	.reorder-btn:not(:disabled):active { background: var(--color-border); }

	/* ---- FAB ---- */
	.fab-container { position: fixed; bottom: 2rem; right: var(--spacing-page); z-index: 50; }

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

	/* ---- Bottom sheets ---- */
	.options-sheet {
		position: fixed; bottom: 0; left: 0; right: 0;
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

	.sheet-title { font-size: 1.35rem; font-weight: 800; color: var(--color-text-primary); margin: 0; flex: 1; }

	.sheet-close {
		background: none; border: none; cursor: pointer;
		color: var(--color-text-secondary); font-size: 0.95rem; font-weight: 600; font-family: inherit;
	}

	.sheet-back {
		background: none; border: none; padding: 0; cursor: pointer;
		color: var(--color-text-secondary); display: flex; align-items: center; flex-shrink: 0; margin-right: 0.5rem;
	}

	.sheet-body {
		flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 1.75rem;
		scrollbar-width: none; -ms-overflow-style: none;
	}
	.sheet-body::-webkit-scrollbar { display: none; }

	.sheet-section { display: flex; flex-direction: column; gap: 0.75rem; }

	.sheet-label {
		font-size: 0.82rem; font-weight: 700; text-transform: uppercase;
		letter-spacing: 0.05em; color: var(--color-text-tertiary);
	}

	.sheet-input {
		width: 100%; padding: 0.75rem 1rem; border-radius: var(--radius-md);
		background: var(--color-surface); border: 1px solid var(--color-border);
		font-family: inherit; font-size: 1rem; color: var(--color-text); outline: none; box-sizing: border-box;
	}
	.sheet-input:focus { border-color: #e0dce6; box-shadow: none; }

	.color-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.75rem; }

	@media (min-width: 640px) {
		.color-grid { grid-template-columns: repeat(8, 1fr); gap: 0.6rem; }
	}

	.color-swatch {
		aspect-ratio: 1; border-radius: var(--radius-lg); border: 3px solid transparent;
		cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0;
	}
	.color-swatch.selected { border-color: var(--color-text-primary); }
	.color-none { background: var(--color-surface); border-color: var(--color-border); color: var(--color-text-secondary); }
	.color-none.selected { border-color: var(--color-text-primary); }

	.sheet-footer { flex-shrink: 0; padding-top: 1rem; background-color: var(--color-bg); display: flex; flex-direction: column; gap: 0; }

	.save-btn {
		width: 100%; padding: 1.1rem; background-color: var(--color-border); color: var(--color-text-tertiary);
		border: none; border-radius: var(--radius-xl); font-size: 1.05rem; font-weight: 700; font-family: inherit;
		cursor: not-allowed; margin-bottom: 0.5rem;
	}
	.save-btn:not(:disabled) { background-color: var(--color-primary); color: white; cursor: pointer; }
	.save-btn:not(:disabled):active { transform: scale(0.98); }

	.sheet-divider { height: 1px; background: var(--color-border); margin: 0.75rem 0; }

	.sheet-action {
		display: flex; align-items: center; gap: 0.75rem; width: 100%; padding: 0.875rem 0;
		background: none; border: none; border-bottom: 1px solid var(--color-border);
		font-family: inherit; font-size: 0.95rem; font-weight: 600; color: var(--color-text); cursor: pointer; text-align: left;
	}
	.sheet-action:last-child { border-bottom: none; }
	.sheet-action.danger { color: #C5221F; }

	/* ---- Move sheet ---- */
	.move-folder-list { display: flex; flex-direction: column; overflow-y: auto; flex: 1; padding: 0.5rem 0; }

	.move-folder-entry {
		display: flex; align-items: stretch;
		border-bottom: 1px solid var(--color-border-light, var(--color-border));
	}
	.move-folder-entry:last-child { border-bottom: none; }

	.move-folder-select {
		flex: 1; display: flex; align-items: center; padding: 1rem 0;
		background: none; border: none; font-family: inherit; cursor: pointer; text-align: left; color: var(--color-text); min-width: 0;
	}
	.move-folder-select.metti-qui { font-size: 0.95rem; font-weight: 700; color: var(--color-primary); }

	.move-folder-drill {
		padding: 1rem 0 1rem 1rem; background: none; border: none; cursor: pointer;
		color: var(--color-text-tertiary); display: flex; align-items: center; flex-shrink: 0;
	}

	.move-folder-name { flex: 1; font-size: 1rem; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.move-empty { font-size: 0.9rem; color: var(--color-text-secondary); padding: 1.5rem 0; text-align: center; }
</style>
