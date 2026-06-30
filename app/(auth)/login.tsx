import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { Button, Card, ErrorState, Screen, TextInput } from "../../src/components/ui";
import { getApiErrorMessage } from "../../src/api/client";
import { AdminWebOnlyLoginError, adminWebOnlyMessage, useAuthStore } from "../../src/stores/auth-store";
import { colors } from "../../src/theme/colors";

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
    <Screen contentStyle={styles.content}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
      >
        <View style={styles.brand}>
          <Text style={styles.brandName}>LCMP</Text>
          <Text style={styles.brandSubtitle}>Language Center Management Platform</Text>
          <Text style={styles.welcome}>Sign in with your Teacher or Student account.</Text>
        </View>

        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.title}>Mobile portal login</Text>
            <Text style={styles.subtitle}>Use the same LCMP credentials from your portal access.</Text>
          </View>

          {error ? <ErrorState title="Login failed" message={error} /> : null}

          <View style={styles.form}>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              label="Email"
              onChangeText={setEmail}
              placeholder="teacher@lcmp.local"
              returnKeyType="next"
              textContentType="emailAddress"
              value={email}
            />
            <TextInput
              autoCapitalize="none"
              label="Password"
              onChangeText={setPassword}
              onSubmitEditing={handleSubmit}
              placeholder="ChangeMe123!"
              returnKeyType="done"
              secureTextEntry
              textContentType="password"
              value={password}
            />
          </View>

          <Button
            disabled={!canSubmit}
            label="Sign in"
            loading={isSubmitting}
            onPress={handleSubmit}
          />

          <Text style={styles.footer}>Admin accounts are available on the web dashboard.</Text>
        </Card>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: "center",
    paddingVertical: 32
  },
  keyboard: {
    gap: 24
  },
  brand: {
    gap: 6
  },
  brandName: {
    color: colors.primary,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 0
  },
  brandSubtitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800"
  },
  welcome: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22
  },
  card: {
    gap: 18
  },
  cardHeader: {
    gap: 6
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900"
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  form: {
    gap: 14
  },
  footer: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center"
  }
});
