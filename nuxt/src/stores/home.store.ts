import { defineStore } from 'pinia';
import {
  getFlightHoursSummary,
  getPilotDocuments,
  getPilotSchedules,
  type FlightHoursRange,
  type FlightHoursSummary,
  type PilotDocuments,
  type PilotSchedules,
} from '../api/home.api';

export const useHomeStore = defineStore('home', () => {
  const config = useRuntimeConfig();
  const apiBase = String(config.public.apiBase).replace(/\/$/, '');
  const summary = ref<FlightHoursSummary | null>(null);
  const documents = ref<PilotDocuments | null>(null);
  const schedules = ref<PilotSchedules | null>(null);
  const selectedRange = ref<FlightHoursRange>('1w');
  const isLoading = ref(false);
  const isRangeLoading = ref(false);
  const isScheduleLoading = ref(false);
  const errorMessage = ref('');
  const scheduleErrorMessage = ref('');

  async function load(token: string): Promise<void> {
    isLoading.value = true;
    errorMessage.value = '';

    try {
      const [nextSummary, nextDocuments, nextSchedules] = await Promise.all([
        getFlightHoursSummary(apiBase, token, selectedRange.value),
        getPilotDocuments(apiBase, token),
        getPilotSchedules(apiBase, token, 2026, 5),
      ]);
      summary.value = nextSummary;
      documents.value = nextDocuments;
      schedules.value = nextSchedules;
    } catch {
      errorMessage.value =
        'Home data could not be loaded. Check the connection and try again.';
    } finally {
      isLoading.value = false;
    }
  }

  async function selectRange(
    token: string,
    range: FlightHoursRange,
  ): Promise<void> {
    if (range === selectedRange.value) return;

    selectedRange.value = range;
    isRangeLoading.value = true;
    errorMessage.value = '';

    try {
      summary.value = await getFlightHoursSummary(apiBase, token, range);
    } catch {
      errorMessage.value = 'The flight-hours chart could not be refreshed.';
    } finally {
      isRangeLoading.value = false;
    }
  }

  async function loadSchedules(
    token: string,
    year: number,
    month: number,
  ): Promise<void> {
    isScheduleLoading.value = true;
    scheduleErrorMessage.value = '';

    try {
      schedules.value = await getPilotSchedules(apiBase, token, year, month);
    } catch {
      scheduleErrorMessage.value =
        'The schedule could not be loaded. Check the connection and try again.';
    } finally {
      isScheduleLoading.value = false;
    }
  }

  return {
    summary,
    documents,
    schedules,
    selectedRange,
    isLoading,
    isRangeLoading,
    isScheduleLoading,
    errorMessage,
    scheduleErrorMessage,
    load,
    selectRange,
    loadSchedules,
  };
});