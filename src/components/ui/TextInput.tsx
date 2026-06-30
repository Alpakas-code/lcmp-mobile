import { forwardRef } from "react";
import {
  StyleSheet,
  Text,
  TextInput as NativeTextInput,
  TextInputProps as NativeTextInputProps,
  View
} from "react-native";
import { colors } from "../../theme/colors";

type TextInputProps = NativeTextInputProps & {
  label: string;
  error?: string;
};

export const TextInput = forwardRef<NativeTextInput, TextInputProps>(
  ({ label, error, style, ...props }, ref) => (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <NativeTextInput
        ref={ref}
        placeholderTextColor={colors.muted}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  )
);

TextInput.displayName = "TextInput";

const styles = StyleSheet.create({
  wrapper: {
    gap: 8
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700"
  },
  input: {
    minHeight: 48,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: 14
  },
  inputError: {
    borderColor: colors.danger
  },
  error: {
    color: colors.danger,
    fontSize: 13
  }
});
