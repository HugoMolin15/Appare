<script lang="ts">
	import { goto } from '$app/navigation';
	import { studyHistory } from '$lib/stores/history';
	import { studyGoal } from '$lib/stores/settings';
	import { getLocalValue } from '$lib/utils/date';
	import { setCronologiaJumpDate } from '$lib/stores/cronologiaNav';

	// Plug in image paths here once assets are ready (index = intensity 0-4)
	const INTENSITY_IMAGES: (string | null)[] = [null, null, null, null, null];

	// Italian short day names indexed by JS getDay() (0=Sun … 6=Sat)
	const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

	function calculateIntensity(count: number, goal: number): 0 | 1 | 2 | 3 | 4 {
		if (count === 0) return 0;
		if (count >= goal) return 4;
		if (count >= goal * 0.75) return 3;
		if (count >= goal * 0.5) return 2;
		return 1;
	}

	// Last 7 days: index 0 = 6 days ago (left), index 6 = today (right)
	let days = $derived.by(() => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		return Array.from({ length: 7 }, (_, i) => {
			const d = new Date(today);
			d.setDate(today.getDate() - (6 - i));

			const dateStr = getLocalValue(d);
			const count = $studyHistory[dateStr]?.length ?? 0;
			const intensity = calculateIntensity(count, $studyGoal);

			return {
				date: dateStr,
				dayName: DAY_NAMES[d.getDay()],
				dayNum: d.getDate(),
				count,
				intensity,
				isToday: i === 6
			};
		});
	});

	function openDay(dateStr: string) {
		setCronologiaJumpDate(dateStr);
		goto('/cronologia');
	}
</script>

<div class="tracker-container">
	<div class="week-row">
		{#each days as day}
			<button class="day-col" class:today={day.isToday} onclick={() => openDay(day.date)}>
				<span class="day-num">{day.dayNum}</span>
				<span class="day-name">{day.dayName}</span>
				{#if INTENSITY_IMAGES[day.intensity]}
					<img
						src={INTENSITY_IMAGES[day.intensity]}
						alt=""
						class="day-img"
					/>
				{:else}
					<div class="day-circle intensity-{day.intensity}"></div>
				{/if}
			</button>
		{/each}
	</div>
</div>

<style>
	.tracker-container {
		width: 100%;
	}

	.week-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		padding: 0.5rem 0;
	}

	.day-col {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0;
		background: none;
		border: none;
		padding: 0.25rem;
		cursor: pointer;
		border-radius: var(--radius-md);
		-webkit-tap-highlight-color: transparent;
	}

	.day-col:active {
		opacity: 0.6;
	}

	.day-num {
		font-size: 0.9rem;
		font-weight: 700;
		color: var(--color-text-primary);
	}

	.day-name {
		font-size: 0.65rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		margin-bottom: 0.5rem;
	}

	.day-col.today .day-num,
	.day-col.today .day-name {
		color: var(--color-primary);
	}

	.day-col.today .day-circle {
		transform: scale(1.1);
	}

	.day-circle {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		transition: transform 0.2s ease;
	}

	.day-img {
		width: 32px;
		height: 32px;
		object-fit: cover;
		border-radius: 50%;
	}

	.intensity-0 { background-color: var(--color-surface); border: 1px solid #e0dce6; }
	.intensity-1 { background-color: rgba(239, 30, 41, 0.3); border: none; }
	.intensity-2 { background-color: rgba(239, 30, 41, 0.6); border: none; }
	.intensity-3 { background-color: rgba(239, 30, 41, 0.85); border: none; }
	.intensity-4 { background-color: rgba(239, 30, 41, 1); border: none; }
</style>
