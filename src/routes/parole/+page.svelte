<script lang="ts">
	import { words } from '$lib/stores/words';
	import { CATEGORIES } from '$lib/types/word';
	import { wordScores } from '$lib/stores/wordScores';
	import { listDisplayLang, type ListDisplayLang } from '$lib/stores/settings';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import WordRow from '$lib/components/WordRow.svelte';
	import ScoreFilter from '$lib/components/ScoreFilter.svelte';
	import FilterPills from '$lib/components/FilterPills.svelte';
	import SheetBackdrop from '$lib/components/SheetBackdrop.svelte';
	import { filterWords } from '$lib/utils/word-search';
	import SearchInput from '$lib/components/SearchInput.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { fly } from 'svelte/transition';
	import { getParoleSaved, setParoleSaved, type WordSort } from '$lib/stores/paroleNav';
	import BackToTop from '$lib/components/BackToTop.svelte';

	const saved = getParoleSaved();
	let searchQuery = $state(saved.searchQuery);
	let scoreFilter = $state(saved.scoreFilter);
	let sourceFilter = $state(saved.sourceFilter);
	let typeFilter = $state(saved.typeFilter);
	let selectedGroups = $state(new Set<string>(saved.selectedGroups));
	let activeSheet = $state<'sort' | 'score' | 'type' | 'categories' | 'options' | 'source' | null>(null);
	let sortMode = $state(saved.sortMode);

	$effect(() => {
		setParoleSaved({
			searchQuery,
			scoreFilter,
			sourceFilter,
			typeFilter,
			selectedGroups: [...selectedGroups],
			sortMode
		});
	});

	const categoryGroups = Object.entries(CATEGORIES) as [string, readonly string[]][];

	const SORT_OPTIONS: WordSort[] = ['newest', 'oldest', 'it-az', 'jp-az'] as const;
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

	const LANG_LABELS: Record<ListDisplayLang, string> = {
		italiano: 'Italiano',
		hiragana: 'Hiragana / Katakana',
		romaji: 'Romaji',
		kanji: 'Kanji',
	};

	// All active filter pills: { label, remove() }
	let activePills = $derived.by(() => {
		const pills: { label: string; remove: () => void }[] = [];
		if (sourceFilter === 'app') pills.push({ label: 'App', remove: removeSource });
		if (sourceFilter === 'mine') pills.push({ label: 'Mie', remove: removeSource });
		if (typeFilter === 'word') pills.push({ label: 'Parole', remove: removeType });
		if (typeFilter === 'phrase') pills.push({ label: 'Frasi', remove: removeType });
		for (const g of selectedGroups) pills.push({ label: g, remove: () => removeGroup(g) });
		if ($listDisplayLang !== 'italiano') pills.push({ label: LANG_LABELS[$listDisplayLang], remove: () => listDisplayLang.set('italiano') });
		return pills;
	});

	function itAzCompare(a: string, b: string): number {
		const aNum = /^\d/.test(a);
		const bNum = /^\d/.test(b);
		if (aNum !== bNum) return aNum ? 1 : -1;
		return a.localeCompare(b, 'it');
	}

	const MONTH_NAMES = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
		'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

	function isSameDay(a: Date, b: Date) {
		return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
	}

	function getDateLabel(ts: number): string {
		if (!ts) return 'Data non disponibile';
		const d = new Date(ts);
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(today.getDate() - 1);
		if (isSameDay(d, today)) return 'Oggi';
		if (isSameDay(d, yesterday)) return 'Ieri';
		const base = `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
		return d.getFullYear() !== today.getFullYear() ? `${base} ${d.getFullYear()}` : base;
	}

	let filteredWords = $derived.by(() => {
		let result = [...filterWords($words, searchQuery)].filter(w => w.italiano?.trim());
		if (scoreFilter !== 'all') {
			result = result.filter(w => ($wordScores[w.id] ?? 'none') === scoreFilter);
		}
		if (sourceFilter === 'app') result = result.filter(w => w.id.startsWith('seed-'));
		else if (sourceFilter === 'mine') result = result.filter(w => !w.id.startsWith('seed-'));
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

	type WordListItem = { type: 'divider'; label: string } | { type: 'word'; word: typeof filteredWords[number] };

	let wordListItems = $derived.by((): WordListItem[] => {
		if (sortMode !== 'newest' && sortMode !== 'oldest') {
			return filteredWords.map(w => ({ type: 'word', word: w }));
		}
		const items: WordListItem[] = [];
		let lastLabel = '';
		for (const word of filteredWords) {
			const label = getDateLabel(word.createdAt);
			if (label !== lastLabel) {
				items.push({ type: 'divider', label });
				lastLabel = label;
			}
			items.push({ type: 'word', word });
		}
		return items;
	});

	$effect(() => {
		if (activeSheet !== null) document.body.style.overflow = 'hidden';
		else document.body.style.overflow = '';
		return () => { document.body.style.overflow = ''; };
	});
</script>

<svelte:head>
	<title>Anki-jin — Tutte le parole</title>
</svelte:head>

<div class="page page-enter">
	<div class="sticky-header">
		<PageHeader title="Tutte le parole" />

		<SearchInput bind:value={searchQuery} placeholder="Cerca in italiano, romaji, hiragana..." />

		<div class="quick-filter-bar">
		<button class="quick-pill" class:active={$listDisplayLang !== 'italiano'} onclick={() => activeSheet = 'options'}>
			Lingua <Icon name="chevron-down" size={14} />
		</button>
		<button class="quick-pill" class:active={sourceFilter !== 'all'} onclick={() => activeSheet = 'source'}>
			Origine <Icon name="chevron-down" size={14} />
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
		{#each wordListItems as item (item.type === 'word' ? item.word.id : 'div_' + item.label)}
			{#if item.type === 'divider'}
				<div class="date-divider">{item.label}</div>
			{:else}
				<WordRow word={item.word} href="/parole/{item.word.id}" displayLang={$listDisplayLang} />
			{/if}
		{/each}
	</div>
	<BackToTop />
</div>

{#if activeSheet !== null}
	<div class="sheet-backdrop" onclick={() => activeSheet = null} role="presentation"></div>
	<div class="filter-sheet" transition:fly={{ y: 400, duration: 300 }}>
		<div class="sheet-header">
			<h2 class="sheet-title">
				{#if activeSheet === 'sort'}Ordina per
				{:else if activeSheet === 'score'}Stato
				{:else if activeSheet === 'type'}Tipo
				{:else if activeSheet === 'categories'}Categorie
				{:else if activeSheet === 'options'}Lingua
				{:else if activeSheet === 'source'}Origine
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
						<span class="score-opt"><span class="score-dot" style="background: var(--color-border)"></span>Non valutate</span>
						{#if scoreFilter === 'none'}<Icon name="check" size={18} strokeWidth={3} />{/if}
					</button>
					<button class="option-row" class:selected={scoreFilter === 'unknown'} onclick={() => { scoreFilter = 'unknown'; activeSheet = null; }}>
						<span class="score-opt"><span class="score-dot" style="background: #EF5350"></span>Difficile</span>
						{#if scoreFilter === 'unknown'}<Icon name="check" size={18} strokeWidth={3} />{/if}
					</button>
					<button class="option-row" class:selected={scoreFilter === 'learning'} onclick={() => { scoreFilter = 'learning'; activeSheet = null; }}>
						<span class="score-opt"><span class="score-dot" style="background: #42A5F5"></span>Buono</span>
						{#if scoreFilter === 'learning'}<Icon name="check" size={18} strokeWidth={3} />{/if}
					</button>
					<button class="option-row" class:selected={scoreFilter === 'known'} onclick={() => { scoreFilter = 'known'; activeSheet = null; }}>
						<span class="score-opt"><span class="score-dot" style="background: #66BB6A"></span>Facile</span>
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
				<div class="option-list">
					{#each [['italiano', 'Italiano'], ['hiragana', 'Hiragana / Katakana'], ['romaji', 'Romaji'], ['kanji', 'Kanji']] as [val, label]}
						<button class="option-row" class:selected={$listDisplayLang === val} onclick={() => listDisplayLang.set(val as ListDisplayLang)}>
							<span>{label}</span>
							{#if $listDisplayLang === val}<Icon name="check" size={18} strokeWidth={3} />{/if}
						</button>
					{/each}
				</div>
			{:else if activeSheet === 'source'}
				<div class="option-list">
					{#each [['all', 'Tutte le parole'], ['app', 'Parole dell\'app'], ['mine', 'Parole mie']] as [val, label]}
						<button class="option-row" class:selected={sourceFilter === val} onclick={() => sourceFilter = val as 'all'|'app'|'mine'}>
							<span>{label}</span>
							{#if sourceFilter === val}<Icon name="check" size={18} strokeWidth={3} />{/if}
						</button>
					{/each}
				</div>
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
		position: relative;
	}

	/* Kill the SearchInput component's own bottom margin inside sticky header */
	.sticky-header :global(.search-container) {
		margin-bottom: 0;
	}

	/* ---- Quick Filter Bar ---- */
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

	.sheet-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(2px);
		-webkit-backdrop-filter: blur(2px);
		z-index: 100;
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
		color: #1A1A1A;
	}

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

	/* ---- Date divider ---- */
	.date-divider {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-tertiary);
		padding: 1rem 0 0.4rem;
	}

	.date-divider:first-child {
		padding-top: 0;
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

	/* ---- Filter sheet ---- */
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
		color: #1A1A1A;
		font-weight: 700;
	}

	.option-row.selected svg {
		stroke: #1A1A1A;
	}

	.score-opt { display: inline-flex; align-items: center; gap: 0.6rem; }
	.score-dot {
		width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0;
		border: 1px solid color-mix(in srgb, var(--color-text) 12%, transparent);
	}
</style>
