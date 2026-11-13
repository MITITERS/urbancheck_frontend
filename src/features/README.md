# features/

One folder per functional domain (`reports/`, `users/`, `municipalities/`…).
Each one is self-contained and holds its own `components/`, `hooks/`, `api/` and
`types.ts`.

Rules:

- A feature never imports from the inside of another feature. Anything shared
  moves up to `components/common/`, `hooks/` or `types/`.
- Query keys follow the convention documented in `src/lib/queryKeys.ts`.
- No feature sends a municipality id to the API: the backend scopes every
  response by the jurisdiction of the authenticated user.

Empty on purpose: the scaffolding sprint does not create features.
