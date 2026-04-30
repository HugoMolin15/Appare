<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Word } from '$lib/types/word';
	import { wordScores } from '$lib/stores/wordScores';

	const SCORE_COLORS: Record<string, string> = {
		none: 'var(--color-border)',
		unknown: '#C5221F',
		learning: '#D97706',
		known: '#1D6FA4',
	};

	interface Props {
		word: Word;
		href?: string;
		onclick?: (e: MouseEvent) => void;
		selectable?: boolean;
		role?: string;
		ariaChecked?: boolean;
		leading?: Snippet;
		trailing?: Snippet;
	}

	let {
		word,
		href,
		onclick,
		selectable = false,
		role,
		ariaChecked,
		leading,
		trailing
	}: Props = $props();

	const jp = $derived(word.hiragana || word.katakana || word.romaji || word.kanji);
	const scoreColor = $derived(SCORE_COLORS[$wordScores[word.id] ?? 'none']);
</script>

{#if href}
	<a {href} class="word-row" class:selectable {onclick}>
		{#if leading}{@render leading()}{/if}
		<div class="word-main">
			<span class="word-it">{word.italiano}</span>
			<span class="word-jp font-jp">{jp}</span>
		</div>
		<div class="word-trailing">
			<span class="word-score-dot" style="background:{scoreColor}"></span>
			{#if word.tags && word.tags.length > 0}
				<div class="word-tags">
					<span class="word-cat" data-category={word.tags[0]}>{word.tags[0]}</span>
					{#if word.tags.length > 1}<span class="word-tag-more">+{word.tags.length - 1}</span>{/if}
				</div>
			{:else if word.category}
				<span class="word-cat" data-category={word.category}>{word.category}</span>
			{/if}
			{#if trailing}{@render trailing()}{/if}
		</div>
	</a>
{:else}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_interactive_supports_focus -->
	<div
		class="word-row"
		class:selectable
		{role}
		aria-checked={ariaChecked}
		{onclick}
	>
		{#if leading}{@render leading()}{/if}
		<div class="word-main">
			<span class="word-it">{word.italiano}</span>
			<span class="word-jp font-jp">{jp}</span>
		</div>
		<div class="word-trailing">
			<span class="word-score-dot" style="background:{scoreColor}"></span>
			{#if word.tags && word.tags.length > 0}
				<div class="word-tags">
					<span class="word-cat" data-category={word.tags[0]}>{word.tags[0]}</span>
					{#if word.tags.length > 1}<span class="word-tag-more">+{word.tags.length - 1}</span>{/if}
				</div>
			{:else if word.category}
				<span class="word-cat" data-category={word.category}>{word.category}</span>
			{/if}
			{#if trailing}{@render trailing()}{/if}
		</div>
	</div>
{/if}

<style>
	.word-row {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 0;
		border-bottom: 1px solid var(--color-border);
		text-decoration: none;
		color: inherit;
	}

	.word-row:last-child { border-bottom: none; }

	.word-row.selectable {
		cursor: pointer;
		user-select: none;
	}

	.word-main {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex-grow: 1;
		min-width: 0;
	}

	.word-it {
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.word-jp {
		font-size: 0.85rem;
		color: var(--color-text-secondary);
	}

	.word-trailing {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.word-score-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.word-tags {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		flex-shrink: 0;
	}

	.word-cat {
		font-size: 0.65rem;
		font-weight: 700;
		padding: 0.35rem 0.6rem;
		border-radius: var(--radius-md);
		background: var(--color-surface);
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		white-space: nowrap;
	}

	.word-tag-more {
		font-size: 0.65rem;
		font-weight: 700;
		color: var(--color-text-tertiary);
		white-space: nowrap;
	}
</style>
