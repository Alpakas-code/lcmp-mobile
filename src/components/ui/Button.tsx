import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { colors } from "../../theme/colors";
import { radius } from "../../theme/radius";
import { spacing } from "../../theme/spacing";
import { AppIcon, AppIconName } from "./AppIcon";

type ButtonProps = {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: AppIconName;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function AppButton({
  accessibilityLabel,
  icon,
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
  style,
  testID
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" ? styles.primary : styles.secondary,
        variant === "ghost" ? styles.ghost : null,
        variant === "danger" ? styles.danger : null,
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
        style
      ]}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#ffffff" : colors.primary} />
      ) : (
        <View style={styles.buttonContent}>
          {icon ? (
            <AppIcon
              color={variant === "primary" || variant === "danger" ? colors.white : colors.primaryDark}
              name={icon}
              size={18}
            />
          ) : null}
          <Text
            style={[
              styles.label,
              variant === "primary" || variant === "danger" ? styles.primaryLabel : styles.secondaryLabel
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export const Button = AppButton;
export const PrimaryButton = AppButton;
export const SecondaryButton = (props: Omit<ButtonProps, "variant">) => <AppButton {...props} variant="secondary" />;
export const TextButton = (props: Omit<ButtonProps, "variant">) => <AppButton {...props} variant="ghost" />;

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg
  },
  primary: {
    backgroundColor: colors.primary
  },
  secondary: {
    backgroundColor: colors.primarySoft
  },
  ghost: {
    backgroundColor: "transparent"
  },
  danger: {
    backgroundColor: colors.danger
  },
  pressed: {
    opacity: 0.82
  },
  disabled: {
    opacity: 0.56
  },
  buttonContent: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center"
  },
  label: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0
  },
  primaryLabel: {
    color: colors.white
  },
  secondaryLabel: {
    color: colors.primaryDark
  }
});
