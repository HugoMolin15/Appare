<script lang="ts">
	import { folders } from '$lib/stores/folders';
	import { words } from '$lib/stores/words';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import FolderModal from '$lib/components/FolderModal.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import { MY_WORDS_FOLDER_ID } from '$lib/constants';

	let showModal = $state(false);
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

	let folderList = $derived(
		$folders
			.filter((f) => !f.parentId && f.id !== MY_WORDS_FOLDER_ID)
			.map(folderWithCount)
			.sort((a, b) => {
				if (folderSortMode === 'oldest') return a.createdAt - b.createdAt;
				if (folderSortMode === 'name-az') return a.name.localeCompare(b.name, 'it');
				return b.createdAt - a.createdAt;
			})
	);
</script>

<svelte:head>
	<title>Anki-jin — Cartelle</title>
</svelte:head>

<div class="page page-enter">
	<PageHeader title="Cartelle" />

	<div class="sort-row">
		<button class="sort-btn" onclick={cycleFolderSort}>↕ {folderSortLabels[folderSortMode]}</button>
	</div>

	<div class="folder-list">
		{#if myWordsFolder}
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

		{#if folderList.length === 0 && !myWordsFolder}
			<EmptyState
				icon="📁"
				title="Nessuna cartella"
				subtitle="Le cartelle raggruppano le parole per argomento."
			/>
		{:else}
			{#each folderList as folder}
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
			{/each}
		{/if}
	</div>

	<!-- FAB for New Folder -->
	<div class="fab-container">
		<button class="fab" onclick={() => showModal = true}>
			<Icon name="plus" size={18} strokeWidth={2.5} />
			Nuova cartella
		</button>
	</div>

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
