<script lang="ts">
	import type { WordScore } from '$lib/types/word';

	type ScoreFilterValue = 'all' | WordScore;

	interface Props {
		value: ScoreFilterValue;
		onChange: (value: ScoreFilterValue) => void;
		sortLabel?: string;
		onSortCycle?: () => void;
	}

	let { value, onChange, sortLabel, onSortCycle }: Props = $props();

	const OPTIONS: ScoreFilterValue[] = ['all', 'none', 'unknown', 'learning', 'known'];

	const LABELS: Record<ScoreFilterValue, string> = {
		all: 'Tutti',
		none: 'Non valutate',
		unknown: 'Difficile',
		learning: 'Buono',
		known: 'Facile',
	};

	const COLORS: Record<WordScore, string> = {
		none: 'var(--color-border)',
		unknown: '#EF5350',
		learning: '#42A5F5',
		known: '#66BB6A',
	};
</script>

{#if onSortCycle && sortLabel}
	<button class="quick-pill" onclick={onSortCycle}>
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
			<path d="M7 3v18M7 3L3 7M7 3l4 4M17 21V3M17 21l-4-4M17 21l4-4"/>
		</svg>
		{sortLabel}
	</button>
{/if}
{#each OPTIONS as s}
	<button
		class="quick-pill"
		class:active={value === s}
		onclick={() => onChange(s)}
		style={s !== 'all' ? `--chip-color: ${COLORS[s]}` : ''}
	>
		{#if s !== 'all'}
			<span class="score-chip-dot" style="background:{COLORS[s]}"></span>
		{/if}
		{LABELS[s]}
	</button>
{/each}

<style>
	.quick-pill {
		background: none;
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

	.score-chip-dot {
		width: 9px;
		height: 9px;
		border-radius: 50%;
		flex-shrink: 0;
	}

</style>
