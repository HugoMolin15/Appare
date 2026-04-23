<script lang="ts">
	import { addFolder } from '$lib/stores/folders';
	import ClearableInput from '$lib/components/ClearableInput.svelte';
	import { fade, fly } from 'svelte/transition';
	import { FOLDER_COLORS } from '$lib/constants';

	interface Props {
		parentId?: string;
		onClose: () => void;
	}

	let { parentId, onClose }: Props = $props();

	let name = $state('');
	let selectedColor = $state('#8B1A1A');

	const colors = FOLDER_COLORS;

	let isValid = $derived(name.trim().length > 0);

	function handleSave() {
		if (!isValid) return;
		addFolder(name.trim(), selectedColor, parentId);
		onClose();
	}
</script>

<!-- Backdrop -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="backdrop" transition:fade={{ duration: 200 }} onclick={onClose}></div>

<!-- Bottom Sheet -->
<div class="sheet" transition:fly={{ y: 300, duration: 300 }}>
	<div class="sheet-header">
		<h2 class="sheet-title">Nuova cartella</h2>
		<button class="close-btn" onclick={onClose}>Annulla</button>
	</div>

	<div class="modal-content">
		<div class="field">
			<label for="modal-folder-name" class="field-label">Nome cartella</label>
			<ClearableInput bind:value={name} placeholder="es. Viaggi, Cibo..." id="modal-folder-name" />
		</div>

		<div class="field">
			<label class="field-label">Colore</label>
			<div class="color-grid">
				{#each colors as color}
					<button 
						type="button" 
						class="color-option" 
						style="background-color: {color}"
						class:selected={selectedColor === color}
						onclick={() => selectedColor = color}
					>
						{#if selectedColor === color}
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
								<polyline points="20 6 9 17 4 12" />
							</svg>
						{/if}
					</button>
				{/each}
			</div>
		</div>
	</div>

	<div class="modal-footer">
		<button
			type="button"
			class="save-btn"
			class:ready={isValid}
			disabled={!isValid}
			onclick={handleSave}
		>
			Crea cartella
		</button>
	</div>
</div>

<style>
	.backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(2px);
		z-index: 100;
	}

	.sheet {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: 75dvh;
		background-color: var(--color-bg);
		border-radius: var(--radius-xl) var(--radius-xl) 0 0;
		padding: 1.75rem;
		padding-bottom: calc(1rem + env(safe-area-inset-bottom));
		z-index: 101;
		box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.2);
		display: flex;
		flex-direction: column;
	}

	.sheet-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		flex-shrink: 0;
	}

	.sheet-title {
		font-size: 1.35rem;
		font-weight: 800;
		color: var(--color-text-primary);
		margin: 0;
	}

	.close-btn {
		background: none;
		border: none;
		color: var(--color-text-secondary);
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
	}

	.modal-content {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 1.75rem;
		padding-bottom: 1rem;
		/* Hide scrollbar but keep functionality */
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	.modal-content::-webkit-scrollbar {
		display: none;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.field-label {
		font-size: 0.82rem;
		font-weight: 700;
		color: var(--color-text-tertiary);
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
		padding: 0;
		transition: border-color 0.2s ease;
	}

	.color-option.selected {
		border-color: var(--color-text-primary);
	}

	.modal-footer {
		flex-shrink: 0;
		padding-top: 1rem;
		background-color: var(--color-bg);
	}

	.save-btn {
		width: 100%;
		padding: 1.1rem;
		background-color: var(--color-border);
		color: var(--color-text-tertiary);
		border: none;
		border-radius: var(--radius-xl);
		font-size: 1.05rem;
		font-weight: 700;
		cursor: not-allowed;
		transition: all 0.2s ease;
	}

	.save-btn.ready {
		background-color: var(--color-primary);
		color: white;
		cursor: pointer;
		box-shadow: 0 4px 12px rgba(139, 26, 26, 0.2);
	}

	.save-btn.ready:active {
		transform: scale(0.98);
	}
</style>
