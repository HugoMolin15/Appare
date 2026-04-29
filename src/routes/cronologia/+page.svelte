<script lang="ts">
	import { studyHistory } from '$lib/stores/history';
	import { words } from '$lib/stores/words';
	import { selectedWordIds, toggleWordSelection, setSelectedWords, clearSelection, skipExitGuard } from '$lib/stores/studySession';
	import { dateColors, setDateColor } from '$lib/stores/dateColors';
	import { FOLDER_COLORS } from '$lib/constants';
	import { goto } from '$app/navigation';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { filterWords } from '$lib/utils/word-search';
	import SearchInput from '$lib/components/SearchInput.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import type { Word } from '$lib/types/word';
	import { fade, fly } from 'svelte/transition';
	import { shuffle } from '$lib/utils/shuffle';

	// Path state: [Year, Month, Week, Date]
	let path = $state<string[]>([]);

	const monthNames = [
		'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
		'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
	];

	function getWeekKey(dateStr: string) {
		const d = new Date(dateStr);
		const dayOfWeek = d.getDay();
		const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
		const monday = new Date(d);
		monday.setDate(d.getDate() + diffToMonday);
		
		const sunday = new Date(monday);
		sunday.setDate(monday.getDate() + 6);
		
		const monStr = `${monday.getDate()} ${monthNames[monday.getMonth()]}`;
		const sunStr = `${sunday.getDate()} ${monthNames[sunday.getMonth()]}`;
		return `${monStr} - ${sunStr}`;
	}

	function getDayName(dateStr: string) {
		const d = new Date(dateStr);
		const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
		return `${days[d.getDay()]} ${d.getDate()}`;
	}

	// Parse history into a nested structure
	// tree = { "2024": { "04": { "15 Apr - 21 Apr": { "2024-04-18": ["id1", "id2"] } } } }
	let tree = $derived(() => {
		const result: Record<string, any> = {};
		
		for (const [dateStr, ids] of Object.entries($studyHistory)) {
			if (!ids || ids.length === 0) continue;
			
			const year = dateStr.substring(0, 4);
			const month = dateStr.substring(5, 7);
			const week = getWeekKey(dateStr);
			
			if (!result[year]) result[year] = {};
			if (!result[year][month]) result[year][month] = {};
			if (!result[year][month][week]) result[year][month][week] = {};
			
			result[year][month][week][dateStr] = ids;
		}
		
		return result;
	});

	let currentItems = $derived(() => {
		let current = tree();
		for (const p of path) {
			if (current[p]) {
				current = current[p];
			} else {
				return {}; // Path not found
			}
		}
		return current;
	});

	function navigateTo(key: string) {
		path = [...path, key];
	}

	function navigateUp() {
		if (path.length > 0) {
			path = path.slice(0, -1);
		}
	}

	function getTitle() {
		if (path.length === 0) return 'Cronologia';
		if (path.length === 1) return path[0]; // Year
		if (path.length === 2) return `${monthNames[parseInt(path[1]) - 1]} ${path[0]}`; // Month
		if (path.length === 3) return path[2]; // Week
		return getDayName(path[3]); // Day
	}

	let searchQuery = $state('');

	// When viewing a day, path.length === 4 and currentItems() returns string[] (word ids)
	let isDayView = $derived(path.length === 4);

	let dayWords = $derived(
		isDayView
			? (currentItems() as string[]).map(id => $words.find(w => w.id === id)).filter((w): w is Word => w !== undefined)
			: [] as Word[]
	);

	let filteredWords = $derived(filterWords(dayWords, searchQuery));

	let selectedInFolder = $derived(
		dayWords.filter(w => $selectedWordIds.has(w.id)).length
	);

	// Folder select mode (at non-day levels)
	let selectMode = $state(false);
	let selectedKeys = $state(new Set<string>());

	function toggleKeySelect(key: string) {
		const next = new Set(selectedKeys);
		if (next.has(key)) next.delete(key); else next.add(key);
		selectedKeys = next;
	}

	function exitSelectMode() { selectMode = false; selectedKeys = new Set(); }

	function collectWordIdsFromNode(node: unknown): string[] {
		if (Array.isArray(node)) return node as string[];
		if (node && typeof node === 'object') {
			return Object.values(node).flatMap(collectWordIdsFromNode);
		}
		return [];
	}

	let selectedNodeWordCount = $derived.by(() => {
		const items = currentItems();
		return new Set(
			Array.from(selectedKeys).flatMap(k => collectWordIdsFromNode(items[k]))
		).size;
	});

	function studySelectedPeriods() {
		const items = currentItems();
		const allIds = Array.from(selectedKeys).flatMap(k => collectWordIdsFromNode(items[k]));
		const unique = [...new Set(allIds)].filter(id => $words.some(w => w.id === id));
		if (unique.length === 0) return;
		setSelectedWords(shuffle(unique));
		skipExitGuard.set(true);
		goto('/studia');
	}

	// Reset select mode when navigating
	$effect(() => {
		path; // track path changes
		selectMode = false;
		selectedKeys = new Set();
	});

	// Color editing for folder nodes
	let editingColorKey = $state<string | null>(null);
	let editColor = $state('');

	function colorKey(nodeKey: string) {
		return [...path, nodeKey].join('|');
	}

	function openColorEdit(nodeKey: string, e: Event) {
		e.stopPropagation();
		const key = colorKey(nodeKey);
		editColor = $dateColors[key] ?? '';
		editingColorKey = key;
	}

	function saveColor() {
		if (editingColorKey) setDateColor(editingColorKey, editColor || undefined);
		editingColorKey = null;
	}

	$effect(() => {
		if (editingColorKey) document.body.style.overflow = 'hidden';
		else document.body.style.overflow = '';
		return () => { document.body.style.overflow = ''; };
	});
