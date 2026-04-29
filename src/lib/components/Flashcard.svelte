<!--
  Flashcard — A tappable card that cycles through sides (2 or 3).
  Each side shows a label (e.g. "Italiano") and the word text.
-->
<script lang="ts">
	import type { Word } from '$lib/types/word';
	import { cardOrder, randomCardOrder } from '$lib/stores/settings';
	import { shuffle } from '$lib/utils/shuffle';

	interface CardSide {
		label: string;
		text: string;
		japanese: boolean;
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

	// Build sides based on stored order (or shuffle), filtering out empty fields
	let sides = $derived.by(() => {
		const wordValues: Record<string, string> = {
			italiano: word.italiano,
			hiragana: word.hiragana,
			katakana: word.katakana,
			romaji:   word.romaji,
			kanji:    word.kanji,
		};
		const order = $randomCardOrder ? shuffle($cardOrder) : $cardOrder;
		return order
			.filter(key => wordValues[key])
			.map(key => ({
				label: SIDE_DEFS[key].label,
				text: wordValues[key],
				japanese: SIDE_DEFS[key].japanese,
			}));
	});

	let currentSide = $state(0);
	let animating = $state(false);
	let direction = $state<'in' | 'out'>('in');

	// Reset side when word changes
	$effect(() => {
		// Access word.id to trigger effect
		void word.id;
		currentSide = 0;
		animating = false;
		direction = 'in';
	});

	function flip() {
		if (animating) return;
		animating = true;

		// Quick fade out
		animating = true;
		
		setTimeout(() => {
			currentSide = (currentSide + 1) % sides.length;
			
			// Quick fade in
			setTimeout(() => {
				animating = false;
			}, 50);
		}, 50);
	}

	let activeSide = $derived(sides[currentSide]);
	let sideIndicator = $derived(`${currentSide + 1} / ${sides.length}`);
</script>

<button type="button" class="card" class:fade-out={animating} onclick={flip}>
	<span class="card-indicator">{sideIndicator}</span>
	<div class="card-top">
		<span class="card-label">{activeSide.label}</span>
		<span class="card-category" data-category={word.category}>{word.category}</span>
	</div>
	<div class="card-center">
		<span class="card-text" class:font-jp={activeSide.japanese}>{activeSide.text}</span>
	</div>
	<span class="card-hint">Tocca per continuare</span>
</button>

<style>
	.card {
		width: 100%;
		flex: 1;
		min-height: 0;
		max-height: 520px;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1.75rem 1.5rem;
		background: var(--color-surface);
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

	.card-label {
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-text-tertiary);
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
	}

	.card-text {
		font-size: 3rem;
		font-weight: 700;
		color: var(--color-text);
		text-align: center;
		line-height: 1.3;
		word-break: break-word;
	}

	.card-text.font-jp {
		font-family: var(--font-jp);
	}

	.card-hint {
		font-size: 0.7rem;
		color: var(--color-text-tertiary);
	}
</style>
