import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { AppButton, AppCard, AppInput, AppText, ErrorState, FormScreen } from "../../src/components/ui";
import { getApiErrorMessage } from "../../src/api/client";
import { AdminWebOnlyLoginError, adminWebOnlyMessage, useAuthStore } from "../../src/stores/auth-store";
import { colors } from "../../src/theme/colors";
import { radius } from "../../src/theme/radius";
import { shadows } from "../../src/theme/shadows";
import { spacing } from "../../src/theme/spacing";

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  async function handleSubmit() {
    if (!canSubmit || isSubmitting) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const user = await login(email, password);

      if (user.role === "TEACHER") {
        router.replace("/teacher");
      } else if (user.role === "STUDENT") {
        router.replace("/student");
      }
    } catch (submitError) {
      if (submitError instanceof AdminWebOnlyLoginError) {
        setError(adminWebOnlyMessage);
      } else {
        setError(getApiErrorMessage(submitError));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormScreen centered contentStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.logo}>
            <AppText tone="white" variant="h3">LC</AppText>
          </View>
          <View style={styles.heroTitle}>
            <AppText tone="white" variant="h1">LCMP</AppText>
            <AppText tone="white" variant="caption" style={styles.heroSubtitle}>
              Language Center Management Platform
            </AppText>
          </View>
        </View>
        <View style={styles.heroDivider} />
        <View style={styles.heroCopy}>
          <AppText tone="white" variant="h2">Welcome back</AppText>
          <AppText tone="white" style={styles.heroBody}>
            Sign in with your Teacher or Student account.
          </AppText>
        </View>
        <View style={styles.roleRow}>
          <View style={styles.rolePill}>
            <AppText tone="white" variant="caption">Teacher</AppText>
          </View>
          <View style={styles.rolePill}>
            <AppText tone="white" variant="caption">Student</AppText>
          </View>
        </View>
      </View>

      <AppCard style={styles.card}>
        <View style={styles.cardHeader}>
          <AppText variant="h2">Sign in</AppText>
          <AppText tone="muted">Use the same LCMP credentials from your portal access.</AppText>
        </View>

        {error ? <ErrorState title="Login failed" message={error} /> : null}

        <View style={styles.form}>
          <AppInput
            accessibilityLabel="Email"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            label="Email"
            onChangeText={setEmail}
            placeholder="teacher@lcmp.local"
            returnKeyType="next"
            testID="login-email-input"
            textContentType="emailAddress"
            value={email}
          />
          <AppInput
            accessibilityLabel="Password"
            autoCapitalize="none"
            label="Password"
            onChangeText={setPassword}
            onSubmitEditing={handleSubmit}
            placeholder="ChangeMe123!"
            returnKeyType="done"
            secureTextEntry
            testID="login-password-input"
            textContentType="password"
            value={password}
          />
        </View>

        <AppButton
          accessibilityLabel="Sign in"
          disabled={!canSubmit}
          label="Sign in"
          loading={isSubmitting}
          onPress={handleSubmit}
          style={styles.signInButton}
          testID="login-submit-button"
        />

        <AppText align="center" tone="muted" variant="caption">Administrators use the web dashboard.</AppText>
      </AppCard>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingVertical: spacing.xxl
  },
  hero: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
    borderRadius: radius.xxl,
    borderWidth: 1,
    gap: spacing.lg,
    overflow: "hidden",
    padding: spacing.xl,
    width: "100%",
    ...shadows.floating
  },
  heroTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md
  },
  logo: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderColor: "rgba(255, 255, 255, 0.28)",
    borderRadius: radius.lg,
    borderWidth: 1,
    height: 56,
    justifyContent: "center",
    width: 56
  },
  heroTitle: {
    flex: 1,
    gap: spacing.xs
  },
  heroSubtitle: {
    color: "#e9ecff"
  },
  heroDivider: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    height: 1
  },
  heroCopy: {
    gap: spacing.xs
  },
  heroBody: {
    color: "#eef1ff"
  },
  roleRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  rolePill: {
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    borderColor: "rgba(255, 255, 255, 0.22)",
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  card: {
    gap: spacing.lg,
    padding: spacing.xl
  },
  cardHeader: {
    gap: spacing.xs
  },
  form: {
    gap: spacing.md
  },
  signInButton: {
    backgroundColor: colors.black,
    borderRadius: radius.lg,
    minHeight: 54
  }
});
