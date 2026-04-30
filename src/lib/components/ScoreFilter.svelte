<script lang="ts">
	import type { WordScore } from '$lib/types/word';

	type ScoreFilterValue = 'all' | WordScore;

	interface Props {
		value: ScoreFilterValue;
		onChange: (value: ScoreFilterValue) => void;
	}

	let { value, onChange }: Props = $props();

	const OPTIONS: ScoreFilterValue[] = ['all', 'none', 'unknown', 'learning', 'known'];

	const LABELS: Record<ScoreFilterValue, string> = {
		all: 'Tutti',
		none: 'Non valutate',
		unknown: 'Non la so',
		learning: 'Così così',
		known: 'La so',
	};

	const COLORS: Record<WordScore, string> = {
		none: 'var(--color-border)',
		unknown: '#C5221F',
		learning: '#D97706',
		known: '#1D6FA4',
	};
</script>

<div class="score-filter-row">
	{#each OPTIONS as s}
		<button
			class="score-chip"
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
</div>

<style>
	.score-filter-row {
		display: flex;
		gap: 0.4rem;
		overflow-x: auto;
		scrollbar-width: none;
		-ms-overflow-style: none;
		margin-bottom: 0.75rem;
		padding-bottom: 0.1rem;
	}

	.score-filter-row::-webkit-scrollbar { display: none; }

	.score-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.35rem 0.75rem;
		border-radius: var(--radius-full);
		border: 1.5px solid var(--color-border);
		background: var(--color-bg);
		color: var(--color-text-secondary);
		font-size: 0.78rem;
		font-weight: 600;
		font-family: var(--font-sans);
		cursor: pointer;
		white-space: nowrap;
		flex-shrink: 0;
		transition: border-color 0.15s ease, color 0.15s ease;
	}

	.score-chip.active {
		border-color: var(--chip-color, var(--color-primary));
		color: var(--chip-color, var(--color-primary));
		background: color-mix(in srgb, var(--chip-color, var(--color-primary)) 10%, transparent);
	}

	.score-chip-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		flex-shrink: 0;
	}
</style>
