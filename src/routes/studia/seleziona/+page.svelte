<script lang="ts">
	import { words } from '$lib/stores/words';
	import { wordScores } from '$lib/stores/wordScores';
	import { selectedWordIds, toggleWordSelection, selectedCount, setSelectedWords, studyReturnContext } from '$lib/stores/studySession';
	import { goto } from '$app/navigation';
	import { get } from 'svelte/store';
	import { shuffle } from '$lib/utils/shuffle';
	import { randomCardOrder, randomWordOrder, listDisplayLang, type ListDisplayLang } from '$lib/stores/settings';
	import { CATEGORIES } from '$lib/types/word';
	import type { WordScore } from '$lib/types/word';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import WordRow from '$lib/components/WordRow.svelte';
	import SearchInput from '$lib/components/SearchInput.svelte';
	import FilterPills from '$lib/components/FilterPills.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { filterWords } from '$lib/utils/word-search';
	import { Play } from 'phosphor-svelte';

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

	const LANG_LABELS: Record<ListDisplayLang, string> = {
		italiano: 'Italiano',
		hiragana: 'Hiragana / Katakana',
		romaji: 'Romaji',
		kanji: 'Kanji',
	};

	let activePills = $derived.by(() => {
		const pills: { label: string; remove: () => void }[] = [];
		if (sortMode !== 'newest') pills.push({ label: SORT_LABELS[sortMode], remove: () => sortMode = 'newest' });
		if (scoreFilter !== 'all') {
			const label = scoreFilter === 'none' ? 'Non valutate' : scoreFilter === 'unknown' ? 'Difficile' : scoreFilter === 'learning' ? 'Buono' : 'Facile';
			pills.push({ label, remove: () => scoreFilter = 'all' });
		}
		if (typeFilter === 'word') pills.push({ label: 'Parole', remove: removeType });
		if (typeFilter === 'phrase') pills.push({ label: 'Frasi', remove: removeType });
		for (const g of selectedGroups) pills.push({ label: g, remove: () => removeGroup(g) });
		if ($listDisplayLang !== 'italiano') pills.push({ label: LANG_LABELS[$listDisplayLang], remove: () => listDisplayLang.set('italiano') });
		if ($randomWordOrder) pills.push({ label: 'Parole casuali', remove: () => randomWordOrder.set(false) });
		if ($randomCardOrder) pills.push({ label: 'Lato casuale', remove: () => randomCardOrder.set(false) });
		return pills;
	});

	function itAzCompare(a: string, b: string): number {
		const aNum = /^\d/.test(a);
		const bNum = /^\d/.test(b);
		if (aNum !== bNum) return aNum ? 1 : -1;
		return a.localeCompare(b, 'it');
	}

	let filteredWords = $derived.by(() => {
		let result = [...filterWords($words.filter(w => w.italiano?.trim()), searchQuery)];
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

	let activeSheet = $state<'sort' | 'score' | 'type' | 'categories' | 'options' | null>(null);

	$effect(() => {
		if (activeSheet !== null) document.body.style.overflow = 'hidden';
		else document.body.style.overflow = '';
		return () => { document.body.style.overflow = ''; };
	});

	function startStudy() {
		if ($selectedCount === 0) return;
		let ids = [...get(selectedWordIds)];
		if (get(randomCardOrder)) ids = shuffle(ids);
		studyReturnContext.set({ href: '/studia/seleziona', label: 'Modifica selezione', wordIds: ids });
		setSelectedWords(ids);
		goto('/studia');
	}
</script>

<svelte:head>
	<title>Anki-jin — Seleziona parole</title>
</svelte:head>

<div class="page page-enter">
	<div class="sticky-header">
		<PageHeader title="Cosa vuoi studiare?" backHref="/" />

		<div class="search-row">
			<SearchInput bind:value={searchQuery} placeholder="Cerca in italiano, romaji, hiragana..." />
			<button class="play-btn" onclick={startStudy} disabled={$selectedCount === 0}>
				<Play size={15} weight="fill" />
			</button>
		</div>

		<div class="quick-filter-bar">
			<button class="quick-pill" class:active={$randomWordOrder || $randomCardOrder || $listDisplayLang !== 'italiano'} onclick={() => activeSheet = 'options'}>
				Opzioni <Icon name="chevron-down" size={14} />
			</button>
			<button class="quick-pill" class:active={scoreFilter !== 'all'} onclick={() => activeSheet = 'score'}>
				Stato <Icon name="chevron-down" size={14} />
			</button>
			<button class="quick-pill" class:active={selectedGroups.size > 0} onclick={() => activeSheet = 'categories'}>
				Categorie <Icon name="chevron-down" size={14} />
			</button>
			<button class="quick-pill" class:active={typeFilter !== 'all'} onclick={() => activeSheet = 'type'}>
				Tipo <Icon name="chevron-down" size={14} />
			</button>
			<button class="quick-pill" class:active={sortMode !== 'newest'} onclick={() => activeSheet = 'sort'}>
				Ordina <Icon name="chevron-down" size={14} />
			</button>
		</div>

		<FilterPills pills={activePills} />

	</div>

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
					displayLang={$listDisplayLang}
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

</div>

{#if activeSheet !== null}
	<div class="sheet-backdrop" onclick={() => activeSheet = null} role="presentation"></div>
	<div class="filter-sheet">
		<div class="sheet-header">
			<h2 class="sheet-title">
				{#if activeSheet === 'sort'}Ordina per
				{:else if activeSheet === 'score'}Stato
				{:else if activeSheet === 'type'}Tipo
				{:else if activeSheet === 'categories'}Categorie
				{:else if activeSheet === 'options'}Opzioni di studio
				{/if}
			</h2>
			<button class="sheet-close" onclick={() => activeSheet = null}>Chiudi</button>
		</div>
		<div class="sheet-body">
			{#if activeSheet === 'sort'}
				<div class="option-list">
					{#each SORT_OPTIONS as val}
						<button class="option-row" class:selected={sortMode === val} onclick={() => { sortMode = val; activeSheet = null; }}>
							<span>{SORT_LABELS[val]}</span>
							{#if sortMode === val}<Icon name="check" size={18} strokeWidth={3} />{/if}
						</button>
					{/each}
				</div>
			{:else if activeSheet === 'score'}
				<div class="option-list">
					<button class="option-row" class:selected={scoreFilter === 'all'} onclick={() => { scoreFilter = 'all'; activeSheet = null; }}>
						<span>Tutte le parole</span>
						{#if scoreFilter === 'all'}<Icon name="check" size={18} strokeWidth={3} />{/if}
					</button>
					<button class="option-row" class:selected={scoreFilter === 'none'} onclick={() => { scoreFilter = 'none'; activeSheet = null; }}>
						<span>Non valutate</span>
						{#if scoreFilter === 'none'}<Icon name="check" size={18} strokeWidth={3} />{/if}
					</button>
					<button class="option-row" class:selected={scoreFilter === 'unknown'} onclick={() => { scoreFilter = 'unknown'; activeSheet = null; }}>
						<span>Difficile</span>
						{#if scoreFilter === 'unknown'}<Icon name="check" size={18} strokeWidth={3} />{/if}
					</button>
					<button class="option-row" class:selected={scoreFilter === 'learning'} onclick={() => { scoreFilter = 'learning'; activeSheet = null; }}>
						<span>Buono</span>
						{#if scoreFilter === 'learning'}<Icon name="check" size={18} strokeWidth={3} />{/if}
					</button>
					<button class="option-row" class:selected={scoreFilter === 'known'} onclick={() => { scoreFilter = 'known'; activeSheet = null; }}>
						<span>Facile</span>
						{#if scoreFilter === 'known'}<Icon name="check" size={18} strokeWidth={3} />{/if}
					</button>
				</div>
			{:else if activeSheet === 'type'}
				<div class="option-list">
					{#each [['all', 'Tutti'], ['word', 'Parole'], ['phrase', 'Frasi']] as [val, label]}
						<button class="option-row" class:selected={typeFilter === val} onclick={() => { typeFilter = val as 'all'|'word'|'phrase'; activeSheet = null; }}>
							<span>{label}</span>
							{#if typeFilter === val}<Icon name="check" size={18} strokeWidth={3} />{/if}
						</button>
					{/each}
				</div>
			{:else if activeSheet === 'categories'}
				<div class="option-list">
					{#each categoryGroups as [group]}
						<button class="option-row" class:selected={selectedGroups.has(group)} onclick={() => toggleGroup(group)}>
							<span>{group}</span>
							{#if selectedGroups.has(group)}<Icon name="check" size={18} strokeWidth={3} />{/if}
						</button>
					{/each}
				</div>
			{:else if activeSheet === 'options'}
				<div class="filter-section">
					<span class="section-label">Lingua visualizzata in lista</span>
					<div class="option-list">
						{#each [['italiano', 'Italiano'], ['hiragana', 'Hiragana / Katakana'], ['romaji', 'Romaji'], ['kanji', 'Kanji']] as [val, label]}
							<button class="option-row" class:selected={$listDisplayLang === val} onclick={() => listDisplayLang.set(val as ListDisplayLang)}>
								<span>{label}</span>
								{#if $listDisplayLang === val}<Icon name="check" size={18} strokeWidth={3} />{/if}
							</button>
						{/each}
					</div>
				</div>
				<div class="filter-section" style="margin-top: 1.5rem;">
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

<style>
	.page {
		padding: var(--spacing-page);
		display: flex;
		flex-direction: column;
		position: relative;
	}

	.quick-filter-bar {
		display: flex;
		gap: 0.5rem;
		overflow-x: auto;
		scrollbar-width: none;
		-ms-overflow-style: none;
		margin: 0.75rem 0;
		padding-bottom: 0.1rem;
		/* Edge-to-edge layout */
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
		background: white;
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-full);
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		white-space: nowrap;
		cursor: pointer;
		transition: all 0.15s ease;
		flex-shrink: 0;
	}

	.quick-pill.active {
		background: #fff0f0;
		border-color: var(--color-primary);
		color: var(--color-primary);
	}

	.quick-badge {
		background: var(--color-primary);
		color: white;
		font-size: 0.65rem;
		padding: 0.1rem 0.35rem;
		border-radius: 99px;
		line-height: 1;
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

	.search-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.search-row :global(.search-container) {
		flex: 1;
		min-width: 0;
		margin-bottom: 0;
	}

	.play-btn {
		width: 44px;
		height: 44px;
		border-radius: 50% !important;
		background: var(--color-primary);
		color: white;
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		flex-shrink: 0;
	}

	.play-btn:disabled { opacity: 0.35; cursor: not-allowed; }

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
