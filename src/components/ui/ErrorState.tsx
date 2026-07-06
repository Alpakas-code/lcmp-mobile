import { StyleSheet, View } from "react-native";
import { colors } from "../../theme/colors";
import { radius } from "../../theme/radius";
import { shadows } from "../../theme/shadows";
import { spacing } from "../../theme/spacing";
import { AppIcon } from "./AppIcon";
import { AppText } from "./AppText";
import { Button } from "./Button";

type ErrorStateProps = {
  title?: string;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
  accessibilityLabel?: string;
};

export function ErrorState({ accessibilityLabel, title = "Something went wrong", message, retryLabel = "Try again", onRetry }: ErrorStateProps) {
  return (
    <View accessibilityLabel={accessibilityLabel ?? `${title}. ${message}`} accessibilityRole="alert" style={styles.state}>
      <View style={styles.icon}>
        <AppIcon color={colors.danger} name="notification" size={22} />
      </View>
      <View style={styles.copy}>
        <AppText tone="danger" variant="h3">{title}</AppText>
        <AppText tone="danger">{message}</AppText>
      </View>
      {onRetry ? <Button accessibilityHint="Retries the failed request." label={retryLabel} onPress={onRetry} variant="secondary" style={styles.action} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  state: {
    backgroundColor: colors.dangerSoft,
    borderColor: "#fecdca",
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    ...shadows.soft
  },
  icon: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.full,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  copy: {
    gap: spacing.xs
  },
  action: {
    alignSelf: "flex-start"
  }
});
