import { PropsWithChildren } from "react";
import { StyleProp, StyleSheet, Text, TextStyle } from "react-native";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

type AppTextProps = PropsWithChildren<{
  variant?: "greeting" | "h1" | "h2" | "h3" | "cardTitle" | "body" | "bodyStrong" | "caption" | "smallLabel" | "overline";
  tone?: "default" | "soft" | "muted" | "primary" | "danger" | "success" | "white";
  align?: "auto" | "left" | "right" | "center";
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}>;

export function AppText({
  align,
  children,
  numberOfLines,
  style,
  tone = "default",
  variant = "body"
}: AppTextProps) {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        typography[variant],
        styles.base,
        tone === "soft" ? styles.soft : null,
        tone === "muted" ? styles.muted : null,
        tone === "primary" ? styles.primary : null,
        tone === "danger" ? styles.danger : null,
        tone === "success" ? styles.success : null,
        tone === "white" ? styles.white : null,
        align ? { textAlign: align } : null,
        style
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    color: colors.text,
    letterSpacing: 0
  },
  soft: {
    color: colors.textSoft
  },
  muted: {
    color: colors.muted
  },
  primary: {
    color: colors.primary
  },
  danger: {
    color: colors.danger
  },
  success: {
    color: colors.success
  },
  white: {
    color: colors.white
  }
});
