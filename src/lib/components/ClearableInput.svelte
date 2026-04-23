<!--
  ClearableInput — Text input with an optional clear (×) button.
  Usage: <ClearableInput bind:value={myVal} placeholder="es. grande" />
-->
<script lang="ts">
	interface Props {
		value: string;
		placeholder?: string;
		id?: string;
		lang?: string;
		japanese?: boolean;
	}

	let { value = $bindable(), placeholder = '', id = '', lang = '', japanese = false }: Props = $props();

	function clear() {
		value = '';
	}
</script>

<div class="input-wrap">
	<input
		{id}
		type="text"
		class="field-input"
		class:font-jp={japanese}
		{placeholder}
		bind:value
		autocomplete="off"
		autocapitalize="off"
		{lang}
	/>
	{#if value.length > 0}
		<button type="button" class="clear-btn" onclick={clear} aria-label="Cancella">
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
				<line x1="18" y1="6" x2="6" y2="18" />
				<line x1="6" y1="6" x2="18" y2="18" />
			</svg>
		</button>
	{/if}
</div>

<style>
	.input-wrap {
		position: relative;
		display: flex;
		align-items: center;
	}

	.field-input {
		width: 100%;
		padding: 0.8rem 0.9rem;
		padding-right: 2.5rem;
		border: none;
		border-radius: var(--radius-md);
		background: var(--color-surface);
		color: var(--color-text);
		font-size: 1rem;
		font-family: var(--font-sans);
		outline: none;
		transition: background-color 0.15s ease, box-shadow 0.2s ease;
		box-sizing: border-box;
	}

	.field-input.font-jp {
		font-family: var(--font-jp);
	}

	.field-input::placeholder {
		color: var(--color-text-tertiary);
		font-weight: 400;
	}

	.field-input:focus {
		background-color: var(--color-surface);
		box-shadow: inset 0 0 0 1.5px var(--color-primary);
	}

	.clear-btn {
		position: absolute;
		right: 0.6rem;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		border: none;
		border-radius: var(--radius-full);
		background: var(--color-border);
		color: var(--color-text-secondary);
		cursor: pointer;
		padding: 0;
		flex-shrink: 0;
	}
</style>
