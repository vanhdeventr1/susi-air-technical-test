<script setup lang="ts">
import {
  ArrowRight,
  CalendarDays,
  ChartNoAxesCombined,
  CircleAlert,
  FileText,
  LogOut,
  Plane,
} from "@lucide/vue";
import type { Component } from "vue";
import type { FlightHoursRange, FlightHoursSummary } from "../api/home.api";

type SummaryCardKey = keyof FlightHoursSummary["summaryCards"];
type NavigationTab = "home" | "schedule" | "logbook" | "more";

const auth = useAuthStore();
const home = useHomeStore();
const route = useRoute();

const activeTab = computed<NavigationTab>(() => {
  if (route.path === "/schedule") return "schedule";
  if (route.query.tab === "logbook") return "logbook";
  if (route.query.tab === "more") return "more";
  return "home";
});

const isInitializing = ref(true);

const rangeOptions: Array<{ value: FlightHoursRange; label: string }> = [
  { value: "1w", label: "1W" },
  { value: "1m", label: "1M" },
  { value: "3m", label: "3M" },
  { value: "6m", label: "6M" },
  { value: "1y", label: "1Y" },
];

const cardOptions: Array<{
  key: SummaryCardKey;
  label: string;
  detail: string;
  icon: Component;
}> = [
  { key: "daily", label: "Daily", detail: "Today · 1 day", icon: Plane },
  {
    key: "weekly",
    label: "Weekly",
    detail: "Rolling · 7 days",
    icon: ChartNoAxesCombined,
  },
  {
    key: "monthly",
    label: "Monthly",
    detail: "Rolling · 30 days",
    icon: CalendarDays,
  },
  {
    key: "annual",
    label: "Annual",
    detail: "Rolling · 365 days",
    icon: CalendarDays,
  },
];

const limitCards = computed(() =>
  cardOptions.map((card) => ({
    ...card,
    value: home.summary?.summaryCards[card.key],
  })),
);

const chart = computed(() => {
  const summary = home.summary;
  if (!summary?.series.length) return null;

  const left = 42;
  const right = 624;
  const top = 14;
  const bottom = 184;
  const width = right - left;
  const height = bottom - top;
  const yFor = (value: number) => bottom - (value / summary.max) * height;

  const points = summary.series.map((point, index) => {
    const exceedsMax = point.hours > summary.max;

    return {
      ...point,
      x: left + (index / (summary.series.length - 1)) * width,
      y: yFor(Math.min(point.hours, summary.max)),
      isToday: point.date === summary.today,
      exceedsMax,
    };
  });

  const labels = [0, 3, 7, 11, 14]
    .map((index) => points[index])
    .filter((point) => point !== undefined);

  return {
    points,
    labels,
    line: points.map((point) => `${point.x},${point.y}`).join(" "),
    limitY: yFor(summary.limit),
    // Mid tick rounded to a multiple of 5.
    grid: [0, Math.round(summary.max / 2 / 5) * 5, summary.max].map(
      (value) => ({
        value,
        y: yFor(value),
      }),
    ),
    todayX: points.find((point) => point.isToday)?.x ?? left,
    left,
    right,
    top,
    bottom,
  };
});

const loggedDuties = computed(
  () =>
    home.schedules?.schedules.filter((entry) => entry.count_logbooks > 0) ?? [],
);

function formatDate(date: string, includeYear = false): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    ...(includeYear ? { year: "numeric" as const } : {}),
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

async function changeRange(range: FlightHoursRange): Promise<void> {
  if (auth.accessToken) await home.selectRange(auth.accessToken, range);
}

async function signOut(): Promise<void> {
  auth.signOut();
  await navigateTo("/login");
}

onMounted(async () => {
  await auth.restoreSession();

  if (!auth.accessToken || !auth.pilot) {
    await navigateTo("/login");
    return;
  }

  await home.load(auth.accessToken);
  isInitializing.value = false;
});
</script>

