<script lang="ts">
	import { get } from 'svelte/store';
	import { goto } from '$app/navigation';
	import { folders } from '$lib/stores/folders';
	import { words } from '$lib/stores/words';
	import { folderOrder, moveFolderInOrder, snapshotFolderOrder, clearFolderOrder, applyFolderOrder } from '$lib/stores/folderOrder';
	import { setSelectedWords, skipExitGuard } from '$lib/stores/studySession';
	import { shuffle } from '$lib/utils/shuffle';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import FolderModal from '$lib/components/FolderModal.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import { MY_WORDS_FOLDER_ID } from '$lib/constants';

	let showModal = $state(false);
	let reorderMode = $state(false);
	let selectMode = $state(false);
	let selectedFolderIds = $state(new Set<string>());

	type FolderSort = 'newest' | 'oldest' | 'name-az';
	let folderSortMode = $state<FolderSort>('newest');
	const folderSortLabels: Record<FolderSort, string> = { newest: 'Più recenti', oldest: 'Meno recenti', 'name-az': 'A-Z' };
	const folderSortCycle: FolderSort[] = ['newest', 'oldest', 'name-az'];
	function cycleFolderSort() { folderSortMode = folderSortCycle[(folderSortCycle.indexOf(folderSortMode) + 1) % folderSortCycle.length]; }

	function folderWithCount(f: typeof $folders[number]) {
		const childIds = new Set($folders.filter(sub => sub.parentId === f.id).map(sub => sub.id));
		return {
			...f,
			wordCount: $words.filter((w) => w.folderId === f.id || (w.folderId && childIds.has(w.folderId))).length
		};
	}

	let myWordsFolder = $derived(
		$folders.find(f => f.id === MY_WORDS_FOLDER_ID)
			? folderWithCount($folders.find(f => f.id === MY_WORDS_FOLDER_ID)!)
			: null
	);

	let folderList = $derived.by(() => {
		const base = $folders
			.filter((f) => !f.parentId && f.id !== MY_WORDS_FOLDER_ID)
			.map(folderWithCount);
		if ($folderOrder['root']) return applyFolderOrder(base, $folderOrder, 'root');
		if (folderSortMode === 'oldest') return [...base].sort((a, b) => a.createdAt - b.createdAt);
		if (folderSortMode === 'name-az') return [...base].sort((a, b) => a.name.localeCompare(b.name, 'it'));
		return [...base].sort((a, b) => b.createdAt - a.createdAt);
	});

	function enterReorderMode() {
		snapshotFolderOrder('root', folderList.map(f => f.id));
		reorderMode = true;
	}
	function exitReorderMode() { reorderMode = false; }
	function resetFolderOrder() { clearFolderOrder('root'); reorderMode = false; }

	// ---- Select mode ----
	function toggleFolderSelect(id: string) {
		const next = new Set(selectedFolderIds);
		if (next.has(id)) next.delete(id); else next.add(id);
		selectedFolderIds = next;
	}

	function exitSelectMode() {
		selectMode = false;
		selectedFolderIds = new Set();
	}

	function collectWordsFromFolder(folderId: string, ws = get(words), fs = get(folders)): string[] {
		const direct = ws.filter(w => w.folderId === folderId).map(w => w.id);
		const subs = fs.filter(f => f.parentId === folderId).map(f => f.id);
		return [...direct, ...subs.flatMap(id => collectWordsFromFolder(id, ws, fs))];
	}

	let selectedWordCount = $derived.by(() => {
		const ws = $words; const fs = $folders;
		function collect(folderId: string): string[] {
			const direct = ws.filter(w => w.folderId === folderId).map(w => w.id);
			const subs = fs.filter(f => f.parentId === folderId).map(f => f.id);
			return [...direct, ...subs.flatMap(collect)];
		}
		return new Set(Array.from(selectedFolderIds).flatMap(collect)).size;
	});

	function studySelected() {
		const ws = get(words); const fs = get(folders);
		function collect(folderId: string): string[] {
			const direct = ws.filter(w => w.folderId === folderId).map(w => w.id);
			const subs = fs.filter(f => f.parentId === folderId).map(f => f.id);
			return [...direct, ...subs.flatMap(collect)];
		}
		const ids = shuffle([...new Set(Array.from(selectedFolderIds).flatMap(collect))]);
		if (ids.length === 0) return;
		setSelectedWords(ids);
		skipExitGuard.set(true);
		goto('/studia');
	}
