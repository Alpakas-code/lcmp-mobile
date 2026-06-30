# M3 Summary

## Objective

Transform the Student mobile screens from UI-only surfaces into backend-connected screens using the existing LCMP API, React Query cache, SecureStore-backed authentication, and the approved LCMP Mobile Design System.

## Student Features Connected

- Dashboard now loads required backend-backed student data directly and no longer replaces failed calls with silent zero/empty placeholders.
- Courses use the student enrollment endpoint and display course, language, level, group, enrollment status, and normalized payment validation state.
- Schedule uses the role-filtered calendar endpoint with pull-to-refresh for today's and upcoming classes/exams.
- Attendance uses the student attendance summary endpoint with read-only statistics and history.
- Exams use placement test, placement attempt, exam session, and exam attempt endpoints. Exam taking remains available on web where mobile execution is unsupported.
- Progress uses progress report, participation summary, attendance summary, and enrollment data.
- Certificates use the certificate list endpoint and remain read-only in mobile.
- Documents use the student document list endpoint and remain read-only in mobile.
- Messages use inbox, sent, unread count, message detail, send message, and mark-read endpoints.
- Notifications use list, mark-one-read, and mark-all-read endpoints.
- Profile/More now loads `/profile/me`, current enrollment context, and supports profile editing through the existing profile update endpoint.

## API Endpoints Used

- `GET /profile/me`
- `PATCH /profile/me`
- `GET /students/me/enrollments`
- `GET /calendar`
- `GET /students/me/attendance`
- `GET /placement-tests`
- `GET /placement-attempts`
- `GET /exam-sessions`
- `GET /exam-attempts`
- `GET /progress-reports`
- `GET /students/me/participation`
- `GET /certificates`
- `GET /students/me/documents`
- `GET /messages/inbox`
- `GET /messages/sent`
- `GET /messages/unread-count`
- `GET /messages/:id`
- `POST /messages`
- `PATCH /messages/:id/read`
- `GET /notifications/me`
- `PATCH /notifications/:id/read`
- `PATCH /notifications/read-all`

## Components Reused

- `Screen`
- `KeyboardAwareScreen`
- `GreetingHeader`
- `StudentHeader`
- `SummaryCard`
- `InfoRow`
- `StatCard`
- `ScheduleCard`
- `CourseCard`
- `QuickActionCard`
- `NotificationCard`
- `ListItem`
- `TextInput`
- `Button`
- `LoadingState`
- `ErrorState`
- `EmptyState`
- `OfflineBanner`

## Offline Behaviour

- React Query cache remains the source for previously loaded student data.
- Query cache retention was extended for mobile use.
- Screens show an offline banner when a refresh fails with a network-level error while cached data is still available.
- Pull-to-refresh was added through the shared screen wrappers.
- App foreground changes now inform React Query focus management so stale queries can retry when the app becomes active again.
- Full offline mutation sync was not implemented.

## M3.1 Maestro Setup

- Added `.env.maestro` based `MAESTRO_APP_ID` loading.
- Added Maestro npm scripts.
- Added student login/navigation flows.
- Added minimal login and student screen/tab selectors required by Maestro.
- Added `docs/Maestro-setup.md` with Expo Go, development build, run command, and troubleshooting notes.

## Validation Results

- `npm.cmd run typecheck`: passed.
- `npm.cmd run lint`: passed.
- `npm.cmd run start -- --help`: passed.
- `node_modules\.bin\dotenv.cmd -e .env.maestro -- node -p "process.env.MAESTRO_APP_ID"`: returned `host.exp.exponent`.
- `npm.cmd run maestro:student:login`: not run successfully because `maestro` is not available on `PATH` in this terminal (`spawn maestro ENOENT`).

## Issues Found

- Dashboard integration was swallowing endpoint failures and replacing failed requests with fallback empty values.
- Student Profile/More did not load real profile data.
- Student screens did not expose pull-to-refresh.
- Message expansion did not call the message detail endpoint.
- Payment status labels exposed raw backend values instead of the required mobile labels.
- Offline/cached-data state was not visible to the user.

## Fixes Applied

- Added `getStudentProfile`, `updateStudentProfile`, and `getMessageDetail` mobile API functions.
- Removed silent dashboard fallback data and added real profile data to dashboard loading.
- Added pull-to-refresh support to `Screen` and `KeyboardAwareScreen`.
- Added offline banner rendering to Student screens.
- Added profile display and edit support in More using existing backend support.
- Normalized payment display to only `Validated` or `Pending Validation`.
- Made dashboard schedule cards pressable and wired dashboard cards/actions to existing routes.
- Tuned React Query cache and foreground refetch behaviour for mobile usage.

## Known Limitations

- Certificate download exists in the backend, but the current mobile screen remains read-only because no mobile file-open/download flow existed before this task.
- Document upload exists in the backend, but the current mobile screen remains read-only because no mobile upload flow existed before this task.
- Placement and final exam taking flows remain web-only in the mobile UI.
- Pull-to-refresh uses shared scroll wrappers; heavy virtualized FlatList conversion was not introduced in this pass.
- No screenshots were generated.
