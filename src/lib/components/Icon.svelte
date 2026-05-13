<script lang="ts">
	import { Check, CaretRight, CaretDown, X, Plus, Trash } from 'phosphor-svelte';

	interface Props {
		name: 'check' | 'chevron-right' | 'chevron-down' | 'close' | 'plus' | 'trash';
		size?: number;
		strokeWidth?: number; // kept for backwards compat, ignored
		stroke?: string;
		class?: string;
	}

	let { name, size = 20, stroke = 'currentColor', class: className = '' }: Props = $props();
</script>

{#if name === 'check'}
	<Check {size} weight="bold" color={stroke} class={className} />
{:else if name === 'chevron-right'}
	<CaretRight {size} weight="bold" color={stroke} class={className} />
{:else if name === 'chevron-down'}
	<CaretDown {size} weight="bold" color={stroke} class={className} />
{:else if name === 'close'}
	<X {size} weight="bold" color={stroke} class={className} />
{:else if name === 'plus'}
	<Plus {size} weight="bold" color={stroke} class={className} />
{:else if name === 'trash'}
	<Trash {size} weight="bold" color={stroke} class={className} />
{/if}
