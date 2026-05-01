<script lang="ts">
	import { words } from '$lib/stores/words';
	import { wordScores } from '$lib/stores/wordScores';
	import { allStudiedWordIds } from '$lib/stores/history';
	import { selectedWordIds, toggleWordSelection, selectedCount } from '$lib/stores/studySession';
	import { goto } from '$app/navigation';
	import { CATEGORIES } from '$lib/types/word';
	import type { WordScore } from '$lib/types/word';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import WordRow from '$lib/components/WordRow.svelte';
	import SearchInput from '$lib/components/SearchInput.svelte';
	import ScoreFilter from '$lib/components/ScoreFilter.svelte';
	import FilterPills from '$lib/components/FilterPills.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { filterWords } from '$lib/utils/word-search';

	let searchQuery = $state('');
	let scoreFilter = $state<'all' | WordScore>('all');
	let typeFilter = $state<'all' | 'word' | 'phrase'>('all');
	let selectedGroups = $state(new Set<string>());
	type WordSort = 'newest' | 'oldest' | 'it-az' | 'jp-az';
	let sortMode = $state<WordSort>('newest');

	const categoryGroups = Object.entries(CATEGORIES) as [string, readonly string[]][];
	const SORT_OPTIONS: WordSort[] = ['newest', 'oldest', 'it-az', 'jp-az'];
	const SORT_LABELS: Record<WordSort, string> = {
		newest: 'Più recenti',
		oldest: 'Meno recenti',
		'it-az': 'A-Z Italiano',
		'jp-az': 'A-Z Giapponese',
	};

	function cycleSortMode() {
		const idx = SORT_OPTIONS.indexOf(sortMode);
		sortMode = SORT_OPTIONS[(idx + 1) % SORT_OPTIONS.length];
	}

	function removeType() { typeFilter = 'all'; }
	function removeGroup(group: string) {
		const next = new Set(selectedGroups);
		next.delete(group);
		selectedGroups = next;
	}
	function toggleGroup(group: string) {
		const next = new Set(selectedGroups);
		if (next.has(group)) next.delete(group);
		else next.add(group);
		selectedGroups = next;
	}

	let activePills = $derived.by(() => {
		const pills: { label: string; remove: () => void }[] = [];
		if (typeFilter === 'word') pills.push({ label: 'Parole', remove: removeType });
		if (typeFilter === 'phrase') pills.push({ label: 'Frasi', remove: removeType });
		for (const g of selectedGroups) pills.push({ label: g, remove: () => removeGroup(g) });
		return pills;
	});

	function itAzCompare(a: string, b: string): number {
		const aNum = /^\d/.test(a);
		const bNum = /^\d/.test(b);
		if (aNum !== bNum) return aNum ? 1 : -1;
		return a.localeCompare(b, 'it');
	}

	let unstudiedWords = $derived(
		$words.filter(w => !$allStudiedWordIds.has(w.id) && w.italiano?.trim())
	);

	let filteredWords = $derived.by(() => {
		let result = [...filterWords(unstudiedWords, searchQuery)];
		if (scoreFilter !== 'all') {
			result = result.filter(w => ($wordScores[w.id] ?? 'none') === scoreFilter);
		}
		if (typeFilter === 'word') result = result.filter(w => (w.wordType ?? 'word') === 'word');
		else if (typeFilter === 'phrase') result = result.filter(w => w.wordType === 'phrase');
		if (selectedGroups.size > 0) {
			const allowed = new Set(
				categoryGroups
					.filter(([g]) => selectedGroups.has(g))
					.flatMap(([, vals]) => vals as string[])
			);
			result = result.filter(w => {
				const wordTags = w.tags ?? (w.category ? [w.category] : []);
				return wordTags.some(t => allowed.has(t));
			});
		}
		if (sortMode === 'oldest') return result.sort((a, b) => a.createdAt - b.createdAt);
		if (sortMode === 'it-az') return result.sort((a, b) => itAzCompare(a.italiano, b.italiano));
		if (sortMode === 'jp-az') return result.sort((a, b) => (a.hiragana || a.katakana || '').localeCompare(b.hiragana || b.katakana || '', 'ja'));
		return result.sort((a, b) => b.createdAt - a.createdAt);
	});

	let showFilterSheet = $state(false);

	$effect(() => {
		if (showFilterSheet) document.body.style.overflow = 'hidden';
		else document.body.style.overflow = '';
		return () => { document.body.style.overflow = ''; };
	});

	function startStudy() {
		if ($selectedCount > 0) goto('/studia');
	}
</script>

<svelte:head>
	<title>Anki-jin — Seleziona parole</title>
</svelte:head>

