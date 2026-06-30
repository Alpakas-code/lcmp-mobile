import { StyleSheet, View } from "react-native";
import { colors } from "../../theme/colors";
import { radius } from "../../theme/radius";
import { shadows } from "../../theme/shadows";
import { spacing } from "../../theme/spacing";
import { AppIcon, AppIconName } from "./AppIcon";
import { AppText } from "./AppText";
import { Button } from "./Button";

type EmptyStateProps = {
  title: string;
  message?: string;
  icon?: AppIconName;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ actionLabel, icon = "document", message, onAction, title }: EmptyStateProps) {
  return (
    <View style={styles.state}>
      <View style={styles.icon}>
        <AppIcon color={colors.primary} name={icon} size={22} />
      </View>
      <View style={styles.copy}>
        <AppText align="center" variant="h3">{title}</AppText>
        {message ? <AppText align="center" tone="muted">{message}</AppText> : null}
      </View>
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} variant="secondary" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  state: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.xl,
    ...shadows.card
  },
  icon: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.full,
    height: 52,
    justifyContent: "center",
    width: 52
  },
  copy: {
    gap: spacing.xs
  }
});
