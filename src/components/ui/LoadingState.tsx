import { ActivityIndicator, StyleSheet, View } from "react-native";
import { colors } from "../../theme/colors";
import { radius } from "../../theme/radius";
import { spacing } from "../../theme/spacing";
import { AppText } from "./AppText";

type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = "Loading" }: LoadingStateProps) {
  return (
    <View style={styles.state}>
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
  }
});
