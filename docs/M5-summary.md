# M5 Summary

## Objective

Complete the remaining mobile-native student capabilities for LCMP Mobile while preserving the existing Expo architecture, React Query data flow, SecureStore auth storage, and MDS v1.1 components.

## Mobile Inspection Result

- Existing student screens already covered dashboard, schedule calendar, attendance, progress, certificates, documents, messages, notifications, profile editing, placement tests, final exams, and anti-cheat.
- Existing keyboard-safe infrastructure is `KeyboardAwareScreen` and `FormScreen`; login already used `FormScreen`, and document upload now uses `KeyboardAwareScreen`.
- Native modules were not direct dependencies before M5, so Expo-compatible modules were added for file system, sharing, document/image picking, local authentication, notifications, haptics, and network state.

## Backend Reuse

- Reused `GET /certificates/:id/download` for certificate PDF download.
- Reused `POST /student-documents/upload` for student document upload with base64 content.
- Reused `GET /students/me/documents` for document status tracking.
- Reused `GET /notifications/me`, `PATCH /notifications/:id/read`, and `PATCH /notifications/read-all`.
- No student document download endpoint exists, so document open/download/share actions show a clear backend limitation instead of creating unsupported URLs.
- No Expo push token registration endpoint exists, so mobile can request permission and generate an Expo push token locally, but cannot persist it server-side yet.

## Native Features Implemented

- Certificate PDF download, device cache, open, and share.
- Document upload from camera, image library, or file picker.
- Native share sheets for certificate PDFs.
- Optional Remember device and biometric login using Face ID, Touch ID, or fingerprint when supported.
- Push notification permission/token flow and notification-tap routing to Messages, Exams, Schedule, or Notifications when payload data supports it.
- Network status provider connected to React Query online state.
- Haptic success/warning feedback for native file and biometric actions.

## File Handling Changes

- Added `src/native/file-handling.ts` for certificate caching, native open/share, camera capture, image library selection, and document picker selection.
- Certificate actions are available from the Certificates screen.
- Document upload is available from the Documents screen with selected file details, upload status, success messages, and backend error messages.
- Upload is disabled while offline.

## Push Notification Changes

- Added `src/native/push-notifications.ts`.
- Added app-level notification response listener in `AppProviders`.
- Added push enable action to the Notifications screen.
- Documented backend registration as unavailable in-app and in this summary.

## Authentication Improvements

- Added `src/native/biometric-auth.ts`.
- Added optional Remember device toggle on login.
- Added biometric session restoration from SecureStore without removing password login.
- Logout clears the remembered-device flag.

## Offline Improvements

- Added `src/native/network-status.tsx`.
- React Query online state now follows native connectivity.
- Document uploads are blocked while offline.
- Existing cached-data offline banners continue to work, and Documents now also reacts to native offline state.
