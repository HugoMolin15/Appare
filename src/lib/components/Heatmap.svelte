<script lang="ts">
	import { studyHistory } from '$lib/stores/history';
	import { studyGoal } from '$lib/stores/settings';
	import { getLocalValue } from '$lib/utils/date';

	// Date formatters
	const dayNames = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

	// Helper to calculate intensity (0-4)
	function calculateIntensity(count: number, goal: number) {
		if (count === 0) return 0;
		if (count >= goal) return 4;
		if (count >= goal * 0.75) return 3;
		if (count >= goal * 0.5) return 2;
		return 1;
	}

	// Generate current week (Monday to Sunday)
	let currentWeek = $derived.by(() => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		
		// Find Monday of the current week
		const dayOfWeek = today.getDay();
		const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
		
		const monday = new Date(today);
		monday.setDate(today.getDate() + diffToMonday);
		
		const week = [];
		for (let i = 0; i < 7; i++) {
			const d = new Date(monday);
			d.setDate(monday.getDate() + i);
			
			const dateStr = getLocalValue(d);
			const count = $studyHistory[dateStr]?.length || 0;
			const intensity = calculateIntensity(count, $studyGoal);

			week.push({
				date: dateStr,
				dayName: dayNames[i],
				dayNum: d.getDate(),
				count,
				intensity,
				isToday: d.getTime() === today.getTime()
			});
		}
		return week;
	});
</script>

<div class="tracker-container">
	<!-- Current Week View (Horizontal Stack) -->
	<div class="current-week-horizontal">
		{#each currentWeek as day}
			<div class="day-column" class:today={day.isToday}>
				<span class="day-num">{day.dayNum}</span>
				<span class="day-name">{day.dayName}</span>
				<div class="day-square intensity-{day.intensity}" title={`${day.count} parole il ${day.date}`}></div>
			</div>
		{/each}
	</div>
</div>

<style>
	.tracker-container {
		width: 100%;
	}

	/* Current Week Horizontal */
	.current-week-horizontal {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		padding: 0.5rem 0;
	}

	.day-column {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
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
	}

	.day-square {
		width: 32px;
		height: 32px;
		border-radius: 6px;
		transition: transform 0.2s ease;
	}

	.day-column.today .day-num, 
	.day-column.today .day-name {
		color: var(--color-primary);
	}

	.day-column.today .day-square {
		transform: scale(1.1);
	}

	/* Intensities using brand colors */
	.intensity-0 { background-color: var(--color-surface-warm); border: 1px solid var(--color-border); }
	.intensity-1 { background-color: rgba(139, 26, 26, 0.3) !important; border: none; }
	.intensity-2 { background-color: rgba(139, 26, 26, 0.6) !important; border: none; }
	.intensity-3 { background-color: rgba(139, 26, 26, 0.85) !important; border: none; }
	.intensity-4 { background-color: rgba(139, 26, 26, 1) !important; border: none; }

	/* Heatmap Container */
	.heatmap-container {
		width: 100%;
		padding: 1.5rem 0;
		overflow-x: auto;
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	
	.heatmap-container::-webkit-scrollbar {
		display: none;
	}

	.heatmap-grid {
		display: flex;
		gap: 4px;
		min-width: min-content;
		margin-bottom: 1rem;
	}

	.heatmap-col {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.heatmap-cell {
		width: 12px;
		height: 12px;
		border-radius: 2px;
		background-color: var(--color-background);
		border: 1px solid var(--color-border);
		transition: background-color 0.2s ease, transform 0.1s ease;
	}

	.heatmap-grid .heatmap-cell:hover:not(.future) {
		transform: scale(1.2);
		z-index: 10;
		border-color: rgba(255, 255, 255, 0.2);
	}

	.future {
		background-color: transparent;
		border-color: transparent;
	}

	.heatmap-legend {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		gap: 0.35rem;
		font-size: 0.7rem;
		color: var(--color-text-secondary);
	}

	/* Intensities removed from here as they are now global in app.css */
</style>
