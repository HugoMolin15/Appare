<script lang="ts">
	import { words } from '$lib/stores/words';
	import { CATEGORIES } from '$lib/types/word';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { filterWords } from '$lib/utils/word-search';
	import SearchInput from '$lib/components/SearchInput.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { fade, fly } from 'svelte/transition';

	let searchQuery = $state('');
	let sourceFilter = $state<'all' | 'app' | 'mine'>('all');
	let typeFilter = $state<'all' | 'word' | 'phrase'>('all');
	let selectedGroups = $state(new Set<string>());
	let showFilterSheet = $state(false);

	const categoryGroups = Object.entries(CATEGORIES) as [string, readonly string[]][];

	function toggleGroup(group: string) {
		const next = new Set(selectedGroups);
		if (next.has(group)) next.delete(group);
		else next.add(group);
		selectedGroups = next;
	}

	function removeSource() { sourceFilter = 'all'; }
	function removeType() { typeFilter = 'all'; }
	function removeGroup(group: string) {
		const next = new Set(selectedGroups);
		next.delete(group);
		selectedGroups = next;
	}

	// All active filter pills: { label, remove() }
	let activePills = $derived.by(() => {
		const pills: { label: string; remove: () => void }[] = [];
		if (sourceFilter === 'app') pills.push({ label: 'App', remove: removeSource });
		if (sourceFilter === 'mine') pills.push({ label: 'Mie', remove: removeSource });
		if (typeFilter === 'word') pills.push({ label: 'Parole', remove: removeType });
		if (typeFilter === 'phrase') pills.push({ label: 'Frasi', remove: removeType });
		for (const g of selectedGroups) pills.push({ label: g, remove: () => removeGroup(g) });
		return pills;
	});

	let filteredWords = $derived.by(() => {
		let result = filterWords($words, searchQuery);
		if (sourceFilter === 'app') result = result.filter(w => w.id.startsWith('seed-'));
		else if (sourceFilter === 'mine') result = result.filter(w => !w.id.startsWith('seed-'));
		if (typeFilter === 'word') result = result.filter(w => (w.wordType ?? 'word') === 'word');
		else if (typeFilter === 'phrase') result = result.filter(w => w.wordType === 'phrase');
		if (selectedGroups.size > 0) {
			const allowed = new Set(
				categoryGroups
					.filter(([g]) => selectedGroups.has(g))
					.flatMap(([, vals]) => vals)
			);
			result = result.filter(w => w.category !== undefined && allowed.has(w.category));
		}
		return result.sort((a, b) => b.createdAt - a.createdAt);
	});

	$effect(() => {
		if (showFilterSheet) document.body.style.overflow = 'hidden';
		else document.body.style.overflow = '';
		return () => { document.body.style.overflow = ''; };
	});
</script>

<svelte:head>
	<title>Anki-jin — Tutte le parole</title>
</svelte:head>