</script>

<svelte:head>
	<title>Anki-jin — Cronologia</title>
</svelte:head>

<div class="page page-enter">
	<PageHeader 
		title={getTitle()} 
		onback={path.length > 0 ? navigateUp : () => window.history.back()} 
	/>

	<div class="content">
		{#if Object.keys(currentItems()).length === 0}
			<div class="empty-state">
				<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="12" r="10" />
					<polyline points="12 6 12 12 16 14" />
				</svg>
				<p>Nessuna sessione di studio trovata.</p>
			</div>
		{:else if path.length < 4}
			<!-- Show Folders -->
			<div class="crono-sort-row">
				{#if selectMode}
					<button class="sort-btn select-active" onclick={exitSelectMode}>Fine</button>
				{:else}
					<button class="sort-btn" onclick={() => selectMode = true}>Seleziona</button>
				{/if}
			</div>
			<div class="folder-list">
				{#each Object.keys(currentItems()).sort().reverse() as key}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div class="folder-item" onclick={() => selectMode ? toggleKeySelect(key) : navigateTo(key)}>
						{#if selectMode}
							<div class="folder-checkbox" class:checked={selectedKeys.has(key)}>
								<Icon name="check" strokeWidth={3} />
							</div>
						{/if}
						<div class="folder-icon" style={$dateColors[colorKey(key)] ? `color: ${$dateColors[colorKey(key)]}` : ''}>
							<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
								<path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" />
							</svg>
						</div>
						<div class="folder-text">
							<span class="folder-name">
								{#if path.length === 1}
									{monthNames[parseInt(key) - 1]}
								{:else if path.length === 3}
									{getDayName(key)}
								{:else}
									{key}
								{/if}
							</span>
						</div>
						{#if !selectMode}
							<button class="color-dot-btn" onclick={(e) => openColorEdit(key, e)} aria-label="Colora">
								<div class="color-dot" style={$dateColors[colorKey(key)] ? `background: ${$dateColors[colorKey(key)]}` : ''}></div>
							</button>
							<Icon name="chevron-right" class="folder-chevron" />
						{/if}
					</div>
				{/each}
			</div>

			{#if selectMode && selectedKeys.size > 0}
				<div class="study-bar">
					<span class="study-bar-info">
						{selectedKeys.size} {selectedKeys.size === 1 ? 'periodo' : 'periodi'} · {selectedNodeWordCount} parole
					</span>
					<button class="study-bar-btn" onclick={studySelectedPeriods} disabled={selectedNodeWordCount === 0}>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
							<polygon points="5 3 19 12 5 21 5 3" />
						</svg>
						Studia
					</button>
				</div>
			{/if}
		{:else}
			<!-- Show Words for the selected day -->
			<SearchInput bind:value={searchQuery} placeholder="Cerca in italiano, romaji, hiragana..." />

			<div class="folder-actions" style="margin-bottom: 1.5rem;">
				<button class="study-folder-btn" onclick={() => {
					if (selectedInFolder > 0) {
						const selected = dayWords.filter(w => $selectedWordIds.has(w.id)).map(w => w.id);
						setSelectedWords(selected);
					} else {
						setSelectedWords(dayWords.map(w => w.id));
					}
					skipExitGuard.set(true);
					goto('/studia');
				}}>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
						<polygon points="5 3 19 12 5 21 5 3" />
					</svg>
					{#if selectedInFolder > 0}
						Studia {selectedInFolder} {selectedInFolder === 1 ? 'selezionata' : 'selezionate'}
					{:else}
						Studia cartella
					{/if}
				</button>
			</div>

			<div class="header-row-flex">
				<p class="word-count-label">{dayWords.length} parole in questa cartella</p>
				{#if selectedInFolder > 0}
					<button class="clear-btn" onclick={clearSelection}>Deseleziona</button>
				{/if}
			</div>
			
			<div class="word-list">
				{#each filteredWords as word (word.id)}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div class="word-row" onclick={() => toggleWordSelection(word.id)}>
						<div class="word-checkbox" class:checked={$selectedWordIds.has(word.id)}>
							<Icon name="check" strokeWidth={3} />
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
	</div>
</div>

{#if editingColorKey}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="sheet-backdrop" transition:fade={{ duration: 200 }} onclick={() => editingColorKey = null}></div>
	<div class="color-sheet" transition:fly={{ y: 300, duration: 300 }}>
		<div class="sheet-header">
			<h2 class="sheet-title">Colore</h2>
			<button class="sheet-close" onclick={() => editingColorKey = null}>Annulla</button>
		</div>
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
		<button class="save-color-btn" onclick={saveColor}>Salva</button>
	</div>
{/if}

<style>
	.page {
		padding: var(--spacing-page);
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 4rem 1rem;
		color: var(--color-text-secondary);
		text-align: center;
	}

	.crono-sort-row {
		margin-bottom: 0.5rem;
		display: flex;
		gap: 0.5rem;
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

	.folder-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.folder-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 0.25rem;
		color: inherit;
		cursor: pointer;
		border-radius: var(--radius-md);
	}

	.folder-icon {
		width: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-primary);
		flex-shrink: 0;
	}

	.folder-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.folder-name {
		font-size: 1rem;
		font-weight: 700;
		color: var(--color-text-primary);
	}

	.folder-chevron {
		color: var(--color-text-tertiary);
		opacity: 0.6;
	}

	.color-dot-btn {
		background: none;
		border: none;
		padding: 0.4rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.color-dot {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: var(--color-border);
		transition: background 0.15s ease;
	}

	/* ---- Color sheet ---- */
	.sheet-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0,0,0,0.4);
		backdrop-filter: blur(2px);
		z-index: 100;
	}

	.color-sheet {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: var(--color-bg);
		border-radius: var(--radius-xl) var(--radius-xl) 0 0;
		padding: 1.75rem;
		padding-bottom: calc(1.5rem + env(safe-area-inset-bottom));
		z-index: 101;
		box-shadow: 0 -8px 32px rgba(0,0,0,0.15);
	}

	.sheet-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.5rem;
	}

	.sheet-title {
		font-size: 1.2rem;
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

	.color-grid {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 0.75rem;
		margin-bottom: 1.5rem;
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

	.save-color-btn {
		width: 100%;
		padding: 0.9rem;
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: var(--radius-lg);
		font-size: 1rem;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
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

	.header-row-flex {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.clear-btn {
		background: none;
		border: none;
		color: var(--color-primary);
		font-size: 0.82rem;
		font-weight: 600;
		cursor: pointer;
		padding: 0;
	}

	.clear-btn:hover {
		text-decoration: underline;
	}

	/* Word list styles */
	.word-count-label {
		font-size: 0.82rem;
		font-weight: 500;
		color: var(--color-text-secondary);
		margin: 0;
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
		padding: 0.85rem 0;
		border-bottom: 1px solid var(--color-border-light);
		cursor: pointer;
		user-select: none;
	}

	.word-row:last-child {
		border-bottom: none;
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
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-width: 0;
		flex-grow: 1;
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
</style>
