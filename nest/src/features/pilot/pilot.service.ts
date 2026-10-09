import { Injectable } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const PILOT_AVATAR_URL =
  'https://ui-avatars.com/api/?name=John+Doe&background=0D8ABC&color=fff';

interface PilotData {
  pilot: {
    name: string;
    totalFlightHours: number;
  };
}

@Injectable()
export class PilotService {
  private readonly pilot: PilotData['pilot'];

  constructor() {
    const filePath = join(
      __dirname,
      '..',
      '..',
      'database',
      'mock-flight-hours.json',
    );
    const data = JSON.parse(readFileSync(filePath, 'utf-8')) as PilotData;
    this.pilot = data.pilot;
  }

  getProfile(): {
    name: string;
    totalFlightHours: number;
    avatarUrl: string;
  } {
    return {
      ...this.pilot,
      avatarUrl: process.env.PILOT_AVATAR_URL ?? PILOT_AVATAR_URL,
    };
  }
}
