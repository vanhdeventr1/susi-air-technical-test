<script setup lang="ts">
import { CircleAlert, Eye, EyeOff, Phone } from "@lucide/vue";

const auth = useAuthStore();
const username = ref("");
const password = ref("");
const showPassword = ref(false);
const isDev = import.meta.dev;
const logoUrl = "/susiair-logo.png";

const canSubmit = computed(
  () =>
    username.value.trim() !== "" && password.value !== "" && !auth.isLoading,
);

// Live clock (WIB + UTC). Set on mount only, so SSR and client markup match.
const now = ref<Date | null>(null);
let timer: ReturnType<typeof setInterval> | undefined;

function formatTime(zone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: zone,
  }).format(now.value!);
}

const wib = computed(() => (now.value ? formatTime("Asia/Jakarta") : "--:--"));
const utc = computed(() => (now.value ? formatTime("UTC") : "--:--"));
const today = computed(() =>
  now.value
    ? new Intl.DateTimeFormat("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Jakarta",
      }).format(now.value)
    : "",
);

onMounted(async () => {
  now.value = new Date();
  timer = setInterval(() => (now.value = new Date()), 15_000);
  await auth.restoreSession();
  if (auth.pilot) await navigateTo("/home");
});
onBeforeUnmount(() => clearInterval(timer));

async function submitLogin() {
  if (await auth.signIn(username.value, password.value)) {
    await navigateTo("/home");
  }
}
</script>

<template>
  <main class="login">
    <header class="ops">
      <div class="ops__brand">
        <img class="ops__logo" :src="logoUrl" alt="Susi Air" />
        <div class="ops__id">
          <p class="ops__title">Crew Operations</p>
          <p class="ops__date">{{ today || "&nbsp;" }}</p>
        </div>
      </div>

      <div class="ops__clock" aria-label="Current time">
        <div class="ops__time">
          <span class="ops__zone">WIB</span>
          <strong>{{ wib }}</strong>
        </div>
        <div class="ops__time">
          <span class="ops__zone">UTC</span>
          <strong>{{ utc }}</strong>
        </div>
      </div>
    </header>

    <div class="login__body">
      <section class="panel" aria-labelledby="login-title">
        <h1 id="login-title" class="panel__title">Pilot sign in</h1>
        <p class="panel__sub">
          Use the crew account issued by Flight Operations.
        </p>

        <p v-if="auth.errorMessage" class="alert" role="alert">
          <CircleAlert :size="20" :stroke-width="2" aria-hidden="true" />
          <span>{{ auth.errorMessage }}</span>
        </p>

        <form class="form" @submit.prevent="submitLogin">
          <div class="field">
            <label for="username">Username</label>
            <input
              id="username"
              v-model="username"
              :class="{ 'is-error': auth.errorMessage }"
              name="username"
              type="text"
              autocomplete="username"
              autocapitalize="none"
              spellcheck="false"
              required
              :disabled="auth.isLoading"
            />
          </div>

          <div class="field">
            <label for="password">Password</label>
            <div class="field__wrap">
              <input
                id="password"
                v-model="password"
                :class="{ 'is-error': auth.errorMessage }"
                name="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                required
                :disabled="auth.isLoading"
              />
              <button
                class="field__toggle"
                type="button"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                :aria-pressed="showPassword"
                @click="showPassword = !showPassword"
              >
                <EyeOff
                  v-if="showPassword"
                  :size="18"
                  :stroke-width="1.75"
                  aria-hidden="true"
                />
                <Eye
                  v-else
                  :size="18"
                  :stroke-width="1.75"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>

          <button class="btn btn--primary" type="submit" :disabled="!canSubmit">
            {{ auth.isLoading ? "Signing in…" : "Sign in" }}
          </button>
        </form>

        <a class="help" href="tel:+628112113080">
          <Phone :size="16" :stroke-width="1.75" aria-hidden="true" />
          <span>
            Can't sign in? Call Flight Ops
            <strong>+62 811 211 3080</strong>
          </span>
        </a>
      </section>
    </div>

    <footer class="login__foot">
      <span>PT. ASI Pudjiastuti Aviation</span>
      <span v-if="isDev" class="env">Development</span>
    </footer>
  </main>
</template>

<style scoped lang="scss">
// Uses the CSS variables from assets/scss/main.scss (:root), no SCSS imports needed.
$radius-card: 16px;
$radius-field: 12px;
$radius-pill: 999px;

.login {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;

  &__body {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 20px 16px 24px;

    @media (min-width: 768px) {
      align-items: center;
      padding-bottom: 64px;
    }
  }

  &__foot {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 16px;
    font-size: 12px;
    color: var(--text-secondary);
  }
}