</script>

<svelte:head>
	<title>Anki-jin — Cartelle</title>
</svelte:head>

<div class="page page-enter">
	<PageHeader title="Cartelle" />

	<div class="sort-row">
		{#if selectMode}
			<button class="sort-btn select-active" onclick={exitSelectMode}>Fine</button>
		{:else}
			{#if !reorderMode}
				<button class="sort-btn" onclick={cycleFolderSort}>↕ {folderSortLabels[folderSortMode]}</button>
			{/if}
			{#if folderList.length > 1}
				{#if reorderMode}
					<button class="sort-btn reorder-active" onclick={exitReorderMode}>Fine</button>
					{#if $folderOrder['root']}
						<button class="sort-btn" onclick={resetFolderOrder}>Reimposta</button>
					{/if}
				{:else}
					<button class="sort-btn" onclick={enterReorderMode}>Riordina</button>
				{/if}
			{/if}
			<button class="sort-btn" onclick={() => { selectMode = true; reorderMode = false; }}>Seleziona</button>
		{/if}
	</div>

	<div class="folder-list">
		{#if myWordsFolder}
			{#if selectMode}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div class="folder-item" onclick={() => toggleFolderSelect(myWordsFolder!.id)}>
					<div class="folder-checkbox" class:checked={selectedFolderIds.has(myWordsFolder.id)}>
						<Icon name="check" strokeWidth={3} />
					</div>
					<div class="folder-icon" style={myWordsFolder.color ? `color: ${myWordsFolder.color}` : ''}>
						<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
							<path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" />
						</svg>
					</div>
					<div class="folder-text">
						<span class="folder-name">{myWordsFolder.name}</span>
						<span class="folder-count">{myWordsFolder.wordCount} parole</span>
					</div>
				</div>
			{:else}
				<a href="/cartelle/{myWordsFolder.id}" class="folder-item">
					<div class="folder-icon" style={myWordsFolder.color ? `color: ${myWordsFolder.color}` : ''}>
						<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
							<path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" />
						</svg>
					</div>
					<div class="folder-text">
						<span class="folder-name">{myWordsFolder.name}</span>
						<span class="folder-count">{myWordsFolder.wordCount} parole</span>
					</div>
					<Icon name="chevron-right" class="folder-chevron" />
				</a>
			{/if}
		{/if}

		{#if folderList.length === 0 && !myWordsFolder}
			<EmptyState
				icon="📁"
				title="Nessuna cartella"
				subtitle="Le cartelle raggruppano le parole per argomento."
			/>
		{:else}
			{#each folderList as folder, i}
				{#if selectMode}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div class="folder-item" onclick={() => toggleFolderSelect(folder.id)}>
						<div class="folder-checkbox" class:checked={selectedFolderIds.has(folder.id)}>
							<Icon name="check" strokeWidth={3} />
						</div>
						<div class="folder-icon" style={folder.color ? `color: ${folder.color}` : ''}>
							<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
								<path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" />
							</svg>
						</div>
						<div class="folder-text">
							<span class="folder-name">{folder.name}</span>
							<span class="folder-count">{folder.wordCount} parole</span>
						</div>
					</div>
				{:else if reorderMode}
					<div class="folder-item">
						<div class="folder-icon" style={folder.color ? `color: ${folder.color}` : ''}>
							<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
								<path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" />
							</svg>
						</div>
						<div class="folder-text">
							<span class="folder-name">{folder.name}</span>
							<span class="folder-count">{folder.wordCount} parole</span>
						</div>
						<div class="reorder-btns">
							<button
								class="reorder-btn"
								disabled={i === 0}
								onclick={() => moveFolderInOrder('root', folder.id, 'up', folderList.map(f => f.id))}
								aria-label="Sposta su"
							>↑</button>
							<button
								class="reorder-btn"
								disabled={i === folderList.length - 1}
								onclick={() => moveFolderInOrder('root', folder.id, 'down', folderList.map(f => f.id))}
								aria-label="Sposta giù"
							>↓</button>
						</div>
					</div>
				{:else}
					<a href="/cartelle/{folder.id}" class="folder-item">
						<div class="folder-icon" style={folder.color ? `color: ${folder.color}` : ''}>
							<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
								<path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" />
							</svg>
						</div>
						<div class="folder-text">
							<span class="folder-name">{folder.name}</span>
							<span class="folder-count">{folder.wordCount} parole</span>
						</div>
						<Icon name="chevron-right" class="folder-chevron" />
					</a>
				{/if}
			{/each}
		{/if}
	</div>

	{#if selectMode && selectedFolderIds.size > 0}
		<div class="study-bar">
			<span class="study-bar-info">
				{selectedFolderIds.size} {selectedFolderIds.size === 1 ? 'cartella' : 'cartelle'} · {selectedWordCount} parole
			</span>
			<button class="study-bar-btn" onclick={studySelected} disabled={selectedWordCount === 0}>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<polygon points="5 3 19 12 5 21 5 3" />
				</svg>
				Studia
			</button>
		</div>
	{/if}

	<!-- FAB for New Folder -->
	{#if !selectMode}
		<div class="fab-container">
			<button class="fab" onclick={() => showModal = true}>
				<Icon name="plus" size={18} strokeWidth={2.5} />
				Nuova cartella
			</button>
		</div>
	{/if}

	{#if showModal}
		<FolderModal onClose={() => showModal = false} />
	{/if}
</div>


<style>
	.page {
		padding: var(--spacing-page);
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
	}

	.sort-row {
		margin-bottom: 0.5rem;
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
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

	.sort-btn.reorder-active {
		border-color: var(--color-primary);
		color: var(--color-primary);
	}

	.reorder-btns {
		display: flex;
		gap: 0.25rem;
		flex-shrink: 0;
	}

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
		transition: background-color 0.1s ease;
	}

	.reorder-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.reorder-btn:not(:disabled):active {
		background: var(--color-border);
	}

	.folder-list {
		display: flex;
		flex-direction: column;
	}

	.folder-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 0.25rem;
		text-decoration: none;
		color: inherit;
		border-radius: var(--radius-md);
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

	.sort-btn.select-active {
		border-color: var(--color-primary);
		color: var(--color-primary);
	}

	.folder-checkbox {
		width: 24px;
		height: 24px;
		border-radius: 6px;
		border: 2px solid var(--color-border);
		display: flex;
		align-items: center;
		justify-content: center;
		color: transparent;
		flex-shrink: 0;
		transition: all 0.15s ease;
	}

	.folder-checkbox svg { width: 14px; height: 14px; }

	.folder-checkbox.checked {
		background-color: var(--color-primary);
		border-color: var(--color-primary);
		color: white;
	}

	.study-bar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: var(--color-bg);
		border-top: 1px solid var(--color-border);
		padding: 0.85rem var(--spacing-page);
		padding-bottom: calc(0.85rem + env(safe-area-inset-bottom));
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		z-index: 50;
	}

	.study-bar-info {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-text-secondary);
	}

	.study-bar-btn {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.65rem 1.25rem;
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: var(--radius-full);
		font-size: 0.9rem;
		font-weight: 700;
		font-family: var(--font-sans);
		cursor: pointer;
		white-space: nowrap;
	}

	.study-bar-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	/* ---- FAB ---- */
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
		transition: background-color 0.15s ease, transform 0.1s ease;
		white-space: nowrap;
		text-decoration: none;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.fab:hover {
		background-color: var(--color-accent-hover);
		transform: translateY(-2px);
	}

	.fab:active {
		transform: translateY(0) scale(0.96);
	}
</style>
