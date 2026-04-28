import { useState } from 'react';
import { API_BASE_URL } from '../api';

type CheckState = 'idle' | 'running' | 'pass' | 'fail';

interface CheckResult {
  state: CheckState;
  detail: string;
}

interface ChallengeStatusProps {
  userId: string | null;
}

const INITIAL: Record<string, CheckResult> = {
  c1: { state: 'idle', detail: 'Not run yet' },
  c2: { state: 'idle', detail: 'Not run yet' },
  c3: { state: 'idle', detail: 'Not run yet' },
};

export function ChallengeStatus({ userId }: ChallengeStatusProps) {
  const [results, setResults] = useState<Record<string, CheckResult>>(INITIAL);
  const [running, setRunning] = useState(false);

  const update = (key: string, result: CheckResult) =>
    setResults((prev) => ({ ...prev, [key]: result }));

  const runChecks = async () => {
    if (!userId) return;
    setRunning(true);
    setResults({
      c1: { state: 'running', detail: 'Probing confirm endpoint...' },
      c2: { state: 'idle', detail: 'Waiting...' },
      c3: { state: 'idle', detail: 'Waiting...' },
    });

    // Challenge 1: confirm on a fake reminder ID should be 4xx, not 200
    try {
      const res = await fetch(
        `${API_BASE_URL}/reminders/__nonexistent__/confirm`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' } },
      );
      if (res.status >= 400 && res.status < 500) {
        update('c1', {
          state: 'pass',
          detail: `Confirm on missing reminder returned ${res.status}.`,
        });
      } else {
        update('c1', {
          state: 'fail',
          detail: `Expected 4xx for missing reminder, got ${res.status}.`,
        });
      }
    } catch (e) {
      update('c1', {
        state: 'fail',
        detail: `Request failed: ${(e as Error).message}`,
      });
    }

    // Challenge 2: snooze a firing reminder by 30 min, verify scheduledFor
    // advanced; then verify a bad payload is rejected with 4xx.
    //
    // The probe drives the simulated clock itself: it picks a daily schedule
    // for this user, computes a `now` 5 min after one of the schedule's fire
    // times, and queries /reminders/firing?now=<that> — which lazy-creates a
    // PENDING dose in the firing window.
    update('c2', { state: 'running', detail: 'Probing snooze endpoint...' });
    try {
      const schedRes = await fetch(`${API_BASE_URL}/users/${userId}/schedules`);
      if (!schedRes.ok) {
        update('c2', {
          state: 'fail',
          detail: `Could not load schedules (${schedRes.status}).`,
        });
        setRunning(false);
        return;
      }
      const schedules: Array<{
        id: string;
        timesOfDay: string[];
        daysOfWeek: number[] | null;
      }> = await schedRes.json();
      const today = new Date();
      const dailySchedule = schedules.find(
        (s) =>
          (s.daysOfWeek === null || s.daysOfWeek.includes(today.getDay())) &&
          s.timesOfDay.length > 0,
      );
      if (!dailySchedule) {
        update('c2', {
          state: 'fail',
          detail: 'No active schedule fires today for this patient.',
        });
        setRunning(false);
        return;
      }
      const [hh, mm] = dailySchedule.timesOfDay[0].split(':').map(Number);
      const fireAt = new Date(today);
      fireAt.setHours(hh, mm, 0, 0);
      // 5 min after the schedule fires — well inside the 30-min firing window.
      const probeNow = new Date(fireAt.getTime() + 5 * 60_000);
      const firingUrl = `${API_BASE_URL}/users/${userId}/reminders/firing?now=${encodeURIComponent(
        probeNow.toISOString(),
      )}`;
      const firingRes = await fetch(firingUrl);
      if (!firingRes.ok) {
        update('c2', {
          state: 'fail',
          detail: `GET /reminders/firing returned ${firingRes.status}.`,
        });
        setRunning(false);
        return;
      }
      const firingBody = await firingRes.json();
      const reminders: Array<{
        id: string;
        status: string;
        scheduledFor: string;
      }> = firingBody.reminders ?? [];
      const target = reminders.find((r) => r.status === 'PENDING');
      if (!target) {
        update('c2', {
          state: 'fail',
          detail:
            'Firing endpoint returned no PENDING reminder for the probed time.',
        });
        setRunning(false);
        return;
      }
      {
          const originalMs = new Date(target.scheduledFor).getTime();
          const snoozeMinutes = 30;
          const happyRes = await fetch(
            `${API_BASE_URL}/reminders/${target.id}/snooze`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ minutes: snoozeMinutes }),
            },
          );
          if (!happyRes.ok) {
            update('c2', {
              state: 'fail',
              detail: `POST /reminders/:id/snooze returned ${happyRes.status} (expected 2xx).`,
            });
          } else {
            const happyBody = await happyRes.json();
            const newMs = happyBody?.scheduledFor
              ? new Date(happyBody.scheduledFor).getTime()
              : NaN;
            const expectedDeltaMs = snoozeMinutes * 60 * 1000;
            const drift = Math.abs(newMs - originalMs - expectedDeltaMs);
            const advancedOk = Number.isFinite(newMs) && drift <= 60_000;
            if (!advancedOk) {
              update('c2', {
                state: 'fail',
                detail: `scheduledFor did not advance by ~${snoozeMinutes} min (drift ${Math.round(drift / 1000)}s).`,
              });
            } else {
              // Negative test: out-of-range minutes must be rejected with 4xx.
              const badRes = await fetch(
                `${API_BASE_URL}/reminders/${target.id}/snooze`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ minutes: 9999 }),
                },
              );
              if (badRes.status >= 400 && badRes.status < 500) {
                update('c2', {
                  state: 'pass',
                  detail: `Snooze advanced scheduledFor by ${snoozeMinutes}m; out-of-range payload rejected with ${badRes.status}.`,
                });
              } else {
                update('c2', {
                  state: 'fail',
                  detail: `Out-of-range minutes (9999) returned ${badRes.status}; expected 4xx.`,
                });
              }
            }
          }
      }
    } catch (e) {
      update('c2', {
        state: 'fail',
        detail: `Request failed: ${(e as Error).message}`,
      });
    }

    // Challenge 3: GET adherence endpoint should exist and return required shape
    update('c3', { state: 'running', detail: 'Checking adherence endpoint...' });
    try {
      const res = await fetch(`${API_BASE_URL}/users/${userId}/adherence`);
      if (!res.ok) {
        update('c3', {
          state: 'fail',
          detail: `Endpoint returned ${res.status}.`,
        });
      } else {
        const body = await res.json();
        const shapeOk =
          body &&
          typeof body.overallAdherencePct === 'number' &&
          typeof body.currentStreakDays === 'number' &&
          typeof body.windowDays === 'number' &&
          Array.isArray(body.byMedication) &&
          body.byMedication.every(
            (m: { medicationId?: unknown; adherencePct?: unknown; taken?: unknown; scheduled?: unknown }) =>
              typeof m.medicationId === 'string' &&
              typeof m.adherencePct === 'number' &&
              typeof m.taken === 'number' &&
              typeof m.scheduled === 'number',
          );
        if (shapeOk) {
          update('c3', {
            state: 'pass',
            detail: `Endpoint OK — overall ${body.overallAdherencePct.toFixed(0)}%, ${body.byMedication.length} meds.`,
          });
        } else {
          update('c3', {
            state: 'fail',
            detail: 'Response shape did not match the expected AdherenceResponse contract.',
          });
        }
      }
    } catch (e) {
      update('c3', {
        state: 'fail',
        detail: `Request failed: ${(e as Error).message}`,
      });
    }

    setRunning(false);
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-900 text-lg">Challenge Status</h3>
          <p className="text-sm text-slate-500">
            Probes the API to verify each challenge is complete.
          </p>
        </div>
        <button
          onClick={runChecks}
          disabled={!userId || running}
          className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg
                     hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors"
        >
          {running ? 'Running...' : 'Run checks'}
        </button>
      </div>

      {!userId && (
        <p className="text-sm text-slate-400 italic">Select a patient first.</p>
      )}

      <div className="space-y-2 mt-4">
        <CheckRow
          id="C1"
          title="Bug fix — confirm endpoint returns proper error status"
          result={results.c1}
        />
        <CheckRow
          id="C2"
          title="Snooze — POST /reminders/:id/snooze with validation"
          result={results.c2}
        />
        <CheckRow
          id="C3"
          title="Adherence — GET /users/:id/adherence implemented"
          result={results.c3}
        />
      </div>
    </div>
  );
}

function CheckRow({
  id,
  title,
  result,
}: {
  id: string;
  title: string;
  result: CheckResult;
}) {
  const icon = {
    idle: '○',
    running: '…',
    pass: '✓',
    fail: '✗',
  }[result.state];
  const color = {
    idle: 'text-slate-400 border-slate-200 bg-slate-50',
    running: 'text-amber-600 border-amber-200 bg-amber-50',
    pass: 'text-emerald-600 border-emerald-200 bg-emerald-50',
    fail: 'text-rose-600 border-rose-200 bg-rose-50',
  }[result.state];
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${color}`}>
      <span className="font-mono text-lg leading-none mt-0.5">{icon}</span>
      <div className="flex-1">
        <div className="text-sm font-medium text-slate-900">
          <span className="font-mono text-xs text-slate-500 mr-2">{id}</span>
          {title}
        </div>
        <div className="text-xs text-slate-600 mt-1">{result.detail}</div>
      </div>
    </div>
  );
}
