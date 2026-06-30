import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Button, Card, Screen } from "../../../src/components/ui";
import { useAuthStore } from "../../../src/stores/auth-store";
import { colors } from "../../../src/theme/colors";

const teacherCards = [
  { title: "My Groups", detail: "Assigned groups and learners" },
  { title: "Schedule", detail: "Upcoming sessions and classroom plans" },
  { title: "Attendance", detail: "Mark and review class attendance" },
  { title: "Messages", detail: "Communication with students and staff" }
];

export default function TeacherDashboard() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Teacher Portal</Text>
          <Text style={styles.title}>Welcome teacher</Text>
          <Text style={styles.subtitle}>{user?.email ?? "teacher@lcmp.local"}</Text>
        </View>
        <Button label="Sign out" onPress={handleLogout} variant="secondary" style={styles.logout} />
      </View>

      <View style={styles.grid}>
        {teacherCards.map((card) => (
          <Card key={card.title} style={styles.card}>
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardDetail}>{card.detail}</Text>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 20,
    paddingVertical: 24
  },
  header: {
    gap: 16
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    marginTop: 4
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    marginTop: 6
  },
  logout: {
    alignSelf: "flex-start"
  },
  grid: {
    gap: 14
  },
  card: {
    gap: 8
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  cardDetail: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20
  }
});
