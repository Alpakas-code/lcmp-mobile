# M2 Summary

## Objective

Build the Student mobile experience in the existing `lcmp-mobile` Expo app using the M1 authentication, routing, SecureStore token persistence, shared API client, and UI primitives.

## Student Routes

- `/student`
- `/student/courses`
- `/student/schedule`
- `/student/attendance`
- `/student/exams`
- `/student/progress`
- `/student/certificates`
- `/student/documents`
- `/student/messages`
- `/student/notifications`

Bottom tabs are configured for Home, Courses, Schedule, Exams, and More. More links to Attendance, Progress, Certificates, Documents, Messages, and Notifications.

## Features Implemented

- Replaced the placeholder Student dashboard with real backend-backed summary cards.
- Added current enrollment, course, language, level, group, next session, upcoming exam, attendance rate, latest progress, certificate count, unread notification count, and unread message count.
- Implemented courses/enrollments with language, level, course, group, enrollment status, payment status, and progression text.
- Implemented schedule with today's sessions, upcoming sessions, class/exam type, time, teacher, group, classroom, and status.
- Implemented read-only attendance statistics and attendance history.
- Implemented exams view for placement tests, placement attempts/results, final exam sessions, final exam attempts/results, and retake status where returned.
- Implemented progress view for latest progress report, attendance summary, participation summary, remarks, and academic progression.
- Implemented certificates view with title, level, issue date, status, and read-only download limitation text.
- Implemented documents view with document type, file name, upload date, verification date, and status.
- Implemented messages view with inbox, sent list, message body expansion, mark-read on inbox open, and direct message sending.
- Implemented notifications view with unread/read state, mark-one-read, and mark-all-read.
- Added shared student API functions, broad response types, formatting helpers, and student-focused card/list UI helpers.

## API Dependencies

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
- `POST /messages`
- `PATCH /messages/:id/read`
- `GET /notifications/me`
- `PATCH /notifications/:id/read`
- `PATCH /notifications/read-all`

## UX Decisions

- Student screens use mobile cards and lists instead of desktop-style tables.
- Bottom tabs are limited to the highest-frequency screens, with secondary self-service areas grouped under More.
- Dashboard endpoint loading is resilient: if one summary dependency fails, available sections still render with safe fallbacks.
- Feature screens keep their own loading, error, and empty states.
- Payment is display-only and limited to showing returned status.
- Documents are read-only in M2 even though the backend has an upload endpoint, to avoid adding file upload UX beyond the requested scope.

## Validation Results

- `npm.cmd run typecheck`: passed.
- `npm.cmd run lint`: passed with no warnings.
- `npm.cmd run start -- --help`: passed and printed Expo start usage.

## Issues Found

- The M1 `Card` component accepted only a single `ViewStyle`, which was too narrow for composed React Native styles.
- Strict TypeScript required explicit dashboard data narrowing after query loading/error branches.
- Student participation can be hidden by backend notification preferences, so the progress screen handles that API error independently.

## Fixes Applied

- Updated `Card` to accept `StyleProp<ViewStyle>`.
- Added a dashboard data guard after the React Query loading/error states.
- Kept progress participation failure isolated so attendance, reports, and enrollment progression can still render.
- Removed lint array-type warnings from the new student payload types.

## Known Limitations

- Full mobile exam-taking is not implemented in M2; exam cards direct students to use the web flow where needed.
- Certificate download is shown as read-only because the PDF endpoint requires authenticated binary handling that is not wired into the current mobile file flow.
- Document upload is not implemented in M2.
- Direct message sending requires the recipient user ID because no mobile recipient picker endpoint/UI exists yet.
