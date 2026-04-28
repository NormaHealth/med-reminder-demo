import { useEffect, useState } from 'react';

interface ClockProps {
  simulatedNow: Date;
  onChange: (next: Date) => void;
}

function formatLong(d: Date) {
  return d.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatTimeInputValue(d: Date) {
  // <input type="time"> wants "HH:mm" in local time.
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function formatOffset(offsetMs: number): string {
  const abs = Math.abs(offsetMs);
  const sign = offsetMs >= 0 ? '+' : '-';
  const totalMinutes = Math.round(abs / 60_000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0 && m === 0) return 'live (matches real time)';
  if (h === 0) return `${sign}${m}m from real time`;
  if (m === 0) return `${sign}${h}h from real time`;
  return `${sign}${h}h ${m}m from real time`;
}

export function Clock({ simulatedNow, onChange }: ClockProps) {
  // Keep a ticking real-time reference so the offset label stays accurate
  // even when the user isn't interacting.
  const [realNow, setRealNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setRealNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const offsetMs = simulatedNow.getTime() - realNow.getTime();
  const isLive = Math.abs(offsetMs) < 60_000;

  const bump = (deltaMinutes: number) => {
    const next = new Date(simulatedNow.getTime() + deltaMinutes * 60_000);
    onChange(next);
  };

  const reset = () => onChange(new Date());

  const handleTimeInput = (value: string) => {
    if (!value) return;
    const [hh, mm] = value.split(':').map((s) => parseInt(s, 10));
    if (Number.isNaN(hh) || Number.isNaN(mm)) return;
    const next = new Date(simulatedNow);
    next.setHours(hh, mm, 0, 0);
    onChange(next);
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="font-semibold text-slate-900 text-lg">
              Simulated Clock
            </h3>
          </div>
          <div className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
            {formatLong(simulatedNow)}
          </div>
          <div
            className={`text-xs mt-1 ${
              isLive ? 'text-emerald-600' : 'text-amber-600'
            }`}
          >
            {isLive ? '● live (matches real time)' : `● ${formatOffset(offsetMs)}`}
          </div>
          <p className="text-xs text-slate-500 mt-2 max-w-md">
            Scrub time to see reminders fire. Backend always sees the real
            clock; this only changes the UI's view of "now".
          </p>
        </div>

        <div className="flex flex-col gap-3 min-w-[260px]">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 whitespace-nowrap">
              Jump to time
            </label>
            <input
              type="time"
              value={formatTimeInputValue(simulatedNow)}
              onChange={(e) => handleTimeInput(e.target.value)}
              className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded-lg
                         font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="grid grid-cols-5 gap-1">
            <StepButton onClick={() => bump(-60)}>-1h</StepButton>
            <StepButton onClick={() => bump(-15)}>-15m</StepButton>
            <StepButton onClick={() => bump(15)}>+15m</StepButton>
            <StepButton onClick={() => bump(60)}>+1h</StepButton>
            <StepButton onClick={() => bump(240)}>+4h</StepButton>
          </div>
          <button
            onClick={reset}
            disabled={isLive}
            className="px-3 py-1.5 text-sm font-medium rounded-lg border
                       bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100
                       disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Reset to real time
          </button>
        </div>
      </div>
    </div>
  );
}

function StepButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="px-2 py-1.5 text-sm font-medium rounded-lg border border-slate-300
                 bg-white text-slate-700 hover:bg-slate-50 transition-colors
                 font-mono tabular-nums"
    >
      {children}
    </button>
  );
}
