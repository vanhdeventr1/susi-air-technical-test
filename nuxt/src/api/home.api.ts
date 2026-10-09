export type FlightHoursRange = '1w' | '1m' | '3m' | '6m' | '1y';

export interface LimitSummaryCard {
  currentHours: number;
  limit: number;
  windowDays: number;
  utilizationPercent: number;
  isOverLimit: boolean;
}

export interface FlightHoursSummary {
  range: FlightHoursRange;
  today: string;
  windowDays: number;
  displayRangeDays: number;
  displayStartDate: string;
  displayEndDate: string;
  daysBeforeToday: number;
  daysAfterToday: number;
  limit: number;
  max: number;
  summaryCards: {
    daily: LimitSummaryCard;
    weekly: LimitSummaryCard;
    monthly: LimitSummaryCard;
    annual: LimitSummaryCard;
  };
  series: Array<{
    date: string;
    hours: number;
    dailyHours: number;
  }>;
}

export interface PilotDocuments {
  today: string;
  thresholds: {
    warningDays: number;
    comment: string;
  };
  documents: Array<{
    id: string;
    label: string;
    expiryDate: string;
    daysRemaining: number;
    status: 'safe' | 'soon' | 'expired';
  }>;
}

export interface PilotSchedule {
  id: string;
  duty_date: string;
  status: number;
  base_name: string;
  base_color: string;
  duty_type: string;
  count_schedules: number;
  count_logbooks: number;
}

export interface PilotSchedules {
  year: number;
  month: number;
  today: string;
  legend: Array<{ code: string; label: string; color: string }>;
  schedules: PilotSchedule[];
}

export function getFlightHoursSummary(
  apiBase: string,
  token: string,
  range: FlightHoursRange,
): Promise<FlightHoursSummary> {
  return $fetch<FlightHoursSummary>(
    `${apiBase}/flight-hours/summary?range=${range}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
}

export function getPilotDocuments(
  apiBase: string,
  token: string,
): Promise<PilotDocuments> {
  return $fetch<PilotDocuments>(`${apiBase}/documents`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getPilotSchedules(
  apiBase: string,
  token: string,
  year: number,
  month: number,
): Promise<PilotSchedules> {
  return $fetch<PilotSchedules>(
    `${apiBase}/schedules?year=${year}&month=${month}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
}