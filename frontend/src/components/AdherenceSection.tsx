import { useEffect, useState } from 'react';
import type { AdherenceResponse } from '../types';
import { fetchAdherence } from '../api';

interface AdherenceSectionProps {
  userId: string;
  refreshTrigger?: number;
}

export function AdherenceSection({ userId, refreshTrigger }: AdherenceSectionProps) {
  const [data, setData] = useState<AdherenceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchAdherence(userId);
        if (!cancelled) setData(res);
      } catch {
        if (!cancelled) {
          setError('Unable to load adherence data');
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [userId, refreshTrigger]);

  if (loading) {
    return (
      <div className="animate-pulse bg-white rounded-xl p-6 border border-slate-200">
        <div className="h-6 bg-slate-200 rounded w-32"></div>
        <div className="h-4 bg-slate-100 rounded w-48 mt-3"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full
                        bg-red-100 text-red-600 mb-3">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-red-800 font-medium">{error}</p>
        <p className="text-red-600 text-sm mt-1">
          The adherence endpoint may not be implemented yet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 space-y-5">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-3xl font-bold text-slate-900">
            {data.overallAdherencePct.toFixed(0)}%
          </div>
          <div className="text-sm text-slate-500">
            Overall adherence — last {data.windowDays} days
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-teal-700">
            {data.currentStreakDays}
          </div>
          <div className="text-xs text-slate-500">day streak</div>
        </div>
      </div>
      <div className="space-y-2">
        {data.byMedication.map((m) => (
          <div key={m.medicationId} className="flex items-center gap-3">
            <div className="flex-1 text-sm font-medium text-slate-700">
              {m.medicationName}
            </div>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500"
                style={{ width: `${m.adherencePct}%` }}
              />
            </div>
            <div className="text-xs font-mono text-slate-600 w-20 text-right">
              {m.taken}/{m.scheduled} ({m.adherencePct.toFixed(0)}%)
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