<template>
  <main class="home-page">
    <AppHeader />

    <div class="home-content">
      <div
        v-if="isInitializing || home.isLoading"
        class="home-loading"
        role="status"
      >
        <span class="loading-pulse" />
        Loading flight operations data…
      </div>

      <div v-else-if="home.errorMessage" class="home-error" role="alert">
        <CircleAlert :size="20" aria-hidden="true" />
        <span>{{ home.errorMessage }}</span>

        <button
          v-if="auth.accessToken"
          type="button"
          @click="home.load(auth.accessToken)"
        >
          Retry
        </button>
      </div>

      <template v-else-if="home.summary && home.documents">
        <!-- Home dashboard -->
        <template v-if="activeTab === 'home'">
          <section class="section-heading">
            <div>
              <p class="eyebrow">FLIGHT LIMIT MONITORING</p>
              <h1>Hours to limit</h1>
            </div>

            <span class="review-date">
              AS OF {{ formatDate(home.summary.today, true) }}
            </span>
          </section>

          <section
            class="limit-grid"
            aria-label="Current flight hours against limits"
          >
            <article
              v-for="card in limitCards"
              :key="card.key"
              class="limit-card"
              :class="{ 'limit-card--over': card.value?.isOverLimit }"
            >
              <div class="limit-card__top">
                <span class="limit-card__icon">
                  <component :is="card.icon" :size="18" />
                </span>

                <span class="limit-card__label">
                  {{ card.label }}
                </span>
              </div>

              <div class="limit-card__value-row">
                <strong>
                  {{ card.value?.currentHours.toFixed(1) ?? "—" }}
                </strong>

                <span>/ {{ card.value?.limit ?? "—" }} h</span>
              </div>

              <div class="limit-card__meter" aria-hidden="true">
                <span
                  :style="{
                    width: `${Math.min(card.value?.utilizationPercent ?? 0, 100)}%`,
                  }"
                />
              </div>

              <div class="limit-card__meta">
                <span>{{ card.detail }}</span>
                <span>{{ card.value?.utilizationPercent ?? 0 }}%</span>
              </div>
            </article>
          </section>

          <!-- Flight hours chart -->
          <section class="chart-panel" aria-labelledby="chart-title">
            <div class="panel-heading">
              <div>
                <p class="eyebrow">ROLLING FLIGHT HOURS</p>
                <h2 id="chart-title">Flight hours trend</h2>
              </div>

              <div
                class="range-toggle"
                role="group"
                aria-label="Rolling sum range"
              >
                <button
                  v-for="range in rangeOptions"
                  :key="range.value"
                  type="button"
                  :aria-pressed="home.selectedRange === range.value"
                  :disabled="home.isRangeLoading"
                  :class="{ 'is-active': home.selectedRange === range.value }"
                  @click="changeRange(range.value)"
                >
                  {{ range.label }}
                </button>
              </div>
            </div>

            <div v-if="chart && home.summary" class="chart-wrap">
              <div class="chart-legend">
                <span>
                  <i class="chart-legend__hours" />
                  Rolling total
                </span>

                <span>
                  <i class="chart-legend__limit" />
                  Limit {{ home.summary.limit }}h
                </span>

                <span class="chart-bound"> Y MAX {{ home.summary.max }}h </span>
              </div>

              <svg
                class="hours-chart"
                viewBox="0 0 640 220"
                role="img"
                :aria-label="`${home.selectedRange} rolling hours, ${home.summary.displayStartDate} to ${home.summary.displayEndDate}`"
              >
                <g class="chart-grid">
                  <g v-for="tick in chart.grid" :key="tick.value">
                    <line
                      :x1="chart.left"
                      :x2="chart.right"
                      :y1="tick.y"
                      :y2="tick.y"
                    />

                    <text x="2" :y="tick.y + 4">
                      {{ tick.value }}
                    </text>
                  </g>
                </g>

                <line
                  class="chart-today"
                  :x1="chart.todayX"
                  :x2="chart.todayX"
                  :y1="chart.top"
                  :y2="chart.bottom"
                />

                <line
                  class="chart-limit"
                  :x1="chart.left"
                  :x2="chart.right"
                  :y1="chart.limitY"
                  :y2="chart.limitY"
                />

                <polyline class="chart-series" :points="chart.line" />

                <circle
                  v-for="point in chart.points"
                  :key="point.date"
                  class="chart-point"
                  :class="{
                    'chart-point--today': point.isToday,
                    'chart-point--over': point.hours > home.summary.limit,
                    'chart-point--overflow': point.exceedsMax,
                  }"
                  :cx="point.x"
                  :cy="point.y"
                  :r="point.isToday ? 5 : 3"
                >
                  <title>{{ point.date }} · {{ point.hours }} hours</title>
                </circle>

                <g class="chart-labels">
                  <text
                    v-for="point in chart.labels"
                    :key="point.date"
                    :x="point.x"
                    y="211"
                    :class="{ 'is-today': point.isToday }"
                    text-anchor="middle"
                  >
                    {{ point.date.slice(5) }}
                  </text>
                </g>
              </svg>

              <p class="chart-footnote">7 days before · Today · 7 days after</p>
            </div>
          </section>

          <!-- Documents -->
          <section class="documents-panel" aria-labelledby="documents-title">
            <div class="panel-heading panel-heading--compact">
              <div>
                <p class="eyebrow">PILOT RECORDS</p>
                <h2 id="documents-title">My documents</h2>
              </div>

              <span class="document-count">
                {{ home.documents.documents.length }} ITEMS
              </span>
            </div>

            <ul class="document-list">
              <li
                v-for="document in home.documents.documents"
                :key="document.id"
              >
                <span class="document-icon">
                  <FileText :size="18" />
                </span>

                <span class="document-copy">
                  <strong>{{ document.label }}</strong>
                  <small>
                    Expires {{ formatDate(document.expiryDate, true) }}
                  </small>
                </span>

                <span
                  class="document-badge"
                  :class="`document-badge--${document.status}`"
                >
                  <i aria-hidden="true" />
                  {{ document.status }}
                </span>
              </li>
            </ul>
          </section>
        </template>

        <!-- Schedule -->
        <section v-else-if="activeTab === 'schedule'" class="secondary-panel">
          <p class="eyebrow">MAY 2026</p>
          <h1>Schedule</h1>

          <ul class="schedule-list">
            <li
              v-for="entry in home.schedules?.schedules ?? []"
              :key="entry.id"
            >
              <span class="schedule-date">
                {{ formatDate(entry.duty_date) }}
              </span>

              <strong
                class="schedule-base"
                :style="{ color: entry.base_color }"
              >
                {{ entry.base_name }}
              </strong>

              <span class="schedule-type">
                {{ entry.duty_type }}
              </span>

              <span class="schedule-count">
                {{ entry.count_logbooks }}/{{ entry.count_schedules }}
              </span>
            </li>
          </ul>
        </section>

        <!-- Logbook -->
        <section v-else-if="activeTab === 'logbook'" class="secondary-panel">
          <p class="eyebrow">FLIGHT RECORDS</p>
          <h1>Logbook</h1>

          <p class="logbook-total">
            <strong>{{ loggedDuties.length }}</strong>
            duties logged in May
          </p>

          <p class="secondary-note">
            Completed duties matched against the schedule.
          </p>
        </section>

        <!-- More / account -->
        <section v-else class="secondary-panel">
          <p class="eyebrow">CREW ACCOUNT</p>
          <h1>More</h1>

          <div v-if="auth.pilot" class="more-profile">
            <img :src="auth.pilot.avatarUrl" :alt="auth.pilot.name" />

            <div>
              <strong>{{ auth.pilot.name }}</strong>
              <span>Pilot account</span>
            </div>
          </div>

          <button class="signout-button" type="button" @click="signOut">
            <LogOut :size="18" />
            Sign out
          </button>
        </section>
      </template>
    </div>

    <!-- Shared navigation component -->
    <AppBottomNav />
  </main>
