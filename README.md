# Medication Reminder — Interview Challenge

A medication reminder and adherence tracking system. Patients have schedules with multiple medications; the system materializes "dose events" (reminders) and tracks whether each one was confirmed as taken.

## Stack

- **API:** NestJS + TypeORM + SQLite (in-memory)
- **Frontend:** React + Vite + Tailwind

## Getting Started

### Start the backend

```bash
cd api
npm install
npm run start:dev
```

### In another terminal, start the frontend

```bash
cd frontend
npm install
npm run dev
```

The API runs on http://localhost:3000
The frontend runs on http://localhost:5173

## API Endpoints

- `GET /users` — list patients
- `GET /users/:id/schedules` — patient's medication schedules
- `GET /users/:id/reminders/today` — today's dose events with refill status
- `POST /reminders/:id/confirm` — confirm a dose was taken
- `POST /reminders/:id/snooze` — *(does not exist yet — Challenge 2)*
- `GET /users/:id/adherence` — *(does not exist yet — Challenge 3)*

## Validation Panel

The frontend includes a **Challenge Status** panel at the top of the page. Select a patient, then click **Run checks** to probe the API for each challenge's completion criteria. Each check turns green when its challenge is done correctly.

## Challenges

### Challenge 1 — Bug Fix (Small)

There's a bug in the reminder confirm endpoint. When something goes wrong — like confirming a reminder that doesn't exist or one that's already been confirmed — the API returns a 200 status with a generic success payload instead of an appropriate error response.

Find and fix the bug. The API should return proper HTTP status codes and error messages.

**Validation:** C1 turns green when `POST /reminders/:bogus-id/confirm` returns 4xx.

### Challenge 2 — Snooze a Pending Dose (Medium)

Patients sometimes need a few extra minutes before taking a dose. Add an endpoint that snoozes a pending reminder by N minutes.

```
POST /reminders/:id/snooze
Body: { "minutes": number }

200 → { id, status, scheduledFor, confirmedAt }
```

**Rules:**

- `404` if the reminder doesn't exist.
- `422` (or `400`) if `minutes` is not an integer in `[1, 240]` — it's medication, not an alarm clock; cap snoozes at 4 hours.
- `409` if the dose's status is not `PENDING` (can't snooze a dose that's already `TAKEN`, `MISSED`, or `SKIPPED`).
- Otherwise: advance `scheduledFor` by `minutes` minutes, leave `status` as `PENDING`, return the updated dose (same shape as `/confirm`).

The frontend's reminder rows have a `Snooze 15m` button that lights up when the endpoint is implemented.

**Validation:** C2 turns green when snoozing a `PENDING` reminder advances `scheduledFor` by the requested minutes **and** snoozing with `minutes` outside `[1, 240]` returns 4xx. (The probe needs at least one PENDING reminder in today's list — restart the API to reseed if you've worked through them all.)

### Challenge 3 — Adherence Endpoint (Large)

Add the ability to retrieve adherence statistics for a patient. The endpoint should return:

- **Overall adherence percentage** for the last 30 days (TAKEN doses / scheduled doses, excluding doses still pending in the future).
- **Per-medication breakdown** with `medicationId`, `medicationName`, `scheduled`, `taken`, `adherencePct`.
- **Current streak** — number of consecutive days (ending today) where the patient confirmed every scheduled dose.

```
GET /users/:id/adherence

{
  "userId": "1",
  "windowDays": 30,
  "overallAdherencePct": 87.5,
  "currentStreakDays": 4,
  "byMedication": [
    {
      "medicationId": "1",
      "medicationName": "Lisinopril",
      "scheduled": 30,
      "taken": 27,
      "adherencePct": 90.0
    }
  ]
}
```

**Validation:** C3 turns green when the endpoint exists, returns 200, and the body matches the documented shape.
