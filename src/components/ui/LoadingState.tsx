import { ActivityIndicator, StyleSheet, View } from "react-native";
import { colors } from "../../theme/colors";
import { radius } from "../../theme/radius";
import { spacing } from "../../theme/spacing";
import { AppText } from "./AppText";

type LoadingStateProps = {
  label?: string;
  rows?: number;
  variant?: "spinner" | "skeleton";
};

export function LoadingState({ label = "Loading", rows = 3, variant = "spinner" }: LoadingStateProps) {
  if (variant === "skeleton") {
    return (
      <View accessibilityLabel={label} accessibilityRole="progressbar" style={styles.skeletonState}>
        {Array.from({ length: rows }, (_, index) => (
          <View key={index} style={styles.skeletonRow}>
            <View style={styles.skeletonIcon} />
            <View style={styles.skeletonCopy}>
              <View style={styles.skeletonLineWide} />
              <View style={styles.skeletonLine} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View accessibilityLabel={label} accessibilityRole="progressbar" style={styles.state}>
      <View style={styles.loader}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
      <AppText align="center" tone="muted" variant="bodyStrong">{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  state: {
    alignItems: "center",
    flex: 1,
    gap: spacing.md,
    justifyContent: "center",
    padding: spacing.xl
  },
  loader: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.full,
    borderWidth: 1,
    height: 64,
    justifyContent: "center",
    width: 64
  },
  skeletonState: {
    gap: spacing.md,
    paddingVertical: spacing.sm
  },
  skeletonRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 72,
    padding: spacing.md
  },
  skeletonIcon: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    height: 38,
    width: 38
  },
  skeletonCopy: {
    flex: 1,
    gap: spacing.sm
  },
  skeletonLineWide: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    height: 14,
    width: "72%"
  },
  skeletonLine: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    height: 12,
    width: "48%"
  }
});
