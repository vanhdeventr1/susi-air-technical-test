import { Injectable } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface ScheduleEntry {
  duty_date: string;
  [key: string]: unknown;
}

interface ScheduleData {
  today: string;
  legend: Array<Record<string, unknown>>;
  schedules: ScheduleEntry[];
}

@Injectable()
export class SchedulesService {
  private readonly data: ScheduleData;

  constructor() {
    const filePath = join(
      __dirname,
      '..',
      '..',
      'database',
      'mock-schedules.json',
    );
    this.data = JSON.parse(readFileSync(filePath, 'utf-8')) as ScheduleData;
  }

  getSchedules(year: number, month: number) {
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}-`;

    return {
      year,
      month,
      today: this.data.today,
      legend: this.data.legend,
      schedules: this.data.schedules.filter((entry) =>
        entry.duty_date.startsWith(monthPrefix),
      ),
    };
  }
}
