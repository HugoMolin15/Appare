<script lang="ts">
	import { get } from 'svelte/store';
	import { goto, afterNavigate } from '$app/navigation';
	import { folders } from '$lib/stores/folders';
	import { words } from '$lib/stores/words';
	import { folderOrder, moveFolderInOrder, snapshotFolderOrder, clearFolderOrder, applyFolderOrder } from '$lib/stores/folderOrder';
	import { setSelectedWords, studyReturnContext } from '$lib/stores/studySession';
	import { shuffle } from '$lib/utils/shuffle';
	import { randomCardOrder, randomWordOrder } from '$lib/stores/settings';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import StudyRandomPills from '$lib/components/StudyRandomPills.svelte';
	import FolderModal from '$lib/components/FolderModal.svelte';
	import SearchInput from '$lib/components/SearchInput.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import { MY_WORDS_FOLDER_ID } from '$lib/constants';

	let showModal = $state(false);
	let reorderMode = $state(false);
	let selectMode = $state(false);
	let selectedFolderIds = $state(new Set<string>());
	let searchQuery = $state('');

	// Restore selection from study-return context if we're returning from /studia.
	afterNavigate(() => {
		const ctx = get(studyReturnContext);
		if (ctx?.href === '/cartelle' && Array.isArray(ctx.folderIds) && ctx.folderIds.length > 0) {
			selectMode = true;
			selectedFolderIds = new Set(ctx.folderIds);
			studyReturnContext.set(null);
		}
	});

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

	// Filter by search
	let filteredMyWordsFolder = $derived(
		myWordsFolder && (!searchQuery.trim() || myWordsFolder.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
			? myWordsFolder : null
	);
	let filteredFolderList = $derived(
		searchQuery.trim()
			? folderList.filter(f => f.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
			: folderList
	);

	let allFolderCount = $derived((myWordsFolder ? 1 : 0) + folderList.length);
	let totalWordCount = $derived($words.length);

	function enterReorderMode() { snapshotFolderOrder('root', folderList.map(f => f.id)); reorderMode = true; }
	function exitReorderMode() { reorderMode = false; }
	function resetFolderOrder() { clearFolderOrder('root'); reorderMode = false; }

	let activeSheet = $state<'sort' | 'options' | null>(null);

	// ---- Select mode ----
	function toggleFolderSelect(id: string) {
		const next = new Set(selectedFolderIds);
		if (next.has(id)) next.delete(id); else next.add(id);
		selectedFolderIds = next;
	}

	function enterSelectMode() { selectedFolderIds = new Set(); selectMode = true; reorderMode = false; }
	function exitSelectMode() { selectMode = false; selectedFolderIds = new Set(); }

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

	function studyAll() {
		let ids = get(words).map(w => w.id);
		if (ids.length === 0) return;
		if (get(randomCardOrder)) ids = shuffle(ids);
		studyReturnContext.set({ href: '/cartelle', label: 'Torna alle cartelle', wordIds: ids });
		setSelectedWords(ids);
		goto('/studia');
	}

	function studySelected() {
		const ws = get(words); const fs = get(folders);
		function collect(folderId: string): string[] {
			const direct = ws.filter(w => w.folderId === folderId).map(w => w.id);
			const subs = fs.filter(f => f.parentId === folderId).map(f => f.id);
			return [...direct, ...subs.flatMap(collect)];
		}
		let ids = [...new Set(Array.from(selectedFolderIds).flatMap(collect))];
		if (ids.length === 0) return;
		if (get(randomCardOrder)) ids = shuffle(ids);
		studyReturnContext.set({
			href: '/cartelle',
			label: 'Torna alle cartelle',
			wordIds: ids,
			folderIds: Array.from(selectedFolderIds)
		});
		setSelectedWords(ids);
		goto('/studia');
	}
</script>

<svelte:head>
	<title>Anki-jin — Cartelle</title>
</svelte:head>

<div class="page page-enter">
	<div class="sticky-header">
		<PageHeader title="Cartelle" hideBackOnDesktop />

		{#if allFolderCount > 0}
			<!-- ① Action row — sticky -->
			{#if selectMode && selectedFolderIds.size > 0}
				<div class="action-row">
					<button class="study-btn" onclick={studySelected} disabled={selectedWordCount === 0}>
						<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
						Studia {selectedFolderIds.size} {selectedFolderIds.size === 1 ? 'cartella' : 'cartelle'} ({selectedWordCount})
					</button>
					<button class="action-pill muted" onclick={() => selectedFolderIds = new Set()}>Deseleziona</button>
				</div>
			{:else}
				<div class="action-row">
					<button class="study-btn" onclick={studyAll} disabled={totalWordCount === 0}>
						<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
						Studia tutto ({totalWordCount})
					</button>
				</div>
			{/if}

			<!-- ② Controls bar -->
			<div class="controls-bar">
				<span class="count-label">{allFolderCount} {allFolderCount === 1 ? 'cartella' : 'cartelle'} · {totalWordCount} parole</span>
				<button class="select-toggle" onclick={selectMode ? exitSelectMode : enterSelectMode}>
					{selectMode ? 'Fine' : 'Seleziona'}
				</button>
			</div>
		{/if}
	</div>

	{#if allFolderCount > 0}
		<!-- ③ Search — scrolls away -->
		<SearchInput bind:value={searchQuery} placeholder="Cerca cartelle..." />

		<!-- ④ Sort / reorder + random pills row — scrolls away -->
		{#if !selectMode}
			<div class="quick-filter-bar">
				{#if !reorderMode}
					<button class="quick-pill" class:active={folderSortMode !== 'newest'} onclick={() => activeSheet = 'sort'}>
						Ordina <Icon name="chevron-down" size={14} />
					</button>
				{/if}
				{#if folderList.length > 1}
					{#if reorderMode}
						<button class="quick-pill active" onclick={exitReorderMode}>Fine</button>
						{#if $folderOrder['root']}
							<button class="quick-pill" onclick={resetFolderOrder}>Reimposta</button>
						{/if}
					{:else}
						<button class="quick-pill" onclick={enterReorderMode}>Riordina</button>
					{/if}
				{/if}
				<button class="quick-pill" class:active={$randomWordOrder || $randomCardOrder} onclick={() => activeSheet = 'options'}>
					Opzioni <Icon name="chevron-down" size={14} />
				</button>
			</div>
		{/if}
	{/if}

	{#if allFolderCount === 0}
		<EmptyState
			icon="📁"
			title="Nessuna cartella"
			subtitle="Le cartelle raggruppano le parole per argomento."
		/>
	{:else}
		<!-- ⑤ Folder list -->
		<div class="folder-list">
			<!-- "Le mie parole" pinned folder -->
			{#if filteredMyWordsFolder}
				{#if selectMode}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div class="folder-item selectable" onclick={() => toggleFolderSelect(filteredMyWordsFolder!.id)}>
						<div class="folder-checkbox" class:checked={selectedFolderIds.has(filteredMyWordsFolder.id)}>
							<Icon name="check" strokeWidth={3} />
						</div>
						<div class="folder-icon" style={filteredMyWordsFolder.color ? `color: ${filteredMyWordsFolder.color}` : ''}>
							<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/></svg>
						</div>
						<div class="folder-text">
							<span class="folder-name">{filteredMyWordsFolder.name}</span>
							<span class="folder-count">{filteredMyWordsFolder.wordCount} parole</span>
						</div>
					</div>
				{:else}
					<a href="/cartelle/{filteredMyWordsFolder.id}" class="folder-item">
						<div class="folder-icon" style={filteredMyWordsFolder.color ? `color: ${filteredMyWordsFolder.color}` : ''}>
							<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/></svg>
						</div>
						<div class="folder-text">
							<span class="folder-name">{filteredMyWordsFolder.name}</span>
							<span class="folder-count">{filteredMyWordsFolder.wordCount} parole</span>
						</div>
						<Icon name="chevron-right" class="folder-chevron" />
					</a>
				{/if}
			{/if}

			<!-- User folders -->
			{#each filteredFolderList as folder, i}
				{#if selectMode}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div class="folder-item selectable" onclick={() => toggleFolderSelect(folder.id)}>
						<div class="folder-checkbox" class:checked={selectedFolderIds.has(folder.id)}>
							<Icon name="check" strokeWidth={3} />
						</div>
						<div class="folder-icon" style={folder.color ? `color: ${folder.color}` : ''}>
							<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/></svg>
						</div>
						<div class="folder-text">
							<span class="folder-name">{folder.name}</span>
							<span class="folder-count">{folder.wordCount} parole</span>
						</div>
					</div>
				{:else if reorderMode}
					<div class="folder-item">
						<div class="folder-icon" style={folder.color ? `color: ${folder.color}` : ''}>
							<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/></svg>
						</div>
						<div class="folder-text">
							<span class="folder-name">{folder.name}</span>
							<span class="folder-count">{folder.wordCount} parole</span>
						</div>
						<div class="reorder-btns">
							<button class="reorder-btn" disabled={i === 0} onclick={() => moveFolderInOrder('root', folder.id, 'up', folderList.map(f => f.id))} aria-label="Sposta su">↑</button>
							<button class="reorder-btn" disabled={i === folderList.length - 1} onclick={() => moveFolderInOrder('root', folder.id, 'down', folderList.map(f => f.id))} aria-label="Sposta giù">↓</button>
						</div>
					</div>
				{:else}
					<a href="/cartelle/{folder.id}" class="folder-item">
						<div class="folder-icon" style={folder.color ? `color: ${folder.color}` : ''}>
							<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/></svg>
						</div>
						<div class="folder-text">
							<span class="folder-name">{folder.name}</span>
							<span class="folder-count">{folder.wordCount} parole</span>
						</div>
						<Icon name="chevron-right" class="folder-chevron" />
					</a>
				{/if}
			{/each}

			{#if filteredFolderList.length === 0 && !filteredMyWordsFolder && searchQuery.trim()}
				<p class="no-results">Nessun risultato per "{searchQuery}"</p>
			{/if}
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

	{#if activeSheet !== null}
		<div class="sheet-backdrop" onclick={() => activeSheet = null} role="presentation"></div>
		<div class="filter-sheet">
			<div class="sheet-header">
				<h2 class="sheet-title">
					{#if activeSheet === 'sort'}Ordina per
					{:else if activeSheet === 'options'}Opzioni di studio
					{/if}
				</h2>
				<button class="sheet-close" onclick={() => activeSheet = null}>Chiudi</button>
			</div>
			<div class="sheet-body">
				{#if activeSheet === 'sort'}
					<div class="option-list">
						{#each ['newest', 'oldest', 'name-az'] as val}
						<button class="option-row" class:selected={folderSortMode === val} onclick={() => { folderSortMode = val as FolderSort; activeSheet = null; }}>
							<span>{folderSortLabels[val as FolderSort]}</span>
								{#if folderSortMode === val}<Icon name="check" size={18} strokeWidth={3} />{/if}
							</button>
						{/each}
					</div>
				{:else if activeSheet === 'options'}
					<div class="filter-section">
						<span class="section-label">Impostazioni mazzo</span>
						<div class="option-list">
							<button class="option-row" onclick={() => randomWordOrder.update(v => !v)}>
								<span>Ordine parole casuale</span>
								{#if $randomWordOrder}<Icon name="check" size={18} strokeWidth={3} />{/if}
							</button>
							<button class="option-row" onclick={() => randomCardOrder.update(v => !v)}>
								<span>Lato iniziale casuale</span>
								{#if $randomCardOrder}<Icon name="check" size={18} strokeWidth={3} />{/if}
							</button>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.page {
		padding: var(--spacing-page);
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		position: relative;
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
		justify-content: center;
		gap: 0.4rem;
		padding: 0.6rem 1rem;
		width: 100%;
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

	.study-btn:disabled { opacity: 0.4; cursor: not-allowed; }

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

	.action-pill.muted { color: var(--color-text-secondary); }

		/* ---- Quick Filter Bar ---- */
	.quick-filter-bar {
		display: flex;
		gap: 0.5rem;
		overflow-x: auto;
		scrollbar-width: none;
		-ms-overflow-style: none;
		margin: 0.75rem 0;
		padding-bottom: 0.1rem;
		margin-left: calc(-1 * var(--spacing-page));
		margin-right: calc(-1 * var(--spacing-page));
		padding-left: var(--spacing-page);
	}

	.quick-filter-bar::-webkit-scrollbar { display: none; }

	.quick-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.45rem 0.8rem;
		background-color: white;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: 0.85rem;
		font-weight: 600;
		font-family: var(--font-sans);
		color: var(--color-text-secondary);
		cursor: pointer;
		white-space: nowrap;
		flex-shrink: 0;
		transition: all 0.15s ease;
	}

	.quick-pill.active {
		border-color: var(--color-primary);
		color: var(--color-primary);
		background-color: #fff0f0;
	}

	.quick-pill svg { stroke-width: 2.5; }

	/* ---- Folder list ---- */
	.folder-list { display: flex; flex-direction: column; }

	.folder-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.85rem 0;
		text-decoration: none;
		color: inherit;
		border-bottom: 1px solid var(--color-border-light, var(--color-border));
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

	.folder-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		color: var(--color-text-secondary);
		flex-shrink: 0;
	}

	.folder-text { flex: 1; display: flex; flex-direction: column; }

	.folder-name { font-size: 1rem; font-weight: 600; }
	.folder-count { font-size: 0.82rem; color: var(--color-text-secondary); margin-top: 0.1rem; }

	:global(.folder-chevron) { color: var(--color-text-tertiary); flex-shrink: 0; }

	.folder-checkbox {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		border: 2px solid var(--color-border);
		display: flex;
		align-items: center;
		justify-content: center;
		color: transparent;
		flex-shrink: 0;
		transition: all 0.15s ease;
	}

	.folder-checkbox :global(svg) { width: 14px; height: 14px; }

	.folder-checkbox.checked {
		background-color: #1A1A1A;
		border-color: #1A1A1A;
		color: white;
	}

	/* ---- Reorder ---- */
	.reorder-btns { display: flex; gap: 0.25rem; flex-shrink: 0; }

	.reorder-btn {
		width: 32px; height: 32px;
		display: flex; align-items: center; justify-content: center;
		background: var(--color-surface); border: 1px solid var(--color-border);
		border-radius: var(--radius-md); font-size: 1rem; cursor: pointer; color: var(--color-text);
	}

	.reorder-btn:disabled { opacity: 0.3; cursor: not-allowed; }
	.reorder-btn:not(:disabled):active { background: var(--color-border); }

	.no-results {
		font-size: 0.9rem; color: var(--color-text-secondary); padding: 1.5rem 0; text-align: center;
	}

	/* ---- FAB ---- */
	.fab-container { position: fixed; bottom: calc(var(--bottom-nav-height) + 1rem); right: var(--spacing-page); z-index: 50; }

	.fab {
		display: flex; align-items: center; gap: 0.5rem; padding: 0.875rem 1.5rem;
		background-color: var(--color-accent); color: var(--color-text); border: none;
		border-radius: var(--radius-full); font-size: 0.95rem; font-weight: 700;
		font-family: var(--font-sans); cursor: pointer; white-space: nowrap;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); text-decoration: none;
	}

	.fab:hover { transform: translateY(-2px); }
	.fab:active { transform: translateY(0) scale(0.96); }
</style>
