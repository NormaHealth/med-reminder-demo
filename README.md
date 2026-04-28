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

