import re

with open('src/routes/cartelle/+page.svelte', 'r') as f:
    content = f.read()

# Replace sort-row with quick-filter-bar
old_sort_row = r'<div class="sort-row">(.*?)</div>'
def replace_sort_row(match):
    inner = match.group(1)
    inner = inner.replace('class="sort-btn"', 'class="quick-pill"')
    inner = inner.replace('class="sort-btn reorder-active"', 'class="quick-pill active"')
    # replace StudyRandomPills with the quick pills
    random_pills = """
				<button class="quick-pill" class:active={$randomWordOrder} onclick={() => randomWordOrder.update(v => !v)}>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
						<polyline points="16 3 21 3 21 8" />
						<line x1="4" y1="20" x2="21" y2="3" />
						<polyline points="21 16 21 21 16 21" />
						<line x1="15" y1="15" x2="21" y2="21" />
					</svg> Parole
				</button>
				<button class="quick-pill" class:active={$randomCardOrder} onclick={() => randomCardOrder.update(v => !v)}>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
						<polyline points="16 3 21 3 21 8" />
						<line x1="4" y1="20" x2="21" y2="3" />
						<polyline points="21 16 21 21 16 21" />
						<line x1="15" y1="15" x2="21" y2="21" />
					</svg> Carte
				</button>"""
    inner = inner.replace('<StudyRandomPills />', random_pills)
    return f'<div class="quick-filter-bar">{inner}</div>'

content = re.sub(old_sort_row, replace_sort_row, content, flags=re.DOTALL)

# Also import randomWordOrder and randomCardOrder
import_statement = "import { randomWordOrder, randomCardOrder } from '$lib/stores/settings';"
if "randomWordOrder" not in content:
    content = content.replace("import { randomCardOrder } from '$lib/stores/settings';", import_statement)

# Replace sort-row css
old_css = r'/\* ---- Sort row ---- \*/.*?\.sort-btn\.reorder-active \{[^}]*\}'
new_css = """	/* ---- Quick Filter Bar ---- */
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

	.quick-pill svg { stroke-width: 2.5; }"""

content = re.sub(old_css, new_css, content, flags=re.DOTALL)

with open('src/routes/cartelle/+page.svelte', 'w') as f:
    f.write(content)

