import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import {
  CourseCard,
  GreetingHeader,
  HorizontalRail,
  IconButton,
  QuickActionCard,
  ScheduleCard,
  Screen,
  SectionHeader,
  StatCard
} from "../../../src/components/ui";
import { useAuthStore } from "../../../src/stores/auth-store";
import { spacing } from "../../../src/theme/spacing";

const teacherStats = [
  { title: "Today's Classes", value: "03", caption: "Across assigned groups", icon: "calendar", tone: "primary" },
  { title: "Pending Attendance", value: "02", caption: "Sessions to review", icon: "check", tone: "warning" },
  { title: "My Groups", value: "04", caption: "Active learner groups", icon: "people", tone: "secondary" },
  { title: "Unread Messages", value: "05", caption: "Student and staff notes", icon: "chat", tone: "primary" }
] as const;

const teacherCourses = [
  { title: "English A2", subtitle: "Group A2-01", meta: "Today" },
  { title: "French B1", subtitle: "Group B1-02", meta: "Tomorrow" },
  { title: "Spanish A1", subtitle: "Group A1-03", meta: "This week" }
];

export default function TeacherDashboard() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const displayName = user?.email?.split("@")[0] ?? "Teacher";

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <Screen contentStyle={styles.content}>
      <GreetingHeader
        action={<IconButton icon="logout" label="Sign out" onPress={handleLogout} />}
        name={displayName}
        role="Teacher"
      />

      <HorizontalRail>
        {teacherStats.map((item) => (
          <StatCard
            key={item.title}
            caption={item.caption}
            icon={item.icon}
            title={item.title}
            tone={item.tone}
            value={item.value}
          />
        ))}
      </HorizontalRail>

      <View style={styles.sectionBlock}>
        <SectionHeader title="Today's Teaching" subtitle="A calm overview of the next classroom commitments." />
        <ScheduleCard label="08:00am" time="English A2 - Room 3" title="Morning language practice" />
        <ScheduleCard label="10:00am" time="French B1 - Room 1" title="Conversation workshop" tone="secondary" />
      </View>

      <View style={styles.sectionBlock}>
        <SectionHeader title="My Groups" />
        <HorizontalRail>
          {teacherCourses.map((course, index) => (
            <CourseCard
              key={course.title}
              meta={course.meta}
              subtitle={course.subtitle}
              title={course.title}
              tone={index % 2 === 0 ? "primary" : "secondary"}
            />
          ))}
        </HorizontalRail>
      </View>

      <View style={styles.sectionBlock}>
        <SectionHeader title="Quick Actions" />
        <View style={styles.grid}>
          <QuickActionCard icon="check" meta="02" subtitle="Pending sessions" title="Attendance" />
          <QuickActionCard icon="people" meta="04" subtitle="Active groups" title="Groups" />
          <QuickActionCard icon="calendar" meta="03" subtitle="Upcoming today" title="Schedule" />
          <QuickActionCard icon="chat" meta="05" subtitle="Unread notes" title="Messages" />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xxl,
    paddingVertical: spacing.xxl
  },
  sectionBlock: {
    gap: spacing.md
  },
  grid: {
    gap: spacing.md
  }
});
