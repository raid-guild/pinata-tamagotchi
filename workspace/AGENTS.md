# Workspace Guide

This workspace hosts a small Next.js game template.

Conventions:

- Keep persistent game data under `workspace/data/`.
- Keep UI changes in `app/`.
- Keep state transition logic in `lib/pet-store.ts`.
- Avoid broad rewrites until the core loop has been tested by users.
- If adding a new interface, prefer reusing the existing `/api/pet` surface before adding another state model.
