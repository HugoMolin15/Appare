<script lang="ts">
	import { onMount } from 'svelte';
	import { ArrowUp } from 'phosphor-svelte';

	let visible = $state(false);
	let container: Element | null = null;

	onMount(() => {
		container = document.querySelector('.main-content');
		if (!container) return;

		function onScroll() {
			visible = (container?.scrollTop ?? 0) > 300;
		}

		container.addEventListener('scroll', onScroll, { passive: true });
		return () => container?.removeEventListener('scroll', onScroll);
	});

	function scrollToTop() {
		container?.scrollTo({ top: 0, behavior: 'smooth' });
	}
</script>

{#if visible}
	<button class="back-to-top" onclick={scrollToTop} aria-label="Torna su">
		<ArrowUp size={20} weight="bold" />
	</button>
{/if}

<style>
	.back-to-top {
		position: fixed;
		bottom: calc(var(--bottom-nav-height) + 0.75rem);
		right: 1.25rem;
		width: 44px;
		height: 44px;
		border-radius: 50% !important;
		background: var(--color-text);
		color: white;
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		z-index: 40;
		animation: var(--animate-scale-in);
	}
</style>
