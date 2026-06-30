import { PropsWithChildren, ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { AppText } from "./AppText";

type AppHeaderProps = PropsWithChildren<{
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}>;

export function AppHeader({ action, children, eyebrow, subtitle, title }: AppHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.textBlock}>
        {eyebrow ? (
          <AppText tone="primary" variant="overline">
            {eyebrow}
          </AppText>
        ) : null}
        <AppText variant="h1">{title}</AppText>
        {subtitle ? <AppText tone="muted">{subtitle}</AppText> : null}
      </View>
      {action}
      {children}
    </View>
  );
}

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.section}>
      <AppText variant="h3">{title}</AppText>
      {subtitle ? (
        <AppText tone="muted" variant="caption">
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.md
  },
  textBlock: {
    gap: spacing.xs
  },
  section: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    gap: spacing.xs,
    paddingBottom: spacing.sm
  }
});
