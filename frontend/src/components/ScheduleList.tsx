import type { Schedule } from '../types';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface ScheduleListProps {
  schedules: Schedule[];
  loading: boolean;
}

export function ScheduleList({ schedules, loading }: ScheduleListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse bg-white rounded-xl p-5 border border-slate-200">
            <div className="h-5 bg-slate-200 rounded w-40"></div>
            <div className="h-4 bg-slate-100 rounded w-48 mt-2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (schedules.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
        <div className="text-slate-400">No schedules</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {schedules.map((s) => (
        <div
          key={s.id}
          className="bg-white rounded-xl p-5 border border-slate-200"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-slate-900">
                {s.medication.name}
                <span className="ml-2 font-mono text-sm text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                  {s.dosage}
                </span>
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {s.timesOfDay.join(', ')} —{' '}
                {s.daysOfWeek
                  ? s.daysOfWeek.map((d) => DAY_LABELS[d]).join(', ')
                  : 'Daily'}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Started {new Date(s.startDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
