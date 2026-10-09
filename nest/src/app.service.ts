import { Injectable } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REVIEW_TODAY = '2026-05-15';

@Injectable()
export class AppService {
  private readonly documents: Record<string, unknown>;
  private readonly flightHours: unknown;
  private readonly schedules: unknown;

  constructor() {
    const databasePath = join(__dirname, 'database');

    const documents = this.loadJson<Record<string, unknown>>(
      join(databasePath, 'mock-documents.json'),
    );
    this.documents = { ...documents, today: REVIEW_TODAY };

    this.flightHours = this.loadJson(
      join(databasePath, 'mock-flight-hours.json'),
    );

    this.schedules = this.loadJson(join(databasePath, 'mock-schedules.json'));
  }

  private loadJson<T>(filePath: string): T {
    const content: string = readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  }

  getDocuments(): unknown {
    return this.documents;
  }

  getFlightHours(): unknown {
    return this.flightHours;
  }

  getSchedules(): unknown {
    return this.schedules;
  }
}
