import { Injectable } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REVIEW_TODAY = '2026-05-15';

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

interface SourcePilotDocuments {
  thresholds: PilotDocuments['thresholds'];
  documents: Array<Pick<PilotDocuments['documents'][number], 'id' | 'label' | 'expiryDate'>>;
}

@Injectable()
export class DocumentsService {
  private readonly data: PilotDocuments;

  constructor() {
    const filePath = join(
      __dirname,
      '..',
      '..',
      'database',
      'mock-documents.json',
    );
    const data = JSON.parse(
      readFileSync(filePath, 'utf-8'),
    ) as SourcePilotDocuments;
    this.data = {
      today: REVIEW_TODAY,
      thresholds: data.thresholds,
      documents: data.documents.map((document) => {
        const daysRemaining = this.getDaysRemaining(document.expiryDate);
        const status =
          daysRemaining <= 0
            ? 'expired'
            : daysRemaining <= data.thresholds.warningDays
              ? 'soon'
              : 'safe';

        return { ...document, daysRemaining, status };
      }),
    };
  }

  private getDaysRemaining(expiryDate: string): number {
    const todayMilliseconds = Date.parse(`${REVIEW_TODAY}T00:00:00Z`);
    const expiryMilliseconds = Date.parse(`${expiryDate}T00:00:00Z`);
    return Math.floor((expiryMilliseconds - todayMilliseconds) / 86_400_000);
  }

  getDocuments(): PilotDocuments {
    return this.data;
  }
}
