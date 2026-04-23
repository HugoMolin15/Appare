<script lang="ts">
	import { goto } from '$app/navigation';
	import { addFolder } from '$lib/stores/folders';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import ClearableInput from '$lib/components/ClearableInput.svelte';
	import { FOLDER_COLORS } from '$lib/constants';

	let name = $state('');
	let selectedColor = $state('#8B1A1A');

	const colors = FOLDER_COLORS;

	let isValid = $derived(name.trim().length > 0);

	function handleSave() {
		if (!isValid) return;
		addFolder(name.trim(), selectedColor);
		goto('/cartelle');
	}
</script>

<svelte:head>
	<title>Appare — Nuova cartella</title>
</svelte:head>

<div class="page page-enter">
	<PageHeader title="Nuova cartella" />

	<div class="fields">
		<div class="field">
			<label for="input-name" class="field-label">Nome cartella</label>
			<ClearableInput bind:value={name} placeholder="es. Viaggi, Cibo..." id="input-name" />
		</div>

		<div class="field">
			<label class="field-label">Colore cartella</label>
			<div class="color-grid">
				{#each colors as color}
					<button 
						type="button" 
						class="color-option" 
						style="background-color: {color}"
						class:selected={selectedColor === color}
						onclick={() => selectedColor = color}
						aria-label="Seleziona colore {color}"
					>
						{#if selectedColor === color}
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
								<polyline points="20 6 9 17 4 12" />
							</svg>
						{/if}
					</button>
				{/each}
			</div>
		</div>
	</div>

	<div class="save-area">
		<button
			type="button"
			class="save-btn"
			class:ready={isValid}
			disabled={!isValid}
			onclick={handleSave}
		>
			{#if isValid}
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="20 6 9 17 4 12" />
				</svg>
			{/if}
			Salva cartella
		</button>
	</div>
</div>

<style>
	.page {
		padding: var(--spacing-page);
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		gap: 0;
		padding-bottom: 2rem;
	}

	.fields {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		margin-bottom: 2rem;
		margin-top: 1rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.field-label {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.color-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1rem;
	}

	.color-option {
		aspect-ratio: 1;
		border-radius: var(--radius-lg);
		border: 3px solid transparent;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.2s ease, border-color 0.2s ease;
		padding: 0;
	}

	.color-option.selected {
		border-color: var(--color-border);
		transform: scale(1.05);
	}

	.save-area {
		margin-top: auto;
		padding-top: 1rem;
	}

	.save-btn {
		width: 100%;
		padding: 1rem;
		background-color: var(--color-border);
		color: var(--color-text-tertiary);
		border: none;
		border-radius: var(--radius-lg);
		font-size: 1rem;
		font-weight: 700;
		font-family: var(--font-sans);
		cursor: not-allowed;
		transition: all 0.25s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.save-btn.ready {
		background-color: var(--color-primary);
		color: white;
		cursor: pointer;
	}

	.save-btn.ready:hover {
		background-color: var(--color-primary-light);
	}

	.save-btn.ready:active {
		background-color: var(--color-primary-dark);
		transform: scale(0.98);
	}
</style>
