import { PropsWithChildren } from "react";
import { Pressable, StyleSheet, View, ViewStyle } from "react-native";
import { AppBadge, AppCard, AppHeader, AppIcon, AppIconName, AppText, SectionHeader } from "../../components/ui";
import { colors } from "../../theme/colors";
import { radius } from "../../theme/radius";
import { shadows } from "../../theme/shadows";
import { spacing } from "../../theme/spacing";

type HeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export function StudentHeader({ eyebrow = "Student Portal", title, subtitle, action }: HeaderProps) {
  return <AppHeader action={action} eyebrow={eyebrow} subtitle={subtitle} title={title} />;
}

type InfoRowProps = {
  label: string;
  value: string;
};

export function InfoRow({ label, value }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <AppText tone="muted" variant="caption" style={styles.infoLabel}>{label}</AppText>
      <AppText variant="bodyStrong" style={styles.infoValue}>{value}</AppText>
    </View>
  );
}

type SummaryCardProps = PropsWithChildren<{
  title: string;
  value?: string;
  caption?: string;
  icon?: AppIconName;
  onPress?: () => void;
  style?: ViewStyle;
}>;

export function SummaryCard({ title, value, caption, icon, onPress, children, style }: SummaryCardProps) {
  const content = (
    <AppCard style={[styles.summaryCard, style]}>
      <View style={styles.cardTop}>
        {icon ? (
          <View style={styles.iconBox}>
            <AppIcon color={colors.primary} name={icon} size={18} />
          </View>
        ) : null}
        <AppText variant="bodyStrong" style={styles.cardTitle}>{title}</AppText>
      </View>
      {value ? <AppText variant="h2">{value}</AppText> : null}
      {caption ? <AppText tone="muted">{caption}</AppText> : null}
      {children}
    </AppCard>
  );

  if (!onPress) return content;

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      {content}
    </Pressable>
  );
}

type PillProps = {
  label: string;
  tone?: "neutral" | "success" | "danger" | "warning";
};

export function Pill({ label, tone = "neutral" }: PillProps) {
  return <AppBadge tone={tone === "neutral" ? "primary" : tone}>{label}</AppBadge>;
}

export function SectionTitle({ title }: { title: string }) {
  return <SectionHeader title={title} />;
}

export function OfflineBanner({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <View style={styles.offlineBanner}>
      <View style={styles.offlineIcon}>
        <AppIcon color={colors.warning} name="notification" size={18} />
      </View>
      <View style={styles.offlineCopy}>
        <AppText variant="bodyStrong">Offline mode</AppText>
        <AppText tone="muted" variant="caption">Showing cached data. Pull to refresh when the API is reachable.</AppText>
      </View>
    </View>
  );
}

export function toneForStatus(status?: string | null): "neutral" | "success" | "danger" | "warning" {
  const value = status?.toUpperCase();
  if (value?.includes("APPROVED") || value?.includes("ACTIVE") || value?.includes("PAID") || value?.includes("PRESENT") || value?.includes("ISSUED") || value?.includes("READ") || value?.includes("VALIDATED")) {
    return "success";
  }
  if (value?.includes("REJECT") || value?.includes("ABSENT") || value?.includes("FAILED") || value?.includes("CANCEL")) {
    return "danger";
  }
  if (value?.includes("PENDING") || value?.includes("LATE") || value?.includes("EXCUSED") || value?.includes("UNREAD")) {
    return "warning";
  }
  return "neutral";
}

const styles = StyleSheet.create({
  infoRow: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    gap: spacing.xs,
    padding: spacing.md
  },
  infoLabel: {
    color: colors.muted
  },
  infoValue: {
    flexShrink: 1
  },
  summaryCard: {
    gap: spacing.md,
    minHeight: 72,
    ...shadows.soft
  },
  cardTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  iconBox: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  cardTitle: {
    flex: 1
  },
  pressed: {
    opacity: 0.82
  },
  offlineBanner: {
    alignItems: "center",
    backgroundColor: colors.warningSoft,
    borderColor: colors.warning,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md
  },
  offlineIcon: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.full,
    height: 38,
    justifyContent: "center",
    width: 38
  },
  offlineCopy: {
    flex: 1,
    gap: spacing.xs
  }
});
