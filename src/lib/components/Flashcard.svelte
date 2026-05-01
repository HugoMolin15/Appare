<!--
  Flashcard — A tappable card that cycles through user-defined cards.
  Each card can show one or more fields stacked vertically.
-->
<script lang="ts">
	import type { Word } from '$lib/types/word';
	import { cardLayout, randomCardOrder } from '$lib/stores/settings';
	import { shuffle } from '$lib/utils/shuffle';

	interface FieldSide {
		label: string;
		text: string;
		japanese: boolean;
	}

	interface CardSide {
		fields: FieldSide[];
	}

	interface Props {
		word: Word;
	}

	let { word }: Props = $props();

	const SIDE_DEFS: Record<string, { label: string; japanese: boolean }> = {
		italiano: { label: 'Italiano', japanese: false },
		hiragana: { label: 'Hiragana', japanese: true },
		katakana: { label: 'Katakana', japanese: true },
		romaji:   { label: 'Romaji',   japanese: false },
		kanji:    { label: 'Kanji',    japanese: true },
	};

	// Build cards: each entry in cardLayout becomes one card side.
	// Fields within a card are filtered to non-empty values.
	// Cards where ALL fields are empty are skipped.
	let sides = $derived.by((): CardSide[] => {
		const vals: Record<string, string> = {
			italiano: word.italiano,
			hiragana: word.hiragana,
			katakana: word.katakana,
			romaji:   word.romaji,
			kanji:    word.kanji,
		};
		const layout = $randomCardOrder ? shuffle([...$cardLayout]) : $cardLayout;
		return layout
			.map(card => ({
				fields: card.fields
					.filter(k => vals[k])
					.map(k => ({
						label: SIDE_DEFS[k].label,
						text: vals[k],
						japanese: SIDE_DEFS[k].japanese,
					}))
			}))
			.filter(card => card.fields.length > 0);
	});

	let currentSide = $state(0);
	let animating = $state(false);

	// Reset side when word changes
	$effect(() => {
		void word.id;
		currentSide = 0;
		animating = false;
	});

	function flip() {
		if (animating || sides.length <= 1) return;
		animating = true;
		setTimeout(() => {
			currentSide = (currentSide + 1) % sides.length;
			setTimeout(() => { animating = false; }, 50);
		}, 50);
	}

	let activeSide = $derived(sides[currentSide] ?? { fields: [] });
	let sideIndicator = $derived(sides.length > 1 ? `${currentSide + 1} / ${sides.length}` : '');
	// Scale down text when multiple fields share a card
	let textSize = $derived(activeSide.fields.length > 1 ? '1.85rem' : '3rem');
</script>

<button type="button" class="card" class:fade-out={animating} onclick={flip}>
	{#if sideIndicator}
		<span class="card-indicator">{sideIndicator}</span>
	{/if}

	<div class="card-top">
		<span class="card-category" data-category={word.category}>{word.category}</span>
	</div>

	<div class="card-center">
		<div class="card-fields">
			{#each activeSide.fields as field}
				<div class="card-field">
					<span class="card-label">{field.label}</span>
					<span class="card-text" class:font-jp={field.japanese} style="font-size: {textSize}">
						{field.text}
					</span>
				</div>
			{/each}
		</div>
	</div>

	{#if sides.length > 1}
		<span class="card-hint">Tocca per continuare</span>
	{/if}
</button>

<style>
	.card {
		width: 100%;
		flex: 1;
		min-height: 0;
		max-height: 460px;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1.5rem 1.5rem 1.25rem;
		background: transparent;
		border: none;
		border-radius: var(--radius-xl);
		cursor: pointer;
		position: relative;
		transition: opacity 0.1s ease;
		font-family: var(--font-sans);
		box-sizing: border-box;
	}

	.card.fade-out {
		opacity: 0;
	}

	.card-indicator {
		position: absolute;
		top: 1rem;
		right: 1.25rem;
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--color-text-tertiary);
	}

	.card-top {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.35rem;
		padding-top: 0.25rem;
	}

	.card-category {
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.2rem 0.55rem;
		background: var(--color-bg);
		color: var(--color-text-secondary);
		border-radius: var(--radius-full);
	}

	.card-center {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		overflow: hidden;
	}

	/* Stack multiple fields vertically with a divider */
	.card-fields {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
	}

	.card-field {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		width: 100%;
	}

	/* Divider between consecutive fields */
	.card-field + .card-field {
		padding-top: 0.75rem;
		border-top: 1px solid var(--color-border);
	}

	.card-label {
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-text-tertiary);
	}

	.card-text {
		font-weight: 700;
		color: var(--color-text);
		text-align: center;
		line-height: 1.3;
		word-break: break-word;
		transition: font-size 0.15s ease;
	}

	.card-text.font-jp {
		font-family: var(--font-jp);
	}

	.card-hint {
		font-size: 0.7rem;
		color: var(--color-text-tertiary);
		margin-top: 0.25rem;
	}
</style>
