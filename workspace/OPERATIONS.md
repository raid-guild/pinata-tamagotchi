# Operations

## Local Runtime

```bash
npm install
npm run dev
npm run build
npm start
```

The app serves on port `3000`. Pinata exposes it at `/app`.

## Data

SQLite lives at `workspace/data/tamagotchi.db`.

Tables:

- `pet`: core stats, XP, streak, and stage source data.
- `pet_profile`: egg name, shell color, accent color, backstory, and voice style.
- `learned_topics`: topics taught through the UI or chat.
- `pet_events`: recent care/profile/topic history.

XP rules:

- `120` XP max per UTC day.
- First care or teaching interaction on a new UTC day gets a streak bonus.
- Streak bonus is `+3 XP` per streak day after day 1, capped at `+60`.
- If a streak breaks, return-time care or teaching wakes the pet from `sleepy` after 1-3 missed days or `neglected` after 4+ missed days.
- Missed days decay stats once on return; there is no permanent death state.
- Care and teaching still update stats/events after the daily cap is reached.
- Evolution thresholds: `90`, `220`, `420`, `900`, `1900`, `4100`, `8800`, `19000`.
- The guardian threshold chooses one persistent track: `bloom`, `storm`, `moon`, `forge`, or `archive`.
- Track assignment is automatic and based on learned-topic keywords before care stats.
- Current prototype has no permanent death state.

Reset from the app or with:

```bash
curl -X POST http://127.0.0.1:3000/api/pet/reset
```

## OpenClaw Chat Adapter

Post chat messages to:

```bash
curl -X POST http://127.0.0.1:3000/api/openclaw/chat \
  -H 'content-type: application/json' \
  -d '{"message":"teach: agent templates - templates should start tiny"}'
```

Commands:

- Normal text: reply as the egg.
- `ooc:`: builder/operator response.
- `status:`: current state summary.
- `care: feed|play|clean|study`: apply a care action.
- `teach: topic - note`: store a learned topic and grant curiosity/XP.

## Debug Fast Forward

Debug is stored in site config and is disabled by default. Enable it in the app from `Egg profile` -> `Show debug fast-forward controls`, then save the profile.

API:

```bash
curl -X POST http://127.0.0.1:3000/api/debug/advance \
  -H 'content-type: application/json' \
  -d '{"stage":"cosmic","track":"forge"}'
```

## Deployment Checklist

- Confirm `manifest.json` route is still port `3000`, path `/app`.
- Run `npm run build`.
- Run `npm run typecheck`.
- Confirm `GET /health`.
- Confirm `POST /api/openclaw/chat`.
