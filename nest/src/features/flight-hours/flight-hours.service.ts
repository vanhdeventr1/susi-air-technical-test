import { BadRequestException, Injectable } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { FlightHoursRange } from './flight-hours.types';

const REVIEW_TODAY = '2026-05-15';
const CHART_DAYS_EACH_SIDE = 7;

export interface DailyFlightHour {
  date: string;
  hours: number;
}

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

interface ChartBounds {
  limit: number;
  max: number;
  windowDays: number;
  displayRangeDays: number;
}

interface FlightHoursData {
  limits: {
    daily: number;
    weekly: number;
    monthly: number;
    annual: number;
  };
  chartBounds: Record<FlightHoursRange, ChartBounds>;
  flightHours: DailyFlightHour[];
}

@Injectable()
export class FlightHoursService {
  private readonly data: FlightHoursData;
  private readonly hoursByDate: Map<string, number>;

  constructor() {
    const filePath = join(
      __dirname,
      '..',
      '..',
      'database',
      'mock-flight-hours.json',
    );
    this.data = JSON.parse(readFileSync(filePath, 'utf-8')) as FlightHoursData;
    this.hoursByDate = new Map(
      this.data.flightHours.map(({ date, hours }) => [date, hours]),
    );
  }

  getDailyHours(from: string, to: string): DailyFlightHour[] {
    if (from > to) {
      throw new BadRequestException(
        'The from date must be on or before the to date.',
      );
    }

    return this.data.flightHours.filter(
      (entry) => entry.date >= from && entry.date <= to,
    );
  }

  getRollingSummary(range: FlightHoursRange): FlightHoursSummary {
    const bounds = this.data.chartBounds[range];
    const displayStartDate = this.addDays(REVIEW_TODAY, -CHART_DAYS_EACH_SIDE);
    const displayEndDate = this.addDays(REVIEW_TODAY, CHART_DAYS_EACH_SIDE);
    const series: FlightHoursSummary['series'] = [];

    for (
      let dayOffset = -CHART_DAYS_EACH_SIDE;
      dayOffset <= CHART_DAYS_EACH_SIDE;
      dayOffset += 1
    ) {
      const date = this.addDays(REVIEW_TODAY, dayOffset);
      series.push({
        date,
        hours: this.sumWindow(date, bounds.windowDays),
        dailyHours: this.roundHours(this.hoursByDate.get(date) ?? 0),
      });
    }

    const limits = this.data.limits;

    return {
      range,
      today: REVIEW_TODAY,
      windowDays: bounds.windowDays,
      displayRangeDays: series.length,
      displayStartDate,
      displayEndDate,
      daysBeforeToday: CHART_DAYS_EACH_SIDE,
      daysAfterToday: CHART_DAYS_EACH_SIDE,
      limit: bounds.limit,
      max: bounds.max,
      summaryCards: {
        daily: this.createLimitSummaryCard(limits.daily, 1),
        weekly: this.createLimitSummaryCard(limits.weekly, 7),
        monthly: this.createLimitSummaryCard(limits.monthly, 30),
        annual: this.createLimitSummaryCard(limits.annual, 365),
      },
      series,
    };
  }

  private sumWindow(endDate: string, windowDays: number): number {
    let total = 0;

    for (let dayOffset = 0; dayOffset < windowDays; dayOffset += 1) {
      const date = this.addDays(endDate, -dayOffset);
      total += this.hoursByDate.get(date) ?? 0;
    }

    return this.roundHours(total);
  }

  private createLimitSummaryCard(
    limit: number,
    windowDays: number,
  ): LimitSummaryCard {
    const currentHours = this.sumWindow(REVIEW_TODAY, windowDays);

    return {
      currentHours,
      limit,
      windowDays,
      utilizationPercent: Math.round((currentHours / limit) * 1000) / 10,
      isOverLimit: currentHours > limit,
    };
  }

  private addDays(date: string, dayOffset: number): string {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day + dayOffset))
      .toISOString()
      .slice(0, 10);
  }

  private roundHours(hours: number): number {
    return Math.round((hours + Number.EPSILON) * 10) / 10;
  }
}
