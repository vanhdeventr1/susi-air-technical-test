<script setup lang="ts">
// Shared top bar, identical to the Home header.
// Use on Home, Schedule, and the day-detail page (/schedule/[date]).
const auth = useAuthStore();
</script>

<template>
  <header class="app-header">
    <NuxtLink
      class="app-header__brand"
      to="/home"
      aria-label="Susi Air Crew Operations, back to home"
    >
      <img src="/susiair-logo.png" alt="Susi Air" />
      <span class="app-header__unit">CREW OPERATIONS</span>
    </NuxtLink>

    <div v-if="auth.pilot" class="app-header__profile">
      <div class="app-header__copy">
        <span class="app-header__greeting">GOOD DAY, PILOT</span>
        <strong>{{ auth.pilot.name }}</strong>
        <small
          >{{ auth.pilot.totalFlightHours.toLocaleString() }} total flight
          hours</small
        >
      </div>
      <img :src="auth.pilot.avatarUrl" :alt="`${auth.pilot.name} avatar`" />
    </div>
  </header>
</template>

<style scoped lang="scss">
// Mobile first. Breakpoints: 480 (large phone), 720 (tablet)
.app-header {
  position: sticky;
  top: 0;
  z-index: 6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: calc(10px + env(safe-area-inset-top)) 16px 10px;
  border-bottom: 3px solid var(--red);
  background: var(--navy);
  color: #fff;

  &__brand,
  &__profile {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  &__brand {
    color: inherit;
    text-decoration: none;

    img {
      flex: none;
      width: 96px;
      height: 36px;
      padding: 4px 8px;
      border-radius: 8px;
      background: #fff;
      object-fit: contain;
    }
  }

  &__unit {
    display: none; // too wide for phones
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.06em;
    white-space: nowrap;
  }

  &__copy {
    display: grid;
    min-width: 0;
    justify-items: end;
    gap: 2px;
    text-align: right;

    strong {
      max-width: 44vw;
      overflow: hidden;
      font-size: 14px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    small {
      display: none; // phones: name + avatar only
      color: rgba(255, 255, 255, 0.75);
      font-size: 12px;
    }
  }

  &__greeting {
    display: none;
    color: #ff879a;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.06em;
  }

  &__profile img {
    flex: none;
    width: 40px;
    height: 40px;
    border: 2px solid rgba(255, 255, 255, 0.85);
    border-radius: 50%;
    object-fit: cover;
  }

  @media (min-width: 480px) {
    padding-right: 20px;
    padding-left: 20px;

    &__copy strong {
      max-width: 200px;
    }

    &__copy small {
      display: block;
    }
  }

  @media (min-width: 720px) {
    padding-right: 28px;
    padding-left: 28px;

    &__unit,
    &__greeting {
      display: block;
    }
  }
}
</style>