</template>

<style scoped lang="scss">
// Mobile first: base styles are for phones (~360px).
// Breakpoints: 480 (large phone), 720 (tablet), 1024 (desktop).

.home-page {
  min-height: 100dvh;
  padding-bottom: calc(88px + env(safe-area-inset-bottom));
  color: var(--navy);
}

// ---------- Layout ----------
.home-content {
  display: grid;
  gap: 16px;
  width: min(100%, 1160px);
  margin: 0 auto;
  padding: 16px 16px 24px;
}

.section-heading,
.panel-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px 12px;
}

.section-heading {
  flex-wrap: wrap;
}

.section-heading h1,
.panel-heading h2,
.secondary-panel h1 {
  margin: 4px 0 0;
  color: var(--navy);
  font-size: 22px;
  font-weight: 800;
  line-height: 1.2;
}

.eyebrow,
.review-date,
.document-count {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
}

.eyebrow {
  margin: 0;
  color: var(--red);
}

.review-date,
.document-count {
  color: var(--text-secondary);
}

// ---------- Cards ----------
.limit-card,
.chart-panel,
.documents-panel,
.secondary-panel,
.home-loading,
.home-error {
  min-width: 0;
  border: 1px solid #e7eaf0;
  border-radius: 14px;
  background: var(--surface);
  box-shadow: 0 3px 14px rgba(14, 33, 56, 0.045);
}

.limit-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.limit-card {
  padding: 14px;
}

.limit-card--over {
  border-color: rgba(230, 55, 87, 0.45);
}

