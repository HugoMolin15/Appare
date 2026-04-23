<script lang="ts">
	interface Props {
		value: string;
		placeholder?: string;
	}

	let { value = $bindable(), placeholder = 'Cerca...' }: Props = $props();
</script>

<div class="search-container">
	<svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<circle cx="11" cy="11" r="8"></circle>
		<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
	</svg>
	<input
		type="text"
		class="search-input"
		{placeholder}
		bind:value
	/>
</div>

<style>
	.search-container {
		position: relative;
		margin-bottom: 1.5rem;
	}

	.search-icon {
		position: absolute;
		left: 1rem;
		top: 50%;
		transform: translateY(-50%);
		color: var(--color-text-secondary);
	}

	.search-input {
		width: 100%;
		padding: 1rem 1rem 1rem 3rem;
		border-radius: var(--radius-xl);
		background-color: var(--color-surface);
		border: 1px solid var(--color-border);
		color: var(--color-text-primary);
		font-family: inherit;
		font-size: 1rem;
		outline: none;
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
	}

	.search-input:focus {
		border-color: var(--color-brand);
		box-shadow: 0 0 0 3px rgba(139, 26, 26, 0.1);
	}

	.search-input::placeholder {
		color: var(--color-text-secondary);
		opacity: 0.7;
	}
</style>
