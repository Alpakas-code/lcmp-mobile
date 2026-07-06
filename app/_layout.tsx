import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { AppErrorBoundary } from "../src/components/AppErrorBoundary";
import { AppProviders } from "../src/providers/AppProviders";
import { useAuthStore } from "../src/stores/auth-store";

function SessionRedirector() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isHydrating = useAuthStore((state) => state.isHydrating);
  const sessionExpiredAt = useAuthStore((state) => state.sessionExpiredAt);

  useEffect(() => {
    if (!isHydrating && !user && sessionExpiredAt) {
      router.replace("/login");
    }
  }, [isHydrating, router, sessionExpiredAt, user]);

  return null;
}

export default function RootLayout() {
  return (
    <AppErrorBoundary>
      <AppProviders>
        <SessionRedirector />
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </AppProviders>
    </AppErrorBoundary>
  );
}
