<script lang="ts">
	interface Props {
		name: 'check' | 'chevron-right' | 'close' | 'plus';
		size?: number;
		strokeWidth?: number;
		stroke?: string;
		class?: string;
	}

	let {
		name,
		size = 20,
		strokeWidth = 2,
		stroke = 'currentColor',
		class: className = ''
	}: Props = $props();
</script>

<svg
	class={className}
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	{stroke}
	stroke-width={strokeWidth}
	stroke-linecap="round"
	stroke-linejoin="round"
>
	{#if name === 'check'}
		<polyline points="20 6 9 17 4 12" />
	{:else if name === 'chevron-right'}
		<polyline points="9 18 15 12 9 6" />
	{:else if name === 'close'}
		<line x1="18" y1="6" x2="6" y2="18" />
		<line x1="6" y1="6" x2="18" y2="18" />
	{:else if name === 'plus'}
		<line x1="12" y1="5" x2="12" y2="19" />
		<line x1="5" y1="12" x2="19" y2="12" />
	{/if}
</svg>
