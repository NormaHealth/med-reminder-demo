import type {
  User,
  Schedule,
  FiringReminders,
  AdherenceResponse,
} from './types';

const API_BASE = 'http://localhost:3000';

export async function fetchUsers(): Promise<User[]> {
  const res = await fetch(`${API_BASE}/users`);
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function fetchUserSchedules(userId: string): Promise<Schedule[]> {
  const res = await fetch(`${API_BASE}/users/${userId}/schedules`);
  if (!res.ok) throw new Error('Failed to fetch schedules');
  return res.json();
}

export async function fetchFiringReminders(
  userId: string,
  now: Date,
): Promise<FiringReminders> {
  const url = `${API_BASE}/users/${userId}/reminders/firing?now=${encodeURIComponent(
    now.toISOString(),
  )}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch firing reminders');
  return res.json();
}

export async function confirmReminder(
  reminderId: string,
): Promise<Response> {
  return fetch(`${API_BASE}/reminders/${reminderId}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
}

// Endpoint doesn't exist yet — Challenge 2
export async function snoozeReminder(
  reminderId: string,
  minutes: number,
): Promise<Response> {
  return fetch(`${API_BASE}/reminders/${reminderId}/snooze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ minutes }),
  });
}

// Endpoint doesn't exist yet — Challenge 3
export async function fetchAdherence(
  userId: string,
): Promise<AdherenceResponse> {
  const res = await fetch(`${API_BASE}/users/${userId}/adherence`);
  if (!res.ok) throw new Error('Failed to fetch adherence');
  return res.json();
}

export const API_BASE_URL = API_BASE;
