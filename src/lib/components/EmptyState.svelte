<script lang="ts">
	interface Props {
		icon?: string;
		title: string;
		subtitle?: string;
		ctaHref?: string;
		ctaLabel?: string;
		ctaOnClick?: () => void;
	}

	let { icon, title, subtitle, ctaHref, ctaLabel, ctaOnClick }: Props = $props();
</script>

<div class="empty-state">
	{#if icon}
		<span class="empty-icon">{icon}</span>
	{/if}
	<p class="empty-text">{title}</p>
	{#if subtitle}
		<p class="empty-sub">{subtitle}</p>
	{/if}
	{#if ctaLabel && ctaHref}
		<a href={ctaHref} class="empty-btn">{ctaLabel}</a>
	{:else if ctaLabel && ctaOnClick}
		<button type="button" class="empty-btn" onclick={ctaOnClick}>{ctaLabel}</button>
	{/if}
</div>

<style>
	.empty-state {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: 0.5rem;
		padding: 3rem 1rem;
	}

	.empty-icon {
		font-size: 3rem;
		margin-bottom: 0.5rem;
	}

	.empty-text {
		font-size: 1.1rem;
		font-weight: 600;
		margin: 0;
	}

	.empty-sub {
		font-size: 0.85rem;
		color: var(--color-text-secondary);
		margin: 0 0 1rem 0;
	}

	.empty-btn {
		padding: 0.7rem 1.5rem;
		background: var(--color-primary);
		color: white;
		border-radius: var(--radius-lg);
		font-size: 0.9rem;
		font-weight: 600;
		text-decoration: none;
		font-family: var(--font-sans);
		border: none;
		cursor: pointer;
	}
</style>