.limit-card__top,
.limit-card__meta,
.limit-card__value-row {
  display: flex;
  align-items: center;
}

.limit-card__top {
  gap: 8px;
}

.limit-card__icon {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 8px;
  background: rgba(34, 197, 232, 0.12);
  color: #087e9a;
}

.limit-card__label {
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 700;
}

.limit-card__value-row {
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px 6px;
  margin-top: 12px;
}

.limit-card__value-row strong {
  color: var(--navy);
  font-size: 28px;
  font-weight: 800;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.limit-card__value-row span {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.limit-card__meter {
  height: 6px;
  margin-top: 12px;
  overflow: hidden;
  border-radius: 99px;
  background: #edf0f3;
}

.limit-card__meter span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--success);
}

.limit-card--over .limit-card__meter span {
  background: var(--danger);
}

.limit-card__meta {
  justify-content: space-between;
  gap: 4px;
  margin-top: 8px;
  color: var(--text-secondary);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

// ---------- Chart ----------
.chart-panel,
.documents-panel {
  padding: 16px 14px;
}

.panel-heading {
  align-items: center;
  flex-wrap: wrap;
}

.panel-heading h2 {
  font-size: 17px;
}

// Full-width segmented control on phones.
.range-toggle {
  display: flex;
  width: 100%;
  gap: 2px;
  padding: 3px;
  border-radius: 999px;
  background: #f0f2f5;
}

.range-toggle button {
  flex: 1;
  min-width: 0;
  height: 36px;
  padding: 0 6px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 12px;
  font-weight: 800;
}

.range-toggle button.is-active {
  background: var(--navy);
  color: #fff;
}

.range-toggle button:disabled {
  cursor: wait;
  opacity: 0.7;
}

.chart-legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 14px;
  margin: 16px 0 8px;
  color: var(--text-secondary);
  font-size: 12px;
}

.chart-legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.chart-legend i {
  width: 14px;
  height: 3px;
  border-radius: 2px;
}

.chart-legend__hours {
  background: var(--chart-accent);
}

.chart-legend__limit {
  background: var(--red);
}

.chart-legend .chart-bound {
  margin-left: auto;
  font-size: 11px;
  font-weight: 800;
}

.hours-chart {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}

// The SVG uses a 640-wide viewBox and scales down on phones.
.chart-grid line {
  stroke: #e9edf1;
  stroke-width: 1.5;
}

.chart-grid text,
.chart-labels text {
  fill: #6b7480;
  font-family: "Plus Jakarta Sans", sans-serif;
  font-size: 20px;
  font-weight: 600;
}

.chart-limit {
  stroke: var(--red);
  stroke-dasharray: 8 6;
  stroke-width: 3;
}

.chart-today {
  stroke: rgba(14, 33, 56, 0.28);
  stroke-dasharray: 3 6;
  stroke-width: 2;
}

.chart-series {
  fill: none;
  stroke: var(--chart-accent);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 5;
}

.chart-point {
  r: 5px;
  fill: var(--surface);
  stroke: var(--chart-accent);
  stroke-width: 3;
}

.chart-point--today {
  r: 8px;
  fill: var(--navy);
  stroke: var(--surface);
  stroke-width: 4;
}

.chart-point--over,
.chart-point--overflow {
  fill: var(--red);
  stroke: var(--surface);
}

.chart-labels .is-today {
  fill: var(--navy);
  font-weight: 800;
}

.chart-footnote {
  margin: 8px 0 0;
  color: var(--text-secondary);
  font-size: 12px;
  text-align: center;
}

// ---------- Documents ----------
.panel-heading--compact {
  margin-bottom: 8px;
}

.document-list,
.schedule-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.document-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 60px;
  border-top: 1px solid #edf0f3;
}

.document-icon {
  display: grid;
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  place-items: center;
  border-radius: 10px;
  background: #f1f3f6;
  color: var(--navy);
}

.document-copy {
  display: grid;
  min-width: 0;
  flex: 1;
  gap: 3px;
}

