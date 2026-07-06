# M4 Summary

Implemented Student Mobile Exam Taking and a real Student Schedule calendar experience.

## Included

- Added mobile API wrappers for placement/final exam start, attempt detail, answer save, submit, and final exam security events.
- Upgraded Student Exams with placement test cards, final exam session cards, start confirmations, anti-cheat warnings, in-app question taking, answer save/next navigation, submit confirmation, unanswered warnings, result states, and backend error handling.
- Supported backend-returned question types: single choice, multiple choice, true/false, and text answer.
- Added final exam app-state proctoring via `POST /exam-proctoring/security-events`.
- Kept placement proctoring as local warning only because the backend exposes placement security event reads but no mobile-create endpoint.
- Replaced the schedule list with an internal month calendar grid, month navigation, today shortcut, today/selected-date highlighting, class/exam indicators, selected-day sessions, upcoming sessions, pull-to-refresh, and cached/offline banner behavior.

## Business Rules

- No payment, invoice, receipt, refund, installment, or finance feature was added.
- Existing backend enrollment/payment validation remains the source of truth when starting placement tests.
- Final exam authorization, timing, retake, and eligibility checks remain backend-controlled.

## Validation

- `npm run lint`
- `npm run typecheck`
- `npm run start -- --help`

Maestro was skipped as requested.
