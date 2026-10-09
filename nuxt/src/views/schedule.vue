<script setup lang="ts">
import { ArrowLeft, ArrowRight, CalendarDays } from "@lucide/vue";
import type { PilotSchedule } from "../api/home.api";

const auth = useAuthStore();
const home = useHomeStore();

const year = ref(2026);
const month = ref(5);

const weekdayLabels = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const reviewToday = computed(() => home.schedules?.today ?? "2026-05-15");

const monthTitle = computed(() =>
  new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year.value, month.value - 1, 1))),
);

const scheduleByDate = computed(() => {
  const grouped = new Map<
    string,
    {
      entries: PilotSchedule[];
      totalSchedules: number;
      totalLogbooks: number;
      color: string;
      labels: string[];
    }
  >();

  for (const entry of home.schedules?.schedules ?? []) {
    const group = grouped.get(entry.duty_date) ?? {
      entries: [],
      totalSchedules: 0,
      totalLogbooks: 0,
      color: entry.base_color,
      labels: [],
    };

    group.entries.push(entry);
    group.totalSchedules += entry.count_schedules;
    group.totalLogbooks += entry.count_logbooks;
    group.labels.push(getDutyShortLabel(entry.duty_type));
    grouped.set(entry.duty_date, group);
  }

  return grouped;
});

