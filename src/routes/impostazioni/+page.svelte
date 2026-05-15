<script lang="ts">
	import { studyGoal, appFontScale, cardLayout, randomCardOrder, randomWordOrder, fontSizeItaliano, fontSizeHiragana, fontSizeRomaji, fontSizeKanji, fontSizeNotes } from '$lib/stores/settings';
	import type { CardField, Word } from '$lib/types/word';
	import { manualWordCount } from '$lib/stores/words';
	import { currentUser, signOut } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Flashcard from '$lib/components/Flashcard.svelte';
	import { Shuffle, DotsSixVertical, X, Plus, BookOpen, Globe } from 'phosphor-svelte';
	import { shuffle } from '$lib/utils/shuffle';

	// Sample words shown in the random-order visual diagrams.
	const exampleWords = [
		{ it: 'grande', hi: 'おおきい', ro: 'ōkii', ka: '大きい' },
		{ it: 'mangiare', hi: 'たべる', ro: 'taberu', ka: '食べる' },
		{ it: 'scuola', hi: 'がっこう', ro: 'gakkō', ka: '学校' },
	] as const;
	type FormKey = 'it' | 'hi' | 'ro' | 'ka';
	const FORM_KEYS: FormKey[] = ['it', 'hi', 'ro', 'ka'];

	// Re-shuffled every time the corresponding toggle flips.
	let wordOrderIdx = $derived<number[]>($randomWordOrder ? shuffle([0, 1, 2]) : [0, 1, 2]);
	let cardFormOrders = $derived<FormKey[][]>(
		$randomCardOrder
			? [0, 1, 2].map(() => shuffle([...FORM_KEYS]))
			: [0, 1, 2].map(() => [...FORM_KEYS])
	);

	const previewWord: Word = {
		id: 'preview',
		italiano: 'grande',
		hiragana: 'おおきい',
		katakana: 'オオキイ',
		romaji: 'ōkii',
		kanji: '大きい',
		notes: 'Nota di esempio',
		category: 'Aggettivo I',
		wordType: 'word',
		createdAt: 0,
	};

	async function handleSignOut() {
		await signOut();
	}

	// Slider progress percentage (80–130 range)
	let sliderProgress = $derived(Math.round((($appFontScale - 80) / (130 - 80)) * 100));

	function handleSliderInput(e: Event) {
		const target = e.target as HTMLInputElement;
		appFontScale.set(Number(target.value));
	}

	// Per-field flashcard font sliders (0.5–5 rem range)
	const FS_MIN = 0.5, FS_MAX = 5;
	function fsProgress(v: number) { return Math.round(((v - FS_MIN) / (FS_MAX - FS_MIN)) * 100); }
	let fsProgressIt  = $derived(fsProgress($fontSizeItaliano));
	let fsProgressHi  = $derived(fsProgress($fontSizeHiragana));
	let fsProgressRo  = $derived(fsProgress($fontSizeRomaji));
	let fsProgressKa  = $derived(fsProgress($fontSizeKanji));
	let fsProgressNo  = $derived(fsProgress($fontSizeNotes));

	function handleFsInput(store: { set: (v: number) => void }, e: Event) {
		store.set(Number((e.target as HTMLInputElement).value));
	}

	const FS_DEFAULTS = { italiano: 3.0, hiragana: 3.0, romaji: 2.5, kanji: 3.0, notes: 1.2 };

	function handleGoalInput(e: Event) {
		const target = e.target as HTMLInputElement;
		let value = Number(target.value);
		if (value < 1) value = 1;
		if (value > 100) value = 100;
		studyGoal.set(value);
	}

	const SINGLE_FIELDS: CardField[] = ['italiano', 'romaji', 'kanji', 'notes'];
	const FIELD_LABELS: Record<CardField, string> = {
		italiano: 'Italiano',
		hiragana: 'Hiragana',
		katakana: 'Katakana',
		romaji: 'Romaji',
		kanji: 'Kanji',
		notes: 'Note',
	};

	// ---- Drag state (shared by mouse HTML5 drag and touch pointer drag) ----
	let draggingIdx: number | null = $state(null);
	let dropTargetIdx: number | null = $state(null);

	// ---- HTML5 drag (mouse / desktop) ----
	function onDragStart(e: DragEvent, ci: number) {
		draggingIdx = ci;
		if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
	}

	function onDragOver(e: DragEvent, ci: number) {
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
		dropTargetIdx = ci;
	}

	function onDrop(e: DragEvent, ci: number) {
		e.preventDefault();
		if (draggingIdx === null || draggingIdx === ci) { draggingIdx = null; dropTargetIdx = null; return; }
		const from = draggingIdx;
		cardLayout.update(l => {
			const next = [...l];
			const [item] = next.splice(from, 1);
			next.splice(ci, 0, item);
			return next;
		});
		draggingIdx = null;
		dropTargetIdx = null;
	}

	function onDragEnd() {
		draggingIdx = null;
		dropTargetIdx = null;
	}

	// ---- Touch / pointer drag (iOS + Android) ----
	let touchDragClone: HTMLElement | null = null;
	let touchDragOffsetY = 0;

	function onHandlePointerDown(e: PointerEvent, ci: number) {
		if (e.pointerType === 'mouse') return; // mouse handled by HTML5 drag above
		e.preventDefault();
		const handle = e.currentTarget as HTMLElement;
		const card = handle.closest('.builder-card') as HTMLElement;
		if (!card) return;

		const rect = card.getBoundingClientRect();
		touchDragOffsetY = e.clientY - rect.top;

		touchDragClone = card.cloneNode(true) as HTMLElement;
		Object.assign(touchDragClone.style, {
			position: 'fixed',
			width: rect.width + 'px',
			left: rect.left + 'px',
			top: (e.clientY - touchDragOffsetY) + 'px',
			margin: '0',
			opacity: '0.9',
			pointerEvents: 'none',
			zIndex: '9999',
			boxShadow: '0 8px 28px rgba(0,0,0,0.22)',
			transform: 'scale(1.02)',
			borderRadius: '12px',
			transition: 'none',
		});
		document.body.appendChild(touchDragClone);

		handle.setPointerCapture(e.pointerId);
		draggingIdx = ci;
	}

	function onHandlePointerMove(e: PointerEvent, ci: number) {
		if (draggingIdx !== ci || !touchDragClone) return;
		e.preventDefault();

		touchDragClone.style.top = (e.clientY - touchDragOffsetY) + 'px';

		// Find which card's centre is closest to the pointer
		const cards = document.querySelectorAll<HTMLElement>('.builder-card');
		let closest = ci;
		let minDist = Infinity;
		cards.forEach((cardEl, i) => {
			if (i === ci) return;
			const r = cardEl.getBoundingClientRect();
			const dist = Math.abs(e.clientY - (r.top + r.height / 2));
			if (dist < minDist) { minDist = dist; closest = i; }
		});
		dropTargetIdx = closest;
	}

	function onHandlePointerUp(e: PointerEvent, ci: number) {
		if (draggingIdx !== null && dropTargetIdx !== null && draggingIdx !== dropTargetIdx) {
			const from = draggingIdx;
			const to = dropTargetIdx;
			cardLayout.update(l => {
				const next = [...l];
				const [item] = next.splice(from, 1);
				next.splice(to, 0, item);
				return next;
			});
		}
		cleanupTouchDrag();
	}

	function cleanupTouchDrag() {
		touchDragClone?.remove();
		touchDragClone = null;
		draggingIdx = null;
		dropTargetIdx = null;
	}

	// ---- Card layout helpers ----
	function addCard() {
		cardLayout.update(l => [...l, { fields: [] }]);
	}

	function removeCard(i: number) {
		cardLayout.update(l => {
			if (l.length <= 1) return l;
			return l.filter((_, idx) => idx !== i);
		});
	}

	function addFieldToCard(cardIdx: number, field: CardField) {
		cardLayout.update(l => {
			const next = l.map((c, i) =>
				i === cardIdx ? { fields: [...c.fields, field] } : c
			);
			return next;
		});
	}

	function addKanaToCard(cardIdx: number) {
		cardLayout.update(l => l.map((c, i) => {
			if (i !== cardIdx) return c;
			const fields = [...c.fields];
			if (!fields.includes('hiragana')) fields.push('hiragana');
			if (!fields.includes('katakana')) fields.push('katakana');
			return { fields };
		}));
	}

	function removeFieldFromCard(cardIdx: number, fieldIdx: number) {
		cardLayout.update(l => {
			const card = l[cardIdx];
			const newFields = card.fields.filter((_, i) => i !== fieldIdx);
			if (newFields.length === 0) {
				if (l.length <= 1) return l;
				return l.filter((_, i) => i !== cardIdx);
			}
			return l.map((c, i) => i === cardIdx ? { fields: newFields } : c);
		});
	}

	function removeKanaFromCard(cardIdx: number) {
		cardLayout.update(l => {
			const newFields = l[cardIdx].fields.filter(f => f !== 'hiragana' && f !== 'katakana');
			if (newFields.length === 0) {
				if (l.length <= 1) return l;
				return l.filter((_, i) => i !== cardIdx);
			}
			return l.map((c, i) => i === cardIdx ? { fields: newFields } : c);
		});
	}
