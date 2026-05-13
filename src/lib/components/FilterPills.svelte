<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';

	export interface FilterPill {
		label: string;
		remove: () => void;
	}

	interface Props {
		pills: FilterPill[];
	}

	let { pills }: Props = $props();
</script>

{#if pills.length > 0}
	<div class="pills-row">
		{#each pills as pill}
			<span class="pill">
				{pill.label}
				<button class="pill-remove" onclick={pill.remove} aria-label="Rimuovi filtro {pill.label}">
					<Icon name="close" size={12} strokeWidth={3} />
				</button>
			</span>
		{/each}
	</div>
{/if}

<style>
	.pills-row {
		display: flex;
		gap: 0.4rem;
		overflow-x: auto;
		scrollbar-width: none;
		-ms-overflow-style: none;
		margin-bottom: 0.75rem;
		padding-bottom: 0.1rem;

		margin-left: calc(-1 * var(--spacing-page));
		margin-right: calc(-1 * var(--spacing-page));
		padding-left: var(--spacing-page);
	}



	.pills-row::-webkit-scrollbar { display: none; }

	.pill {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.35rem 0.5rem 0.35rem 0.75rem;
		background-color: #1A1A1A;
		color: white;
		border-radius: var(--radius-full);
		font-size: 0.8rem;
		font-weight: 600;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.pill-remove {
		background: rgba(255,255,255,0.25);
		border: none;
		border-radius: 50% !important;
		aspect-ratio: 1;
		box-sizing: border-box;
		overflow: hidden;
		width: 18px;
		height: 18px;
		min-width: 18px;
		min-height: 18px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		color: white;
		padding: 0;
		flex-shrink: 0;
		-webkit-appearance: none;
		appearance: none;
	}
</style>
