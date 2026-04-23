<!--
  CategoryPicker — Category chip selector grouped by grammar type.
  Usage: <CategoryPicker bind:selected={selectedCategory} />
-->
<script lang="ts">
	import { CATEGORIES, type CategoryValue } from '$lib/types/word';

	interface Props {
		selected: CategoryValue | null;
	}

	let { selected = $bindable() }: Props = $props();

	function toggle(cat: CategoryValue) {
		selected = selected === cat ? null : cat;
	}

	const entries = Object.entries(CATEGORIES) as [string, readonly CategoryValue[]][];
</script>

<div class="category-section">
	<span class="category-title">Categoria</span>

	{#each entries as [groupName, options]}
		<div class="category-group">
			<span class="group-label">{groupName}</span>
			<div class="chip-row">
				{#each options as option}
					<button
						type="button"
						class="chip"
						class:active={selected === option}
						data-category={selected === option ? option : undefined}
						onclick={() => toggle(option)}
					>
						{option}
					</button>
				{/each}
			</div>
		</div>
	{/each}
</div>

<style>
	.category-section {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}

	.category-title {
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.category-group {
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
	}

	.group-label {
		font-size: 0.68rem;
		font-weight: 700;
		color: var(--color-text-tertiary);
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.chip-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.chip {
		padding: 0.45rem 0.75rem;
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-full);
		background: var(--color-bg);
		color: var(--color-text);
		font-size: 0.82rem;
		font-weight: 500;
		font-family: var(--font-sans);
		cursor: pointer;
		transition: all 0.15s ease;
		white-space: nowrap;
	}

	.chip:hover:not(.active) {
		border-color: var(--color-text-tertiary);
		background-color: var(--color-surface);
	}

	.chip:active:not(.active) {
		transform: scale(0.96);
	}

	.chip.active {
		background-color: var(--color-primary);
		border-color: var(--color-primary);
		color: white;
	}
</style>
