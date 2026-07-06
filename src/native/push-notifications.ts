import Constants from "expo-constants";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";

export type PushRegistrationResult = {
  status: "registered" | "unsupported" | "denied" | "no-backend";
  token?: string;
  message: string;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true
  })
});

export async function registerForExpoPushNotifications(): Promise<PushRegistrationResult> {
  const permissions = await Notifications.getPermissionsAsync();
  const finalPermissions = permissions.granted
    ? permissions
    : await Notifications.requestPermissionsAsync();

  if (!finalPermissions.granted) {
    return {
      status: "denied",
      message: "Push notification permission was not granted."
    };
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);

  return {
    status: "no-backend",
    token: token.data,
    message: "Expo push token created locally. The backend does not expose a push token registration endpoint yet."
  };
}

export function notificationUrlFromData(data: Record<string, unknown> | undefined) {
  const explicitPath = String(data?.href ?? data?.path ?? "");
  if (explicitPath.startsWith("/student/") || explicitPath.startsWith("/teacher/")) {
    return explicitPath;
  }

  const route = String(data?.route ?? data?.screen ?? data?.type ?? "").toLowerCase();
  const role = String(data?.role ?? data?.portal ?? "").toLowerCase();
  const isTeacher = role.includes("teacher") || route.includes("teacher");
  const base = isTeacher ? "/teacher" : "/student";

  if (route.includes("message")) return `${base}/messages`;
  if (route.includes("exam") || route.includes("placement")) return isTeacher ? "/teacher/schedule" : "/student/exams";
  if (route.includes("schedule") || route.includes("calendar")) return `${base}/schedule`;
  if (route.includes("notification")) return `${base}/notifications`;
  return `${base}/notifications`;
}

export async function openNotificationTarget(data: Record<string, unknown> | undefined) {
  const url = Linking.createURL(notificationUrlFromData(data));
  await Linking.openURL(url);
}

export function addPushNotificationResponseListener() {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as Record<string, unknown> | undefined;
    void openNotificationTarget(data);
  });
}
