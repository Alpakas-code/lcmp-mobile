import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  AppText,
  Button,
  EmptyState,
  ErrorState,
  GreetingHeader,
  HorizontalRail,
  IconButton,
  KeyboardAwareScreen,
  ListItem,
  ListScreen,
  LoadingState,
  QuickActionCard,
  Screen,
  StatCard,
  TextInput
} from "../../components/ui";
import { getApiErrorMessage, isNetworkError } from "../../api/client";
import { isRememberedDevice } from "../../native/biometric-auth";
import { useNetworkStatus } from "../../native/network-status";
import { registerForExpoPushNotifications } from "../../native/push-notifications";
import { useAuthStore } from "../../stores/auth-store";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { formatDate, formatDateTime, nameOf, personName, statusLabel, text } from "../student/format";
import { InfoRow, OfflineBanner, Pill, SectionTitle, StudentHeader, SummaryCard, toneForStatus } from "../student/StudentUI";
import {
  createAttendanceSession,
  createParticipationRecord,
  generateProgressReport,
  getAttendanceSessions,
  getNotificationPreference,
  getParticipationRecords,
  getProgressReports,
  getTeacherCalendar,
  getTeacherDashboardData,
  getTeacherGroupStudents,
  getTeacherGroups,
  getTeacherInboxMessages,
  getTeacherMessageDetail,
  getTeacherNotifications,
  getTeacherProfile,
  getTeacherSentMessages,
  getTeacherUnreadMessageCount,
  markAllTeacherNotificationsRead,
  markTeacherMessageRead,
  markTeacherNotificationRead,
  saveAttendanceRecords,
  sendTeacherMessage,
  updateAttendanceRecord,
  updateNotificationPreference,
  updateParticipationRecord,
  updateTeacherProfile
} from "./api";
import type {
  GroupStudentAssignment,
  ParticipationRecord,
  TeacherCalendarEvent,
  TeacherGroup,
  TeacherMessage,
  TeacherNotification
} from "./types";

const attendanceStatuses = ["PRESENT", "ABSENT", "LATE", "EXCUSED"] as const;

function resourceError(error: unknown, retry: () => void) {
  return <ErrorState message={getApiErrorMessage(error)} onRetry={retry} />;
}

function refreshAll(...refetchers: (() => Promise<unknown>)[]) {
  return () => {
    void Promise.all(refetchers.map((refetch) => refetch()));
  };
}

function hasOfflineError(...errors: unknown[]) {
  return errors.some((error) => error && isNetworkError(error));
}

function isUnreadNotification(item: TeacherNotification) {
  return !item.readAt && item.status !== "READ";
}

function dateKey(value: Date | string | undefined) {
  const date = value ? new Date(value) : new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function calendarRange(month: Date) {
  const start = startOfMonth(month);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const from = new Date(start);
  from.setDate(start.getDate() - start.getDay());
  from.setHours(0, 0, 0, 0);
  const to = new Date(end);
  to.setDate(end.getDate() + (6 - end.getDay()));
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

function calendarDays(month: Date) {
  const { from } = calendarRange(month);
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(from);
    day.setDate(from.getDate() + index);
    return day;
  });
}

function monthLabel(date: Date) {
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function groupStudentId(item: GroupStudentAssignment) {
  return item.studentId ?? item.student?.id;
}

function studentLabel(item: GroupStudentAssignment) {
  return personName(item.student, "Student");
}

function eventRange(event: TeacherCalendarEvent) {
  return `${formatDateTime(event.startTime)} - ${formatDateTime(event.endTime)}`;
}

function groupStudentCount(group: TeacherGroup) {
  return Number(group._count?.assignments ?? group.assignments?.length ?? 0);
}

export function TeacherDashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const query = useQuery({ queryKey: ["teacher", "dashboard"], queryFn: getTeacherDashboardData });

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  if (query.isLoading) {
    return (
      <Screen scroll={false}>
        <LoadingState label="Loading teacher dashboard" />
      </Screen>
    );
  }

  if (query.isError && !query.data) {
    return <Screen contentStyle={styles.content}>{resourceError(query.error, query.refetch)}</Screen>;
  }

  const data = query.data;
  if (!data) return null;

  const displayName = [data.profile.firstName, data.profile.lastName].filter(Boolean).join(" ") || user?.email?.split("@")[0] || "Teacher";
  const todayKey = dateKey(new Date());
  const todaySessions = data.calendar.filter((event) => dateKey(event.startTime) === todayKey);
  const upcoming = data.calendar.filter((event) => new Date(String(event.startTime)).getTime() >= Date.now()).slice(0, 4);
  const unreadNotifications = data.notifications.filter(isUnreadNotification).length;
  const studentCount = data.groups.reduce((sum, group) => sum + groupStudentCount(group), 0);
  const pendingAttendance = todaySessions.filter((event) => event.type !== "EXAM_SESSION").length;

  return (
    <Screen contentStyle={styles.content} onRefresh={() => void query.refetch()} refreshing={query.isRefetching} testID="teacher-dashboard">
      <OfflineBanner visible={Boolean(data && query.error && isNetworkError(query.error))} />
      <GreetingHeader
        action={<IconButton icon="logout" label="Sign out" onPress={handleLogout} />}
        name={displayName}
        role="Teacher"
      />
      <HorizontalRail>
        <StatCard title="Groups" value={String(data.groups.length)} caption="Assigned groups" icon="people" onPress={() => router.push("/teacher/groups")} />
        <StatCard title="Students" value={String(studentCount)} caption="Across groups" icon="school" tone="secondary" onPress={() => router.push("/teacher/groups")} />
        <StatCard title="Today" value={String(todaySessions.length)} caption="Sessions and exams" icon="calendar" tone="warning" onPress={() => router.push("/teacher/schedule")} />
        <StatCard title="Messages" value={String(data.inboxCount.count)} caption="Unread" icon="chat" onPress={() => router.push("/teacher/messages")} />
      </HorizontalRail>
      <View style={styles.sectionBlock}>
        <SectionTitle title="Today's sessions" />
        {todaySessions.length === 0 ? <EmptyState icon="calendar" title="No sessions today" message="Assigned sessions will appear here from the calendar." /> : null}
        {todaySessions.map((event) => <EventCard key={`${event.type}-${event.id}`} event={event} />)}
      </View>
      <View style={styles.sectionBlock}>
        <SectionTitle title="Upcoming" />
        {upcoming.length === 0 ? <EmptyState icon="calendar" title="No upcoming events" message="Upcoming classes and exams will appear here." /> : null}
        {upcoming.map((event) => <EventCard key={`${event.type}-upcoming-${event.id}`} event={event} />)}
      </View>
      <View style={styles.sectionBlock}>
        <SectionTitle title="Quick actions" />
        <View style={styles.grid}>
          <QuickActionCard icon="check" meta={String(pendingAttendance)} subtitle="Create or update records" title="Take attendance" onPress={() => router.push("/teacher/attendance")} />
          <QuickActionCard icon="calendar" meta={String(todaySessions.length)} subtitle="Calendar view" title="Schedule" onPress={() => router.push("/teacher/schedule")} />
          <QuickActionCard icon="people" meta={String(data.groups.length)} subtitle="Assigned groups" title="Groups" onPress={() => router.push("/teacher/groups")} />
          <QuickActionCard icon="trend" meta="Reports" subtitle="Student progress" title="Progress" onPress={() => router.push("/teacher/progress")} />
          <QuickActionCard icon="chat" meta={String(data.inboxCount.count)} subtitle="Inbox and sent" title="Messages" onPress={() => router.push("/teacher/messages")} />
          <QuickActionCard icon="notification" meta={String(unreadNotifications)} subtitle="Unread updates" title="Notifications" onPress={() => router.push("/teacher/notifications")} />
        </View>
      </View>
    </Screen>
  );
}

