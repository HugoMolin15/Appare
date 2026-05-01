<!--
  ClearableInput — Text input with an optional clear (×) button.
  Usage: <ClearableInput bind:value={myVal} placeholder="es. grande" />
-->
<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';

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
			<Icon name="close" size={14} strokeWidth={2.5} />
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
		box-shadow: inset 0 0 0 1.5px #e0dce6;
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
