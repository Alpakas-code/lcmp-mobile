import { PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme/colors";
import { radius } from "../../theme/radius";
import { spacing } from "../../theme/spacing";

type AppBadgeProps = PropsWithChildren<{
  tone?: "neutral" | "primary" | "success" | "danger" | "warning";
}>;

export function AppBadge({ children, tone = "neutral" }: AppBadgeProps) {
  return (
    <View
      style={[
        styles.badge,
        tone === "primary" ? styles.primary : null,
        tone === "success" ? styles.success : null,
        tone === "danger" ? styles.danger : null,
        tone === "warning" ? styles.warning : null
      ]}
    >
      <Text
        style={[
          styles.label,
          tone === "primary" ? styles.primaryLabel : null,
          tone === "success" ? styles.successLabel : null,
          tone === "danger" ? styles.dangerLabel : null,
          tone === "warning" ? styles.warningLabel : null
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6
  },
  label: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  primary: {
    backgroundColor: colors.primarySoft
  },
  primaryLabel: {
    color: colors.primaryDark
  },
  success: {
    backgroundColor: colors.successSoft
  },
  successLabel: {
    color: colors.success
  },
  danger: {
    backgroundColor: colors.dangerSoft
  },
  dangerLabel: {
    color: colors.danger
  },
  warning: {
    backgroundColor: colors.warningSoft
  },
  warningLabel: {
    color: colors.warning
  }
});
