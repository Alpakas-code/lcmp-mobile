import { focusManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren, useEffect } from "react";
import { AppState } from "react-native";
import { ThemeProvider } from "../theme/ThemeProvider";
import { NetworkStatusProvider } from "../native/network-status";
import { addPushNotificationResponseListener } from "../native/push-notifications";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 30,
      refetchOnReconnect: true,
      refetchOnWindowFocus: true,
      retry: 1,
      staleTime: 1000 * 60
    }
  }
});

export function AppProviders({ children }: PropsWithChildren) {
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (status) => {
      focusManager.setFocused(status === "active");
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const subscription = addPushNotificationResponseListener();
    return () => subscription.remove();
  }, []);

  return (
    <ThemeProvider>
      <NetworkStatusProvider>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </NetworkStatusProvider>
    </ThemeProvider>
  );
}
