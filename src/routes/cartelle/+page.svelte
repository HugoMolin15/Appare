<script lang="ts">
	import { folders } from '$lib/stores/folders';
	import { words } from '$lib/stores/words';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import FolderModal from '$lib/components/FolderModal.svelte';

	let showModal = $state(false);

	// Compute word count per folder including subfolders
	let folderList = $derived(
		$folders.filter((f) => !f.parentId).map((f) => {
			const childIds = new Set($folders.filter(sub => sub.parentId === f.id).map(sub => sub.id));
			return {
				...f,
				wordCount: $words.filter((w) => w.folderId === f.id || (w.folderId && childIds.has(w.folderId))).length
			};
		})
	);
</script>

<svelte:head>
	<title>Appare — Cartelle</title>
</svelte:head>

<div class="page page-enter">
	<PageHeader title="Cartelle" />

	{#if folderList.length === 0}
		<div class="empty-state">
			<span class="empty-icon">📁</span>
			<p class="empty-text">Nessuna cartella</p>
			<p class="empty-sub">Le cartelle raggruppano le parole per argomento.</p>
		</div>
	{:else}
		<div class="folder-list">
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
					<svg class="folder-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<polyline points="9 18 15 12 9 6" />
					</svg>
				</a>
			{/each}
		</div>
	{/if}

	<!-- FAB for New Folder -->
	<div class="fab-container">
		<button class="fab" onclick={() => showModal = true}>
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
				<line x1="12" y1="5" x2="12" y2="19" />
				<line x1="5" y1="12" x2="19" y2="12" />
			</svg>
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
		transition: background-color 0.12s ease;
	}

	.folder-item:hover {
		background-color: var(--color-surface);
	}

	.folder-item:active {
		background-color: var(--color-surface-warm);
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

	.empty-state {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: 0.5rem;
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

	.empty-sub {
		font-size: 0.85rem;
		color: var(--color-text-secondary);
		margin: 0;
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
