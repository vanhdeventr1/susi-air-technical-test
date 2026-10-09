<script setup lang="ts">
import { BookOpen, CalendarDays, House, MoreHorizontal } from "@lucide/vue";

const route = useRoute();

const navigation = [
  { key: "home", label: "Home", icon: House, to: "/home" },
  { key: "schedule", label: "Schedule", icon: CalendarDays, to: "/schedule" },
  { key: "logbook", label: "Logbook", icon: BookOpen, to: "/home?tab=logbook" },
  { key: "more", label: "More", icon: MoreHorizontal, to: "/home?tab=more" },
] as const;

const activeTab = computed(() => {
  if (route.path === "/schedule") return "schedule";

  if (route.path === "/home") {
    if (route.query.tab === "logbook") return "logbook";
    if (route.query.tab === "more") return "more";
    return "home";
  }

  return "";
});

async function selectNavigation(to: string) {
  await navigateTo(to);
}
</script>

<template>
  <nav class="bottom-nav" aria-label="Main navigation">
    <button
      v-for="item in navigation"
      :key="item.key"
      type="button"
      :class="{ 'is-active': activeTab === item.key }"
      :aria-current="activeTab === item.key ? 'page' : undefined"
      @click="selectNavigation(item.to)"
    >
      <component
        :is="item.icon"
        :size="22"
        :stroke-width="activeTab === item.key ? 2.2 : 1.7"
      />
      <span>{{ item.label }}</span>
    </button>
  </nav>
</template>

<style scoped lang="scss">
.bottom-nav {
  position: fixed;
  z-index: 5;
  right: 0;
  bottom: 0;
  left: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  padding: 6px 8px calc(6px + env(safe-area-inset-bottom));
  border-top: 1px solid #e1e5eb;
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 -4px 18px rgba(14, 33, 56, 0.06);
}

.bottom-nav button {
  display: flex;
  min-width: 0;
  min-height: 56px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 11px;
  font-weight: 700;
}

.bottom-nav button.is-active {
  color: var(--red);
}

@media (min-width: 720px) {
  .bottom-nav {
    right: 50%;
    bottom: 16px;
    left: auto;
    width: min(520px, calc(100vw - 32px));
    padding: 6px;
    transform: translateX(50%);
    border: 1px solid #e1e5eb;
    border-radius: 999px;
  }

  .bottom-nav button {
    min-height: 46px;
    flex-direction: row;
    gap: 8px;
    border-radius: 999px;
    font-size: 13px;
  }
}
</style>
