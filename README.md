# Pinata Tamagotchi

A Pinata Agent template for a small Tamagotchi-style companion. The first prototype focuses on the core loop: care for an egg, watch it evolve, and expose the state through a simple web UI plus JSON API.

## What ships

- A Next.js app served on port `3000`.
- SQLite persistence in `workspace/data/tamagotchi.db`.
- API routes for reading state, applying care actions, and resetting the game.
- A tiny DB-backed CMS for egg name, colors, backstory, voice, and learned topics.
- A chat adapter endpoint for OpenClaw-style interfaces and command prefixes.
- A Pinata template `manifest.json` with build/start scripts, a public `/app` route, and a daily task prompt.
- Workspace docs that define the agent personality and handoff context.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Template deployment

The manifest follows the Pinata template shape:

- `scripts.build`: installs dependencies and builds the app.
- `scripts.start`: launches `pm2-runtime`.
- `routes[0]`: exposes port `3000` at `/app`.

After importing this public repo as a Pinata template, deploy it and visit the generated `/app` route.

## API

```bash
GET /api/pet
POST /api/pet/action  # { "action": "feed" | "play" | "clean" | "study" }
POST /api/pet/reset
GET /api/profile
POST /api/profile     # { "eggName", "shellColor", "accentColor", "backstory", "voiceStyle" }
GET /api/topics
POST /api/topics      # { "topic", "note" }
POST /api/openclaw/chat # { "message": "teach: agent templates - templates should be tiny" }
POST /api/debug/advance # debug only, { "stage": "cosmic", "track": "forge" }
GET /health
```

## Chat commands

OpenClaw or another chat surface can post to `/api/openclaw/chat`.

- Normal message: replies in-character as the egg.
- `ooc:`: replies as the operator/builder with implementation status.
- `status:`: summarizes stage, mood, streak, and learned topics.
- `care: feed|play|clean|study`: performs a care action.
- `teach: topic - optional note`: stores a topic and gives curiosity/XP.

## Game Rules

- Stages unlock at `90`, `220`, `420`, `900`, `1900`, `4100`, `8800`, and `19000` XP.
- XP is capped at `120` per UTC day.
- The first care or teaching interaction on a new UTC day gets a streak bonus: `+3 XP` per streak day after day 1, capped at `+60`.
- Broken streaks create a recoverable sleepy loop: 1-3 missed days wakes as `sleepy`, 4+ missed days wakes from `neglected`, and return-time care applies stat decay once.
- At guardian form, the creature chooses one evolution track: `bloom`, `storm`, `moon`, `forge`, or `archive`.
- Post-guardian forms get larger and more fantastical as the track shapes their visual layers.
- The egg does not permanently die in this prototype. A future neglect loop should make it sleepy and recoverable instead.

## Debug Mode

Fast-forward controls are hidden by default. Enable them from the collapsed `Egg profile` panel with `Show debug fast-forward controls`.

When enabled, the app shows a collapsed `Debug` panel and enables `POST /api/debug/advance`.

## Next iteration ideas

- Add alternate interfaces: Discord slash commands, Telegram check-ins, or a small web component embed.
- Let the agent generate daily care prompts from recent events and learned topics.
- Add multiplayer: each cohort member owns one pet, with a shared garden page.
- Add more evolution branches based on dominant care style.
- Add exportable snapshots for cohort demos or social sharing.
