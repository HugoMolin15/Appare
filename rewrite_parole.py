import re

with open('src/routes/parole/+page.svelte', 'r') as f:
    content = f.read()

# 1. Replace showFilterSheet with activeSheet
content = content.replace("let showFilterSheet = $state(false);", "let activeSheet = $state<'sort' | 'score' | 'type' | 'categories' | 'options' | null>(null);")

# 2. In effect, replace showFilterSheet with activeSheet !== null
content = content.replace("if (showFilterSheet) document.body.style.overflow = 'hidden';", "if (activeSheet !== null) document.body.style.overflow = 'hidden';")

# 3. Replace the PageHeader filter button entirely with a simpler action
header_pattern = r'<PageHeader title="Tutte le parole" hideBack>.*?</PageHeader>'
new_header = '<PageHeader title="Tutte le parole" hideBack />'
content = re.sub(header_pattern, new_header, content, flags=re.DOTALL)

# 4. Replace ScoreFilter and FilterPills with the quick filter bar
old_filters = r'<ScoreFilter.*?/>\s*<FilterPills pills=\{activePills\} />'
new_filters = """<div class="quick-filter-bar">
		<button class="quick-pill" class:active={$listDisplayLang !== 'italiano' || sourceFilter !== 'all'} onclick={() => activeSheet = 'options'}>
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

	<FilterPills pills={activePills} />"""

content = re.sub(old_filters, new_filters, content, flags=re.DOTALL)

# 5. Replace the bottom sheet
old_sheet = r'\{#if showFilterSheet\}.*\{/if\}'
new_sheet = """{#if activeSheet !== null}
	<div class="sheet-backdrop" onclick={() => activeSheet = null} role="presentation"></div>
	<div class="filter-sheet" transition:fly={{ y: 400, duration: 300 }}>
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
				<div class="filter-section" style="margin-bottom: 2rem;">
					<span class="section-label">Lingua visualizzata</span>
					<div class="option-list">
						{#each [['italiano', 'Italiano'], ['hiragana', 'Hiragana / Katakana'], ['romaji', 'Romaji'], ['kanji', 'Kanji']] as [val, label]}
							<button class="option-row" class:selected={$listDisplayLang === val} onclick={() => listDisplayLang.set(val)}>
								<span>{label}</span>
								{#if $listDisplayLang === val}<Icon name="check" size={18} strokeWidth={3} />{/if}
							</button>
						{/each}
					</div>
				</div>
				<div class="filter-section">
					<span class="section-label">Origine</span>
					<div class="option-list">
						{#each [['all', 'Tutte le parole'], ['app', 'Parole dell\\'app'], ['mine', 'Parole mie']] as [val, label]}
							<button class="option-row" class:selected={sourceFilter === val} onclick={() => sourceFilter = val as 'all'|'app'|'mine'}>
								<span>{label}</span>
								{#if sourceFilter === val}<Icon name="check" size={18} strokeWidth={3} />{/if}
							</button>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}"""

content = re.sub(old_sheet, new_sheet, content, flags=re.DOTALL)

# Add CSS for quick-filter-bar
new_css = """	/* ---- Quick Filter Bar ---- */
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
	}"""

content = content.replace("	/* ---- Filter button ---- */", new_css + "\n\n	/* ---- Filter button ---- */")

with open('src/routes/parole/+page.svelte', 'w') as f:
    f.write(content)