</script>

<svelte:head>
	<title>Anki-jin — Impostazioni</title>
</svelte:head>

<div class="page page-enter">
	<PageHeader title="Impostazioni" hideBack />

	<!-- Account / Login -->
	{#if $currentUser}
		<div class="account-row">
			<div class="account-info">
				<span class="account-label">Account</span>
				<span class="account-email">{$currentUser.email ?? ''}</span>
			</div>
			<button class="signout-btn" onclick={handleSignOut}>Esci</button>
		</div>
	{:else}
		<div class="login-cta">
			<div class="login-cta-text">
				<span class="login-cta-title">Salva i tuoi progressi</span>
				<span class="login-cta-sub">Crea un account per sincronizzare i dati su tutti i tuoi dispositivi.</span>
			</div>
			<a href="/login" class="login-cta-btn">Accedi / Registrati</a>
		</div>
	{/if}

	<!-- Divider -->
	<div class="divider"></div>

	<!-- Card Layout Section -->
	<section class="section">
		<h2 class="section-heading">Struttura flashcard</h2>
		<p class="section-subtitle">Definisci le carte che appaiono durante lo studio. Ogni carta può mostrare uno o più campi.</p>

		<!-- Random word order toggle -->
		<div class="order-toggle" onclick={() => randomWordOrder.set(!$randomWordOrder)} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && randomWordOrder.set(!$randomWordOrder)}>
			<div class="order-toggle-left">
				<Shuffle size={18} weight="bold" />
				<span class="order-toggle-label">Ordine casuale delle parole</span>
			</div>
			<div class="toggle-switch" class:on={$randomWordOrder}>
				<div class="toggle-thumb"></div>
			</div>
		</div>
		<div class="order-visual">
			{#each wordOrderIdx as wi}
				<div class="vp-column">
					<div class="vp-header">{exampleWords[wi].it}</div>
					{#each FORM_KEYS as form}
						<div class="vp-card" class:vp-card-jp={form === 'hi' || form === 'ka'}>{exampleWords[wi][form]}</div>
					{/each}
				</div>
			{/each}
		</div>

		<!-- Random card order toggle -->
		<div class="order-toggle" onclick={() => randomCardOrder.set(!$randomCardOrder)} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && randomCardOrder.set(!$randomCardOrder)}>
			<div class="order-toggle-left">
				<Shuffle size={18} weight="bold" />
				<span class="order-toggle-label">Ordine casuale delle carte</span>
			</div>
			<div class="toggle-switch" class:on={$randomCardOrder}>
				<div class="toggle-thumb"></div>
			</div>
		</div>
		<div class="order-visual">
			{#each [0, 1, 2] as wi}
				<div class="vp-column">
					<div class="vp-header">{exampleWords[wi].it}</div>
					{#each cardFormOrders[wi] as form}
						<div class="vp-card" class:vp-card-jp={form === 'hi' || form === 'ka'}>{exampleWords[wi][form]}</div>
					{/each}
				</div>
			{/each}
		</div>

		<!-- Card builder -->
		<div class="card-builder" role="list">
			{#each $cardLayout as card, ci}
				<div
					class="builder-card"
					class:dragging={draggingIdx === ci}
					class:drag-over={dropTargetIdx === ci && draggingIdx !== ci}
					draggable="true"
					role="listitem"
					ondragstart={(e) => onDragStart(e, ci)}
					ondragover={(e) => onDragOver(e, ci)}
					ondrop={(e) => onDrop(e, ci)}
					ondragend={onDragEnd}
				>
					<!-- Card header -->
					<div class="builder-card-header">
						<div class="builder-card-header-left">
							<span
								class="drag-handle"
								aria-label="Trascina per riordinare"
								onpointerdown={(e) => onHandlePointerDown(e, ci)}
								onpointermove={(e) => onHandlePointerMove(e, ci)}
								onpointerup={(e) => onHandlePointerUp(e, ci)}
								onpointercancel={cleanupTouchDrag}
							>
								<DotsSixVertical size={15} weight="bold" />
							</span>
							<span class="builder-card-title">Carta {ci + 1}</span>
						</div>
						{#if $cardLayout.length > 1}
							<button class="remove-card-btn" onclick={() => removeCard(ci)} aria-label="Rimuovi carta">
								<X size={15} weight="bold" />
							</button>
						{/if}
					</div>

					<!-- Fields on this card -->
					{#each card.fields as field, fi}
						{#if field === 'katakana' && card.fields.includes('hiragana')}
							<!-- skip: shown together with hiragana -->
						{:else}
							<div class="builder-field-row">
								<span class="builder-field-dot"></span>
								<span class="builder-field-label">
									{field === 'hiragana' && card.fields.includes('katakana') ? 'Hiragana / Katakana' : FIELD_LABELS[field]}
								</span>
								<button
									class="remove-field-btn"
									onclick={() => {
										if (field === 'hiragana' && card.fields.includes('katakana')) {
											removeKanaFromCard(ci);
										} else {
											removeFieldFromCard(ci, fi);
										}
									}}
									aria-label="Rimuovi campo"
								>
									<X size={14} weight="bold" />
								</button>
							</div>
						{/if}
					{/each}

					<!-- Add field chips -->
					<div class="builder-add-field-row">
						{#each SINGLE_FIELDS as f}
							<button
								class="field-chip"
								class:disabled={card.fields.includes(f)}
								onclick={() => { if (!card.fields.includes(f)) addFieldToCard(ci, f); }}
								disabled={card.fields.includes(f)}
							>
								+ {FIELD_LABELS[f]}
							</button>
						{/each}
						<button
							class="field-chip"
							class:disabled={card.fields.includes('hiragana') && card.fields.includes('katakana')}
							onclick={() => { if (!(card.fields.includes('hiragana') && card.fields.includes('katakana'))) addKanaToCard(ci); }}
							disabled={card.fields.includes('hiragana') && card.fields.includes('katakana')}
						>
							+ Hiragana / Katakana
						</button>
					</div>
				</div>
			{/each}

			<!-- Add card button -->
			<button class="add-card-btn" onclick={addCard}>
				<Plus size={16} weight="bold" />
				Aggiungi carta
			</button>
		</div>
	</section>

	<!-- Divider -->
	<div class="divider"></div>

	<!-- Font Size Section -->
	<section class="section">
		<h2 class="section-heading">Dimensione testo</h2>
		<p class="section-subtitle">Regola la dimensione di tutto il testo nell'app.</p>

		<div class="card-preview-wrap">
			<Flashcard word={previewWord} />
		</div>

		<div class="slider-row">
			<span class="slider-label-sm">A</span>
			<div class="slider-container">
				<input
					type="range"
					min="80"
					max="130"
					step="1"
					value={$appFontScale}
					oninput={handleSliderInput}
					class="font-slider"
					style="--progress: {sliderProgress}%"
				/>
			</div>
			<span class="slider-label-lg">A</span>
		</div>

		{#if $appFontScale !== 100}
			<button class="reset-btn" onclick={() => appFontScale.set(100)}>
				Ripristina dimensione predefinita
			</button>
		{/if}
	</section>

	<!-- Divider -->
	<div class="divider"></div>

	<!-- Per-field flashcard font sizes -->
	<section class="section">
		<h2 class="section-heading">Dimensione testo carte</h2>
		<p class="section-subtitle">Regola la dimensione del testo per ogni campo nelle flashcard.</p>

		<div class="fs-field-list">
			<!-- Italiano -->
			<div class="fs-field-row">
				<span class="fs-field-label">Italiano</span>
				<div class="fs-slider-wrap">
					<span class="slider-label-sm">A</span>
					<div class="slider-container">
						<input type="range" min={FS_MIN} max={FS_MAX} step="0.1"
							value={$fontSizeItaliano}
							oninput={(e) => handleFsInput(fontSizeItaliano, e)}
							class="font-slider"
							style="--progress: {fsProgressIt}%"
						/>
					</div>
					<span class="slider-label-lg">A</span>
					<span class="fs-value">{$fontSizeItaliano.toFixed(1)}</span>
				</div>
				{#if $fontSizeItaliano !== FS_DEFAULTS.italiano}
					<button class="reset-btn" onclick={() => fontSizeItaliano.set(FS_DEFAULTS.italiano)}>Ripristina</button>
				{/if}
			</div>

			<!-- Hiragana / Katakana -->
			<div class="fs-field-row">
				<span class="fs-field-label">Hiragana / Katakana</span>
				<div class="fs-slider-wrap">
					<span class="slider-label-sm font-jp">あ</span>
					<div class="slider-container">
						<input type="range" min={FS_MIN} max={FS_MAX} step="0.1"
							value={$fontSizeHiragana}
							oninput={(e) => handleFsInput(fontSizeHiragana, e)}
							class="font-slider"
							style="--progress: {fsProgressHi}%"
						/>
					</div>
					<span class="slider-label-lg font-jp">あ</span>
					<span class="fs-value">{$fontSizeHiragana.toFixed(1)}</span>
				</div>
				{#if $fontSizeHiragana !== FS_DEFAULTS.hiragana}
					<button class="reset-btn" onclick={() => fontSizeHiragana.set(FS_DEFAULTS.hiragana)}>Ripristina</button>
				{/if}
			</div>

			<!-- Romaji -->
			<div class="fs-field-row">
				<span class="fs-field-label">Romaji</span>
				<div class="fs-slider-wrap">
					<span class="slider-label-sm">A</span>
					<div class="slider-container">
						<input type="range" min={FS_MIN} max={FS_MAX} step="0.1"
							value={$fontSizeRomaji}
							oninput={(e) => handleFsInput(fontSizeRomaji, e)}
							class="font-slider"
							style="--progress: {fsProgressRo}%"
						/>
					</div>
					<span class="slider-label-lg">A</span>
					<span class="fs-value">{$fontSizeRomaji.toFixed(1)}</span>
				</div>
				{#if $fontSizeRomaji !== FS_DEFAULTS.romaji}
					<button class="reset-btn" onclick={() => fontSizeRomaji.set(FS_DEFAULTS.romaji)}>Ripristina</button>
				{/if}
			</div>

			<!-- Kanji -->
			<div class="fs-field-row">
				<span class="fs-field-label">Kanji</span>
				<div class="fs-slider-wrap">
					<span class="slider-label-sm font-jp">字</span>
					<div class="slider-container">
						<input type="range" min={FS_MIN} max={FS_MAX} step="0.1"
							value={$fontSizeKanji}
							oninput={(e) => handleFsInput(fontSizeKanji, e)}
							class="font-slider"
							style="--progress: {fsProgressKa}%"
						/>
					</div>
					<span class="slider-label-lg font-jp">字</span>
					<span class="fs-value">{$fontSizeKanji.toFixed(1)}</span>
				</div>
				{#if $fontSizeKanji !== FS_DEFAULTS.kanji}
					<button class="reset-btn" onclick={() => fontSizeKanji.set(FS_DEFAULTS.kanji)}>Ripristina</button>
				{/if}
			</div>

			<!-- Note -->
			<div class="fs-field-row">
				<span class="fs-field-label">Note</span>
				<div class="fs-slider-wrap">
					<span class="slider-label-sm">A</span>
					<div class="slider-container">
						<input type="range" min={FS_MIN} max={FS_MAX} step="0.1"
							value={$fontSizeNotes}
							oninput={(e) => handleFsInput(fontSizeNotes, e)}
							class="font-slider"
							style="--progress: {fsProgressNo}%"
						/>
					</div>
					<span class="slider-label-lg">A</span>
					<span class="fs-value">{$fontSizeNotes.toFixed(1)}</span>
				</div>
				{#if $fontSizeNotes !== FS_DEFAULTS.notes}
					<button class="reset-btn" onclick={() => fontSizeNotes.set(FS_DEFAULTS.notes)}>Ripristina</button>
				{/if}
			</div>
		</div>
	</section>

	<!-- Divider -->
	<div class="divider"></div>

	<!-- Study Goal Section -->
	<section class="section">
		<h2 class="section-heading">Obiettivo di studio</h2>
		<p class="section-subtitle">Quante parole vuoi imparare ogni giorno? Questo influenzerà i colori della tua heatmap.</p>

		<div class="goal-input-container">
			<input
				type="number"
				class="goal-input"
				value={$studyGoal}
				oninput={handleGoalInput}
				min="1"
				max="100"
			/>
			<span class="goal-unit">parole al giorno</span>
		</div>

		<div class="intensity-legend">
			<div class="legend-item">
				<img src="/heatmap-1.png" alt="0 parole" class="legend-img" />
				<span class="legend-text">0</span>
			</div>
			<div class="legend-item">
				<img src="/heatmap-2.png" alt="basso" class="legend-img" />
				<span class="legend-text">1–{Math.max(1, Math.floor($studyGoal * 0.5) - 1)}</span>
			</div>
			<div class="legend-item">
				<img src="/heatmap-3.png" alt="medio" class="legend-img" />
				<span class="legend-text">{Math.floor($studyGoal * 0.5)}+</span>
			</div>
			<div class="legend-item">
				<img src="/heatmap-4.png" alt="alto" class="legend-img" />
				<span class="legend-text">{Math.floor($studyGoal * 0.75)}+</span>
			</div>
			<div class="legend-item">
				<img src="/heatmap-5.png" alt="obiettivo" class="legend-img" />
				<span class="legend-text">{$studyGoal}+</span>
			</div>
		</div>
	</section>

	<!-- Divider -->
	<div class="divider"></div>

	<!-- Archive Count -->
	<div class="archive-row">
		<div class="archive-left">
			<BookOpen size={22} weight="fill" />
			<span class="archive-label">Parole inserite</span>
		</div>
		<span class="archive-count">{$manualWordCount}</span>
	</div>

	<!-- Website link -->
	<div class="site-link-row">
		<a
			href="https://appareassociazione.wixsite.com/giapponeseperugia"
			target="_blank"
			rel="noopener noreferrer"
			class="site-link"
		>
			<Globe size={15} weight="fill" />
			appareassociazione.wixsite.com
		</a>
	</div>
</div>

<style>
	.page {
		padding: var(--spacing-page);
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
	}

	/* ---- Sections ---- */
	.section {
		margin-bottom: 1.5rem;
	}

	.section-heading {
		font-size: 1.35rem;
		font-weight: 700;
		margin: 0 0 0.35rem 0;
		letter-spacing: -0.015em;
	}

	.section-subtitle {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		margin: 0 0 1.25rem 0;
		line-height: 1.4;
	}

	/* ---- Goal Input ---- */
	.goal-input-container {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background-color: var(--color-surface);
		padding: 1.15rem 1.5rem;
		border-radius: var(--radius-xl);
		border: 1px solid var(--color-border);
		width: 100%;
		box-sizing: border-box;
		margin-bottom: 1.25rem;
	}

	.goal-input {
		width: 80px;
		background: none;
		border: none;
		font-size: 1.75rem;
		font-weight: 700;
		color: #1A1A1A;
		text-align: center;
		padding: 0.25rem;
		outline: none;
	}

	.goal-input::-webkit-inner-spin-button,
	.goal-input::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	.goal-unit {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color-text-secondary);
	}

	/* Intensity Legend */
	.intensity-legend {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.5rem 0.25rem;
	}

	.legend-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
	}

	.legend-img {
		width: 36px;
		height: 36px;
		object-fit: contain;
	}

	.legend-text {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-secondary);
	}

	/* ---- Divider ---- */
	.divider {
		height: 1px;
		background-color: var(--color-border-light);
		margin: 0.5rem 0 1.5rem 0;
	}

	/* ---- Card Preview ---- */
	.card-preview-wrap {
		display: flex;
		flex-direction: column;
		background-color: var(--color-surface);
		border-radius: var(--radius-xl);
		margin-bottom: 1rem;
		min-height: 200px;
	}

	/* ---- Slider ---- */
	.slider-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.slider-label-sm {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		user-select: none;
	}

	.slider-label-lg {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-text-secondary);
		user-select: none;
	}

	.slider-container {
		flex: 1;
	}

	.reset-btn {
		margin-top: 0.75rem;
		background: none;
		border: none;
		padding: 0;
		font-size: 0.82rem;
		font-family: var(--font-sans);
		font-weight: 600;
		color: var(--color-primary);
		cursor: pointer;
		text-align: left;
	}

	.font-slider {
		width: 100%;
		height: 6px;
		-webkit-appearance: none;
		appearance: none;
		background: linear-gradient(
			to right,
			var(--color-primary) 0%,
			var(--color-primary) var(--progress, 50%),
			var(--color-border) var(--progress, 50%),
			var(--color-border) 100%
		);
		border-radius: var(--radius-full);
		outline: none;
		cursor: pointer;
	}

	.font-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		background: var(--color-primary);
		border: 3px solid white;
		cursor: pointer;
		transition: transform 0.1s ease;
	}

	.font-slider::-webkit-slider-thumb:active {
		transform: scale(1.15);
	}

	.font-slider::-moz-range-thumb {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--color-primary);
		border: 3px solid white;
		cursor: pointer;
	}

	/* ---- Per-field font size sliders ---- */
	.fs-field-list {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.fs-field-row {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.fs-field-label {
		font-size: 0.82rem;
		font-weight: 700;
		color: var(--color-text-secondary);
	}

	.fs-slider-wrap {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.fs-value {
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--color-text-tertiary);
		min-width: 2.5rem;
		text-align: right;
	}

	/* ---- Card Layout / Toggle ---- */
	.order-toggle {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.9rem 1rem;
		background: var(--color-surface);
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-border);
		cursor: pointer;
		margin-bottom: 1rem;
		user-select: none;
	}

	.order-toggle-left {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		color: var(--color-text);
	}

	.order-toggle-label {
		font-size: 0.95rem;
		font-weight: 600;
	}

	.toggle-switch {
		width: 44px;
		height: 26px;
		border-radius: 13px;
		background: var(--color-border);
		position: relative;
		transition: background 0.2s ease;
		flex-shrink: 0;
	}

	.toggle-switch.on {
		background: var(--color-primary);
	}

	.toggle-thumb {
		position: absolute;
		top: 3px;
		left: 3px;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: white;
		transition: transform 0.2s ease;
		box-shadow: 0 1px 3px rgba(0,0,0,0.2);
	}

	.toggle-switch.on .toggle-thumb {
		transform: translateX(18px);
	}

	/* ---- Order visual (parole/carte explanation diagram) ---- */
	.order-visual {
		display: flex;
		gap: 0.5rem;
		margin: -0.5rem 0 1rem;
		padding: 0.75rem;
		background: var(--color-surface);
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-border);
	}

	.vp-column {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		min-width: 0;
	}

	.vp-header {
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--color-text);
		text-align: center;
		padding: 0.25rem 0.1rem;
		letter-spacing: -0.01em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.vp-card {
		font-size: 0.72rem;
		font-weight: 500;
		color: var(--color-text-secondary);
		text-align: center;
		padding: 0.35rem 0.15rem;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.vp-card-jp {
		font-family: var(--font-jp);
		font-size: 0.78rem;
		color: var(--color-text);
	}

	/* ---- Card Builder ---- */
	.card-builder {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.builder-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 0.75rem 1rem;
	}

	.builder-card {
		transition: opacity 0.15s ease, border-color 0.15s ease;
	}

	.builder-card.dragging {
		opacity: 0.4;
		cursor: grabbing;
	}

	.builder-card.drag-over {
		border-color: var(--color-primary);
	}

	.builder-card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}

	.builder-card-header-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.drag-handle {
		display: flex;
		align-items: center;
		color: var(--color-text-tertiary);
		cursor: grab;
		padding: 0.2rem;
		touch-action: none;
		user-select: none;
		-webkit-user-select: none;
	}

	.drag-handle:active {
		cursor: grabbing;
	}

	.builder-card-title {
		font-size: 0.8rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-text-secondary);
	}

	.remove-card-btn {
		background: none;
		border: none;
		padding: 0.3rem;
		cursor: pointer;
		color: var(--color-text-tertiary);
		border-radius: var(--radius-md);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-left: 0.25rem;
	}

	.builder-field-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.3rem 0;
		border-bottom: 1px solid var(--color-border-light, var(--color-border));
	}

	.builder-field-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--color-primary);
		flex-shrink: 0;
	}

	.builder-field-label {
		flex: 1;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.remove-field-btn {
		background: none;
		border: none;
		padding: 0.25rem;
		cursor: pointer;
		color: var(--color-text-tertiary);
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-sm, 4px);
	}

	.builder-add-field-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		padding-top: 0.6rem;
	}

	.field-chip {
		padding: 0.3rem 0.7rem;
		border-radius: var(--radius-full);
		border: 1.5px solid var(--color-border);
		background: var(--color-bg);
		color: var(--color-text);
		font-size: 0.78rem;
		font-weight: 600;
		font-family: var(--font-sans);
		cursor: pointer;
		transition: opacity 0.15s ease;
	}

	.field-chip.disabled {
		opacity: 0.3;
		cursor: default;
	}

	.add-card-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		width: 100%;
		padding: 0.75rem;
		border: 1.5px dashed var(--color-border);
		border-radius: var(--radius-lg);
		background: none;
		color: var(--color-text-secondary);
		font-size: 0.88rem;
		font-weight: 600;
		font-family: var(--font-sans);
		cursor: pointer;
		transition: border-color 0.15s ease, color 0.15s ease;
	}

	.add-card-btn:hover {
		border-color: #e0dce6;
		color: var(--color-primary);
	}

	/* ---- Archive Row ---- */
	.archive-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0;
	}

	.archive-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		color: var(--color-text);
	}

	.archive-label {
		font-size: 1rem;
		font-weight: 600;
	}

	.archive-count {
		font-size: 1.05rem;
		font-weight: 700;
		color: var(--color-primary);
	}

	/* ---- Account ---- */
	.account-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0;
	}

	.account-info {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.account-label {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-text-secondary);
	}

	.account-email {
		font-size: 0.95rem;
		font-weight: 500;
		color: var(--color-text);
	}

	.signout-btn {
		background: none;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		font-weight: 600;
		font-family: var(--font-sans);
		color: #C5221F;
		cursor: pointer;
	}

	/* ---- Login CTA ---- */
	.login-cta {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}

	.login-cta-text {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.login-cta-title {
		font-size: 0.95rem;
		font-weight: 700;
	}

	.login-cta-sub {
		font-size: 0.82rem;
		color: var(--color-text-secondary);
		line-height: 1.4;
	}

	.login-cta-btn {
		display: block;
		text-align: center;
		padding: 0.75rem;
		background-color: var(--color-primary);
		color: white;
		border-radius: var(--radius-md);
		text-decoration: none;
		font-size: 0.9rem;
		font-weight: 700;
	}

	/* ---- Website link ---- */
	.site-link-row {
		display: flex;
		justify-content: center;
		padding: 1.5rem 0 0.5rem;
	}

	.site-link {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.78rem;
		font-weight: 500;
		color: var(--color-text-tertiary);
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.site-link:hover {
		color: var(--color-primary);
	}
</style>
