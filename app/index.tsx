import { Redirect } from "expo-router";
import { useEffect } from "react";
import { LoadingState, Screen } from "../src/components/ui";
import { useAuthStore } from "../src/stores/auth-store";

export default function RootIndex() {
  const user = useAuthStore((state) => state.user);
  const isHydrating = useAuthStore((state) => state.isHydrating);
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (isHydrating) {
    return (
      <Screen scroll={false}>
        <LoadingState label="Preparing LCMP" />
      </Screen>
    );
  }

  if (user?.role === "TEACHER") {
    return <Redirect href="/teacher" />;
  }

  if (user?.role === "STUDENT") {
    return <Redirect href="/student" />;
  }

  return <Redirect href="/login" />;
}
