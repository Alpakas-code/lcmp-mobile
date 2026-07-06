import { PropsWithChildren, ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { colors } from "../../theme/colors";
import { radius } from "../../theme/radius";
import { shadows } from "../../theme/shadows";
import { spacing } from "../../theme/spacing";
import { AppBadge } from "./AppBadge";
import { AppButton } from "./Button";
import { AppCard } from "./Card";
import { AppIcon, AppIconName } from "./AppIcon";
import { AppText } from "./AppText";
import { AppInput } from "./TextInput";

type AvatarProps = {
  label: string;
  size?: number;
};

export function Avatar({ label, size = 48 }: AvatarProps) {
  const initials = label
    .split(/[ @.]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase())
    .join("");

  return (
    <View style={[styles.avatar, { height: size, width: size, borderRadius: size / 2 }]}>
      <AppText tone="white" variant="bodyStrong">{initials || "LC"}</AppText>
    </View>
  );
}

type GreetingHeaderProps = {
  eyebrow?: string;
  name: string;
  role: string;
  action?: ReactNode;
};

export function GreetingHeader({ action, eyebrow, name, role }: GreetingHeaderProps) {
  return (
    <View style={styles.greetingHeader}>
      <View style={styles.greetingProfile}>
        <Avatar label={name} />
        <View style={styles.greetingText}>
          {eyebrow ? <AppText tone="muted" variant="smallLabel">{eyebrow}</AppText> : null}
          <AppText variant="h2">{name}</AppText>
          <AppText tone="muted" variant="caption">{role}</AppText>
        </View>
      </View>
      {action}
    </View>
  );
}

type IconButtonProps = {
  icon: AppIconName;
  label: string;
  onPress: () => void;
};

export function IconButton({ icon, label, onPress }: IconButtonProps) {
  return (
    <Pressable accessibilityHint={`Activates ${label}.`} accessibilityLabel={label} accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}>
      <AppIcon color={colors.text} name={icon} size={18} />
    </Pressable>
  );
}

export function SearchBar({ onChangeText, value }: { value: string; onChangeText: (value: string) => void }) {
  return <AppInput icon="search" label="Search" onChangeText={onChangeText} placeholder="Search LCMP" value={value} />;
}

export function Chip({ label, selected = false, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole={onPress ? "button" : undefined} onPress={onPress} style={[styles.chip, selected ? styles.chipSelected : null]}>
      <AppText tone={selected ? "white" : "soft"} variant="caption">{label}</AppText>
    </Pressable>
  );
}

type StatCardProps = {
  title: string;
  value: string;
  caption?: string;
  icon?: AppIconName;
  tone?: "primary" | "secondary" | "success" | "warning" | "danger";
  onPress?: () => void;
};

export function StatCard({ caption, icon, onPress, title, tone = "primary", value }: StatCardProps) {
  const card = (
    <AppCard style={[styles.statCard, tone === "secondary" ? styles.secondaryCard : null, tone === "success" ? styles.successCard : null, tone === "warning" ? styles.warningCard : null, tone === "danger" ? styles.dangerCard : null]}>
      <View style={styles.statTop}>
        {icon ? <AppIcon color={tone === "primary" || tone === "secondary" ? colors.white : colors.text} name={icon} size={20} /> : null}
        <AppText tone={tone === "primary" || tone === "secondary" ? "white" : "soft"} variant="smallLabel">{title}</AppText>
      </View>
      <AppText tone={tone === "primary" || tone === "secondary" ? "white" : "default"} variant="h2">{value}</AppText>
      {caption ? <AppText tone={tone === "primary" || tone === "secondary" ? "white" : "muted"} variant="caption">{caption}</AppText> : null}
    </AppCard>
  );

  if (!onPress) return card;
  return <Pressable accessibilityLabel={`${title}. ${value}${caption ? `. ${caption}` : ""}`} accessibilityRole="button" onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>{card}</Pressable>;
}

