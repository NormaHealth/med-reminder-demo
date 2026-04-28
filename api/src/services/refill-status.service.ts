import { Injectable } from '@nestjs/common';

export interface RefillStatus {
  daysSupplyRemaining: number;
  refillNeeded: boolean;
  pharmacy: string;
}

@Injectable()
export class RefillStatusService {
  private readonly statuses: Record<string, RefillStatus> = {
    Lisinopril: { daysSupplyRemaining: 4, refillNeeded: true, pharmacy: 'CVS' },
    Metformin: { daysSupplyRemaining: 22, refillNeeded: false, pharmacy: 'CVS' },
    Atorvastatin: { daysSupplyRemaining: 3, refillNeeded: true, pharmacy: 'Walgreens' },
    Omeprazole: { daysSupplyRemaining: 18, refillNeeded: false, pharmacy: 'Walgreens' },
    Amlodipine: { daysSupplyRemaining: 11, refillNeeded: false, pharmacy: 'CVS' },
    Levothyroxine: { daysSupplyRemaining: 2, refillNeeded: true, pharmacy: 'Rite Aid' },
    Warfarin: { daysSupplyRemaining: 14, refillNeeded: false, pharmacy: 'CVS' },
  };

  async getStatus(medicationName: string): Promise<RefillStatus> {
    const status = this.statuses[medicationName];
    if (!status) {
      throw new Error(`Refill status not found for medication: ${medicationName}`);
    }
    return status;
  }
}
