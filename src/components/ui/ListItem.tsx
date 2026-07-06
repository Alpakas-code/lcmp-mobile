import { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { colors } from "../../theme/colors";
import { radius } from "../../theme/radius";
import { spacing } from "../../theme/spacing";
import { AppIcon, AppIconName } from "./AppIcon";
import { AppText } from "./AppText";

type ListItemProps = {
  title: string;
  subtitle?: string;
  icon?: AppIconName;
  accessory?: ReactNode;
  onPress?: () => void;
  accessibilityHint?: string;
  accessibilityLabel?: string;
};

export function ListItem({ accessibilityHint, accessibilityLabel, accessory, icon, onPress, subtitle, title }: ListItemProps) {
  const content = (
    <View style={styles.row}>
      {icon ? (
        <View style={styles.icon}>
          <AppIcon color={colors.primary} name={icon} size={19} />
        </View>
      ) : null}
      <View style={styles.text}>
        <AppText variant="bodyStrong">{title}</AppText>
        {subtitle ? (
          <AppText tone="muted" variant="caption">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {accessory ?? (onPress ? <AppIcon color={colors.muted} name="chevron" size={18} /> : null)}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel ?? `${title}${subtitle ? `. ${subtitle}` : ""}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 64,
    padding: spacing.md
  },
  icon: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    height: 38,
    justifyContent: "center",
    width: 38
  },
  text: {
    flex: 1,
    gap: spacing.xs
  },
  pressed: {
    opacity: 0.82
  }
});