type CourseCardProps = {
  title: string;
  subtitle?: string;
  meta?: string;
  tone?: "primary" | "secondary" | "neutral";
  onPress?: () => void;
};

export function CourseCard({ meta, onPress, subtitle, title, tone = "primary" }: CourseCardProps) {
  const card = (
    <AppCard style={[styles.courseCard, tone === "secondary" ? styles.courseSecondary : null, tone === "neutral" ? styles.courseNeutral : null]}>
      <AppText tone={tone === "neutral" ? "default" : "white"} variant="cardTitle">{title}</AppText>
      {subtitle ? <AppText tone={tone === "neutral" ? "muted" : "white"} variant="caption">{subtitle}</AppText> : null}
      {meta ? <AppBadge tone={tone === "neutral" ? "primary" : "neutral"}>{meta}</AppBadge> : null}
    </AppCard>
  );

  if (!onPress) return card;
  return <Pressable accessibilityLabel={`${title}${subtitle ? `. ${subtitle}` : ""}${meta ? `. ${meta}` : ""}`} accessibilityRole="button" onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>{card}</Pressable>;
}

type ScheduleCardProps = {
  title: string;
  time: string;
  label?: string;
  tone?: "primary" | "secondary" | "warning" | "danger";
  onPress?: () => void;
};

export function ScheduleCard({ label, onPress, time, title, tone = "primary" }: ScheduleCardProps) {
  const card = (
    <AppCard style={styles.scheduleCard}>
      <View style={[styles.scheduleAccent, tone === "secondary" ? styles.secondaryAccent : null, tone === "warning" ? styles.warningAccent : null, tone === "danger" ? styles.dangerAccent : null]} />
      <View style={styles.scheduleContent}>
        {label ? <AppText tone="muted" variant="smallLabel">{label}</AppText> : null}
        <AppText variant="cardTitle">{title}</AppText>
        <AppText tone="muted" variant="caption">{time}</AppText>
      </View>
    </AppCard>
  );

  if (!onPress) return card;

  return (
    <Pressable accessibilityLabel={`${title}. ${time}${label ? `. ${label}` : ""}`} accessibilityRole="button" onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      {card}
    </Pressable>
  );
}

type SimpleCardProps = {
  title: string;
  subtitle?: string;
  meta?: string;
  icon?: AppIconName;
  onPress?: () => void;
};

export function NotificationCard(props: SimpleCardProps) {
  return <MDSListCard {...props} icon={props.icon ?? "notification"} />;
}

export function MessageCard(props: SimpleCardProps) {
  return <MDSListCard {...props} icon={props.icon ?? "chat"} />;
}

export function DocumentCard(props: SimpleCardProps) {
  return <MDSListCard {...props} icon={props.icon ?? "document"} />;
}

export function CertificateCard(props: SimpleCardProps) {
  return <MDSListCard {...props} icon={props.icon ?? "ribbon"} />;
}

export function QuickActionCard({ icon = "grid", meta, onPress, subtitle, title }: SimpleCardProps) {
  return <MDSListCard icon={icon} meta={meta} onPress={onPress} subtitle={subtitle} title={title} />;
}

function MDSListCard({ icon = "document", meta, onPress, subtitle, title }: SimpleCardProps) {
  const card = (
    <AppCard style={styles.listCard}>
      <View style={styles.listIcon}>
        <AppIcon color={colors.primary} name={icon} size={18} />
      </View>
      <View style={styles.listContent}>
        <AppText variant="bodyStrong">{title}</AppText>
        {subtitle ? <AppText tone="muted" variant="caption">{subtitle}</AppText> : null}
      </View>
      {meta ? <AppBadge tone="primary">{meta}</AppBadge> : null}
    </AppCard>
  );

  if (!onPress) return card;

  return (
    <Pressable accessibilityLabel={`${title}${subtitle ? `. ${subtitle}` : ""}${meta ? `. ${meta}` : ""}`} accessibilityRole="button" onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      {card}
    </Pressable>
  );
}

export function SkeletonLoader({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.skeleton, style]} />;
}

