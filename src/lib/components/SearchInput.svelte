<script lang="ts">
	interface Props {
		value: string;
		placeholder?: string;
	}

	let { value = $bindable(), placeholder = 'Cerca...' }: Props = $props();

	let inputValue = $state(value);
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	// Keep inputValue in sync when the outer value is reset externally
	$effect(() => {
		if (value !== inputValue && debounceTimer === null) {
			inputValue = value;
		}
	});

	function handleInput(e: Event) {
		inputValue = (e.target as HTMLInputElement).value;
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			debounceTimer = null;
			value = inputValue;
		}, 150);
	}

	function clearInput() {
		inputValue = '';
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = null;
		value = '';
	}
</script>

<div class="search-container">
	<svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<circle cx="11" cy="11" r="8"></circle>
		<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
	</svg>
	<input
		type="text"
		class="search-input"
		class:has-clear={inputValue.length > 0}
		{placeholder}
		value={inputValue}
		oninput={handleInput}
	/>
	{#if inputValue.length > 0}
		<button class="clear-btn" onclick={clearInput} aria-label="Cancella ricerca">
			<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
				<line x1="18" y1="6" x2="6" y2="18"></line>
				<line x1="6" y1="6" x2="18" y2="18"></line>
			</svg>
		</button>
	{/if}
</div>

<style>
	.search-container {
		position: relative;
		margin-bottom: 1rem;
	}

	.search-icon {
		position: absolute;
		left: 1rem;
		top: 50%;
		transform: translateY(-50%);
		color: var(--color-text-secondary);
		pointer-events: none;
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
		box-sizing: border-box;
	}

	.search-input.has-clear {
		padding-right: 3rem;
	}

	.search-input:focus {
		border-color: var(--color-brand);
		box-shadow: 0 0 0 3px rgba(139, 26, 26, 0.1);
	}

	.search-input::placeholder {
		color: var(--color-text-secondary);
		opacity: 0.7;
	}

	.clear-btn {
		position: absolute;
		right: 0.85rem;
		top: 50%;
		transform: translateY(-50%);
		background: var(--color-border);
		border: none;
		border-radius: var(--radius-full);
		cursor: pointer;
		color: var(--color-text-secondary);
		display: flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		padding: 0;
		flex-shrink: 0;
	}
</style>
