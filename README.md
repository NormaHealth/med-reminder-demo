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
- `GET /users/:id/reminders/firing?now=<ISO>` — reminders currently firing at `now` (PENDING doses with `scheduledFor` in `[now − 30m, now]`); lazy-creates dose records as schedules enter the firing window
- `POST /reminders/:id/confirm` — confirm a dose was taken
- `POST /reminders/:id/snooze` — *(does not exist yet — Challenge 2)*
- `GET /users/:id/adherence` — *(does not exist yet — Challenge 3)*

## Simulated Clock

When the API starts, **there are no active reminders** — only historical dose events (past 30 days) for adherence. Reminders come into existence when a schedule's time enters the firing window.

The frontend has a **Simulated Clock** widget at the top of the page. Use the time picker or the stepper buttons (`-1h / -15m / +15m / +1h / +4h`) to scrub time. The clock is sent to the backend as `?now=<ISO>` on every firing-reminders fetch, so:

- Set the clock to 7:55 AM → no schedules in window → "Firing Now" section is hidden.
- Step to 8:05 AM → Eleanor's 8:00 Lisinopril fires (a dose record gets lazy-created).
- Click **Snooze 15m** → `scheduledFor` advances to 8:15 → the dose drops out of the firing window.
- Step to 8:20 AM → it fires again.

The clock only shapes the *firing window* — adherence and confirm still use real wall-clock time on the backend.

## Validation Panel

The frontend includes a **Challenge Status** panel at the top of the page. Select a patient, then click **Run checks** to probe the API for each challenge's completion criteria. Each check turns green when its challenge is done correctly.