const calendarCells = computed(() => {
  const firstDay = new Date(Date.UTC(year.value, month.value - 1, 1));
  const mondayOffset = (firstDay.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(
    Date.UTC(year.value, month.value, 0),
  ).getUTCDate();
  const cellCount = Math.ceil((mondayOffset + daysInMonth) / 7) * 7;

  return Array.from({ length: cellCount }, (_, index) => {
    const dayNumber = index - mondayOffset + 1;

    if (dayNumber < 1 || dayNumber > daysInMonth) return null;

    const date = `${year.value}-${String(month.value).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;

    return {
      date,
      dayNumber,
      duty: scheduleByDate.value.get(date),
      isToday: date === reviewToday.value,
    };
  });
});

function getDutyShortLabel(code: string): string {
  const labels: Record<string, string> = {
    DTY: "DUTY",
    RLV: "RL",
    TRD: "TR",
    TRX: "TX",
    ULV: "UL",
  };

  return labels[code] ?? code;
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

async function loadMonth(): Promise<void> {
  if (auth.accessToken) {
    await home.loadSchedules(auth.accessToken, year.value, month.value);
  }
}

async function changeMonth(offset: number): Promise<void> {
  const nextMonth = new Date(Date.UTC(year.value, month.value - 1 + offset, 1));

  year.value = nextMonth.getUTCFullYear();
  month.value = nextMonth.getUTCMonth() + 1;

  await loadMonth();
}

async function openDay(date: string): Promise<void> {
  await navigateTo(`/schedule/${date}`);
}

onMounted(async () => {
  await auth.restoreSession();

  if (!auth.accessToken || !auth.pilot) {
    await navigateTo("/login");
    return;
  }

  await loadMonth();
});
</script>

<template>
  <main class="schedule-page">
    <AppHeader />

    <div class="schedule-content">
      <section class="schedule-title">
        <div>
          <p class="eyebrow">DUTY PLANNING</p>
          <h1>Schedule</h1>
        </div>

        <span class="today-reference">
          TODAY · {{ formatDate(reviewToday) }}
        </span>
      </section>

      <section class="calendar-panel" aria-label="Monthly duty calendar">
        <div class="calendar-toolbar">
          <div class="month-label">
            <CalendarDays :size="19" aria-hidden="true" />
            <h2>{{ monthTitle }}</h2>
          </div>

          <div class="month-controls" aria-label="Change calendar month">
            <button
              type="button"
              aria-label="Previous month"
              :disabled="home.isScheduleLoading"
              @click="changeMonth(-1)"
            >
              <ArrowLeft :size="18" aria-hidden="true" />
            </button>

            <button
              type="button"
              aria-label="Next month"
              :disabled="home.isScheduleLoading"
              @click="changeMonth(1)"
            >
              <ArrowRight :size="18" aria-hidden="true" />
            </button>
          </div>
        </div>

        <p v-if="home.scheduleErrorMessage" class="schedule-error" role="alert">
          {{ home.scheduleErrorMessage }}
          <button type="button" @click="loadMonth">Retry</button>
        </p>

        <div
          v-if="home.isScheduleLoading"
          class="calendar-loading"
          role="status"
        >
          Loading {{ monthTitle }} schedule…
        </div>

        <div
          v-else
          class="calendar-grid"
          role="grid"
          :aria-label="`${monthTitle} calendar`"
        >
          <div
            v-for="weekday in weekdayLabels"
            :key="weekday"
            class="weekday"
            role="columnheader"
          >
            {{ weekday }}
          </div>

          <div
            v-for="(cell, index) in calendarCells"
            :key="cell?.date ?? `blank-${index}`"
            class="calendar-cell"
            role="gridcell"
          >
            <button
              v-if="cell"
              class="day-cell"
              :class="{
                'day-cell--today': cell.isToday,
                'day-cell--scheduled': cell.duty,
              }"
              :style="
                cell.duty ? { '--duty-color': cell.duty.color } : undefined
              "
              :aria-label="
                cell.duty
                  ? `${formatDate(cell.date)}, ${cell.duty.labels.join(', ')}, ${Math.max(cell.duty.totalSchedules - cell.duty.totalLogbooks, 0)} remaining`
                  : formatDate(cell.date)
              "
              type="button"
              @click="openDay(cell.date)"
            >
              <span class="day-cell__number">
                {{ cell.dayNumber }}
              </span>

              <span v-if="cell.duty" class="day-cell__duty">
                {{ cell.duty.labels[0] }}
              </span>

              <span
                v-if="cell.duty"
                class="day-cell__status"
                :class="{
                  'day-cell__status--complete':
                    cell.duty.totalLogbooks === cell.duty.totalSchedules,
                }"
                aria-hidden="true"
              >
                {{
                  cell.duty.totalLogbooks === cell.duty.totalSchedules
                    ? "✓"
                    : Math.max(
                        cell.duty.totalSchedules - cell.duty.totalLogbooks,
                        0,
                      )
                }}
              </span>
            </button>
          </div>
        </div>

        <div
          v-if="home.schedules"
          class="duty-legend"
          aria-label="Duty type legend"
        >
          <span
            v-for="item in home.schedules.legend"
            :key="item.code"
            class="legend-item"
          >
            <i :style="{ backgroundColor: item.color }" aria-hidden="true" />
            <strong>{{ getDutyShortLabel(item.code) }}</strong>
            <small>{{ item.label }}</small>
          </span>
        </div>
      </section>

      <section class="schedule-summary">
        <div>
          <p class="eyebrow">MONTH OVERVIEW</p>
          <h2>{{ home.schedules?.schedules.length ?? 0 }} scheduled duties</h2>
        </div>

        <span>{{ monthTitle }}</span>
      </section>
    </div>

    <AppBottomNav />
  </main>
</template>

<style scoped lang="scss">
.schedule-page {
  min-height: 100dvh;
  padding-bottom: calc(88px + env(safe-area-inset-bottom));
  color: var(--navy);
}

.schedule-content {
  display: grid;
  gap: 14px;
  width: min(100%, 900px);
  margin: 0 auto;
  padding: 18px 12px 24px;
}

.schedule-title,
.calendar-toolbar,
.schedule-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.eyebrow {
  margin: 0;
  color: var(--red);
  font-size: 9px;
  font-weight: 800;
}

.schedule-title h1 {
  margin: 4px 0 0;
  font-size: 23px;
  font-weight: 800;
}

.today-reference {
  color: var(--text-secondary);
  font-size: 8px;
  font-weight: 800;
  text-align: right;
}

.calendar-panel,
.schedule-summary {
  padding: 14px 10px;
  border: 1px solid #e7eaf0;
  border-radius: 13px;
  background: var(--surface);
  box-shadow: 0 3px 14px rgba(14, 33, 56, 0.045);
}

.calendar-toolbar {
  padding: 0 4px 12px;
}

.month-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--navy);
}

.month-label svg {
  color: var(--red);
}

.month-label h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 800;
}

.month-controls {
  display: flex;
  gap: 6px;
}

.month-controls button {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 1px solid #e5e8ed;
  border-radius: 9px;
  background: #fff;
  color: var(--navy);
  cursor: pointer;
}

.month-controls button:disabled {
  cursor: wait;
  opacity: 0.55;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 3px;
}

.weekday {
  display: grid;
  min-height: 26px;
  place-items: center;
  color: var(--text-secondary);
  font-size: 8px;
  font-weight: 800;
}

.calendar-cell {
  min-width: 0;
  min-height: 55px;
}

.day-cell {
  position: relative;
  display: flex;
  width: 100%;
  min-height: 55px;
  flex-direction: column;
  align-items: flex-start;
  padding: 5px 4px;
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--navy);
  cursor: pointer;
  text-align: left;
}

.day-cell--scheduled {
  border-color: color-mix(in srgb, var(--duty-color) 42%, white);
  background: color-mix(in srgb, var(--duty-color) 14%, white);
}

.day-cell--today .day-cell__number {
  display: grid;
  width: 20px;
  height: 20px;
  place-items: center;
  border-radius: 50%;
  background: var(--navy);
  color: #fff;
}

.day-cell__number {
  display: grid;
  min-width: 20px;
  height: 20px;
  place-items: center;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 700;
}

.day-cell__duty {
  display: block;
  max-width: 100%;
  margin-top: 3px;
  overflow: hidden;
  color: color-mix(in srgb, var(--duty-color) 76%, var(--navy));
  font-size: 7px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.day-cell__status {
  position: absolute;
  top: 4px;
  right: 4px;
  display: grid;
  min-width: 15px;
  height: 15px;
  padding: 0 2px;
  place-items: center;
  border-radius: 999px;
  background: var(--red);
  color: #fff;
  font-size: 8px;
  font-weight: 800;
}

.day-cell__status--complete {
  background: var(--success);
}

.duty-legend {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px 7px;
  margin-top: 14px;
  padding: 13px 4px 2px;
  border-top: 1px solid #edf0f3;
}

.legend-item {
  display: grid;
  grid-template-columns: 9px 28px minmax(0, 1fr);
  align-items: center;
  gap: 5px;
  min-width: 0;
}

.legend-item i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend-item strong {
  color: var(--navy);
  font-size: 8px;
  font-weight: 800;
}

.legend-item small {
  overflow: hidden;
  color: var(--text-secondary);
  font-size: 8px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.schedule-summary {
  padding: 13px;
}

.schedule-summary h2 {
  margin: 5px 0 0;
  font-size: 13px;
  font-weight: 800;
}

.schedule-summary > span {
  color: var(--text-secondary);
  font-size: 10px;
}

.schedule-error,
.calendar-loading {
  padding: 12px 7px;
  color: var(--text-secondary);
  font-size: 11px;
}

.schedule-error {
  color: var(--danger);
}

.schedule-error button {
  margin-left: 8px;
  border: 0;
  background: transparent;
  color: var(--navy);
  font-weight: 800;
  cursor: pointer;
}

@media (min-width: 480px) {
  .schedule-content {
    padding-right: 20px;
    padding-left: 20px;
  }

  .calendar-panel {
    padding: 16px;
  }

  .weekday {
    font-size: 10px;
  }

  .day-cell__number {
    font-size: 11px;
  }
}

@media (min-width: 720px) {
  .schedule-page {
    padding-bottom: 104px;
  }

  .schedule-content {
    gap: 16px;
    padding: 24px 24px 32px;
  }

  .schedule-title h1 {
    font-size: 26px;
  }

  .today-reference {
    font-size: 10px;
  }

  .calendar-panel {
    padding: 20px;
    border-radius: 15px;
  }

  .month-label h2 {
    font-size: 18px;
  }

  .calendar-grid {
    gap: 6px;
  }

  .calendar-cell,
  .day-cell {
    min-height: 76px;
  }

  .day-cell {
    padding: 7px;
    border-radius: 10px;
  }

  .day-cell__number {
    font-size: 12px;
  }

  .day-cell__duty {
    margin-top: 6px;
    font-size: 9px;
  }

  .day-cell__status {
    top: 7px;
    right: 7px;
  }

  .duty-legend {
    grid-template-columns: repeat(5, minmax(0, 1fr));
    padding-top: 16px;
  }

  .legend-item strong,
  .legend-item small {
    font-size: 10px;
  }

  .schedule-summary {
    padding: 18px;
  }

  .schedule-summary h2 {
    font-size: 15px;
  }

  .schedule-summary > span {
    font-size: 12px;
  }
}
</style>
