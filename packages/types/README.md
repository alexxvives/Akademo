# @akademo/types

Shared TypeScript types for the AKADEMO platform. Consumed by both the Next.js frontend and the Cloudflare Worker API (`workers/akademo-api`).

## Layout

- `src/database.ts` — D1 row shapes (mirrors `migrations/`)
- `src/api.ts` — request/response payloads exchanged between worker and frontend
- `src/models.ts` — domain models used in business logic
- `src/index.ts` — public barrel

## Build

```sh
npm run build:types        # from repo root, runs `cd packages/types && npm run build`
```

The compiled output lands in `dist/` and is **gitignored**. Consumers import via the `@akademo/types` workspace alias declared in `package.json`.

## Conventions

- One canonical row type per database table (no duplicates between worker and frontend).
- API payload types must be serializable JSON (no `Date`, no class instances).
- Prefer `interface` for object shapes, `type` for unions / utilities.
