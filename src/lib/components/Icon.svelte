<script lang="ts">
	interface Props {
		name: 'check' | 'chevron-right' | 'chevron-down' | 'close' | 'plus' | 'trash';
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
	{:else if name === 'chevron-down'}
		<polyline points="6 9 12 15 18 9" />
	{:else if name === 'close'}
		<line x1="18" y1="6" x2="6" y2="18" />
		<line x1="6" y1="6" x2="18" y2="18" />
	{:else if name === 'plus'}
		<line x1="12" y1="5" x2="12" y2="19" />
		<line x1="5" y1="12" x2="19" y2="12" />
	{:else if name === 'trash'}
		<polyline points="3 6 5 6 21 6" />
		<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
	{/if}
</svg>
