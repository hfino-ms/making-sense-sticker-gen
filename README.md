# MS Sticker Generator

This repository contains the Sticker Generator web app (frontend built with React + Vite, backend minimal Express server). The app generates AI stickers (OpenAI), optionally integrates a selfie via image edits, composites overlays on the client, uploads final images to Supabase storage, and notifies workflows via n8n webhooks.

## Key features

- Sticker generation using OpenAI Images API (generations & edits)
- Client-side composition (overlay + image) and server-side upload to Supabase
- n8n webhook integration for downstream workflows
- Centralized environment validation for server-side endpoints
- Tests with Vitest for backend and utils
- Pre-commit checks (Husky) running lint, typecheck, tests and build
- CI workflow (GitHub Actions) runs lint, typecheck, tests and build on PRs

## Environment variables (server)

The server expects the following environment variables in production:

- OPENAI_API_KEY: API key for OpenAI (required)
- N8N_WEBHOOK_URL: full URL to your n8n webhook (required to trigger workflows)
- N8N_WEBHOOK_AUTH: optional Authorization header value for n8n
- SUPABASE_URL: your Supabase project URL (required for uploads)
- SUPABASE_SERVICE_KEY: Supabase service role key for uploads (required)
- SUPABASE_BUCKET: (optional) bucket name, default: `stickers`
- PORT: server port (defaults to 3000)

Dev variables (client):

- VITE_OPENAI_API_KEY: optional (only used if generating directly from client; prefer server proxy)

## Local development

1. Install dependencies: npm install
2. Start dev server (Express + Vite): npm run dev
3. Open http://localhost:3000 (server serves the built app or index.html depending)

## Scripts

- npm run dev - start Express server and spawn Vite for SPA dev
- npm run dev:vite - start only Vite
- npm run build - TypeScript build + Vite build
- npm run lint - run ESLint
- npm run typecheck - run tsc --noEmit
- npm run test - run Vitest
- npm run precommit - run lint, typecheck, tests & build (used by Husky pre-commit)

## Tests

- Tests are in `tests/` and run with Vitest. Backend handlers and utilities are unit-tested and mocked (OpenAI and Supabase interactions are mocked in tests).

## CI

GitHub Actions workflow runs on push/PR to main/master and executes install, lint, typecheck, tests and build.

## Project structure

- api/ - serverless-style API endpoints mounted by Express
  - services/ - backend helper modules (openai, supabase, config)
- src/ - frontend app (React + Vite)
  - components/ - React components
  - services/ - client-side service wrappers
  - utils/ - utilities (prompt builder, agent logic)
- tests/ - Vitest tests for backend and utils


## Security notes

- Never commit SUPABASE_SERVICE_KEY or OPENAI_API_KEY to source control.
- Use CI / Hosting secrets for production keys.
- Limit Supabase service role key usage to server endpoints only.

## Next steps

- Integrate Sentry for error monitoring
- Add e2e tests (Cypress or Playwright) for critical flows
- Add metrics and observability for generation job success/failure rates

---

