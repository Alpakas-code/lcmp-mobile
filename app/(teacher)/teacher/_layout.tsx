import { Tabs } from "expo-router";
import { ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppIcon, AppIconName } from "../../../src/components/ui";
import { colors } from "../../../src/theme/colors";
import { radius } from "../../../src/theme/radius";

const visibleTabs: { name: string; title: string; icon: AppIconName; testID?: string }[] = [
  { name: "index", title: "Home", icon: "home", testID: "teacher-home-tab" },
  { name: "groups", title: "Groups", icon: "people", testID: "teacher-groups-tab" },
  { name: "schedule", title: "Schedule", icon: "calendar", testID: "teacher-schedule-tab" },
  { name: "attendance", title: "Attendance", icon: "check", testID: "teacher-attendance-tab" },
  { name: "more", title: "More", icon: "grid", testID: "teacher-more-tab" }
];

export default function TeacherTabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: "900", letterSpacing: 0 },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          minHeight: 64 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8
        }
      }}
    >
      {visibleTabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            tabBarAccessibilityLabel: `${tab.title} tab`,
            title: tab.title,
            tabBarButtonTestID: tab.testID,
            tabBarIcon: ({ color, focused }) => {
              const iconStyle: ViewStyle = {
                backgroundColor: focused ? colors.primarySoft : "transparent",
                borderRadius: radius.full,
                minWidth: focused ? 38 : 22,
                paddingHorizontal: focused ? 10 : 0,
                paddingVertical: focused ? 4 : 0
              };

              return <AppIcon color={color} name={tab.icon} size={20} style={iconStyle} />;
            }
          }}
        />
      ))}
      <Tabs.Screen name="participation" options={{ href: null }} />
      <Tabs.Screen name="progress" options={{ href: null }} />
      <Tabs.Screen name="messages" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="course-room" options={{ href: null }} />
    </Tabs>
  );
}
