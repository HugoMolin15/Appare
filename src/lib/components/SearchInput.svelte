<script lang="ts">
	import { fly } from 'svelte/transition';

	interface Props {
		value: string;
		placeholder?: string;
		collapsible?: boolean;
	}

	let { value = $bindable(), placeholder = 'Cerca...', collapsible = false }: Props = $props();

	let inputValue = $state(value);
	let expanded = $state(!collapsible);
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;
	let inputEl = $state<HTMLInputElement | null>(null);

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

	function openSearch() {
		expanded = true;
		// Focus the input after it renders
		setTimeout(() => inputEl?.focus(), 50);
	}

	function closeSearch() {
		clearInput();
		expanded = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') closeSearch();
	}
</script>

{#if collapsible && !expanded}
	<button class="search-icon-btn" onclick={openSearch} aria-label="Cerca">
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="11" cy="11" r="8"></circle>
			<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
		</svg>
	</button>
{:else if collapsible && expanded}
	<div class="search-overlay" transition:fly={{ y: -8, duration: 200 }}>
		<svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="11" cy="11" r="8"></circle>
			<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
		</svg>
		<input
			bind:this={inputEl}
			type="text"
			class="search-input"
			{placeholder}
			value={inputValue}
			oninput={handleInput}
			onkeydown={handleKeydown}
		/>
		<button class="close-btn" onclick={closeSearch} aria-label="Chiudi ricerca">
			<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
				<line x1="18" y1="6" x2="6" y2="18"></line>
				<line x1="6" y1="6" x2="18" y2="18"></line>
			</svg>
		</button>
	</div>
{:else}
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
{/if}

<style>
	/* ---- Collapsible: icon-only button ---- */
	.search-icon-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: #f5f3f7;
		border: none;
		color: #1A1A1A;
		cursor: pointer;
		flex-shrink: 0;
	}

	/* ---- Collapsible: expanded overlay ---- */
	.search-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--color-bg);
		padding: 0 var(--spacing-page);
		height: 40px;
		z-index: 10;
	}

	/* ---- Standard (non-collapsible) ---- */
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

	/* In overlay mode the icon is flex (not absolute) */
	.search-overlay .search-icon {
		position: static;
		transform: none;
		flex-shrink: 0;
		color: var(--color-text-secondary);
	}

	.search-input {
		width: 100%;
		padding: 0.75rem 1rem 0.75rem 3rem;
		border-radius: var(--radius-full);
		background-color: #f5f3f7;
		border: 1px solid transparent;
		color: #1A1A1A;
		font-family: inherit;
		font-size: 1rem;
		outline: none;
		transition: border-color 0.2s ease;
		box-sizing: border-box;
	}

	/* Overlay input is flex-grow, not full-width block */
	.search-overlay .search-input {
		flex: 1;
		padding: 0.4rem 0.75rem;
		border-radius: var(--radius-full);
		min-width: 0;
	}

	.search-input:focus {
		border-color: #e0dce6;
	}

	.search-input::placeholder {
		color: var(--color-text-secondary);
		opacity: 0.7;
	}

	.search-input.has-clear {
		padding-right: 3rem;
	}

	.clear-btn,
	.close-btn {
		position: absolute;
		right: 0.85rem;
		top: 50%;
		transform: translateY(-50%);
		background: #e0dce6;
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

	/* In overlay, close btn is flex (not absolute) */
	.search-overlay .close-btn {
		position: static;
		transform: none;
	}
</style>