// Operations header: logo + title on the left, live clock on the right
.ops {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: var(--navy);
  border-bottom: 3px solid var(--red);
  color: #fff;

  @media (min-width: 480px) {
    padding: 14px 20px;
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  // White chip so the logo stays readable on navy
  &__logo {
    display: block;
    flex: none;
    height: 36px;
    width: auto;
    padding: 5px 8px;
    border-radius: 8px;
    background: #fff;
    object-fit: contain;
  }

  &__title {
    margin: 0;
    font-size: 15px;
    font-weight: 800;
    white-space: nowrap;

    @media (min-width: 480px) {
      font-size: 16px;
    }
  }

  &__date {
    display: none;
    margin: 2px 0 0;
    font-size: 12px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.7);

    @media (min-width: 480px) {
      display: block;
    }
  }

  &__clock {
    display: flex;
    flex: none;
    gap: 14px;
  }

  &__time {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    line-height: 1.15;

    strong {
      font-size: 17px;
      font-weight: 800;
      font-variant-numeric: tabular-nums;
    }
  }

  &__zone {
    font-size: 11px;
    font-weight: 700;
    color: var(--chart-accent);
  }
}

.panel {
  width: 100%;
  max-width: 400px;
  padding: 24px 20px;
  background: var(--surface);
  border-radius: $radius-card;
  box-shadow:
    0 1px 2px rgba(14, 33, 56, 0.06),
    0 8px 24px rgba(14, 33, 56, 0.06);

  @media (min-width: 480px) {
    padding: 32px;
  }

  &__title {
    margin: 0;
    font-size: 24px;
    font-weight: 800;
  }

  &__sub {
    margin: 4px 0 24px;
    font-size: 14px;
    color: var(--text-secondary);
  }
}

.alert {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin: 0 0 20px;
  padding: 12px 14px;
  border: 1px solid rgba(230, 55, 87, 0.35);
  border-radius: $radius-field;
  background: rgba(230, 55, 87, 0.08);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;

  svg {
    flex: none;
    margin-top: 1px;
    color: var(--danger);
  }
}

.form {
  display: grid;
  gap: 16px;
}

.field {
  label {
    display: block;
    margin-bottom: 6px;
    font-size: 13px;
    font-weight: 600;
  }

  input {
    width: 100%;
    height: 48px;
    padding: 0 14px;
    border: 1.5px solid transparent;
    border-radius: $radius-field;
    background: var(--background);
    color: var(--navy);
    font-size: 16px; // avoids iOS zoom
    font-weight: 500;
    outline: 0;
    transition:
      border-color 0.15s,
      background-color 0.15s;

    &:focus {
      border-color: var(--navy);
      background: var(--surface);
    }
    &.is-error {
      border-color: var(--danger);
      background: var(--surface);
    }
    &:disabled {
      opacity: 0.6;
      cursor: wait;
    }
  }

  &__wrap {
    position: relative;

    input {
      padding-right: 48px;
    }
  }

  &__toggle {
    position: absolute;
    top: 50%;
    right: 8px;
    transform: translateY(-50%);
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border: 0;
    border-radius: $radius-pill;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;

    &:hover {
      color: var(--navy);
    }
  }
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 52px;
  border: 0;
  border-radius: $radius-pill;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition:
    background-color 0.15s,
    opacity 0.15s;

  & + & {
    margin-top: 10px;
  }

  &--primary {
    margin-top: 8px;
    background: var(--red);
    color: #fff;

    &:hover:not(:disabled) {
      background: var(--red-dark);
    }
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &--ghost {
    background: transparent;
    border: 1.5px solid var(--border);
    color: var(--navy);

    &:hover {
      background: var(--background);
    }
  }
}

// Centered help line
.help {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
  font-size: 13px;
  line-height: 1.5;
  text-align: center;
  color: var(--text-secondary);
  text-decoration: none;

  svg {
    flex: none;
    color: var(--navy);
  }

  strong {
    color: var(--navy);
    font-weight: 800;
    white-space: nowrap;
  }
}

.pilot {
  display: flex;
  align-items: center;
  gap: 14px;

  &__avatar {
    width: 56px;
    height: 56px;
    border-radius: $radius-pill;
    object-fit: cover;
    background: var(--background);
  }

  &__name {
    margin: 0 0 2px;
    font-size: 20px;
    font-weight: 800;
    line-height: 1.2;
  }
}

.status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);

  i {
    width: 8px;
    height: 8px;
    border-radius: $radius-pill;
    background: var(--success);
  }
}

.stat {
  margin: 24px 0 16px;
  padding: 16px;
  border-radius: $radius-field;
  background: var(--background);

  dt {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary);
  }

  dd {
    margin: 4px 0 0;
    font-size: 36px;
    font-weight: 800;
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
  }
}

.env {
  padding: 2px 8px;
  border-radius: $radius-pill;
  background: rgba(245, 158, 11, 0.15);
  color: #92600a;
  font-weight: 700;
}
</style>
