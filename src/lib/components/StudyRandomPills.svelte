<script lang="ts">
	import { randomWordOrder, randomCardOrder } from '$lib/stores/settings';
</script>

<div class="study-random-pills">
	<button
		class="random-pill"
		class:active={$randomWordOrder}
		onclick={() => randomWordOrder.update(v => !v)}
		title={$randomWordOrder ? 'Ordine parole: casuale' : 'Ordine parole: fisso'}
	>
		<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
			<polyline points="16 3 21 3 21 8" />
			<line x1="4" y1="20" x2="21" y2="3" />
			<polyline points="21 16 21 21 16 21" />
			<line x1="15" y1="15" x2="21" y2="21" />
		</svg>
		Parole
	</button>
	<button
		class="random-pill"
		class:active={$randomCardOrder}
		onclick={() => randomCardOrder.update(v => !v)}
		title={$randomCardOrder ? 'Ordine carte: casuale' : 'Ordine carte: fisso'}
	>
		<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
			<polyline points="16 3 21 3 21 8" />
			<line x1="4" y1="20" x2="21" y2="3" />
			<polyline points="21 16 21 21 16 21" />
			<line x1="15" y1="15" x2="21" y2="21" />
		</svg>
		Carte
	</button>
</div>

<style>
	.study-random-pills {
		display: flex;
		gap: 0.4rem;
	}

	.random-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.4rem 0.7rem;
		border-radius: var(--radius-full);
		border: 1.5px solid var(--color-border);
		background: var(--color-bg);
		color: var(--color-text-secondary);
		font-size: 0.8rem;
		font-weight: 600;
		font-family: var(--font-sans);
		cursor: pointer;
		transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
		white-space: nowrap;
	}

	.random-pill.active {
		border-color: var(--color-primary);
		color: var(--color-primary);
	}
</style>