type BottomSheetProps = PropsWithChildren<{
  visible: boolean;
  title: string;
  onClose: () => void;
}>;

export function BottomSheet({ children, onClose, title, visible }: BottomSheetProps) {
  return (
    <Modal animationType="slide" transparent visible={visible}>
      <View style={styles.sheetOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <AppText variant="h3">{title}</AppText>
          {children}
        </View>
      </View>
    </Modal>
  );
}

type ConfirmationDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmationDialog({
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  message,
  onCancel,
  onConfirm,
  title,
  visible
}: ConfirmationDialogProps) {
  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.dialogOverlay}>
        <AppCard style={styles.dialog}>
          <AppText variant="h3">{title}</AppText>
          <AppText tone="muted">{message}</AppText>
          <View style={styles.dialogActions}>
            <AppButton accessibilityHint="Closes this confirmation dialog." label={cancelLabel} onPress={onCancel} variant="secondary" style={styles.dialogButton} />
            <AppButton accessibilityHint="Confirms this action." label={confirmLabel} onPress={onConfirm} style={styles.dialogButton} />
          </View>
        </AppCard>
      </View>
    </Modal>
  );
}

export function HorizontalRail({ children }: PropsWithChildren) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    backgroundColor: colors.primary,
    justifyContent: "center"
  },
  greetingHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  greetingProfile: {
    alignItems: "center",
    flexDirection: "row",
    flex: 1,
    gap: spacing.md
  },
  greetingText: {
    flex: 1,
    gap: spacing.xs
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.full,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48,
    ...shadows.soft
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }]
  },
  chip: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm
  },
  chipSelected: {
    backgroundColor: colors.primary
  },
  statCard: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    gap: spacing.sm,
    minHeight: 136,
    width: 148
  },
  secondaryCard: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary
  },
  successCard: {
    backgroundColor: colors.successSoft,
    borderColor: colors.successSoft
  },
  warningCard: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warningSoft
  },
  dangerCard: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.dangerSoft
  },
  statTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  courseCard: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    gap: spacing.sm,
    minHeight: 154,
    width: 214
  },
  courseSecondary: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary
  },
  courseNeutral: {
    backgroundColor: colors.surface,
    borderColor: colors.border
  },
  scheduleCard: {
    flexDirection: "row",
    gap: spacing.md,
    padding: 0
  },
  scheduleAccent: {
    backgroundColor: colors.primary,
    borderBottomLeftRadius: radius.lg,
    borderTopLeftRadius: radius.lg,
    width: 8
  },
  secondaryAccent: {
    backgroundColor: colors.secondary
  },
  warningAccent: {
    backgroundColor: colors.warning
  },
  dangerAccent: {
    backgroundColor: colors.danger
  },
  scheduleContent: {
    flex: 1,
    gap: spacing.xs,
    padding: spacing.lg,
    paddingLeft: 0
  },
  listCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md
  },
  listIcon: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  listContent: {
    flex: 1,
    gap: spacing.xs
  },
  skeleton: {
    backgroundColor: colors.neutralSoft,
    borderRadius: radius.lg,
    minHeight: 18
  },
  sheetOverlay: {
    backgroundColor: colors.overlay,
    flex: 1,
    justifyContent: "flex-end"
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    gap: spacing.lg,
    padding: spacing.xxl
  },
  sheetHandle: {
    alignSelf: "center",
    backgroundColor: colors.borderStrong,
    borderRadius: radius.full,
    height: 5,
    width: 48
  },
  dialogOverlay: {
    alignItems: "center",
    backgroundColor: colors.overlay,
    flex: 1,
    justifyContent: "center",
    padding: spacing.xxl
  },
  dialog: {
    gap: spacing.lg,
    width: "100%"
  },
  dialogActions: {
    flexDirection: "row",
    gap: spacing.md
  },
  dialogButton: {
    flex: 1
  },
  rail: {
    gap: spacing.md,
    paddingRight: spacing.lg
  }
});