<div class="page page-enter">
	<PageHeader title="Cosa vuoi studiare?" backHref="/">
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

	<ScoreFilter
		value={scoreFilter}
		onChange={(v) => scoreFilter = v}
		sortLabel={SORT_LABELS[sortMode]}
		onSortCycle={cycleSortMode}
	/>

	<FilterPills pills={activePills} />

	<p class="word-count-label">{filteredWords.length} {typeFilter === 'phrase' ? 'frasi' : filteredWords.length === 1 ? 'parola' : 'parole'} da studiare</p>

	<div class="word-list">
		{#if filteredWords.length === 0}
			<div class="empty-state">
				<p>Nessuna parola trovata.</p>
			</div>
		{:else}
			{#each filteredWords as word (word.id)}
				<WordRow
					{word}
					selectable
					role="checkbox"
					ariaChecked={$selectedWordIds.has(word.id)}
					onclick={() => toggleWordSelection(word.id)}
				>
					{#snippet leading()}
						<div class="word-checkbox" class:checked={$selectedWordIds.has(word.id)}>
							<Icon name="check" size={14} strokeWidth={3} />
						</div>
					{/snippet}
				</WordRow>
			{/each}
		{/if}
	</div>

	<div class="bottom-bar">
		<button class="cta-button" disabled={$selectedCount === 0} onclick={startStudy}>
			{#if $selectedCount === 0}
				Seleziona parole
			{:else}
				Studia {$selectedCount} {$selectedCount === 1 ? 'parola' : 'parole'}
			{/if}
		</button>
	</div>
</div>

{#if showFilterSheet}
	<div class="sheet-backdrop" onclick={() => showFilterSheet = false} role="presentation"></div>
	<div class="filter-sheet">
		<div class="sheet-header">
			<h2 class="sheet-title">Filtri</h2>
			<button class="sheet-close" onclick={() => showFilterSheet = false}>Chiudi</button>
		</div>
		<div class="sheet-body">
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
							{#if typeFilter === val}<Icon name="check" size={18} strokeWidth={3} />{/if}
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
							{#if selectedGroups.has(group)}<Icon name="check" size={18} strokeWidth={3} />{/if}
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
		position: relative;
		padding-bottom: 120px;
	}

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

	.word-checkbox {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		border: 2px solid var(--color-border);
		display: flex;
		align-items: center;
		justify-content: center;
		color: transparent;
		transition: all 0.2s ease;
		flex-shrink: 0;
	}

	.word-checkbox.checked {
		background-color: #1A1A1A;
		border-color: #1A1A1A;
		color: white;
	}

	.empty-state {
		text-align: center;
		color: var(--color-text-secondary);
		padding: 2rem 0;
	}

	.bottom-bar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 1rem var(--spacing-page);
		background: var(--color-bg);
		padding-bottom: calc(1rem + env(safe-area-inset-bottom, 20px));
		z-index: 100;
	}

	@media (min-width: 768px) { .bottom-bar { left: 220px; } }
	@media (min-width: 1280px) { .bottom-bar { left: 260px; } }

	.cta-button {
		width: 100%;
		padding: 1.1rem;
		background-color: var(--color-primary);
		color: white;
		border: none;
		border-radius: var(--radius-full);
		font-size: 1.05rem;
		font-weight: 700;
		font-family: var(--font-sans);
		cursor: pointer;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.cta-button:disabled {
		background-color: var(--color-surface);
		color: var(--color-text-secondary);
		cursor: not-allowed;
		opacity: 0.7;
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
	}

	.filter-btn.active { color: #1A1A1A; }

	.filter-badge {
		position: absolute;
		top: 2px;
		right: 2px;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: #1A1A1A;
		color: white;
		font-size: 0.6rem;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* ---- Filter sheet ---- */
	.sheet-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0,0,0,0.4);
		z-index: 100;
	}

	.filter-sheet {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		max-height: 70dvh;
		background: var(--color-bg);
		border-radius: var(--radius-xl) var(--radius-xl) 0 0;
		padding: 1.75rem;
		padding-bottom: calc(1rem + env(safe-area-inset-bottom));
		z-index: 101;
		box-shadow: 0 -8px 32px rgba(0,0,0,0.2);
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

	.sheet-title { font-size: 1.35rem; font-weight: 800; margin: 0; }

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

	.filter-section { display: flex; flex-direction: column; gap: 0.5rem; }

	.section-label {
		font-size: 0.82rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-tertiary);
		margin-bottom: 0.25rem;
	}

	.option-list { display: flex; flex-direction: column; }

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
	.option-row.selected { color: #1A1A1A; font-weight: 700; }
	.option-row.selected :global(svg) { stroke: #1A1A1A; }
</style>
