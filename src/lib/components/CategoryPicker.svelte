<!--
  CategoryPicker — Multi-select tag picker: preset grammar categories + custom user tags.
  Usage: <CategoryPicker bind:selectedTags={selectedTags} />
-->
<script lang="ts">
	import { CATEGORIES } from '$lib/types/word';
	import { userTags, addUserTag, removeUserTag } from '$lib/stores/userTags';
	import Icon from '$lib/components/Icon.svelte';

	interface Props {
		selectedTags: string[];
	}

	let { selectedTags = $bindable() }: Props = $props();

	const entries = Object.entries(CATEGORIES) as [string, readonly string[]][];

	function toggle(tag: string) {
		if (selectedTags.includes(tag)) {
			selectedTags = selectedTags.filter(t => t !== tag);
		} else {
			selectedTags = [...selectedTags, tag];
		}
	}

	let newTagInput = $state('');
	let inputEl: HTMLInputElement | undefined = $state();

	function handleAddTag(e?: Event) {
		e?.preventDefault();
		const tag = newTagInput.trim();
		if (!tag) return;
		addUserTag(tag);
		if (!selectedTags.includes(tag)) {
			selectedTags = [...selectedTags, tag];
		}
		newTagInput = '';
		inputEl?.focus();
	}

	function handleRemoveUserTag(tag: string) {
		removeUserTag(tag);
		selectedTags = selectedTags.filter(t => t !== tag);
	}
</script>

<div class="category-section">
	<span class="category-title">Etichette</span>

	{#each entries as [groupName, options]}
		<div class="category-group">
			<span class="group-label">{groupName}</span>
			<div class="chip-row">
				{#each options as option}
					<button
						type="button"
						class="chip"
						class:active={selectedTags.includes(option)}
						data-category={selectedTags.includes(option) ? option : undefined}
						onclick={() => toggle(option)}
					>
						{option}
					</button>
				{/each}
			</div>
		</div>
	{/each}

	{#if $userTags.length > 0}
		<div class="category-group">
			<span class="group-label">PERSONALIZZATE</span>
			<div class="chip-row">
				{#each $userTags as tag}
					<div class="chip-wrapper">
						<button
							type="button"
							class="chip"
							class:active={selectedTags.includes(tag)}
							onclick={() => toggle(tag)}
						>
							{tag}
						</button>
						<button
							type="button"
							class="chip-delete"
							onclick={() => handleRemoveUserTag(tag)}
							aria-label="Rimuovi etichetta {tag}"
						>
							<Icon name="close" size={10} strokeWidth={3} />
						</button>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<div class="add-tag-row">
		<input
			bind:this={inputEl}
			type="text"
			class="tag-input"
			placeholder="Nuova etichetta..."
			bind:value={newTagInput}
			onkeydown={(e) => e.key === 'Enter' && handleAddTag(e)}
			maxlength={40}
		/>
		<button type="button" class="add-tag-btn" onclick={handleAddTag} disabled={!newTagInput.trim()}>
			<Icon name="plus" size={16} strokeWidth={2.5} />
		</button>
	</div>
</div>

<style>
	.category-section {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}

	.category-title {
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.category-group {
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
	}

	.group-label {
		font-size: 0.68rem;
		font-weight: 700;
		color: var(--color-text-tertiary);
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.chip-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.chip-wrapper {
		position: relative;
		display: inline-flex;
	}

	.chip {
		padding: 0.45rem 0.75rem;
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-full);
		background: var(--color-bg);
		color: var(--color-text);
		font-size: 0.82rem;
		font-weight: 500;
		font-family: var(--font-sans);
		cursor: pointer;
		white-space: nowrap;
	}

	.chip.active {
		background-color: var(--color-primary);
		border-color: var(--color-primary);
		color: white;
	}

	.chip-delete {
		position: absolute;
		top: -6px;
		right: -6px;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--color-text-secondary);
		color: white;
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		padding: 0;
		opacity: 0;
		transition: opacity 0.15s ease;
	}

	.chip-wrapper:hover .chip-delete {
		opacity: 1;
	}

	/* always show on touch devices */
	@media (hover: none) {
		.chip-delete {
			opacity: 1;
		}
	}

	.add-tag-row {
		display: flex;
		gap: 0.4rem;
		align-items: center;
	}

	.tag-input {
		flex: 1;
		padding: 0.55rem 0.85rem;
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-full);
		background: var(--color-bg);
		font-size: 0.82rem;
		font-family: var(--font-sans);
		color: var(--color-text);
		outline: none;
	}

	.tag-input:focus {
		border-color: var(--color-primary);
	}

	.add-tag-btn {
		width: 34px;
		height: 34px;
		border-radius: 50%;
		border: none;
		background: var(--color-primary);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		flex-shrink: 0;
		transition: opacity 0.15s ease;
	}

	.add-tag-btn:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}
</style>
