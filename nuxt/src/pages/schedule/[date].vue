<script setup lang="ts">
import { ArrowLeft, CalendarDays } from "@lucide/vue";

const auth = useAuthStore();
const route = useRoute();
const date = computed(() => String(route.params.date ?? ""));

const formattedDate = computed(() => {
  const value = date.value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
});

onMounted(async () => {
  await auth.restoreSession();
  if (!auth.accessToken || !auth.pilot) await navigateTo("/login");
});
</script>

<template>
  <main class="schedule-detail-page">
    <header class="detail-header">
      <NuxtLink to="/schedule" aria-label="Back to schedule">
        <ArrowLeft :size="19" />
      </NuxtLink>
      <span>CREW OPERATIONS</span>
      <img src="/susiair-logo.png" alt="Susi Air" />
    </header>

    <section class="detail-placeholder">
      <span class="detail-icon"><CalendarDays :size="23" /></span>
      <p class="eyebrow">DUTY DETAILS</p>
      <h1>{{ formattedDate }}</h1>
      <p>Detail page coming soon</p>
    </section>
  </main>
</template>

<style scoped lang="scss">
.schedule-detail-page {
  min-height: 100dvh;
  padding: 16px;
  background: var(--background);
  color: var(--navy);
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--navy);
  color: #fff;
  font-size: 9px;
  font-weight: 800;
}

.detail-header a {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 50%;
  color: #fff;
}

.detail-header img {
  width: 92px;
  height: 32px;
  padding: 4px 7px;
  border-radius: 7px;
  background: #fff;
  object-fit: contain;
}

.detail-placeholder {
  display: grid;
  justify-items: center;
  width: min(100%, 520px);
  margin: 18vh auto 0;
  padding: 30px 20px;
  border: 1px solid #e7eaf0;
  border-radius: 14px;
  background: var(--surface);
  box-shadow: 0 3px 14px rgba(14, 33, 56, 0.045);
  text-align: center;
}

.detail-icon {
  display: grid;
  width: 48px;
  height: 48px;
  margin-bottom: 17px;
  place-items: center;
  border-radius: 13px;
  background: rgba(34, 197, 232, 0.12);
  color: #087e9a;
}

.eyebrow {
  margin: 0;
  color: var(--red);
  font-size: 9px;
  font-weight: 800;
}

.detail-placeholder h1 {
  margin: 8px 0;
  font-size: 19px;
  font-weight: 800;
}

.detail-placeholder > p:last-child {
  margin: 0;
  color: var(--text-secondary);
  font-size: 12px;
}
</style>
