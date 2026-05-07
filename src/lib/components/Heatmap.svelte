<!--
  Heatmap — full-month calendar view with prev/next navigation.
  Replaces the fixed 7-day strip so users can browse their entire history.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { studyHistory } from '$lib/stores/history';
	import { studyGoal } from '$lib/stores/settings';
	import { getLocalValue } from '$lib/utils/date';
	import { setCronologiaJumpDate } from '$lib/stores/cronologiaNav';

	// Plug in image paths here once assets are ready (index = intensity 0-4)
	const INTENSITY_IMAGES: (string | null)[] = [null, null, null, null, null];

	const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
	const MONTH_NAMES = [
		'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
		'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
	];

	function calculateIntensity(count: number, goal: number): 0 | 1 | 2 | 3 | 4 {
		if (count === 0) return 0;
		if (count >= goal) return 4;
		if (count >= goal * 0.75) return 3;
		if (count >= goal * 0.5) return 2;
		return 1;
	}

	const now = new Date();
	let viewYear = $state(now.getFullYear());
	let viewMonth = $state(now.getMonth()); // 0-indexed

	let isCurrentMonth = $derived(
		viewYear === now.getFullYear() && viewMonth === now.getMonth()
	);

	function prevMonth() {
		if (viewMonth === 0) { viewMonth = 11; viewYear--; }
		else viewMonth--;
	}

	function nextMonth() {
		if (isCurrentMonth) return;
		if (viewMonth === 11) { viewMonth = 0; viewYear++; }
		else viewMonth++;
	}

	type DayCell = {
		date: string;
		dayNum: number;
		intensity: 0 | 1 | 2 | 3 | 4;
		isToday: boolean;
		isFuture: boolean;
	};

	let calendarGrid = $derived.by((): (DayCell | null)[] => {
		const todayMidnight = new Date();
		todayMidnight.setHours(0, 0, 0, 0);
		const todayStr = getLocalValue(todayMidnight);

		const firstDay = new Date(viewYear, viewMonth, 1);
		const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
		const startDow = firstDay.getDay(); // 0=Sun

		const cells: (DayCell | null)[] = Array(startDow).fill(null);

		for (let d = 1; d <= daysInMonth; d++) {
			const date = new Date(viewYear, viewMonth, d);
			const dateStr = getLocalValue(date);
			const isFuture = date > todayMidnight;
			const count = isFuture ? 0 : ($studyHistory[dateStr]?.length ?? 0);
			cells.push({
				date: dateStr,
				dayNum: d,
				intensity: isFuture ? 0 : calculateIntensity(count, $studyGoal),
				isToday: dateStr === todayStr,
				isFuture,
			});
		}

		return cells;
	});

	function openDay(cell: DayCell) {
		if (cell.isFuture) return;
		setCronologiaJumpDate(cell.date);
		goto('/cronologia');
	}
</script>

<div class="tracker-container">
	<div class="month-nav">
		<button class="nav-btn" onclick={prevMonth} aria-label="Mese precedente">
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
				<polyline points="15 18 9 12 15 6" />
			</svg>
		</button>
		<span class="month-label">{MONTH_NAMES[viewMonth]} {viewYear}</span>
		<button class="nav-btn" onclick={nextMonth} disabled={isCurrentMonth} aria-label="Mese successivo">
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
				<polyline points="9 18 15 12 9 6" />
			</svg>
		</button>
	</div>

	<div class="cal-grid">
		{#each DAY_NAMES as name}
			<span class="cal-header">{name}</span>
		{/each}
		{#each calendarGrid as cell}
			{#if cell === null}
				<span class="cal-empty"></span>
			{:else}
				<button
					class="cal-day"
					class:today={cell.isToday}
					class:future={cell.isFuture}
					onclick={() => openDay(cell)}
					disabled={cell.isFuture}
					aria-label={cell.date}
				>
					<span class="day-num">{cell.dayNum}</span>
					{#if INTENSITY_IMAGES[cell.intensity]}
						<img src={INTENSITY_IMAGES[cell.intensity]} alt="" class="day-img" />
					{:else}
						<div class="day-circle intensity-{cell.intensity}"></div>
					{/if}
				</button>
			{/if}
		{/each}
	</div>
</div>

<style>
	.tracker-container {
		width: 100%;
	}

	/* ---- Month navigation ---- */
	.month-nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.75rem;
	}

	.month-label {
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--color-text);
	}

	.nav-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: none;
		border: none;
		border-radius: var(--radius-md);
		color: var(--color-text-secondary);
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
		transition: opacity 0.15s;
	}

	.nav-btn:disabled {
		opacity: 0.25;
		cursor: default;
	}

	.nav-btn:not(:disabled):active {
		opacity: 0.5;
	}

	/* ---- Calendar grid ---- */
	.cal-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 2px 0;
	}

	.cal-header {
		font-size: 0.6rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		text-align: center;
		padding-bottom: 0.4rem;
		letter-spacing: 0.03em;
	}

	.cal-empty {
		/* placeholder for days before the 1st */
	}

	.cal-day {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		background: none;
		border: none;
		padding: 0.2rem 0;
		cursor: pointer;
		border-radius: var(--radius-sm);
		-webkit-tap-highlight-color: transparent;
	}

	.cal-day:not(.future):active {
		opacity: 0.6;
	}

	.cal-day.future {
		cursor: default;
		opacity: 0.35;
	}

	.day-num {
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--color-text-primary);
		line-height: 1;
	}

	.cal-day.today .day-num {
		color: var(--color-primary);
		font-weight: 800;
	}

	.day-circle {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		transition: transform 0.15s ease;
	}

	.cal-day.today .day-circle {
		transform: scale(1.1);
	}

	.day-img {
		width: 28px;
		height: 28px;
		object-fit: cover;
		border-radius: 50%;
	}

	.intensity-0 { background-color: var(--color-surface); border: 1px solid #e0dce6; }
	.intensity-1 { background-color: rgba(239, 30, 41, 0.3); border: none; }
	.intensity-2 { background-color: rgba(239, 30, 41, 0.6); border: none; }
	.intensity-3 { background-color: rgba(239, 30, 41, 0.85); border: none; }
	.intensity-4 { background-color: rgba(239, 30, 41, 1); border: none; }
</style>