function EventCard({ event }: { event: TeacherCalendarEvent }) {
  return (
    <SummaryCard icon={event.type === "EXAM_SESSION" ? "school" : "calendar"} title={text(event.title, event.type === "EXAM_SESSION" ? "Exam session" : "Class session")}>
      <View style={styles.pillRow}>
        <Pill label={statusLabel(event.type ?? "Session")} />
        <Pill label={statusLabel(event.status)} tone={toneForStatus(event.status)} />
      </View>
      <InfoRow label="Time" value={eventRange(event)} />
      <InfoRow label="Group" value={nameOf(event.group)} />
      <InfoRow label="Classroom" value={nameOf(event.classroom, text(event.meetingUrl, "Not assigned"))} />
    </SummaryCard>
  );
}

export function TeacherGroupsScreen() {
  const router = useRouter();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const groups = useQuery({ queryKey: ["teacher", "groups"], queryFn: getTeacherGroups });
  const students = useQuery({
    enabled: Boolean(selectedGroupId),
    queryKey: ["teacher", "groups", selectedGroupId, "students"],
    queryFn: () => getTeacherGroupStudents(String(selectedGroupId))
  });
  const selectedGroup = groups.data?.find((group) => group.id === selectedGroupId) ?? groups.data?.[0];

  useEffect(() => {
    if (!selectedGroupId && groups.data?.[0]) setSelectedGroupId(groups.data[0].id);
  }, [groups.data, selectedGroupId]);

  return (
    <Screen contentStyle={styles.content} onRefresh={refreshAll(groups.refetch, students.refetch)} refreshing={groups.isRefetching || students.isRefetching}>
      <OfflineBanner visible={Boolean(groups.data && groups.error && isNetworkError(groups.error))} />
      <StudentHeader title="Groups" subtitle="Assigned groups and active students." />
      {groups.isLoading ? <LoadingState label="Loading groups" /> : null}
      {groups.isError && !groups.data ? resourceError(groups.error, groups.refetch) : null}
      {groups.data?.length === 0 ? <EmptyState icon="people" title="No assigned groups" message="Teacher-assigned groups will appear here." /> : null}
      {groups.data?.map((group) => (
        <SummaryCard key={group.id} icon="people" title={text(group.name, "Group")} onPress={() => setSelectedGroupId(group.id)}>
          <View style={styles.pillRow}>
            <Pill label={group.isActive === false ? "Inactive" : "Active"} tone={group.isActive === false ? "warning" : "success"} />
            <Pill label={`${groupStudentCount(group)} students`} />
          </View>
          <InfoRow label="Language" value={nameOf(group.language)} />
          <InfoRow label="Level" value={nameOf(group.subLevel ?? group.level)} />
          <InfoRow label="Course" value={nameOf(group.course)} />
          <InfoRow label="Schedules" value={String(group._count?.schedules ?? 0)} />
          {group.course?.id ? (
            <Button label="Open course room" onPress={() => router.push(`/teacher/course-room?courseId=${group.course?.id}`)} variant="secondary" />
          ) : null}
        </SummaryCard>
      ))}
      {selectedGroup ? (
        <View style={styles.sectionBlock}>
          <SectionTitle title={`${text(selectedGroup.name, "Group")} students`} />
          {students.isLoading ? <LoadingState label="Loading students" /> : null}
          {students.isError ? resourceError(students.error, students.refetch) : null}
          {students.data?.length === 0 ? <EmptyState icon="people" title="No active students" message="Active group assignments will appear here." /> : null}
          {students.data?.map((assignment) => (
            <SummaryCard key={assignment.id} icon="school" title={studentLabel(assignment)}>
              <InfoRow label="Email" value={text(assignment.student?.email)} />
              <InfoRow label="Phone" value={text(assignment.student?.profile?.phone)} />
              <InfoRow label="Progress" value={text(assignment.enrollment?.progressionText)} />
              <View style={styles.actionRow}>
                <Button label="Attendance" onPress={() => router.push("/teacher/attendance")} variant="secondary" style={styles.actionButton} />
                <Button label="Participation" onPress={() => router.push("/teacher/participation")} variant="secondary" style={styles.actionButton} />
                <Button label="Progress" onPress={() => router.push("/teacher/progress")} variant="secondary" style={styles.actionButton} />
              </View>
            </SummaryCard>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

export function TeacherScheduleScreen() {
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(new Date());
  const range = useMemo(() => calendarRange(visibleMonth), [visibleMonth]);
  const query = useQuery({
    queryKey: ["teacher", "schedule", range.from.toISOString(), range.to.toISOString()],
    queryFn: () => getTeacherCalendar(range.from, range.to)
  });
  const events = query.data ?? [];
  const selectedEvents = events.filter((event) => dateKey(event.startTime) === dateKey(selectedDate));
  const upcoming = events.filter((event) => new Date(String(event.startTime)).getTime() >= Date.now()).slice(0, 6);

  function goToday() {
    const today = new Date();
    setVisibleMonth(startOfMonth(today));
    setSelectedDate(today);
  }

  return (
    <Screen contentStyle={styles.content} onRefresh={() => void query.refetch()} refreshing={query.isRefetching}>
      <OfflineBanner visible={Boolean(query.data && query.error && isNetworkError(query.error))} />
      <StudentHeader title="Schedule" subtitle="Teacher calendar for classes and exams." />
      {query.isLoading ? <LoadingState label="Loading schedule" /> : null}
      {query.isError && !query.data ? resourceError(query.error, query.refetch) : null}
      <SummaryCard title={monthLabel(visibleMonth)} icon="calendar">
        <View style={styles.calendarActions}>
          <Button label="Previous" onPress={() => setVisibleMonth((current) => addMonths(current, -1))} variant="secondary" style={styles.calendarAction} />
          <Button label="Today" onPress={goToday} variant="ghost" style={styles.calendarAction} />
          <Button label="Next" onPress={() => setVisibleMonth((current) => addMonths(current, 1))} variant="secondary" style={styles.calendarAction} />
        </View>
        <TeacherCalendarMonth events={events} month={visibleMonth} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      </SummaryCard>
      <SectionTitle title={formatDate(selectedDate)} />
      {selectedEvents.length === 0 ? <EmptyState icon="calendar" title="No events on this date" message="Select another highlighted date or check upcoming events." /> : null}
      {selectedEvents.map((event) => <EventCard key={`${event.type}-selected-${event.id}`} event={event} />)}
      <SectionTitle title="Upcoming" />
      {upcoming.length === 0 && query.data ? <EmptyState icon="calendar" title="No upcoming events" message="No upcoming teacher-scoped calendar events returned." /> : null}
      {upcoming.map((event) => <EventCard key={`${event.type}-schedule-${event.id}`} event={event} />)}
    </Screen>
  );
}

function TeacherCalendarMonth({ events, month, onSelectDate, selectedDate }: { events: TeacherCalendarEvent[]; month: Date; selectedDate: Date; onSelectDate: (date: Date) => void }) {
  const eventMap = useMemo(() => {
    const map = new Map<string, { classes: number; exams: number }>();
    events.forEach((event) => {
      const key = dateKey(event.startTime);
      const current = map.get(key) ?? { classes: 0, exams: 0 };
      if (event.type === "EXAM_SESSION") current.exams += 1;
      else current.classes += 1;
      map.set(key, current);
    });
    return map;
  }, [events]);
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const selected = dateKey(selectedDate);
  const today = dateKey(new Date());

  return (
    <View style={styles.calendarGrid}>
      {labels.map((label) => <AppText key={label} tone="muted" variant="caption" style={styles.weekday}>{label}</AppText>)}
      {calendarDays(month).map((day) => {
        const key = dateKey(day);
        const indicators = eventMap.get(key);
        const isCurrentMonth = day.getMonth() === month.getMonth();
        const isSelected = key === selected;
        const isToday = key === today;
        return (
          <Pressable
            key={key}
            accessibilityHint="Shows teacher events for this date."
            accessibilityLabel={`Select ${formatDate(day.toISOString())}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelectDate(day)}
            style={({ pressed }) => [styles.dayCell, !isCurrentMonth ? styles.outsideMonth : null, isToday ? styles.todayCell : null, isSelected ? styles.selectedDayCell : null, pressed ? styles.pressed : null]}
          >
            <AppText variant="bodyStrong" tone={isSelected ? "white" : isCurrentMonth ? "default" : "muted"}>{String(day.getDate())}</AppText>
            <View style={styles.dotRow}>
              {indicators?.classes ? <View style={[styles.eventDot, styles.classDot]} /> : null}
              {indicators?.exams ? <View style={[styles.eventDot, styles.examDot]} /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export function TeacherAttendanceScreen() {
  const queryClient = useQueryClient();
  const network = useNetworkStatus();
  const groups = useQuery({ queryKey: ["teacher", "groups"], queryFn: getTeacherGroups });
  const [groupId, setGroupId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [records, setRecords] = useState<Record<string, { status: string; remarks?: string; recordId?: string }>>({});
  const sessions = useQuery({ enabled: Boolean(groupId), queryKey: ["teacher", "attendance-sessions", groupId], queryFn: () => getAttendanceSessions(String(groupId)) });
  const students = useQuery({ enabled: Boolean(groupId), queryKey: ["teacher", "groups", groupId, "students"], queryFn: () => getTeacherGroupStudents(String(groupId)) });
  const selectedSession = sessions.data?.find((item) => item.id === sessionId);

  useEffect(() => {
    if (!groupId && groups.data?.[0]) setGroupId(groups.data[0].id);
  }, [groupId, groups.data]);

  useEffect(() => {
    if (!sessionId && sessions.data?.[0]) setSessionId(sessions.data[0].id);
  }, [sessionId, sessions.data]);

  useEffect(() => {
    if (!selectedSession) return;
    const next: Record<string, { status: string; remarks?: string; recordId?: string }> = {};
    selectedSession.records?.forEach((record) => {
      next[record.studentId] = { status: record.status ?? "PRESENT", remarks: record.remarks ?? "", recordId: record.id };
    });
    setRecords(next);
    setTitle(selectedSession.title ?? "");
  }, [selectedSession]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (network.isOffline) throw new Error("Attendance cannot be saved while offline.");
      if (!groupId) throw new Error("Select a group before saving attendance.");
      const session = selectedSession ?? await createAttendanceSession({
        groupId,
        title: title.trim() || "Mobile attendance",
        sessionDate: new Date().toISOString(),
        notes: notes.trim() || undefined
      });
      const payload = (students.data ?? []).map((student) => {
        const studentId = String(groupStudentId(student));
        return { studentId, status: records[studentId]?.status ?? "PRESENT", remarks: records[studentId]?.remarks?.trim() || undefined, recordId: records[studentId]?.recordId };
      });
      const existing = payload.filter((record) => record.recordId);
      const missing = payload.filter((record) => !record.recordId);
      await Promise.all(existing.map((record) => updateAttendanceRecord(String(record.recordId), { status: record.status, remarks: record.remarks, updateReason: "Updated from mobile" })));
      if (missing.length) {
        await saveAttendanceRecords(session.id, missing.map(({ studentId, status, remarks }) => ({ studentId, status, remarks })));
      }
      return session;
    },
    onSuccess: async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      void queryClient.invalidateQueries({ queryKey: ["teacher", "attendance-sessions"] });
    }
  });

  function setAll(status: string) {
    const next: Record<string, { status: string; remarks?: string; recordId?: string }> = {};
    (students.data ?? []).forEach((student) => {
      const id = String(groupStudentId(student));
      next[id] = { ...records[id], status };
    });
    setRecords(next);
  }

  function setRecord(studentId: string, patch: Partial<{ status: string; remarks: string }>) {
    setRecords((current) => ({ ...current, [studentId]: { ...current[studentId], ...patch, status: patch.status ?? current[studentId]?.status ?? "PRESENT" } }));
  }

  return (
    <KeyboardAwareScreen contentStyle={styles.content} onRefresh={refreshAll(groups.refetch, sessions.refetch, students.refetch)} refreshing={groups.isRefetching || sessions.isRefetching || students.isRefetching}>
      <OfflineBanner visible={network.isOffline || hasOfflineError(groups.error, sessions.error, students.error)} />
      <StudentHeader title="Attendance" subtitle="Create or update attendance records for assigned groups." />
      {groups.isLoading ? <LoadingState label="Loading groups" /> : null}
      {groups.isError && !groups.data ? resourceError(groups.error, groups.refetch) : null}
      <PickerCard title="Group" items={groups.data ?? []} selectedId={groupId} labelFor={(group) => text(group.name, "Group")} onSelect={(id) => { setGroupId(id); setSessionId(null); setRecords({}); }} />
      <PickerCard title="Existing sessions" items={sessions.data ?? []} selectedId={sessionId} labelFor={(session) => `${formatDate(session.sessionDate)} - ${text(session.title, session.group?.name)}`} onSelect={setSessionId} emptyLabel="No attendance sessions yet" />
      <SummaryCard icon="check" title={selectedSession ? "Update records" : "New attendance session"}>
        <TextInput label="Session title" value={title} onChangeText={setTitle} />
        <TextInput label="Notes" value={notes} onChangeText={setNotes} multiline style={styles.multiline} />
        <View style={styles.actionRow}>
          <Button label="Bulk present" onPress={() => setAll("PRESENT")} variant="secondary" style={styles.actionButton} />
          <Button label="Bulk absent" onPress={() => setAll("ABSENT")} variant="secondary" style={styles.actionButton} />
        </View>
      </SummaryCard>
      {students.isLoading ? <LoadingState label="Loading students" /> : null}
      {students.isError ? resourceError(students.error, students.refetch) : null}
      {students.data?.map((student) => {
        const studentId = String(groupStudentId(student));
        const record = records[studentId] ?? { status: "PRESENT", remarks: "" };
        return (
          <SummaryCard key={student.id} icon="school" title={studentLabel(student)}>
            <View style={styles.segmentWrap}>
              {attendanceStatuses.map((status) => (
                <Button key={status} label={statusLabel(status)} onPress={() => setRecord(studentId, { status })} variant={record.status === status ? "primary" : "secondary"} style={styles.segmentSmall} />
              ))}
            </View>
            <TextInput label="Remarks" value={record.remarks ?? ""} onChangeText={(value) => setRecord(studentId, { remarks: value })} />
          </SummaryCard>
        );
      })}
      {saveMutation.isError ? <ErrorState title="Attendance not saved" message={getApiErrorMessage(saveMutation.error)} /> : null}
      {saveMutation.isSuccess ? <StatusMessage message="Attendance saved." /> : null}
      <Button label="Save attendance" onPress={() => saveMutation.mutate()} loading={saveMutation.isPending} disabled={network.isOffline || !groupId || !students.data?.length} />
    </KeyboardAwareScreen>
  );
}

function PickerCard<T extends { id: string }>({ emptyLabel = "No items", items, labelFor, onSelect, selectedId, title }: { title: string; items: T[]; selectedId: string | null; labelFor: (item: T) => string; onSelect: (id: string) => void; emptyLabel?: string }) {
  return (
    <SummaryCard icon="grid" title={title}>
      {items.length === 0 ? <AppText tone="muted">{emptyLabel}</AppText> : null}
      <View style={styles.segmentWrap}>
        {items.map((item) => (
          <Button key={item.id} label={labelFor(item)} onPress={() => onSelect(item.id)} variant={selectedId === item.id ? "primary" : "secondary"} style={styles.segmentSmall} />
        ))}
      </View>
    </SummaryCard>
  );
}

export function TeacherParticipationScreen() {
  const queryClient = useQueryClient();
  const network = useNetworkStatus();
  const [groupId, setGroupId] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [score, setScore] = useState("10");
  const [remarks, setRemarks] = useState("");
  const [editingRecord, setEditingRecord] = useState<ParticipationRecord | null>(null);
  const groups = useQuery({ queryKey: ["teacher", "groups"], queryFn: getTeacherGroups });
  const students = useQuery({ enabled: Boolean(groupId), queryKey: ["teacher", "groups", groupId, "students"], queryFn: () => getTeacherGroupStudents(String(groupId)) });
  const records = useQuery({ queryKey: ["teacher", "participation", groupId, studentId], queryFn: () => getParticipationRecords({ groupId: groupId ?? undefined, studentId: studentId ?? undefined }) });

  useEffect(() => {
    if (!groupId && groups.data?.[0]) setGroupId(groups.data[0].id);
  }, [groupId, groups.data]);

  useEffect(() => {
    if (!studentId && students.data?.[0]) setStudentId(String(groupStudentId(students.data[0])));
  }, [studentId, students.data]);

  const saveMutation = useMutation({
    mutationFn: () => {
      if (network.isOffline) throw new Error("Participation cannot be saved while offline.");
      if (!groupId || !studentId) throw new Error("Select a group and student before saving.");
      const parsedScore = Number(score);
      if (!Number.isFinite(parsedScore) || parsedScore < 0 || parsedScore > 20) throw new Error("Score must be between 0 and 20.");
      if (editingRecord) return updateParticipationRecord(editingRecord.id, { score: parsedScore, remarks: remarks.trim() || undefined });
      return createParticipationRecord({ groupId, studentId, score: parsedScore, remarks: remarks.trim() || undefined });
    },
    onSuccess: async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEditingRecord(null);
      setRemarks("");
      void queryClient.invalidateQueries({ queryKey: ["teacher", "participation"] });
    }
  });

  function editRecord(record: ParticipationRecord) {
    setEditingRecord(record);
    setGroupId(record.groupId ?? record.group?.id ?? groupId);
    setStudentId(record.studentId ?? record.student?.id ?? studentId);
    setScore(String(record.score ?? "10"));
    setRemarks(record.remarks ?? "");
  }

  return (
    <KeyboardAwareScreen contentStyle={styles.content} onRefresh={refreshAll(groups.refetch, students.refetch, records.refetch)} refreshing={groups.isRefetching || students.isRefetching || records.isRefetching}>
      <OfflineBanner visible={network.isOffline || hasOfflineError(groups.error, students.error, records.error)} />
      <StudentHeader title="Participation" subtitle="Add or update participation scores." />
      <PickerCard title="Group" items={groups.data ?? []} selectedId={groupId} labelFor={(group) => text(group.name, "Group")} onSelect={(id) => { setGroupId(id); setStudentId(null); }} />
      <PickerCard title="Student" items={students.data ?? []} selectedId={studentId} labelFor={studentLabel} onSelect={(id) => setStudentId(id)} emptyLabel="Select a group first" />
      <SummaryCard icon="trend" title={editingRecord ? "Update participation" : "Add participation"}>
        <TextInput label="Score / 20" value={score} onChangeText={setScore} keyboardType="numeric" />
        <TextInput label="Remarks" value={remarks} onChangeText={setRemarks} multiline style={styles.multiline} />
        {saveMutation.isError ? <ErrorState message={getApiErrorMessage(saveMutation.error)} /> : null}
        {saveMutation.isSuccess ? <StatusMessage message="Participation saved." /> : null}
        <Button label={editingRecord ? "Update record" : "Add record"} onPress={() => saveMutation.mutate()} loading={saveMutation.isPending} disabled={network.isOffline || !groupId || !studentId} />
      </SummaryCard>
      <SectionTitle title="Records" />
      {records.isLoading ? <LoadingState label="Loading participation" /> : null}
      {records.data?.length === 0 ? <EmptyState icon="trend" title="No participation records" message="Saved records will appear here." /> : null}
      {records.data?.map((record) => (
        <SummaryCard key={record.id} icon="trend" title={personName(record.student, "Student")}>
          <InfoRow label="Score" value={`${text(record.score)} / 20`} />
          <InfoRow label="Group" value={nameOf(record.group)} />
          <InfoRow label="Date" value={formatDate(record.createdAt)} />
          <InfoRow label="Remarks" value={text(record.remarks)} />
          <Button label="Edit" onPress={() => editRecord(record)} variant="secondary" />
        </SummaryCard>
      ))}
    </KeyboardAwareScreen>
  );
}

export function TeacherProgressScreen() {
  const queryClient = useQueryClient();
  const network = useNetworkStatus();
  const [groupId, setGroupId] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [remarks, setRemarks] = useState("");
  const groups = useQuery({ queryKey: ["teacher", "groups"], queryFn: getTeacherGroups });
  const students = useQuery({ enabled: Boolean(groupId), queryKey: ["teacher", "groups", groupId, "students"], queryFn: () => getTeacherGroupStudents(String(groupId)) });
  const reports = useQuery({ queryKey: ["teacher", "progress-reports", groupId, studentId], queryFn: () => getProgressReports({ groupId: groupId ?? undefined, studentId: studentId ?? undefined }) });

  useEffect(() => {
    if (!groupId && groups.data?.[0]) setGroupId(groups.data[0].id);
  }, [groupId, groups.data]);

  useEffect(() => {
    if (!studentId && students.data?.[0]) setStudentId(String(groupStudentId(students.data[0])));
  }, [studentId, students.data]);

  const generateMutation = useMutation({
    mutationFn: () => {
      if (network.isOffline) throw new Error("Progress reports cannot be generated while offline.");
      if (!groupId || !studentId) throw new Error("Select a group and student first.");
      return generateProgressReport({ groupId, studentId, teacherRemarks: remarks.trim() || undefined });
    },
    onSuccess: async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setRemarks("");
      void queryClient.invalidateQueries({ queryKey: ["teacher", "progress-reports"] });
    }
  });

  return (
    <KeyboardAwareScreen contentStyle={styles.content} onRefresh={refreshAll(groups.refetch, students.refetch, reports.refetch)} refreshing={groups.isRefetching || students.isRefetching || reports.isRefetching}>
      <OfflineBanner visible={network.isOffline || hasOfflineError(groups.error, students.error, reports.error)} />
      <StudentHeader title="Progress Reports" subtitle="Generate and review student progress reports." />
      <PickerCard title="Group" items={groups.data ?? []} selectedId={groupId} labelFor={(group) => text(group.name, "Group")} onSelect={(id) => { setGroupId(id); setStudentId(null); }} />
      <PickerCard title="Student" items={students.data ?? []} selectedId={studentId} labelFor={studentLabel} onSelect={(id) => setStudentId(id)} emptyLabel="Select a group first" />
      <SummaryCard icon="trend" title="Generate report">
        <TextInput label="Teacher remarks" value={remarks} onChangeText={setRemarks} multiline style={styles.multiline} />
        {generateMutation.isError ? <ErrorState message={getApiErrorMessage(generateMutation.error)} /> : null}
        {generateMutation.isSuccess ? <StatusMessage message="Progress report generated." /> : null}
        <Button label="Generate report" onPress={() => generateMutation.mutate()} loading={generateMutation.isPending} disabled={network.isOffline || !groupId || !studentId} />
      </SummaryCard>
      <SectionTitle title="Reports" />
      {reports.isLoading ? <LoadingState label="Loading reports" /> : null}
      {reports.data?.length === 0 ? <EmptyState icon="trend" title="No reports" message="Generated progress reports will appear here." /> : null}
      {reports.data?.map((report) => (
        <SummaryCard key={report.id} icon="trend" title={personName(report.student, "Student")}>
          <Pill label={statusLabel(report.examEligibilityStatus)} tone={toneForStatus(report.examEligibilityStatus)} />
          <InfoRow label="Group" value={nameOf(report.group)} />
          <InfoRow label="Generated" value={formatDate(report.generatedAt)} />
          <InfoRow label="Attendance" value={`${text(report.attendanceRate, "0")}%`} />
          <InfoRow label="Participation" value={text(report.averageParticipationScore)} />
          <InfoRow label="Remarks" value={text(report.teacherRemarks)} />
        </SummaryCard>
      ))}
    </KeyboardAwareScreen>
  );
}

export function TeacherMessagesScreen() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"inbox" | "sent">("inbox");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [recipientId, setRecipientId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [groupId, setGroupId] = useState<string | null>(null);
  const inbox = useQuery({ queryKey: ["teacher", "messages", "inbox"], queryFn: getTeacherInboxMessages });
  const sent = useQuery({ queryKey: ["teacher", "messages", "sent"], queryFn: getTeacherSentMessages });
  const unread = useQuery({ queryKey: ["teacher", "messages", "unread"], queryFn: getTeacherUnreadMessageCount });
  const groups = useQuery({ queryKey: ["teacher", "groups"], queryFn: getTeacherGroups });
  const students = useQuery({ enabled: Boolean(groupId), queryKey: ["teacher", "groups", groupId, "students"], queryFn: () => getTeacherGroupStudents(String(groupId)) });
  const selectedMessage = useQuery({ enabled: Boolean(selectedId), queryKey: ["teacher", "messages", "detail", selectedId], queryFn: () => getTeacherMessageDetail(String(selectedId)) });
  const readMutation = useMutation({ mutationFn: markTeacherMessageRead, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teacher", "messages"] }) });
  const sendMutation = useMutation({
    mutationFn: sendTeacherMessage,
    onSuccess: async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setRecipientId("");
      setSubject("");
      setBody("");
      void queryClient.invalidateQueries({ queryKey: ["teacher", "messages"] });
    }
  });
  const active = mode === "inbox" ? inbox : sent;
  const messages = active.data ?? [];

  useEffect(() => {
    if (!groupId && groups.data?.[0]) setGroupId(groups.data[0].id);
  }, [groupId, groups.data]);

  function openMessage(message: TeacherMessage) {
    setSelectedId((current) => (current === message.id ? null : message.id));
    if (mode === "inbox" && !message.readAt) readMutation.mutate(message.id);
  }

  return (
    <KeyboardAwareScreen contentStyle={styles.content} onRefresh={refreshAll(inbox.refetch, sent.refetch, unread.refetch)} refreshing={inbox.isRefetching || sent.isRefetching || unread.isRefetching}>
      <OfflineBanner visible={hasOfflineError(inbox.error, sent.error, unread.error)} />
      <StudentHeader title="Messages" subtitle={`Inbox, sent messages, and direct student messaging. Unread: ${unread.data?.count ?? 0}`} />
      <View style={styles.segment}>
        <Button label="Inbox" onPress={() => setMode("inbox")} variant={mode === "inbox" ? "primary" : "secondary"} style={styles.segmentButton} />
        <Button label="Sent" onPress={() => setMode("sent")} variant={mode === "sent" ? "primary" : "secondary"} style={styles.segmentButton} />
      </View>
      {active.isLoading ? <LoadingState label="Loading messages" /> : null}
      {messages.length === 0 && active.data ? <EmptyState icon="chat" title="No messages" message={`${mode === "inbox" ? "Received" : "Sent"} messages will appear here.`} /> : null}
      {messages.map((message) => (
        <SummaryCard key={message.id} icon="chat" title={text(message.subject, "Message")} onPress={() => openMessage(message)}>
          <View style={styles.pillRow}>
            <Pill label={message.readAt || mode === "sent" ? "Read" : "Unread"} tone={message.readAt || mode === "sent" ? "success" : "neutral"} />
            <Pill label={formatDate(message.createdAt)} />
          </View>
          <InfoRow label={mode === "inbox" ? "From" : "To"} value={personName(mode === "inbox" ? message.sender : message.recipient)} />
          {selectedId === message.id ? selectedMessage.isLoading ? <LoadingState label="Loading message" /> : <AppText style={styles.bodyText}>{text(selectedMessage.data?.body ?? message.body, "No message body")}</AppText> : null}
        </SummaryCard>
      ))}
      <SummaryCard icon="mail" title="Compose">
        <AppText variant="bodyStrong">Recipient group</AppText>
        <View style={styles.segmentWrap}>
          {(groups.data ?? []).map((group) => (
            <Button key={group.id} label={text(group.name, "Group")} onPress={() => setGroupId(group.id)} variant={groupId === group.id ? "primary" : "secondary"} style={styles.segmentSmall} />
          ))}
        </View>
        <AppText variant="bodyStrong">Student recipient</AppText>
        <View style={styles.segmentWrap}>
          {(students.data ?? []).map((student) => {
            const id = String(groupStudentId(student));
            return <Button key={student.id} label={studentLabel(student)} onPress={() => setRecipientId(id)} variant={recipientId === id ? "primary" : "secondary"} style={styles.segmentSmall} />;
          })}
        </View>
        <TextInput label="Recipient user ID" value={recipientId} onChangeText={setRecipientId} autoCapitalize="none" />
        <TextInput label="Subject" value={subject} onChangeText={setSubject} />
        <TextInput label="Message" value={body} onChangeText={setBody} multiline style={styles.multiline} />
        {sendMutation.isError ? <ErrorState message={getApiErrorMessage(sendMutation.error)} /> : null}
        <Button label="Send" onPress={() => sendMutation.mutate({ recipientId, subject, body })} loading={sendMutation.isPending} disabled={!recipientId.trim() || !subject.trim() || !body.trim()} />
      </SummaryCard>
    </KeyboardAwareScreen>
  );
}

export function TeacherNotificationsScreen() {
  const queryClient = useQueryClient();
  const [pushMessage, setPushMessage] = useState<string | null>(null);
  const query = useQuery({ queryKey: ["teacher", "notifications"], queryFn: getTeacherNotifications });
  const markOne = useMutation({ mutationFn: markTeacherNotificationRead, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teacher", "notifications"] }) });
  const markAll = useMutation({ mutationFn: markAllTeacherNotificationsRead, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teacher", "notifications"] }) });
  const pushRegistration = useMutation({
    mutationFn: registerForExpoPushNotifications,
    onSuccess: (result) => setPushMessage(result.message),
    onError: (error) => setPushMessage(getApiErrorMessage(error))
  });
  const notifications = query.data ?? [];

  return (
    <ListScreen
      contentStyle={styles.content}
      data={notifications}
      keyExtractor={(item) => item.id}
      onRefresh={() => void query.refetch()}
      refreshing={query.isRefetching}
      ListHeaderComponent={(
        <>
          <OfflineBanner visible={Boolean(query.data && query.error && isNetworkError(query.error))} />
          <StudentHeader title="Notifications" subtitle="Teacher notifications and push permission." action={<Button label="Mark all read" onPress={() => markAll.mutate()} loading={markAll.isPending} variant="secondary" style={styles.signOut} />} />
          <SummaryCard icon="notification" title="Push notifications">
            <AppText tone="muted">Push permission can be enabled locally. Backend token registration is not available yet.</AppText>
            {pushMessage ? <InfoRow label="Status" value={pushMessage} /> : null}
            <Button label="Enable push" onPress={() => pushRegistration.mutate()} loading={pushRegistration.isPending} variant="secondary" />
          </SummaryCard>
          {query.isLoading ? <LoadingState label="Loading notifications" variant="skeleton" /> : null}
          {query.isError && !query.data ? resourceError(query.error, query.refetch) : null}
        </>
      )}
      ListEmptyComponent={query.data ? <EmptyState icon="notification" title="No notifications" message="LCMP notifications will appear here." /> : null}
      renderItem={({ item: notification }) => (
        <SummaryCard key={notification.id} icon="notification" title={text(notification.title, "Notification")}>
          <View style={styles.pillRow}>
            <Pill label={statusLabel(notification.type)} />
            <Pill label={isUnreadNotification(notification) ? "Unread" : "Read"} tone={isUnreadNotification(notification) ? "neutral" : "success"} />
          </View>
          <AppText style={styles.bodyText}>{text(notification.message)}</AppText>
          <InfoRow label="Date" value={formatDateTime(notification.createdAt)} />
          {isUnreadNotification(notification) ? <Button label="Mark read" onPress={() => markOne.mutate(notification.id)} loading={markOne.isPending} variant="secondary" /> : null}
        </SummaryCard>
      )}
    />
  );
}

export function TeacherMoreScreen() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const [remembered, setRemembered] = useState(false);

  useEffect(() => {
    void isRememberedDevice().then(setRemembered);
  }, []);

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  const links = [
    { title: "Participation", detail: "Scores and remarks", href: "/teacher/participation", icon: "trend" },
    { title: "Progress Reports", detail: "Generate reports", href: "/teacher/progress", icon: "document" },
    { title: "Messages", detail: "Inbox and compose", href: "/teacher/messages", icon: "chat" },
    { title: "Notifications", detail: "Updates and push", href: "/teacher/notifications", icon: "notification" },
    { title: "Profile", detail: "Profile and settings", href: "/teacher/profile", icon: "people" }
  ] as const;

  return (
    <Screen contentStyle={styles.content}>
      <StudentHeader title="More" subtitle="Teacher tools and account settings." action={<Button label="Logout" onPress={handleLogout} variant="secondary" style={styles.signOut} />} />
      <SummaryCard icon="lock" title="Device security">
        <InfoRow label="Remember device" value={remembered ? "Enabled" : "Disabled"} />
        <InfoRow label="Biometric login" value="Managed from the login screen after password sign-in." />
      </SummaryCard>
      {links.map((link) => (
        <ListItem key={link.href} icon={link.icon} title={link.title} subtitle={link.detail} onPress={() => router.push(link.href)} />
      ))}
    </Screen>
  );
}

export function TeacherProfileScreen() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const profile = useQuery({ queryKey: ["teacher", "profile"], queryFn: getTeacherProfile });
  const preferences = useQuery({ queryKey: ["teacher", "notification-preference"], queryFn: getNotificationPreference });
  const updateProfile = useMutation({
    mutationFn: updateTeacherProfile,
    onSuccess: async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsEditing(false);
      void queryClient.invalidateQueries({ queryKey: ["teacher", "profile"] });
    }
  });
  const updatePreference = useMutation({
    mutationFn: updateNotificationPreference,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teacher", "notification-preference"] })
  });

  useEffect(() => {
    if (!profile.data || isEditing) return;
    setFirstName(profile.data.firstName ?? "");
    setLastName(profile.data.lastName ?? "");
    setPhone(profile.data.phone ?? "");
  }, [isEditing, profile.data]);

  return (
    <KeyboardAwareScreen contentStyle={styles.content} onRefresh={refreshAll(profile.refetch, preferences.refetch)} refreshing={profile.isRefetching || preferences.isRefetching}>
      <OfflineBanner visible={hasOfflineError(profile.error, preferences.error)} />
      <StudentHeader title="Profile" subtitle="Teacher profile and notification settings." />
      {profile.isLoading ? <LoadingState label="Loading profile" /> : null}
      {profile.isError && !profile.data ? resourceError(profile.error, profile.refetch) : null}
      {profile.data ? (
        <SummaryCard icon="people" title="Profile">
          {isEditing ? (
            <>
              <TextInput label="First name" value={firstName} onChangeText={setFirstName} textContentType="givenName" />
              <TextInput label="Last name" value={lastName} onChangeText={setLastName} textContentType="familyName" />
              <TextInput label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" textContentType="telephoneNumber" />
              {updateProfile.isError ? <ErrorState message={getApiErrorMessage(updateProfile.error)} /> : null}
              <View style={styles.actionRow}>
                <Button label="Cancel" onPress={() => setIsEditing(false)} variant="secondary" style={styles.actionButton} />
                <Button label="Save" onPress={() => updateProfile.mutate({ firstName: firstName.trim() || undefined, lastName: lastName.trim() || undefined, phone: phone.trim() || undefined })} loading={updateProfile.isPending} style={styles.actionButton} />
              </View>
            </>
          ) : (
            <>
              <InfoRow label="Name" value={text([profile.data.firstName, profile.data.lastName].filter(Boolean).join(" "), "Name not set")} />
              <InfoRow label="Email" value={text(profile.data.email)} />
              <InfoRow label="Phone" value={text(profile.data.phone)} />
              <Button label="Edit profile" onPress={() => setIsEditing(true)} variant="secondary" />
            </>
          )}
        </SummaryCard>
      ) : null}
      <SummaryCard icon="notification" title="Notification settings">
        {preferences.isLoading ? <LoadingState label="Loading preferences" /> : null}
        {preferences.data ? (
          <>
            <InfoRow label="Push" value={preferences.data.pushEnabled ? "Enabled" : "Disabled"} />
            <InfoRow label="In-app" value={preferences.data.inAppEnabled === false ? "Disabled" : "Enabled"} />
            <View style={styles.actionRow}>
              <Button label={preferences.data.pushEnabled ? "Disable push" : "Enable push"} onPress={() => updatePreference.mutate({ pushEnabled: !preferences.data?.pushEnabled })} loading={updatePreference.isPending} variant="secondary" style={styles.actionButton} />
            </View>
          </>
        ) : preferences.isError ? resourceError(preferences.error, preferences.refetch) : null}
      </SummaryCard>
    </KeyboardAwareScreen>
  );
}

function StatusMessage({ message }: { message: string }) {
  return (
    <SummaryCard icon="check" title="Saved">
      <AppText tone="muted">{message}</AppText>
    </SummaryCard>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingVertical: spacing.xxl
  },
  grid: {
    gap: spacing.md
  },
  sectionBlock: {
    gap: spacing.md
  },
  signOut: {
    alignSelf: "flex-start"
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  actionButton: {
    flex: 1,
    minWidth: 104,
    paddingHorizontal: spacing.sm
  },
  segment: {
    flexDirection: "row",
    gap: spacing.sm
  },
  segmentButton: {
    flex: 1
  },
  segmentWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  segmentSmall: {
    minHeight: 42,
    paddingHorizontal: spacing.sm
  },
  pressed: {
    opacity: 0.82
  },
  calendarActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  calendarAction: {
    flex: 1,
    minWidth: 92,
    paddingHorizontal: spacing.sm
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs
  },
  weekday: {
    textAlign: "center",
    width: "13.45%"
  },
  dayCell: {
    alignItems: "center",
    aspectRatio: 1,
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    width: "13.45%"
  },
  outsideMonth: {
    opacity: 0.45
  },
  todayCell: {
    borderColor: colors.primary,
    borderWidth: 2
  },
  selectedDayCell: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  dotRow: {
    flexDirection: "row",
    gap: 3,
    height: 8,
    marginTop: 2
  },
  eventDot: {
    borderRadius: 3,
    height: 6,
    width: 6
  },
  classDot: {
    backgroundColor: colors.success
  },
  examDot: {
    backgroundColor: colors.warning
  },
  multiline: {
    minHeight: 112,
    paddingTop: spacing.md,
    textAlignVertical: "top"
  },
  bodyText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21
  }
});
