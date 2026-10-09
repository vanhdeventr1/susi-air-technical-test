export const FLIGHT_HOURS_RANGES = ['1w', '1m', '3m', '6m', '1y'] as const;
export type FlightHoursRange = (typeof FLIGHT_HOURS_RANGES)[number];
