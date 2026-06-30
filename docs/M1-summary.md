# M1 Summary

## Objective
Create the LCMP Mobile foundation as one Expo React Native application for Teacher and Student portals. Admin remains web-only.

## Project Setup
- Created `lcmp-mobile` as a TypeScript Expo Router project.
- Added React Query, Axios, Expo SecureStore, and Zustand.
- Added `.env.example` with configurable `EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1`.

## Routes Created
- `/login` through `app/(auth)/login.tsx`.
- `/teacher` through `app/(teacher)/teacher/index.tsx`.
- `/student` through `app/(student)/student/index.tsx`.
- Root `app/index.tsx` redirects based on stored authentication state.

## Auth Behavior
- Login calls `POST /auth/login`.
- Teacher accounts redirect to `/teacher`.
- Student accounts redirect to `/student`.
- Admin and Super Admin accounts are blocked on mobile with: `Admin accounts are available on the web dashboard.`
- Access and refresh tokens are stored with Expo SecureStore.

## API Setup
- Added shared Axios API client with environment-based base URL.
- Added Bearer token injection from SecureStore.
- Added timeout and 401 handling.
- Added response unwrap helper for the backend `{ message, data }` response shape.

## Validation Results
- `npm run typecheck` - passed.
- `npm run lint` - passed.
- `npm run start -- --help` - passed as a lightweight Expo start validation without leaving a dev server running.

## Known Limitations
- M1 dashboards use placeholder cards only.
- Real Teacher and Student dashboard data is deferred to M2/M3.
- No Admin mobile routes were added.
- `npm install` completed with npm audit reporting 22 moderate vulnerabilities in installed dependencies; no audit fix was run for M1.
