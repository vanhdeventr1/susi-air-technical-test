# Susi Air Pilot Portal

This workspace contains two separate apps:

- `nest/`: NestJS REST API backed by the mock JSON files.
- `nuxt/`: Nuxt frontend for pilot sign-in and flight operations.

## Requirements

- Node.js and npm
- Run the backend and frontend in separate terminals.

## Backend Setup

```sh
cd nest
npm install
```

Create `nest/.env` with a JWT signing secret:

```dotenv
SECRET_KEY=replace-with-a-long-random-secret
```

`SECRET_KEY` is required by both token signing and verification. Optional settings:

```dotenv
PORT=3000
FRONTEND_ORIGIN=http://localhost:3002
PILOT_AVATAR_URL=https://example.com/pilot-avatar.png
```

Defaults are shown above; `PILOT_AVATAR_URL` has a built-in fallback. Keep real secrets out of source control.

Start the API from the `nest/` directory:

```sh
npm run start:dev
```

The Nest CLI copies `src/database/*.json` into the build output. To build and run production output:

```sh
npm run build
npm run start:prod
```

## Frontend Setup

In a second terminal:

```sh
cd nuxt
npm install
npm run dev -- --port 3002
```

Open `http://localhost:3002/login`. The frontend defaults to `http://localhost:3000/api/v1` for its API. To use another API base, set:

```dotenv
NUXT_PUBLIC_API_BASE=http://localhost:3000/api/v1
```

Then build with `npm run build`. Nuxt uses its file-based routing, `$fetch` for API calls, and Pinia for authentication and dashboard state; Axios and a separately configured router are not used.

## Pilot Login

The prototype uses one hardcoded pilot account:

```text
Username: johndoe
Password: susiairtest
```

`POST /api/v1/auth/login` returns an `access_token`. Send it on protected requests as `Authorization: Bearer <token>`.

## API Routes

All routes are under `/api/v1`. Except for login, they require the Bearer token.

| Method | Path                    | Parameters                         |
| ------ | ----------------------- | ---------------------------------- |
| POST   | `/auth/login`           | JSON body: `username`, `password`  |
| GET    | `/pilot/me`             | None                               |
| GET    | `/flight-hours`         | `from=YYYY-MM-DD`, `to=YYYY-MM-DD` |
| GET    | `/flight-hours/summary` | `range=1w\|1m\|3m\|6m\|1y`         |
| GET    | `/documents`            | None                               |
| GET    | `/schedules`            | `year=YYYY`, `month=1..12`         |

The summary is calculated by the backend. It returns limit-card values and a 15-day chart centered on the fixed review date `2026-05-15`. Missing flight-hour dates contribute zero. Document urgency is also calculated by the backend using that review date.

## Structure and Design Choices

- Nest features are separated into Auth, Pilot, Flight Hours, Documents, and Schedules modules, each with its own controller and service; query DTOs live with the feature that uses them.
- `RouterModule` mounts the features below `/api/v1`. The global validation pipe and exception filter are registered at app bootstrap.
- JSON files are loaded in memory by their owning services. This keeps the technical-test implementation independent of a database or ORM.
- JWT signing and verification share the required `SECRET_KEY`; the data controllers use the JWT guard.
- Nuxt uses `src/views` for screens, `src/pages` for route wrappers, `src/api` for `$fetch` clients, and `src/stores` for Pinia state.
- The UI uses Susi Air’s navy/red palette, Plus Jakarta Sans, the official logo, and a mobile-first layout.

## With More Time

- Replace hardcoded credentials with a user store, password hashing, and short-lived access/refresh tokens.
- Add automated API tests for authentication, date validation, rolling windows, document urgency, and schedule month changes.
- Build full Logbook, Schedule detail, and More screens; those navigation destinations are currently lightweight placeholders.
- Make the review date and default schedule month configurable for different test datasets.
- Notifications for schedule changes and document expiry.
  -Add data export functionality for reports.
