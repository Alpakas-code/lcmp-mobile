import { forwardRef } from "react";
import {
  StyleSheet,
  Text,
  TextInput as NativeTextInput,
  TextInputProps as NativeTextInputProps,
  View
} from "react-native";
import { colors } from "../../theme/colors";
import { radius } from "../../theme/radius";
import { spacing } from "../../theme/spacing";
import { AppIcon, AppIconName } from "./AppIcon";

type TextInputProps = NativeTextInputProps & {
  label: string;
  error?: string;
  icon?: AppIconName;
};

export const AppInput = forwardRef<NativeTextInput, TextInputProps>(
  ({ icon, label, error, style, ...props }, ref) => (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputShell, error ? styles.inputError : null]}>
        {icon ? <AppIcon color={colors.muted} name={icon} size={18} /> : null}
        <NativeTextInput
          ref={ref}
          placeholderTextColor={colors.muted}
          style={[styles.input, style]}
          {...props}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  )
);

AppInput.displayName = "AppInput";

export const TextInput = AppInput;

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800"
  },
  inputShell: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    minHeight: 48,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
    minHeight: 48,
    paddingVertical: spacing.sm
  },
  inputError: {
    borderColor: colors.danger
  },
  error: {
    color: colors.danger,
    fontSize: 13
  }
});
