export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface Medication {
  id: string;
  name: string;
  defaultDosage: string;
  instructions: string;
}

export interface RefillStatus {
  daysSupplyRemaining: number;
  refillNeeded: boolean;
  pharmacy: string;
}

export type DoseStatus = 'PENDING' | 'TAKEN' | 'MISSED' | 'SKIPPED';

export interface Reminder {
  id: string;
  scheduledFor: string;
  status: DoseStatus;
  confirmedAt: string | null;
  dosage: string;
  medication: {
    id: string;
    name: string;
    instructions: string;
  };
  refillStatus: RefillStatus;
}

export interface TodayReminders {
  userId: string;
  reminders: Reminder[];
}

export interface Schedule {
  id: string;
  userId: string;
  medicationId: string;
  dosage: string;
  timesOfDay: string[];
  daysOfWeek: number[] | null;
  startDate: string;
  endDate: string | null;
  active: boolean;
  medication: Medication;
}

// Adherence — endpoint to be implemented as Challenge 3
export interface MedicationAdherence {
  medicationId: string;
  medicationName: string;
  scheduled: number;
  taken: number;
  adherencePct: number;
}

export interface AdherenceResponse {
  userId: string;
  windowDays: number;
  overallAdherencePct: number;
  currentStreakDays: number;
  byMedication: MedicationAdherence[];
}
