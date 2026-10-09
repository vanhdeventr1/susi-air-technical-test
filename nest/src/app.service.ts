import { Injectable } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

@Injectable()
export class AppService {
  private readonly documents: unknown;
  private readonly flightHours: unknown;
  private readonly schedules: unknown;

  constructor() {
    const databasePath = join(process.cwd(), 'src', 'database');

    this.documents = this.loadJson(join(databasePath, 'mock-documents.json'));

    this.flightHours = this.loadJson(
      join(databasePath, 'mock-flight-hours.json'),
    );

    this.schedules = this.loadJson(join(databasePath, 'mock-schedules.json'));
  }

  private loadJson(filePath: string): unknown {
    const content: string = readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as unknown;
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