.document-copy strong {
  display: -webkit-box;
  overflow: hidden;
  color: var(--navy);
  font-size: 14px;
  line-height: 1.3;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.document-copy small {
  color: var(--text-secondary);
  font-size: 12px;
}

.document-badge {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  text-transform: capitalize;
}

.document-badge i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.document-badge--safe {
  background: rgba(31, 191, 143, 0.12);
  color: #118860;
}

.document-badge--soon {
  background: rgba(245, 158, 11, 0.14);
  color: #a86500;
}

.document-badge--expired {
  background: rgba(230, 55, 87, 0.11);
  color: var(--danger);
}

// ---------- Loading / error ----------
.home-loading,
.home-error {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 16px;
  color: var(--text-secondary);
  font-size: 14px;
}

.home-error {
  flex-wrap: wrap;
  color: var(--danger);
  font-weight: 600;

  span {
    flex: 1;
    min-width: 0;
  }
}

.home-error button {
  min-width: 80px;
  height: 40px;
  margin-left: auto;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
  background: var(--navy);
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
}

.loading-pulse {
  width: 10px;
  height: 10px;
  flex: none;
  border-radius: 50%;
  background: var(--chart-accent);
  animation: pulse 1s ease-in-out infinite alternate;
}

// ---------- Secondary tabs ----------
.secondary-panel {
  min-height: 250px;
  padding: 20px 16px;
}

.secondary-panel h1 {
  margin: 8px 0 16px;
  font-size: 24px;
}

// Schedule row on phones.
.schedule-list li {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) auto;
  grid-template-areas:
    "date base count"
    ". type type";
  gap: 2px 12px;
  padding: 12px 0;
  border-top: 1px solid #edf0f3;
  color: var(--text-secondary);
  font-size: 13px;
}

.schedule-date {
  grid-area: date;
  color: var(--navy);
  font-weight: 700;
}

.schedule-base {
  grid-area: base;
  min-width: 0;
  overflow: hidden;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.schedule-type {
  grid-area: type;
  font-size: 12px;
}

.schedule-count {
  grid-area: count;
  color: var(--navy);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.logbook-total {
  margin: 0 0 8px;
  color: var(--text-secondary);
  font-size: 14px;
}

.logbook-total strong {
  color: var(--navy);
  font-size: 32px;
  font-weight: 800;
}

.secondary-note {
  margin: 0;
  color: var(--text-secondary);
  font-size: 13px;
}

.more-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
  border-top: 1px solid #edf0f3;
  border-bottom: 1px solid #edf0f3;
}

.more-profile img {
  flex: none;
  width: 48px;
  height: 48px;
  border: 2px solid #e7eaf0;
  border-radius: 50%;
  object-fit: cover;
}

.more-profile div {
  display: grid;
  gap: 4px;
  font-size: 15px;
}

.more-profile span {
  color: var(--text-secondary);
  font-size: 12px;
}

.signout-button {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  margin-top: 12px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--danger);
  cursor: pointer;
  font-size: 15px;
  font-weight: 700;
}

@keyframes pulse {
  to {
    opacity: 0.35;
    transform: scale(0.8);
  }
}

// ---------- ≥480px: large phones ----------
@media (min-width: 480px) {
  .home-content {
    padding: 20px 20px 28px;
  }

  .limit-card {
    padding: 16px;
  }

  .range-toggle {
    width: auto;
  }

  .range-toggle button {
    flex: none;
    min-width: 44px;
  }
}

// ---------- ≥720px: tablet ----------
@media (min-width: 720px) {
  .home-page {
    padding-bottom: 104px;
  }

  .home-content {
    gap: 18px;
    padding: 24px 28px 32px;
  }

  .limit-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
  }

  .limit-card__value-row strong {
    font-size: 30px;
  }

  .chart-panel,
  .documents-panel {
    padding: 20px;
  }

  .hours-chart .chart-grid text,
  .hours-chart .chart-labels text {
    font-size: 13px;
  }

  .chart-series {
    stroke-width: 3.5;
  }

  .chart-point {
    r: 4px;
  }

  .chart-point--today {
    r: 6px;
  }

  .chart-limit {
    stroke-width: 2;
  }

  .schedule-list li {
    grid-template-columns: 90px minmax(0, 1fr) 140px 70px;
    grid-template-areas: "date base type count";
    align-items: center;
    font-size: 14px;
  }

  .schedule-type {
    font-size: 14px;
  }

  .secondary-panel {
    max-width: 720px;
    padding: 28px;
  }
}

// ---------- ≥1024px: desktop ----------
@media (min-width: 1024px) {
  .home-content {
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 20px;
    padding: 28px 32px 40px;
  }

  .section-heading,
  .limit-grid,
  .home-loading,
  .home-error,
  .secondary-panel {
    grid-column: 1 / -1;
  }

  .chart-panel {
    grid-column: 1 / 8;
  }

  .documents-panel {
    grid-column: 8 / -1;
  }
}
</style>
