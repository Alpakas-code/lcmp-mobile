# Maestro Setup

## Prerequisites

- Java installed.
- Maestro installed.
- Android emulator or device running.
- Expo app running.
- LCMP API reachable from the installed mobile app.

## Environment

The Maestro scripts load `MAESTRO_APP_ID` from `.env.maestro`.

For Expo Go:

```env
MAESTRO_APP_ID=host.exp.exponent
```

For a development build:

```env
MAESTRO_APP_ID=com.lcmp.mobile
MAESTRO_DEV_CLIENT_URL=lcmpmobile://expo-development-client/?url=http%3A%2F%2F10.0.2.2%3A8081
```

Use the real package name for the installed development build if it differs.
Use `10.0.2.2` for the Android emulator because it maps to the host machine. For a physical Android device, replace it with your computer LAN IP.

The local `.env.maestro` file is ignored by git. Use `.env.maestro.example` as the template on another machine.

## Student Credentials

- Email: `student@lcmp.local`
- Password: `ChangeMe123!`

## Run Commands

```powershell
npm run maestro:student:login
npm run maestro:student:navigation
npm run maestro:student
```

## Flows

- `maestro/student-login.yaml` clears app state, signs in with the student account, and waits for `student-dashboard`.
- `maestro/student-navigation.yaml` reuses the login flow, checks the Courses, Schedule, and Exams tabs, then opens Attendance from More.

## Expo Go Notes

When testing with Expo Go, keep `MAESTRO_APP_ID=host.exp.exponent` and make sure the LCMP Expo project is already open in Expo Go. Maestro launches Expo Go itself; it does not choose a project from the Expo Go home screen.

When testing with a development build, set `MAESTRO_APP_ID` to the development build package name.

For a debug development build, keep Metro running with:

```powershell
npm run start -- --dev-client
```

The flow launches `MAESTRO_DEV_CLIENT_URL` after clearing state. Without that URL, the app can stay on the Expo/dev-client splash because the native shell has no Metro bundle to load.

## Troubleshooting

- Unable to launch app `undefined`: `.env.maestro` is missing or `MAESTRO_APP_ID` is empty. Copy `.env.maestro.example` to `.env.maestro` and set the value.
- Java not found: install Java and confirm `java -version` works in the same terminal.
- adb device not found: start the Android emulator or connect a device, then confirm `adb devices` lists it.
- Expo Go vs development build appId: use `host.exp.exponent` for Expo Go and the real package name, such as `com.lcmp.mobile`, for a development build.
- App stays on the Expo splash: start Metro with `npm run start -- --dev-client` and confirm `MAESTRO_DEV_CLIENT_URL` points to the reachable Metro URL.
- `login-email-input` is not visible: confirm the LCMP app, not only the Expo/dev-client launcher, is on screen and wait for the root redirect from the loading screen to finish.
- Backend API not reachable from emulator: confirm `EXPO_PUBLIC_API_URL` points to a host reachable from the emulator or device.