<div class="page page-enter">
	<PageHeader title="Tutte le parole" backHref="/">
		{#snippet actions()}
			<button
				class="filter-btn"
				class:active={activePills.length > 0}
				onclick={() => showFilterSheet = true}
				aria-label="Filtri"
			>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<line x1="4" y1="6" x2="20" y2="6" />
					<line x1="8" y1="12" x2="16" y2="12" />
					<line x1="12" y1="18" x2="12" y2="18" stroke-width="3" stroke-linecap="round" />
				</svg>
				{#if activePills.length > 0}
					<span class="filter-badge">{activePills.length}</span>
				{/if}
			</button>
		{/snippet}
	</PageHeader>

	<SearchInput bind:value={searchQuery} placeholder="Cerca in italiano, romaji, hiragana..." />

	{#if activePills.length > 0}
		<div class="pills-row">
			{#each activePills as pill}
				<span class="pill">
					{pill.label}
					<button class="pill-remove" onclick={pill.remove} aria-label="Rimuovi filtro {pill.label}">
						<Icon name="close" size={12} strokeWidth={3} />
					</button>
				</span>
			{/each}
		</div>
	{/if}

	<p class="word-count-label">{filteredWords.length} parole</p>

	<div class="word-list">
		{#each filteredWords as word (word.id)}
			<a href="/parole/{word.id}" class="word-row">
				<div class="word-main">
					<span class="word-it">{word.italiano}</span>
					<span class="word-jp font-jp">
						{word.hiragana || word.katakana || word.romaji || word.kanji}
					</span>
				</div>
				<span class="word-cat" data-category={word.category}>{word.category}</span>
			</a>
		{/each}
	</div>
</div>

{#if showFilterSheet}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="sheet-backdrop" transition:fade={{ duration: 200 }} onclick={() => showFilterSheet = false}></div>
	<div class="filter-sheet" transition:fly={{ y: 400, duration: 300 }}>
		<div class="sheet-header">
			<h2 class="sheet-title">Filtri</h2>
			<button class="sheet-close" onclick={() => showFilterSheet = false}>Chiudi</button>
		</div>

		<div class="sheet-body">
			<div class="filter-section">
				<span class="section-label">Origine</span>
				<div class="option-list">
					{#each [['all', 'Tutte le parole'], ['app', 'Parole dell\'app'], ['mine', 'Parole mie']] as [val, label]}
						<button
							class="option-row"
							class:selected={sourceFilter === val}
							onclick={() => sourceFilter = val as 'all' | 'app' | 'mine'}
						>
							<span>{label}</span>
							{#if sourceFilter === val}
								<Icon name="check" size={18} strokeWidth={3} />
							{/if}
						</button>
					{/each}
				</div>
			</div>

			<div class="filter-section">
				<span class="section-label">Tipo</span>
				<div class="option-list">
					{#each [['all', 'Tutti'], ['word', 'Parole'], ['phrase', 'Frasi']] as [val, label]}
						<button
							class="option-row"
							class:selected={typeFilter === val}
							onclick={() => typeFilter = val as 'all' | 'word' | 'phrase'}
						>
							<span>{label}</span>
							{#if typeFilter === val}
								<Icon name="check" size={18} strokeWidth={3} />
							{/if}
						</button>
					{/each}
				</div>
			</div>

			<div class="filter-section">
				<span class="section-label">Categoria</span>
				<div class="option-list">
					{#each categoryGroups as [group]}
						<button
							class="option-row"
							class:selected={selectedGroups.has(group)}
							onclick={() => toggleGroup(group)}
						>
							<span>{group}</span>
							{#if selectedGroups.has(group)}
								<Icon name="check" size={18} strokeWidth={3} />
							{/if}
						</button>
					{/each}
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.page {
		padding: var(--spacing-page);
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
	}

	/* ---- Filter button ---- */
	.filter-btn {
		position: relative;
		background: none;
		border: none;
		color: var(--color-text);
		cursor: pointer;
		padding: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-full);
		transition: background-color 0.15s ease;
	}

	.filter-btn:hover {
		background-color: var(--color-surface);
	}

	.filter-btn.active {
		color: var(--color-primary);
	}

	.filter-badge {
		position: absolute;
		top: 2px;
		right: 2px;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: var(--color-primary);
		color: white;
		font-size: 0.6rem;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* ---- Active pills row ---- */
	.pills-row {
		display: flex;
		gap: 0.4rem;
		overflow-x: auto;
		scrollbar-width: none;
		-ms-overflow-style: none;
		margin-bottom: 0.75rem;
		padding-bottom: 0.1rem;
	}

	.pills-row::-webkit-scrollbar { display: none; }

	.pill {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.35rem 0.5rem 0.35rem 0.75rem;
		background-color: var(--color-primary);
		color: white;
		border-radius: var(--radius-full);
		font-size: 0.8rem;
		font-weight: 600;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.pill-remove {
		background: rgba(255,255,255,0.25);
		border: none;
		border-radius: 50%;
		width: 18px;
		height: 18px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		color: white;
		padding: 0;
		flex-shrink: 0;
	}

	/* ---- Word list ---- */
	.word-count-label {
		font-size: 0.82rem;
		font-weight: 500;
		color: var(--color-text-secondary);
		margin: 0 0 1rem;
	}

	.word-list {
		display: flex;
		flex-direction: column;
	}

	.word-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem 0;
		border-bottom: 1px solid var(--color-border);
		text-decoration: none;
		color: inherit;
	}

	.word-row:last-child { border-bottom: none; }

	.word-main {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
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
	}

	/* ---- Filter sheet ---- */
	.sheet-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(2px);
		z-index: 100;
	}

	.filter-sheet {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: 75dvh;
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
		margin-bottom: 1.5rem;
		flex-shrink: 0;
	}

	.sheet-title {
		font-size: 1.35rem;
		font-weight: 800;
		margin: 0;
	}

	.sheet-close {
		background: none;
		border: none;
		color: var(--color-text-secondary);
		font-size: 0.95rem;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
	}

	.sheet-body {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 2rem;
		scrollbar-width: none;
	}

	.sheet-body::-webkit-scrollbar { display: none; }

	.filter-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.section-label {
		font-size: 0.82rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-tertiary);
		margin-bottom: 0.25rem;
	}

	.option-list {
		display: flex;
		flex-direction: column;
	}

	.option-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 0.9rem 0;
		background: none;
		border: none;
		border-bottom: 1px solid var(--color-border);
		font-family: inherit;
		font-size: 0.95rem;
		font-weight: 500;
		color: var(--color-text);
		cursor: pointer;
		text-align: left;
	}

	.option-row:last-child { border-bottom: none; }

	.option-row.selected {
		color: var(--color-primary);
		font-weight: 700;
	}

	.option-row.selected svg {
		stroke: var(--color-primary);
	}
</style>
