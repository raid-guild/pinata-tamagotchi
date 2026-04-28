# Handoff

## Product direction

This is intentionally not a crypto app. It is a cute, low-friction template for testing agent-hosted interfaces and recurring engagement loops. The current loop is simple enough to evaluate quickly:

1. User visits the hosted `/app` route.
2. User performs one or more care actions.
3. SQLite records the pet state and ritual log.
4. The pet evolves visually as XP crosses thresholds.
5. The human can customize name, colors, backstory, voice, and topics.
6. OpenClaw chat can talk as the egg by default, or use command prefixes.
7. A scheduled Pinata task can nudge the agent to suggest the next experiment.

## Current mechanics

- `feed` raises fullness.
- `play` raises joy.
- `clean` raises shine.
- `study` raises curiosity.
- First care or teaching interaction on a new UTC day increases the streak and gets a streak bonus.
- Streak bonus is `+3 XP` per streak day after day 1, capped at `+60`.
- Broken streaks trigger the recoverable care state.
- Missing 1-3 days applies return-time stat decay and wakes as `sleepy`.
- Missing 4+ days applies stronger return pressure and wakes from `neglected`.
- XP is capped at `120` per UTC day; extra care still updates stats and logs events.
- Stages unlock at `90`, `220`, `420`, `900`, `1900`, `4100`, `8800`, and `19000` XP.
- At `420` XP, the creature chooses a persistent evolution track.
- Tracks are `bloom`, `storm`, `moon`, `forge`, and `archive`.
- Track selection uses recent learned-topic keywords first, then falls back to dominant care stats.
- Post-guardian forms are `familiar`, `mythic`, `celestial`, `elder`, and `cosmic`.
- The egg does not permanently die in this prototype.

## Useful files

- `manifest.json`: Pinata template metadata, scripts, route, and daily task.
- `app/components/PetScene.tsx`: Main UI and SVG pet visualization.
- `lib/pet-store.ts`: SQLite schema, state transitions, and event log.
- `app/api/pet/*`: Core pet JSON API routes.
- `app/api/profile`: DB-backed profile/CMS endpoint.
- `app/api/topics`: Teachable topic endpoint.
- `app/api/openclaw/chat`: Chat adapter for OpenClaw-style messages.
- `workspace/SOUL.md`: Agent personality for deployed instances.
- `workspace/OPERATIONS.md`: Runtime, reset, and API notes.

## Suggested next steps

- Add a `POST /api/pet/message` endpoint so external channels can leave notes for the pet.
- Add a recoverable neglect loop: missed days lower stats, and several missed days make the egg sleepy until care resumes.
- Expand `/api/openclaw/chat` into a richer OpenClaw response proxy when the gateway contract is finalized.
- Expand track-specific SVG traits and eventually move track rules into a table if branches get more complex.
- Add a cohort garden route that lists multiple pets from imported JSON snapshots.
- Replace the reset button with a confirmation modal before public demos.
- Add Playwright smoke tests for the main care loop once the UI stabilizes.
