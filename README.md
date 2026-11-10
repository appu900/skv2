# CUTM Awarding Body – Frontend (v2)

Next.js 16 (App Router, TypeScript, Tailwind) frontend for the skill assessment platform. Talks to the
Express backend in `Skill_Assesment_platform_backend`.

## Run locally

```bash
npm install
cp .env.example .env.local   # BACKEND_API_URL=http://localhost:8000/api/v1
npm run dev                  # http://localhost:3000
```

The backend must be running (with MongoDB and Redis).

## How auth works

- `POST /api/auth/login` calls the backend login of the chosen portal and stores the JWT in an
  **httpOnly cookie** (`sap_session`). Browser JavaScript never sees the token.
- Browser code calls `/api/backend/*` (`src/lib/api/client.ts`). The route handler in
  `src/app/api/backend/[...path]/route.ts` forwards the request to the backend and adds
  `x-access-token` from the cookie. JSON and multipart uploads are streamed through.
- `src/proxy.ts` guards `/admin`, `/tp`, `/aa`, `/sna`: wrong role or expired session → login page.
  The backend still authorises every API call.
- `useSession()` (`/api/auth/session`) gives the logged in user's name, role, scheme and state.

## Structure

```
src/
  app/
    (public)  /  /verify  /login  /login/[role]  /register/*
    admin/ tp/ aa/ sna/   one folder per portal, layout = PortalShell
    api/auth/*            login / logout / session
    api/backend/[...path] proxy to the Express API
  config/navigation.ts    every portal menu entry (drives the sidebar and placeholder pages)
  components/ui           buttons, inputs, cards …
  components/portal       PortalShell, PageHeader, PlaceholderPage
  lib/auth                roles, JWT decoding, session cookie, useSession
  lib/api                 axios client + response types
  proxy.ts                route guard (Next 16 name for middleware)
```

## Status

All four portals have their layout, navigation and routes. Pages show a placeholder until their
feature is built. Working end to end today: login/logout for every portal, route protection and
public certificate verification.
