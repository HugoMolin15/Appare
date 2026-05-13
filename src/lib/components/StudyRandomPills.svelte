<script lang="ts">
	import { randomWordOrder, randomCardOrder } from '$lib/stores/settings';
	import { Shuffle } from 'phosphor-svelte';
</script>

<div class="study-random-pills">
	<button
		class="random-pill"
		class:active={$randomWordOrder}
		onclick={() => randomWordOrder.update(v => !v)}
		title={$randomWordOrder ? 'Ordine parole: casuale' : 'Ordine parole: fisso'}
	>
		<Shuffle size={12} weight="bold" />
		Parole
	</button>
	<button
		class="random-pill"
		class:active={$randomCardOrder}
		onclick={() => randomCardOrder.update(v => !v)}
		title={$randomCardOrder ? 'Ordine carte: casuale' : 'Ordine carte: fisso'}
	>
		<Shuffle size={12} weight="bold" />
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
