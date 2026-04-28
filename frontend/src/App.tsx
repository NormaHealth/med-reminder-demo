import { useEffect, useState, useCallback } from 'react';
import type { User, Reminder, Schedule } from './types';
import { fetchUsers, fetchFiringReminders, fetchUserSchedules } from './api';
import { UserSelect } from './components/UserSelect';
import { ReminderList } from './components/ReminderList';
import { ScheduleList } from './components/ScheduleList';
import { AdherenceSection } from './components/AdherenceSection';
import { ChallengeStatus } from './components/ChallengeStatus';
import { Clock } from './components/Clock';

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingReminders, setLoadingReminders] = useState(false);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [simulatedNow, setSimulatedNow] = useState<Date>(() => new Date());

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchUsers();
        setUsers(data);
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        setLoadingUsers(false);
      }
    }
    load();
  }, []);

  // Schedules load once per user — they don't depend on the simulated clock.
  useEffect(() => {
    if (!selectedUserId) {
      setSchedules([]);
      return;
    }
    let cancelled = false;
    setLoadingSchedules(true);
    fetchUserSchedules(selectedUserId)
      .then((data) => {
        if (!cancelled) setSchedules(data);
      })
      .catch((err) => {
        console.error('Failed to load schedules:', err);
        if (!cancelled) setSchedules([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSchedules(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedUserId]);

  // Firing reminders refetch on every clock change OR after confirm/snooze.
  useEffect(() => {
    if (!selectedUserId) {
      setReminders([]);
      return;
    }
    let cancelled = false;
    setLoadingReminders(true);
    fetchFiringReminders(selectedUserId, simulatedNow)
      .then((res) => {
        if (!cancelled) setReminders(res.reminders || []);
      })
      .catch((err) => {
        console.error('Failed to load firing reminders:', err);
        if (!cancelled) setReminders([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingReminders(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedUserId, simulatedNow, refreshKey]);

  const handleConfirmed = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const selectedUser = users.find((u) => u.id === selectedUserId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-teal-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600
                              flex items-center justify-center shadow-sm">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Medication Reminders</h1>
                <p className="text-sm text-slate-500">Adherence tracking for seniors</p>
              </div>
            </div>
            <UserSelect
              users={users}
              selectedUserId={selectedUserId}
              onSelect={setSelectedUserId}
              loading={loadingUsers}
            />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Clock simulatedNow={simulatedNow} onChange={setSimulatedNow} />
        </div>
        <div className="mb-8">
          <ChallengeStatus userId={selectedUserId} />
        </div>

        {!selectedUserId ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl
                            bg-slate-100 text-slate-400 mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Select a Patient</h2>
            <p className="text-slate-500 max-w-md mx-auto">
              Choose a patient from the dropdown above to view today's reminders and adherence.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600
                                flex items-center justify-center text-white text-xl font-bold shadow-sm">
                  {selectedUser?.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedUser?.name}</h2>
                  <p className="text-slate-500">{selectedUser?.email} · {selectedUser?.phone}</p>
                </div>
              </div>
            </div>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Active Schedules
              </h2>
              <ScheduleList schedules={schedules} loading={loadingSchedules} />
            </section>

            {(reminders.length > 0 || loadingReminders) && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    Firing Now
                    <span className="text-sm font-normal text-slate-500">
                      ({reminders.length})
                    </span>
                  </h2>
                  {loadingReminders && (
                    <span className="text-sm text-slate-500 animate-pulse">
                      Loading...
                    </span>
                  )}
                </div>
                <ReminderList
                  reminders={reminders}
                  loading={loadingReminders}
                  onConfirmed={handleConfirmed}
                  simulatedNow={simulatedNow}
                />
              </section>
            )}

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Adherence</h2>
              <AdherenceSection userId={selectedUserId} refreshTrigger={refreshKey} />
            </section>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <p className="text-sm text-slate-400 text-center">
            Interview Challenge — Medication Reminder System
          </p>
        </div>
      </footer>
    </div>
  );
}
