<script lang="ts">
	import { fade, scale } from 'svelte/transition';

	interface Props {
		title: string;
		message: string;
		confirmLabel?: string;
		cancelLabel?: string;
		isDanger?: boolean;
		onConfirm: () => void;
		onCancel: () => void;
	}

	let { 
		title, 
		message, 
		confirmLabel = 'Conferma', 
		cancelLabel = 'Annulla', 
		isDanger = false,
		onConfirm, 
		onCancel 
	}: Props = $props();
</script>

<!-- Backdrop -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="backdrop" transition:fade={{ duration: 150 }} onclick={onCancel}></div>

<!-- Modal -->
<div class="modal-wrapper">
	<div class="modal" transition:scale={{ duration: 200, start: 0.9 }}>
		<h2 class="modal-title">{title}</h2>
		<p class="modal-message">{message}</p>
		
		<div class="modal-actions">
			<button class="btn btn-cancel" onclick={onCancel}>
				{cancelLabel}
			</button>
			<button 
				class="btn btn-confirm" 
				class:danger={isDanger}
				onclick={onConfirm}
			>
				{confirmLabel}
			</button>
		</div>
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
		backdrop-filter: blur(4px);
		z-index: 1000;
	}

	.modal-wrapper {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		z-index: 1001;
		pointer-events: none;
	}

	.modal {
		background-color: var(--color-bg);
		width: 100%;
		max-width: 320px;
		border-radius: var(--radius-xl);
		padding: 1.75rem;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
		pointer-events: auto;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.modal-title {
		font-size: 1.2rem;
		font-weight: 800;
		margin: 0;
		color: var(--color-text-primary);
	}

	.modal-message {
		font-size: 0.95rem;
		line-height: 1.5;
		color: var(--color-text-secondary);
		margin: 0 0 0.5rem 0;
	}

	.modal-actions {
		display: flex;
		gap: 0.75rem;
	}

	.btn {
		flex: 1;
		padding: 0.8rem;
		border-radius: var(--radius-lg);
		font-size: 0.95rem;
		font-weight: 700;
		cursor: pointer;
		border: none;
		transition: all 0.2s ease;
	}

	.btn-cancel {
		background-color: var(--color-surface);
		color: var(--color-text-secondary);
	}

	.btn-confirm {
		background-color: var(--color-text-primary);
		color: white;
	}

	.btn-confirm.danger {
		background-color: var(--color-primary);
	}

	.btn:active {
		transform: scale(0.96);
	}
</style>
