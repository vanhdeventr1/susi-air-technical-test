import { defineStore } from 'pinia';
import {
  getApiErrorMessage,
  getPilotProfile,
  login,
  type PilotProfile,
} from '../api/auth.api';

export const useAuthStore = defineStore('auth', () => {
  const config = useRuntimeConfig();
  const apiBase = String(config.public.apiBase).replace(/\/$/, '');
  const accessToken = useCookie<string | null>('pilot_access_token', {
    sameSite: 'strict',
    secure: import.meta.env.PROD,
    maxAge: 60 * 60 * 24,
    default: () => null,
  });
  const pilot = ref<PilotProfile | null>(null);
  const isLoading = ref(false);
  const errorMessage = ref('');

  async function signIn(username: string, password: string): Promise<boolean> {
    isLoading.value = true;
    errorMessage.value = '';

    try {
      const result = await login(apiBase, {
        username: username.trim(),
        password,
      });
      accessToken.value = result.access_token;
      pilot.value = await getPilotProfile(apiBase, result.access_token);
      return true;
    } catch (error: unknown) {
      accessToken.value = null;
      pilot.value = null;
      errorMessage.value = getApiErrorMessage(error);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function restoreSession(): Promise<void> {
    if (!accessToken.value) return;

    try {
      pilot.value = await getPilotProfile(apiBase, accessToken.value);
    } catch {
      signOut();
    }
  }

  function signOut(): void {
    accessToken.value = null;
    pilot.value = null;
    errorMessage.value = '';
  }

  return {
    accessToken,
    pilot,
    isLoading,
    errorMessage,
    signIn,
    restoreSession,
    signOut,
  };
});