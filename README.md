# TuitionTrack — Frontend Prototype v0.1

A front-end-first prototype for the TuitionTrack concept: a shared tuition-life view for independent tutors, tuition centers, and parents in Nepal.

## Included in this first pass

- Public landing page with the proposed navy / cobalt / teal visual direction.
- Separate, addressable routes for tutor, parent, and tuition-center demo workspaces.
- Separate sections for overview, students, attendance, fee records, tests & marks, and notifications.
- Sample attendance register with mark-all-present, individual present/absent toggles, and save confirmation.
- Sample fee ledger with record-payment flow and parent confirm/dispute interactions.
- Sample test scheduling and mark publication flow.
- Responsive layout and reduced-motion support.
- Only fictional demo data. No real student data should be entered.

## Important: prototype boundary

This is **not a production app**. It has no backend, real authentication, server-side authorization, or real messaging. The role picker simulates switching between demo views. Changes live in React state and reset when the page reloads. Parent confirmation is simulated locally and does not independently verify that money changed hands. No payment is processed.

## Requirements

- Node.js 20 or newer recommended.
- npm.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

To check a production build:

```bash
npm run build
npm run preview
```

## Main routes

- `/` — public landing page
- `/start` — choose a demo role
- `/app/tutor/dashboard` — tutor workspace
- `/app/parent/dashboard` — parent workspace, scoped to the fictional student Suman Thapa
- `/app/center/dashboard` — tuition-center workspace

Each workspace has separate page routes, e.g. `/app/tutor/attendance` and `/app/parent/fees`.

## Brand mark

The current symbol beside the TuitionTrack wordmark is a temporary CSS placeholder. Replace it with the approved logo asset once that file is added to `public/` and supplied to the UI.

## Suggested next step

Review the page structure and core task flows with a few tutors and parents before selecting the production backend, authentication model, data schema, or notification provider. Avoid entering real student or payment information in this prototype.
