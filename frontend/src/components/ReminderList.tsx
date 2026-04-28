import { useState } from 'react';
import type { Reminder } from '../types';
import { confirmReminder, snoozeReminder } from '../api';

interface ReminderListProps {
  reminders: Reminder[];
  loading: boolean;
  onConfirmed: () => void;
  simulatedNow: Date;
}

const SNOOZE_MINUTES = 15;
const FIRING_GRACE_MS = 30 * 60_000; // 30 min after scheduled = firing window

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatRelative(deltaMs: number): string {
  const abs = Math.abs(deltaMs);
  const totalMinutes = Math.round(abs / 60_000);
  if (totalMinutes < 1) return 'now';
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

type DisplayState =
  | { kind: 'UPCOMING'; minutesUntil: number }
  | { kind: 'FIRING'; minutesSince: number }
  | { kind: 'OVERDUE'; minutesSince: number }
  | { kind: 'TAKEN' }
  | { kind: 'MISSED' }
  | { kind: 'SKIPPED' };

function computeDisplayState(r: Reminder, simulatedNow: Date): DisplayState {
  if (r.status === 'TAKEN') return { kind: 'TAKEN' };
  if (r.status === 'MISSED') return { kind: 'MISSED' };
  if (r.status === 'SKIPPED') return { kind: 'SKIPPED' };
  // PENDING — derive from clock
  const scheduledMs = new Date(r.scheduledFor).getTime();
  const nowMs = simulatedNow.getTime();
  const delta = nowMs - scheduledMs;
  if (delta < 0) {
    return { kind: 'UPCOMING', minutesUntil: Math.round(-delta / 60_000) };
  }
  if (delta < FIRING_GRACE_MS) {
    return { kind: 'FIRING', minutesSince: Math.round(delta / 60_000) };
  }
  return { kind: 'OVERDUE', minutesSince: Math.round(delta / 60_000) };
}

const badgeStyle: Record<DisplayState['kind'], string> = {
  UPCOMING: 'bg-slate-50 text-slate-600 border-slate-200',
  FIRING: 'bg-amber-100 text-amber-800 border-amber-300 ring-2 ring-amber-200',
  OVERDUE: 'bg-rose-50 text-rose-700 border-rose-200',
  TAKEN: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  MISSED: 'bg-rose-50 text-rose-700 border-rose-200',
  SKIPPED: 'bg-slate-100 text-slate-600 border-slate-200',
};

function badgeText(s: DisplayState): string {
  switch (s.kind) {
    case 'UPCOMING':
      return `UPCOMING in ${formatRelative(s.minutesUntil * 60_000)}`;
    case 'FIRING':
      return `🔔 FIRING NOW${s.minutesSince > 0 ? ` (${s.minutesSince}m)` : ''}`;
    case 'OVERDUE':
      return `⚠ OVERDUE by ${formatRelative(s.minutesSince * 60_000)}`;
    case 'TAKEN':
      return 'TAKEN';
    case 'MISSED':
      return 'MISSED';
    case 'SKIPPED':
      return 'SKIPPED';
  }
}

export function ReminderList({
  reminders,
  loading,
  onConfirmed,
  simulatedNow,
}: ReminderListProps) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [snoozingId, setSnoozingId] = useState<string | null>(null);
  const [snoozeLocked, setSnoozeLocked] = useState<Record<string, boolean>>({});

  const handleConfirm = async (id: string) => {
    setPendingId(id);
    try {
      await confirmReminder(id);
      onConfirmed();
    } finally {
      setPendingId(null);
    }
  };

  const handleSnooze = async (id: string) => {
    setSnoozingId(id);
    try {
      const res = await snoozeReminder(id, SNOOZE_MINUTES);
      if (res.ok) {
        onConfirmed();
      } else {
        // Endpoint not implemented (404) or rejecting our payload — lock the
        // button for this row and surface the 🔒 indicator. Clears on refresh.
        setSnoozeLocked((prev) => ({ ...prev, [id]: true }));
      }
    } catch {
      setSnoozeLocked((prev) => ({ ...prev, [id]: true }));
    } finally {
      setSnoozingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-white rounded-xl p-5 border border-slate-200">
            <div className="space-y-2">
              <div className="h-5 bg-slate-200 rounded w-32"></div>
              <div className="h-4 bg-slate-100 rounded w-48"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (reminders.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
        <div className="text-slate-400 text-lg">No reminders today</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reminders.map((r) => {
        const display = computeDisplayState(r, simulatedNow);
        const isFiring = display.kind === 'FIRING';
        return (
        <div
          key={r.id}
          className={`bg-white rounded-xl p-5 border transition-all duration-150
                     ${isFiring
                       ? 'border-amber-300 shadow-md shadow-amber-100'
                       : 'border-slate-200 hover:border-slate-300'}`}
        >
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="font-mono text-2xl font-semibold text-slate-900">
                  {formatTime(r.scheduledFor)}
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeStyle[display.kind]}`}
                >
                  {badgeText(display)}
                </span>
              </div>
              <h3 className="font-semibold text-slate-900 text-lg mt-2">
                {r.medication.name}
                <span className="ml-2 font-mono text-sm text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                  {r.dosage}
                </span>
              </h3>
              <p className="text-sm text-slate-500 mt-1">{r.medication.instructions}</p>
              {r.refillStatus.refillNeeded && (
                <p className="text-xs text-amber-700 mt-2">
                  Refill needed — {r.refillStatus.daysSupplyRemaining} days left at {r.refillStatus.pharmacy}
                </p>
              )}
            </div>
            {r.status === 'PENDING' && (
              <div className="flex flex-col gap-2 items-stretch">
                <button
                  onClick={() => handleConfirm(r.id)}
                  disabled={pendingId === r.id}
                  className="px-3 py-1.5 bg-teal-600 text-white text-sm font-medium rounded-lg
                             hover:bg-teal-700 disabled:opacity-50 transition-colors"
                >
                  {pendingId === r.id ? 'Saving...' : 'Mark taken'}
                </button>
                {snoozeLocked[r.id] ? (
                  <button
                    disabled
                    title="Endpoint not implemented yet — Challenge 2"
                    className="px-3 py-1.5 bg-slate-100 text-slate-400 text-sm font-medium rounded-lg
                               border border-dashed border-slate-300 cursor-not-allowed"
                  >
                    🔒 Snooze (C2)
                  </button>
                ) : (
                  <button
                    onClick={() => handleSnooze(r.id)}
                    disabled={snoozingId === r.id}
                    className="px-3 py-1.5 bg-white text-slate-700 text-sm font-medium rounded-lg
                               border border-slate-300 hover:bg-slate-50
                               disabled:opacity-50 transition-colors"
                  >
                    {snoozingId === r.id ? 'Snoozing...' : `Snooze ${SNOOZE_MINUTES}m`}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        );
      })}
    </div>
  );
}
