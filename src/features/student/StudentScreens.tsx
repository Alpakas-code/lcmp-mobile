import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppState, Pressable, StyleSheet, View } from "react-native";
import {
  AppText,
  Button,
  ConfirmationDialog,
  CourseCard as MDSCourseCard,
  EmptyState,
  ErrorState,
  GreetingHeader,
  HorizontalRail,
  IconButton,
  KeyboardAwareScreen,
  ListItem,
  ListScreen,
  LoadingState,
  NotificationCard,
  QuickActionCard,
  ScheduleCard,
  Screen,
  StatCard,
  TextInput
} from "../../components/ui";
import { getApiErrorMessage, isNetworkError } from "../../api/client";
import { useAuthStore } from "../../stores/auth-store";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import {
  getCertificates,
  getExamAttempts,
  getExamSessions,
  getInboxMessages,
  getMessageDetail,
  getNotifications,
  getPlacementAttempts,
  getPlacementTests,
  getProgressReports,
  getSentMessages,
  getStudentAttendance,
  getStudentCalendar,
  getStudentDashboardData,
  getStudentDocuments,
  getStudentEnrollments,
  getStudentParticipation,
  getStudentProfile,
  markAllNotificationsRead,
  markMessageRead,
  markNotificationRead,
  saveExamAnswer,
  savePlacementAnswer,
  sendMessage,
  startExamSession,
  startPlacementTest,
  submitExamAttempt,
  submitPlacementAttempt,
  createExamSecurityEvent,
  uploadStudentDocument,
  updateStudentProfile
} from "./api";
import {
  captureDocumentImage,
  documentDownloadUnsupportedMessage,
  downloadCertificatePdf,
  openNativeFile,
  pickDocumentFile,
  pickImageFromLibrary,
  shareNativeFile,
  type NativeFile
} from "../../native/file-handling";
import { registerForExpoPushNotifications } from "../../native/push-notifications";
import { useNetworkStatus } from "../../native/network-status";
import { activeGroup, formatDate, formatDateTime, nameOf, paymentStatus, personName, statusLabel, text } from "./format";
import { InfoRow, OfflineBanner, Pill, SectionTitle, StudentHeader, SummaryCard, toneForStatus } from "./StudentUI";
import type { AttemptQuestion, CalendarEvent, Certificate, Enrollment, ExamAttempt, ExamSession, Message, Notification, PlacementTest, SaveAttemptAnswerInput, StudentDocument } from "./types";

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

function isUnreadNotification(item: Notification) {
  return !item.readAt && item.status !== "READ";
}

function splitCalendar(events: CalendarEvent[]) {
  const now = new Date();
  const todayKey = now.toDateString();
  return {
    today: events.filter((event) => new Date(String(event.startTime)).toDateString() === todayKey),
    upcoming: events.filter((event) => new Date(String(event.startTime)).getTime() >= now.getTime())
  };
}

function dateKey(value: Date | string | undefined) {
  const date = value ? new Date(value) : new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
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

function eventTimeRange(event: CalendarEvent | ExamSession) {
  return `${formatDateTime(event.startTime)} - ${formatDateTime(event.endTime)}`;
}

function isAttemptSubmitted(attempt?: ExamAttempt | null) {
  const status = attempt?.status?.toUpperCase();
  return Boolean(status && status !== "IN_PROGRESS");
}

function answerMapFrom(attempt?: ExamAttempt | null): Record<string, SaveAttemptAnswerInput> {
  const map: Record<string, SaveAttemptAnswerInput> = {};
  attempt?.answers?.forEach((answer) => {
    map[answer.questionId] = {
      questionId: answer.questionId,
      choiceIds: answer.choiceAnswers?.map((choice) => choice.choiceId) ?? [],
      trueFalseAnswer: answer.trueFalseAnswer ?? undefined,
      textAnswer: answer.textAnswer ?? undefined
    };
  });
  return map;
}

function currentEnrollment(enrollments: Enrollment[]) {
  return (
    enrollments.find((item) => item.status === "APPROVED" || item.status === "ACTIVE") ??
    enrollments[0] ??
    null
  );
}

function EnrollmentCard({ enrollment, onPress }: { enrollment: Enrollment; onPress?: () => void }) {
  const group = activeGroup(enrollment);
  return (
    <SummaryCard icon="book" title={nameOf(enrollment.course, "Course")} onPress={onPress}>
      <View style={styles.pillRow}>
        <Pill label={statusLabel(enrollment.status)} tone={toneForStatus(enrollment.status)} />
        <Pill label={`Payment ${paymentStatus(enrollment)}`} tone={toneForStatus(paymentStatus(enrollment))} />
      </View>
      <InfoRow label="Language" value={nameOf(enrollment.language)} />
      <InfoRow label="Level" value={nameOf(enrollment.subLevel ?? enrollment.level)} />
      <InfoRow label="Group" value={nameOf(group)} />
      <InfoRow label="Progression" value={text(enrollment.progressionText)} />
    </SummaryCard>
  );
}

function EventCard({ event }: { event: CalendarEvent | ExamSession }) {
  return (
    <SummaryCard icon={event.type === "EXAM_SESSION" ? "school" : "calendar"} title={text(event.title, event.type === "EXAM_SESSION" ? "Exam session" : "Class session")}>
      <View style={styles.pillRow}>
        <Pill label={statusLabel(event.type ?? "Session")} />
        <Pill label={statusLabel(event.status)} tone={toneForStatus(event.status)} />
      </View>
      <InfoRow label="Date" value={`${formatDateTime(event.startTime)} - ${formatDateTime(event.endTime)}`} />
      <InfoRow label="Teacher" value={personName(event.teacher)} />
      <InfoRow label="Group" value={nameOf(event.group)} />
      <InfoRow label="Classroom" value={nameOf(event.classroom, text(event.meetingUrl, "Not assigned"))} />
    </SummaryCard>
  );
}

export function StudentDashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const query = useQuery({ queryKey: ["student", "dashboard"], queryFn: getStudentDashboardData });

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  if (query.isLoading) {
    return (
      <Screen scroll={false}>
        <LoadingState label="Loading student dashboard" />
      </Screen>
    );
  }

  const data = query.data;

  if (query.isError && !data) {
    return <Screen contentStyle={styles.content}>{resourceError(query.error, query.refetch)}</Screen>;
  }

  if (!data) {
    return (
      <Screen scroll={false}>
        <LoadingState label="Loading student dashboard" />
      </Screen>
    );
  }

  const enrollment = currentEnrollment(data.enrollments);
  const group = activeGroup(enrollment);
  const events = splitCalendar(data.calendar);
  const nextSession = events.upcoming.find((event) => event.type !== "EXAM_SESSION");
  const upcomingExam =
    events.upcoming.find((event) => event.type === "EXAM_SESSION") ??
    data.examSessions.find((session) => new Date(String(session.startTime)).getTime() >= Date.now());
  const latestReport = data.progressReports[0];
  const unreadNotifications = data.notifications.filter(isUnreadNotification).length;
  const displayName =
    [data.profile.firstName, data.profile.lastName].filter(Boolean).join(" ") ||
    user?.email?.split("@")[0] ||
    "Student";
  const courseItems = data.enrollments.slice(0, 4);
  const recentNotifications = data.notifications.slice(0, 3);

  return (
    <Screen contentStyle={styles.content} onRefresh={() => void query.refetch()} refreshing={query.isRefetching} testID="student-dashboard">
      <OfflineBanner visible={Boolean(data && query.error && isNetworkError(query.error))} />
      <GreetingHeader
        action={(
          <View style={styles.headerActions}>
            <IconButton icon="notification" label="Notifications" onPress={() => router.push("/student/notifications")} />
            <IconButton icon="logout" label="Sign out" onPress={handleLogout} />
          </View>
        )}
        name={displayName}
        role="Student"
      />

      <HorizontalRail>
        <StatCard
          caption={`${data.attendance.present} present`}
          icon="check"
          onPress={() => router.push("/student/attendance")}
          title="Attendance"
          value={`${data.attendance.attendanceRate}%`}
        />
        <StatCard
          caption={nameOf(enrollment?.language)}
          icon="book"
          onPress={() => router.push("/student/courses")}
          title="Current Level"
          tone="secondary"
          value={nameOf(enrollment?.subLevel ?? enrollment?.level, "Pending")}
        />
        <StatCard
          caption={upcomingExam ? text(upcomingExam.title, "Final exam") : "No session returned"}
          icon="school"
          onPress={() => router.push("/student/exams")}
          title="Upcoming Exam"
          tone="warning"
          value={upcomingExam ? formatDate(upcomingExam.startTime) : "None"}
        />
      </HorizontalRail>

      <View style={styles.sectionBlock}>
        <SectionTitle title="Today's Class" />
        <ScheduleCard
          label={nextSession ? nameOf(nextSession.group) : nameOf(group)}
          onPress={() => router.push("/student/schedule")}
          time={nextSession ? `${formatDateTime(nextSession.startTime)} - ${formatDateTime(nextSession.endTime)}` : "No class returned by the calendar"}
          title={nextSession ? text(nextSession.title, "Class session") : nameOf(enrollment?.course, "No scheduled class")}
        />
      </View>

      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeaderRow}>
          <SectionTitle title="My Courses" />
          <Button label="View All" onPress={() => router.push("/student/courses")} variant="ghost" style={styles.textAction} />
        </View>
        {courseItems.length ? (
          <HorizontalRail>
            {courseItems.map((item, index) => (
              <MDSCourseCard
                key={item.id}
                meta={statusLabel(item.status)}
                onPress={() => router.push("/student/courses")}
                subtitle={`${nameOf(item.language)} - ${nameOf(item.subLevel ?? item.level)}`}
                title={nameOf(item.course, "LCMP Course")}
                tone={index % 2 === 0 ? "primary" : "secondary"}
              />
            ))}
          </HorizontalRail>
        ) : (
          <EmptyState icon="book" title="No courses yet" message="Approved enrollments will appear here once LCMP assigns them." />
        )}
      </View>

      <View style={styles.sectionBlock}>
        <SectionTitle title="Recent Notifications" />
        {recentNotifications.length ? (
          recentNotifications.map((item) => (
            <NotificationCard
              key={item.id}
              onPress={() => router.push("/student/notifications")}
              meta={isUnreadNotification(item) ? "Unread" : "Read"}
              subtitle={text(item.message)}
              title={text(item.title, "Notification")}
            />
          ))
        ) : (
          <EmptyState icon="notification" title="No notifications" message="LCMP updates will appear here." />
        )}
      </View>

      <View style={styles.sectionBlock}>
        <SectionTitle title="Quick Actions" />
        <View style={styles.grid}>
          <QuickActionCard icon="trend" meta={latestReport ? statusLabel(latestReport.examEligibilityStatus) : "Pending"} onPress={() => router.push("/student/progress")} subtitle="Latest progress report" title="Progress" />
          <QuickActionCard icon="ribbon" meta={String(data.certificates.length)} onPress={() => router.push("/student/certificates")} subtitle="Earned certificates" title="Certificates" />
          <QuickActionCard icon="chat" meta={String(data.unreadMessages.count)} onPress={() => router.push("/student/messages")} subtitle="Unread messages" title="Messages" />
          <QuickActionCard icon="notification" meta={String(unreadNotifications)} onPress={() => router.push("/student/notifications")} subtitle="Unread notifications" title="Notifications" />
        </View>
      </View>
    </Screen>
  );
}

export function CoursesScreen() {
  const router = useRouter();
  const query = useQuery({ queryKey: ["student", "courses"], queryFn: getStudentEnrollments });

  function openCourse(enrollment: Enrollment) {
    const courseId = enrollment.course?.id ?? enrollment.courseId;
    if (courseId) router.push(`/student/course-room?courseId=${courseId}`);
  }

  return (
    <Screen contentStyle={styles.content} onRefresh={() => void query.refetch()} refreshing={query.isRefetching} testID="student-courses-screen">
      <OfflineBanner visible={Boolean(query.data && query.error && isNetworkError(query.error))} />
      <StudentHeader title="Courses" subtitle="Your enrollments, groups, levels, and payment validation status." />
      {query.isLoading ? <LoadingState label="Loading courses" /> : null}
      {query.isError && !query.data ? resourceError(query.error, query.refetch) : null}
      {query.data?.length === 0 ? (
        <EmptyState icon="book" title="No courses yet" message="Approved enrollments will appear here once LCMP assigns them." />
      ) : null}
      {query.data?.map((enrollment) => <EnrollmentCard key={enrollment.id} enrollment={enrollment} onPress={() => openCourse(enrollment)} />)}
    </Screen>
  );
}

export function ScheduleScreen() {
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(new Date());
  const range = useMemo(() => calendarRange(visibleMonth), [visibleMonth]);
  const query = useQuery({
    queryKey: ["student", "schedule", range.from.toISOString(), range.to.toISOString()],
    queryFn: () => getStudentCalendar(range.from, range.to)
  });
  const events = query.data ?? [];
  const selectedEvents = events.filter((event) => dateKey(event.startTime) === dateKey(selectedDate));
  const upcoming = events
    .filter((event) => new Date(String(event.startTime)).getTime() >= Date.now())
    .slice(0, 5);

  function goToday() {
    const today = new Date();
    setVisibleMonth(startOfMonth(today));
    setSelectedDate(today);
  }

  return (
    <Screen contentStyle={styles.content} onRefresh={() => void query.refetch()} refreshing={query.isRefetching} testID="student-schedule-screen">
      <OfflineBanner visible={Boolean(query.data && query.error && isNetworkError(query.error))} />
      <StudentHeader title="Schedule" subtitle="Calendar view for classes and final exam sessions." />
      {query.isLoading ? <LoadingState label="Loading schedule" /> : null}
      {query.isError && !query.data ? resourceError(query.error, query.refetch) : null}
      <SummaryCard title={monthLabel(visibleMonth)} icon="calendar">
        <View style={styles.calendarActions}>
          <Button label="Previous" onPress={() => setVisibleMonth((current) => addMonths(current, -1))} variant="secondary" style={styles.calendarAction} />
          <Button label="Today" onPress={goToday} variant="ghost" style={styles.calendarAction} />
          <Button label="Next" onPress={() => setVisibleMonth((current) => addMonths(current, 1))} variant="secondary" style={styles.calendarAction} />
        </View>
        <CalendarMonth
          events={events}
          month={visibleMonth}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </SummaryCard>
      <SectionTitle title={formatDate(selectedDate)} />
      {selectedEvents.length === 0 ? <EmptyState icon="calendar" title="No sessions on this date" message="Select another highlighted date or use the upcoming list below." /> : null}
      {selectedEvents.map((event) => <EventCard key={event.id} event={event} />)}
      <SectionTitle title="Upcoming" />
      {upcoming.length === 0 && query.data ? <EmptyState icon="calendar" title="No upcoming sessions" message="There are no upcoming sessions in this calendar range." /> : null}
      {upcoming.map((event) => <EventCard key={event.id} event={event} />)}
    </Screen>
  );
}

function CalendarMonth({
  events,
  month,
  onSelectDate,
  selectedDate
}: {
  events: CalendarEvent[];
  month: Date;
  onSelectDate: (date: Date) => void;
  selectedDate: Date;
}) {
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
  const days = calendarDays(month);
  const today = dateKey(new Date());
  const selected = dateKey(selectedDate);
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <View style={styles.calendarGrid}>
      {labels.map((label) => (
        <AppText key={label} tone="muted" variant="caption" style={styles.weekday}>{label}</AppText>
      ))}
      {days.map((day) => {
        const key = dateKey(day);
        const indicators = eventMap.get(key);
        const isCurrentMonth = day.getMonth() === month.getMonth();
        const isSelected = key === selected;
        const isToday = key === today;
        return (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityLabel={`Select ${formatDate(day.toISOString())}`}
            onPress={() => onSelectDate(day)}
            style={({ pressed }) => [
              styles.dayCell,
              !isCurrentMonth ? styles.outsideMonth : null,
              isToday ? styles.todayCell : null,
              isSelected ? styles.selectedDayCell : null,
              pressed ? styles.pressed : null
            ]}
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

export function AttendanceScreen() {
  const query = useQuery({ queryKey: ["student", "attendance"], queryFn: getStudentAttendance });
  const records = query.data?.records ?? [];

  return (
    <Screen contentStyle={styles.content} onRefresh={() => void query.refetch()} refreshing={query.isRefetching} testID="student-attendance-screen">
      <OfflineBanner visible={Boolean(query.data && query.error && isNetworkError(query.error))} />
      <StudentHeader title="Attendance" subtitle="Read-only attendance statistics and class history." />
      {query.isLoading ? <LoadingState label="Loading attendance" /> : null}
      {query.isError && !query.data ? resourceError(query.error, query.refetch) : null}
      {query.data ? (
        <HorizontalRail>
          <StatCard title="Rate" value={`${query.data.attendanceRate}%`} caption="Attendance rate" icon="trend" />
          <StatCard title="Present" value={String(query.data.present)} caption="Classes attended" icon="check" tone="secondary" />
          <StatCard title="Absent" value={String(query.data.absent)} caption="Marked absent" icon="notification" tone="danger" />
          <StatCard title="Late" value={String(query.data.late)} caption="Late arrivals" icon="calendar" tone="warning" />
          <StatCard title="Excused" value={String(query.data.excused)} caption="Excused records" icon="document" tone="warning" />
        </HorizontalRail>
      ) : null}
      {records.length === 0 && query.data ? (
        <EmptyState icon="check" title="No attendance history" message="Attendance records will appear after teachers save them." />
      ) : null}
      {records.map((record) => (
        <SummaryCard key={record.id} icon="check" title={statusLabel(record.status)}>
          <Pill label={statusLabel(record.status)} tone={toneForStatus(record.status)} />
          <InfoRow label="Session" value={text(record.attendanceSession?.title ?? record.attendanceSession?.group?.name)} />
          <InfoRow label="Date" value={formatDate(record.createdAt ?? record.attendanceSession?.sessionDate)} />
          <InfoRow label="Remarks" value={text(record.remarks)} />
        </SummaryCard>
      ))}
    </Screen>
  );
}

export function ExamsScreen() {
  const queryClient = useQueryClient();
  const [activeFlow, setActiveFlow] = useState<"placement" | "final" | null>(null);
  const [activeAttempt, setActiveAttempt] = useState<ExamAttempt | null>(null);
  const [pendingStart, setPendingStart] = useState<{ type: "placement"; item: PlacementTest } | { type: "final"; item: ExamSession } | null>(null);
  const placementTests = useQuery({ queryKey: ["student", "placement-tests"], queryFn: getPlacementTests });
  const placementAttempts = useQuery({ queryKey: ["student", "placement-attempts"], queryFn: getPlacementAttempts });
  const examSessions = useQuery({ queryKey: ["student", "exam-sessions"], queryFn: getExamSessions });
  const examAttempts = useQuery({ queryKey: ["student", "exam-attempts"], queryFn: getExamAttempts });
  const isLoading = placementTests.isLoading || placementAttempts.isLoading || examSessions.isLoading || examAttempts.isLoading;
  const error = placementTests.error ?? placementAttempts.error ?? examSessions.error ?? examAttempts.error;
  const isRefreshing = placementTests.isRefetching || placementAttempts.isRefetching || examSessions.isRefetching || examAttempts.isRefetching;
  const hasAnyData = Boolean(placementTests.data || placementAttempts.data || examSessions.data || examAttempts.data);
  const startPlacement = useMutation({
    mutationFn: startPlacementTest,
    onSuccess: (attempt) => {
      setActiveFlow("placement");
      setActiveAttempt(attempt);
      setPendingStart(null);
      void queryClient.invalidateQueries({ queryKey: ["student", "placement-attempts"] });
    }
  });
  const startFinal = useMutation({
    mutationFn: startExamSession,
    onSuccess: (attempt) => {
      setActiveFlow("final");
      setActiveAttempt(attempt);
      setPendingStart(null);
      void queryClient.invalidateQueries({ queryKey: ["student", "exam-attempts"] });
    }
  });

  function closeAttempt() {
    setActiveFlow(null);
    setActiveAttempt(null);
    void placementAttempts.refetch();
    void examAttempts.refetch();
  }

  if (activeFlow && activeAttempt) {
    return (
      <ExamAttemptScreen
        attempt={activeAttempt}
        flow={activeFlow}
        onAttemptChange={setActiveAttempt}
        onClose={closeAttempt}
      />
    );
  }

  const startError = startPlacement.error ?? startFinal.error;

  return (
    <Screen
      contentStyle={styles.content}
      onRefresh={refreshAll(placementTests.refetch, placementAttempts.refetch, examSessions.refetch, examAttempts.refetch)}
      refreshing={isRefreshing}
      testID="student-exams-screen"
    >
      <OfflineBanner
        visible={hasAnyData && hasOfflineError(placementTests.error, placementAttempts.error, examSessions.error, examAttempts.error)}
      />
      <StudentHeader title="Exams" subtitle="Placement tests, placement status, final sessions, and exam results." />
      {isLoading ? <LoadingState label="Loading exams" /> : null}
      {error && !hasAnyData ? <ErrorState message={getApiErrorMessage(error)} onRetry={() => {
        void placementTests.refetch();
        void placementAttempts.refetch();
        void examSessions.refetch();
        void examAttempts.refetch();
      }} /> : null}
      {startError ? <ErrorState title="Cannot start exam" message={getApiErrorMessage(startError)} /> : null}
      <SectionTitle title="Placement tests" />
      {placementTests.data?.length === 0 ? <EmptyState icon="school" title="No placement tests" message="Available placement tests will appear here." /> : null}
      {placementTests.data?.map((test) => {
        const latestAttempt = placementAttempts.data?.find((attempt) => attempt.placementTestId === test.id);
        const locked = test.status && test.status !== "ACTIVE";
        return (
        <SummaryCard key={test.id} icon={locked ? "lock" : "school"} title={text(test.title, "Placement test")}>
          <View style={styles.pillRow}>
            <Pill label={statusLabel(test.status)} tone={toneForStatus(test.status)} />
            {latestAttempt ? <Pill label={statusLabel(latestAttempt.status)} tone={toneForStatus(latestAttempt.status)} /> : null}
          </View>
          <InfoRow label="Language" value={nameOf(test.language)} />
          <InfoRow label="Duration" value={test.durationMinutes ? `${test.durationMinutes} minutes` : "Not specified"} />
          <InfoRow label="Access" value="Backend validation is checked when starting." />
          {latestAttempt && isAttemptSubmitted(latestAttempt) ? (
            <InfoRow label="Result" value={text(latestAttempt.finalLevel ?? latestAttempt.recommendedLevel ?? latestAttempt.percentageScore, "Pending review")} />
          ) : null}
          <Button
            label={latestAttempt?.status === "IN_PROGRESS" ? "Resume placement test" : "Start placement test"}
            onPress={() => setPendingStart({ type: "placement", item: test })}
            disabled={Boolean(locked)}
            loading={startPlacement.isPending && pendingStart?.type === "placement" && pendingStart.item.id === test.id}
          />
        </SummaryCard>
        );
      })}
      <SectionTitle title="Placement results" />
      {placementAttempts.data?.length === 0 ? <EmptyState icon="trend" title="No placement results" message="Placement attempts and results will appear here." /> : null}
      {placementAttempts.data?.map((attempt) => (
        <SummaryCard key={attempt.id} icon="trend" title={text(attempt.placementTest?.title, "Placement attempt")}>
          <Pill label={statusLabel(attempt.status)} tone={toneForStatus(attempt.status)} />
          <InfoRow label="Score" value={attempt.percentageScore ? `${attempt.percentageScore}%` : text(attempt.rawScore ?? attempt.finalScore ?? attempt.score, "Pending")} />
          <InfoRow label="Recommended level" value={text(attempt.recommendedLevel, "Hidden until validation or pending review")} />
          <InfoRow label="Validated level" value={nameOf(attempt.finalLevel ?? attempt.validatedLevel)} />
        </SummaryCard>
      ))}
      <SectionTitle title="Final exam sessions" />
      {examSessions.data?.length === 0 ? <EmptyState icon="calendar" title="No final exams" message="Scheduled final exams will appear here." /> : null}
      {examSessions.data?.map((session) => {
        const latestAttempt = examAttempts.data?.find((attempt) => attempt.examSessionId === session.id);
        const now = Date.now();
        const notStarted = session.startTime ? new Date(String(session.startTime)).getTime() > now : false;
        const expired = session.endTime ? new Date(String(session.endTime)).getTime() < now : false;
        return (
          <SummaryCard key={session.id} icon="school" title={text(session.title, "Final exam")}>
            <View style={styles.pillRow}>
              <Pill label={statusLabel(session.status)} tone={toneForStatus(session.status)} />
              {latestAttempt ? <Pill label={statusLabel(latestAttempt.status)} tone={toneForStatus(latestAttempt.status)} /> : null}
            </View>
            <InfoRow label="Date" value={eventTimeRange(session)} />
            <InfoRow label="Group" value={nameOf(session.group)} />
            <InfoRow label="Teacher" value={personName(session.teacher)} />
            <InfoRow label="Retake" value={latestAttempt?.retakeAllowed ? "Backend returned eligible" : "Only available if backend allows it"} />
            <Button
              label={latestAttempt?.status === "IN_PROGRESS" ? "Resume final exam" : "Start final exam"}
              onPress={() => setPendingStart({ type: "final", item: session })}
              disabled={session.status === "CANCELLED" || notStarted || expired}
              loading={startFinal.isPending && pendingStart?.type === "final" && pendingStart.item.id === session.id}
            />
          </SummaryCard>
        );
      })}
      <SectionTitle title="Final exam results" />
      {examAttempts.data?.length === 0 ? <EmptyState icon="document" title="No exam attempts" message="Exam attempts and results will appear here." /> : null}
      {examAttempts.data?.map((attempt) => (
        <SummaryCard key={attempt.id} icon="document" title={text(attempt.examSession?.title, "Exam attempt")}>
          <Pill label={statusLabel(attempt.status)} tone={toneForStatus(attempt.status)} />
          <InfoRow label="Score" value={attempt.finalScore ? `${attempt.finalScore} / ${text(attempt.maxScore, "-")}` : "Not graded"} />
          <InfoRow label="Result" value={attempt.passed === null || attempt.passed === undefined ? "Pending" : attempt.passed ? "Passed" : "Not passed"} />
          <InfoRow label="Retake" value={attempt.retakeAllowed ? "Eligible" : "Not available"} />
        </SummaryCard>
      ))}
      <ConfirmationDialog
        visible={Boolean(pendingStart)}
        title="Anti-cheat warning"
        message={pendingStart?.type === "placement"
          ? "Do not leave the test while it is active. Placement security events are not creatable from mobile in the current backend, so warnings are local only."
          : "Do not leave the final exam while it is active. App backgrounding or suspicious navigation will be reported to LCMP and may invalidate the attempt after repeated warnings."}
        confirmLabel={pendingStart?.type === "placement" ? "Start placement" : "Start final exam"}
        onCancel={() => setPendingStart(null)}
        onConfirm={() => {
          if (!pendingStart) return;
          if (pendingStart.type === "placement") startPlacement.mutate(pendingStart.item.id);
          else startFinal.mutate(pendingStart.item.id);
        }}
      />
    </Screen>
  );
}

function ExamAttemptScreen({
  attempt,
  flow,
  onAttemptChange,
  onClose
}: {
  attempt: ExamAttempt;
  flow: "placement" | "final";
  onAttemptChange: (attempt: ExamAttempt) => void;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const questions = attempt.selectedQuestions ?? [];
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, SaveAttemptAnswerInput>>(() => answerMapFrom(attempt));
  const [submitDialog, setSubmitDialog] = useState(false);
  const [securityMessage, setSecurityMessage] = useState<string | null>(null);
  const suppressNavigationEvent = useRef(false);
  const latestAttemptRef = useRef(attempt);
  const currentQuestion = questions[index];
  const isFinal = flow === "final";
  const saveMutation = useMutation({
    mutationFn: (input: SaveAttemptAnswerInput) => isFinal ? saveExamAnswer(attempt.id, input) : savePlacementAnswer(attempt.id, input)
  });
  const submitMutation = useMutation({
    mutationFn: () => isFinal ? submitExamAttempt(attempt.id) : submitPlacementAttempt(attempt.id),
    onSuccess: (updated) => {
      suppressNavigationEvent.current = true;
      onAttemptChange(updated);
      void queryClient.invalidateQueries({ queryKey: ["student", isFinal ? "exam-attempts" : "placement-attempts"] });
    }
  });
  const securityMutation = useMutation({
    mutationFn: (metadata: Record<string, unknown>) => createExamSecurityEvent({ attemptId: attempt.id, type: "WINDOW_BLUR", metadata }),
    onSuccess: (response) => {
      if (response?.attempt) onAttemptChange(response.attempt);
      const count = response?.attempt?.fraudCount ?? attempt.fraudCount;
      setSecurityMessage(response?.attempt?.status === "INVALIDATED" ? "This exam attempt has been invalidated by LCMP security rules." : `Security warning recorded${count ? ` (${count}/3)` : ""}.`);
    },
    onError: (error) => setSecurityMessage(getApiErrorMessage(error))
  });

  useEffect(() => {
    setAnswers(answerMapFrom(attempt));
  }, [attempt]);

  useEffect(() => {
    latestAttemptRef.current = attempt;
  }, [attempt]);

  useEffect(() => {
    if (!isFinal || isAttemptSubmitted(latestAttemptRef.current)) return;
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        securityMutation.mutate({ source: "app_state", state, occurredOn: "mobile" });
      }
    });
    return () => subscription.remove();
  }, [attempt.id, attempt.status, isFinal, securityMutation]);

  useEffect(() => {
    return () => {
      const latestAttempt = latestAttemptRef.current;
      if (isFinal && !suppressNavigationEvent.current && !isAttemptSubmitted(latestAttempt)) {
        createExamSecurityEvent({ attemptId: latestAttempt.id, type: "WINDOW_BLUR", metadata: { source: "screen_unmount", occurredOn: "mobile" } }).catch(() => undefined);
      }
    };
  }, [isFinal]);

  const answeredCount = questions.filter((question) => hasAnswer(answers[question.question.id])).length;
  const unanswered = questions.length - answeredCount;
  const submitted = isAttemptSubmitted(attempt);
  const blocked = attempt.status === "INVALIDATED";

  function updateAnswer(question: AttemptQuestion, patch: Partial<SaveAttemptAnswerInput>) {
    const questionId = question.question.id;
    setAnswers((current) => ({
      ...current,
      [questionId]: {
        ...current[questionId],
        ...patch,
        questionId
      }
    }));
  }

  function saveCurrent(goNext = false) {
    if (!currentQuestion) return;
    const payload = answers[currentQuestion.question.id];
    if (!hasAnswer(payload)) return;
    saveMutation.mutate(payload, {
      onSuccess: () => {
        if (goNext && index < questions.length - 1) setIndex((value) => value + 1);
      }
    });
  }

  if (submitted || blocked) {
    return (
      <Screen contentStyle={styles.content} testID="student-exam-result-screen">
        <StudentHeader title={isFinal ? "Final exam result" : "Placement result"} subtitle={statusLabel(attempt.status)} action={<Button label="Back" onPress={onClose} variant="secondary" style={styles.signOut} />} />
        <SummaryCard icon={blocked ? "lock" : "trend"} title={blocked ? "Attempt blocked" : "Submission received"}>
          <Pill label={statusLabel(attempt.status)} tone={toneForStatus(attempt.status)} />
          {isFinal ? (
            <>
              <InfoRow label="Score" value={attempt.finalScore ? `${attempt.finalScore} / ${text(attempt.maxScore, "-")}` : "Pending review"} />
              <InfoRow label="Result" value={attempt.passed === null || attempt.passed === undefined ? text(attempt.resultMessage, "Pending validation") : attempt.passed ? "Passed" : "Not passed"} />
              <InfoRow label="Retake" value={attempt.retakeAllowed ? "Eligible" : "Not available"} />
            </>
          ) : (
            <>
              <InfoRow label="Score" value={attempt.percentageScore ? `${attempt.percentageScore}%` : text(attempt.rawScore, "Pending review")} />
              <InfoRow label="Recommended level" value={text(attempt.recommendedLevel, "Pending validation")} />
              <InfoRow label="Final level" value={text(attempt.finalLevel, "Not validated yet")} />
            </>
          )}
          {securityMessage ? <AppText tone="muted">{securityMessage}</AppText> : null}
        </SummaryCard>
      </Screen>
    );
  }

  return (
    <KeyboardAwareScreen contentStyle={styles.content} testID="student-exam-attempt-screen">
      <StudentHeader
        title={isFinal ? "Final exam" : "Placement test"}
        subtitle={`Question ${questions.length ? index + 1 : 0} of ${questions.length}`}
        action={<Button label="Exit" onPress={onClose} variant="secondary" style={styles.signOut} />}
      />
      <SummaryCard icon="notification" title="Anti-cheat active">
        <InfoRow label="Warning" value={text(attempt.warning, isFinal ? "Leaving the exam can be reported and repeated warnings may invalidate the attempt." : "Do not leave the placement test while it is active.")} />
        <InfoRow label="Warnings" value={isFinal ? `${attempt.fraudCount ?? 0}/3` : "Local warning only"} />
        {securityMessage ? <AppText tone="muted">{securityMessage}</AppText> : null}
      </SummaryCard>
      <ExamProgressBar answered={answeredCount} current={index + 1} total={questions.length} />
      {questions.length === 0 ? <EmptyState icon="document" title="No questions returned" message="The backend did not return active questions for this attempt." /> : null}
      {currentQuestion ? (
        <QuestionCard
          answer={answers[currentQuestion.question.id]}
          disabled={saveMutation.isPending || submitMutation.isPending}
          question={currentQuestion}
          onChange={(patch) => updateAnswer(currentQuestion, patch)}
        />
      ) : null}
      {saveMutation.isError ? <ErrorState title="Answer not saved" message={getApiErrorMessage(saveMutation.error)} /> : null}
      {submitMutation.isError ? <ErrorState title="Submit failed" message={getApiErrorMessage(submitMutation.error)} /> : null}
      <View style={styles.examNav}>
        <Button label="Previous" onPress={() => setIndex((value) => Math.max(0, value - 1))} disabled={index === 0} variant="secondary" style={styles.examNavButton} />
        <Button label="Save" onPress={() => saveCurrent(false)} disabled={!currentQuestion || !hasAnswer(answers[currentQuestion.question.id])} loading={saveMutation.isPending} style={styles.examNavButton} />
        <Button label="Next" onPress={() => saveCurrent(true)} disabled={!currentQuestion || index >= questions.length - 1 || !hasAnswer(answers[currentQuestion.question.id])} variant="secondary" style={styles.examNavButton} />
      </View>
      <Button
        label={unanswered > 0 ? `Submit with ${unanswered} unanswered` : "Submit attempt"}
        onPress={() => setSubmitDialog(true)}
        variant={unanswered > 0 ? "danger" : "primary"}
        loading={submitMutation.isPending}
        disabled={questions.length === 0}
      />
      <ConfirmationDialog
        visible={submitDialog}
        title="Submit attempt?"
        message={unanswered > 0 ? `${unanswered} question(s) are unanswered. Submit anyway? You cannot change answers after submission.` : "You cannot change answers after submission."}
        confirmLabel="Submit"
        onCancel={() => setSubmitDialog(false)}
        onConfirm={() => {
          setSubmitDialog(false);
          submitMutation.mutate();
        }}
      />
    </KeyboardAwareScreen>
  );
}

function hasAnswer(answer?: SaveAttemptAnswerInput) {
  return Boolean(answer && ((answer.choiceIds?.length ?? 0) > 0 || answer.trueFalseAnswer !== undefined || Boolean(answer.textAnswer?.trim())));
}

function ExamProgressBar({ answered, current, total }: { answered: number; current: number; total: number }) {
  const percent = total > 0 ? Math.min(100, Math.round((answered / total) * 100)) : 0;
  return (
    <SummaryCard icon="trend" title="Progress">
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percent}%` as const }]} />
      </View>
      <InfoRow label="Current" value={`${current} / ${total}`} />
      <InfoRow label="Remaining" value={String(Math.max(0, total - answered))} />
    </SummaryCard>
  );
}

function QuestionCard({
  answer,
  disabled,
  onChange,
  question
}: {
  answer?: SaveAttemptAnswerInput;
  disabled?: boolean;
  onChange: (patch: Partial<SaveAttemptAnswerInput>) => void;
  question: AttemptQuestion;
}) {
  const type = question.question.type;
  const choices = question.question.choices ?? [];
  const selected = answer?.choiceIds ?? [];

  function toggleChoice(choiceId: string) {
    if (type === "SINGLE_CHOICE") {
      onChange({ choiceIds: [choiceId], textAnswer: undefined, trueFalseAnswer: undefined });
      return;
    }
    const next = selected.includes(choiceId)
      ? selected.filter((id) => id !== choiceId)
      : [...selected, choiceId];
    onChange({ choiceIds: next, textAnswer: undefined, trueFalseAnswer: undefined });
  }

  return (
    <SummaryCard icon="document" title={`Question ${question.orderIndex}`}>
      <AppText style={styles.questionPrompt}>{question.question.prompt}</AppText>
      <Pill label={statusLabel(type)} />
      {type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE" ? (
        <View style={styles.choiceList}>
          {choices.map((choice) => {
            const isSelected = selected.includes(choice.id);
            return (
              <Pressable
                key={choice.id}
                accessibilityHint="Selects this answer option."
                accessibilityLabel={`${isSelected ? "Selected" : "Not selected"} ${choice.label ? `${choice.label}. ` : ""}${choice.text}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                disabled={disabled}
                onPress={() => toggleChoice(choice.id)}
                style={({ pressed }) => [
                  styles.choiceRow,
                  isSelected ? styles.choiceSelected : null,
                  pressed ? styles.pressed : null
                ]}
              >
                <View style={[styles.choiceMarker, isSelected ? styles.choiceMarkerSelected : null]} />
                <AppText style={styles.choiceText}>{choice.label ? `${choice.label}. ` : ""}{choice.text}</AppText>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      {type === "TRUE_FALSE" ? (
        <View style={styles.segment}>
          <Button label="True" onPress={() => onChange({ trueFalseAnswer: true, choiceIds: [], textAnswer: undefined })} variant={answer?.trueFalseAnswer === true ? "primary" : "secondary"} style={styles.segmentButton} />
          <Button label="False" onPress={() => onChange({ trueFalseAnswer: false, choiceIds: [], textAnswer: undefined })} variant={answer?.trueFalseAnswer === false ? "primary" : "secondary"} style={styles.segmentButton} />
        </View>
      ) : null}
      {type === "TEXT_ANSWER" ? (
        <TextInput
          label="Answer"
          value={answer?.textAnswer ?? ""}
          onChangeText={(value) => onChange({ textAnswer: value, choiceIds: [], trueFalseAnswer: undefined })}
          multiline
          style={styles.multiline}
        />
      ) : null}
      {!["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "TEXT_ANSWER"].includes(type) ? (
        <EmptyState icon="document" title="Unsupported question type" message="This question type is not supported by the mobile app yet." />
      ) : null}
    </SummaryCard>
  );
}

export function ProgressScreen() {
  const reports = useQuery({ queryKey: ["student", "progress-reports"], queryFn: getProgressReports });
  const participation = useQuery({ queryKey: ["student", "participation"], queryFn: getStudentParticipation });
  const attendance = useQuery({ queryKey: ["student", "progress-attendance"], queryFn: getStudentAttendance });
  const enrollments = useQuery({ queryKey: ["student", "progress-enrollments"], queryFn: getStudentEnrollments });
  const isLoading = reports.isLoading || participation.isLoading || attendance.isLoading || enrollments.isLoading;
  const latest = reports.data?.[0];
  const isRefreshing = reports.isRefetching || participation.isRefetching || attendance.isRefetching || enrollments.isRefetching;
  const hasAnyData = Boolean(reports.data || participation.data || attendance.data || enrollments.data);

  return (
    <Screen
      contentStyle={styles.content}
      onRefresh={refreshAll(reports.refetch, participation.refetch, attendance.refetch, enrollments.refetch)}
      refreshing={isRefreshing}
    >
      <OfflineBanner visible={hasAnyData && hasOfflineError(reports.error, participation.error, attendance.error, enrollments.error)} />
      <StudentHeader title="Progress" subtitle="Academic progress, participation, attendance, and teacher remarks." />
      {isLoading ? <LoadingState label="Loading progress" /> : null}
      {reports.error && !reports.data ? resourceError(reports.error, reports.refetch) : null}
      {participation.error ? (
        !participation.data ? <ErrorState title="Participation unavailable" message={getApiErrorMessage(participation.error)} onRetry={participation.refetch} /> : null
      ) : null}
      {latest ? (
        <SummaryCard icon="trend" title="Latest report" value={statusLabel(latest.examEligibilityStatus)}>
          <InfoRow label="Generated" value={formatDate(latest.generatedAt)} />
          <InfoRow label="Attendance" value={`${text(latest.attendanceRate, "0")}%`} />
          <InfoRow label="Participation" value={text(latest.averageParticipationScore)} />
          <InfoRow label="Teacher remarks" value={text(latest.teacherRemarks)} />
        </SummaryCard>
      ) : reports.data ? (
        <EmptyState icon="trend" title="No progress reports" message="Teacher-generated progress reports will appear here." />
      ) : null}
      {attendance.data ? (
        <SummaryCard icon="check" title="Attendance summary" value={`${attendance.data.attendanceRate}%`}>
          <InfoRow label="Present" value={String(attendance.data.present)} />
          <InfoRow label="Absent" value={String(attendance.data.absent)} />
          <InfoRow label="Late" value={String(attendance.data.late)} />
        </SummaryCard>
      ) : null}
      {participation.data ? (
        <SummaryCard icon="people" title="Participation" value={participation.data.averageScore === null ? "No score" : String(participation.data.averageScore)}>
          <InfoRow label="Records" value={String(participation.data.records.length)} />
        </SummaryCard>
      ) : null}
      {enrollments.data ? (
        <SummaryCard icon="book" title="Academic progression">
          {enrollments.data.map((enrollment) => (
            <InfoRow
              key={enrollment.id}
              label={nameOf(enrollment.language)}
              value={`${nameOf(enrollment.subLevel ?? enrollment.level)} - ${statusLabel(enrollment.status)}`}
            />
          ))}
        </SummaryCard>
      ) : null}
    </Screen>
  );
}

export function CertificatesScreen() {
  const query = useQuery({ queryKey: ["student", "certificates"], queryFn: getCertificates });
  const [cachedFiles, setCachedFiles] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const downloadMutation = useMutation({
    mutationFn: (certificate: Certificate) => {
      setActiveId(certificate.id);
      return downloadCertificatePdf(
        certificate.id,
        certificate.certificateNumber ? `certificate-${certificate.certificateNumber}.pdf` : undefined
      );
    },
    onSuccess: (uri, certificate) => {
      setCachedFiles((current) => ({ ...current, [certificate.id]: uri }));
      setMessage("Certificate downloaded and cached on this device.");
    },
    onError: (error) => setMessage(getApiErrorMessage(error)),
    onSettled: () => setActiveId(null)
  });

  async function openCertificate(certificate: Certificate) {
    try {
      const uri = cachedFiles[certificate.id] ?? await downloadMutation.mutateAsync(certificate);
      await openNativeFile(uri);
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    }
  }

  async function shareCertificate(certificate: Certificate) {
    try {
      const uri = cachedFiles[certificate.id] ?? await downloadMutation.mutateAsync(certificate);
      await shareNativeFile(uri);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : getApiErrorMessage(error));
    }
  }

  return (
    <Screen contentStyle={styles.content} onRefresh={() => void query.refetch()} refreshing={query.isRefetching}>
      <OfflineBanner visible={Boolean(query.data && query.error && isNetworkError(query.error))} />
      <StudentHeader title="Certificates" subtitle="Earned certificates and issue status." />
      {query.isLoading ? <LoadingState label="Loading certificates" /> : null}
      {query.isError && !query.data ? resourceError(query.error, query.refetch) : null}
      {message ? <StatusMessage message={message} onDismiss={() => setMessage(null)} /> : null}
      {query.data?.length === 0 ? <EmptyState icon="ribbon" title="No certificates" message="Certificates will appear after validated passed final exams." /> : null}
      {query.data?.map((certificate) => (
        <SummaryCard key={certificate.id} icon="ribbon" title={text(certificate.title, "Certificate")}>
          <Pill label={statusLabel(certificate.status)} tone={toneForStatus(certificate.status)} />
          <InfoRow label="Level" value={nameOf(certificate.level)} />
          <InfoRow label="Group" value={nameOf(certificate.group)} />
          <InfoRow label="Issue date" value={formatDate(certificate.issuedAt)} />
          <InfoRow label="Cache" value={cachedFiles[certificate.id] ? "Downloaded on this device" : "Not downloaded"} />
          <View style={styles.actionRow}>
            <Button
              label="Download"
              onPress={() => downloadMutation.mutate(certificate)}
              loading={downloadMutation.isPending && activeId === certificate.id}
              style={styles.actionButton}
            />
            <Button label="Open" onPress={() => void openCertificate(certificate)} variant="secondary" style={styles.actionButton} />
            <Button label="Share" onPress={() => void shareCertificate(certificate)} variant="secondary" style={styles.actionButton} />
          </View>
        </SummaryCard>
      ))}
    </Screen>
  );
}

export function DocumentsScreen() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const network = useNetworkStatus();
  const query = useQuery({ queryKey: ["student", "documents"], queryFn: getStudentDocuments });
  const [documentType, setDocumentType] = useState("ID_CARD");
  const [selectedFile, setSelectedFile] = useState<NativeFile | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const uploadMutation = useMutation({
    mutationFn: (file: NativeFile) => {
      if (!user?.id) throw new Error("Unable to upload without a signed-in student.");
      if (network.isOffline) throw new Error("Uploads are disabled while offline.");
      return uploadStudentDocument({
        studentId: user.id,
        documentType,
        fileName: file.fileName,
        mimeType: file.mimeType,
        contentBase64: file.base64
      });
    },
    onSuccess: () => {
      setSelectedFile(null);
      setMessage("Document uploaded successfully.");
      void queryClient.invalidateQueries({ queryKey: ["student", "documents"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : getApiErrorMessage(error))
  });

  async function selectFile(kind: "camera" | "library" | "file") {
    try {
      const file =
        kind === "camera"
          ? await captureDocumentImage()
          : kind === "library"
            ? await pickImageFromLibrary()
            : await pickDocumentFile();
      if (file) {
        setSelectedFile(file);
        setMessage(`${file.fileName} is ready to upload.`);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : getApiErrorMessage(error));
    }
  }

  function unsupportedDocumentAction(document: StudentDocument) {
    setMessage(documentDownloadUnsupportedMessage(document));
  }

  return (
    <KeyboardAwareScreen contentStyle={styles.content} onRefresh={() => void query.refetch()} refreshing={query.isRefetching}>
      <OfflineBanner visible={network.isOffline || Boolean(query.data && query.error && isNetworkError(query.error))} />
      <StudentHeader title="Documents" subtitle="Upload and track student document status." />
      {query.isLoading ? <LoadingState label="Loading documents" /> : null}
      {query.isError && !query.data ? resourceError(query.error, query.refetch) : null}
      {message ? <StatusMessage message={message} onDismiss={() => setMessage(null)} /> : null}
      <SummaryCard icon="document" title="Upload document">
        <View style={styles.segment}>
          {["ID_CARD", "PASSPORT", "PHOTO", "OTHER"].map((type) => (
            <Button
              key={type}
              label={statusLabel(type)}
              onPress={() => setDocumentType(type)}
              variant={documentType === type ? "primary" : "secondary"}
              style={styles.segmentButton}
            />
          ))}
        </View>
        <View style={styles.actionRow}>
          <Button label="Camera" onPress={() => void selectFile("camera")} variant="secondary" style={styles.actionButton} />
          <Button label="Library" onPress={() => void selectFile("library")} variant="secondary" style={styles.actionButton} />
          <Button label="Files" onPress={() => void selectFile("file")} variant="secondary" style={styles.actionButton} />
        </View>
        {selectedFile ? (
          <>
            <InfoRow label="Selected" value={selectedFile.fileName} />
            <InfoRow label="Type" value={selectedFile.mimeType} />
            <InfoRow label="Progress" value={uploadMutation.isPending ? "Uploading..." : "Ready"} />
          </>
        ) : null}
        <Button
          label="Upload"
          onPress={() => selectedFile ? uploadMutation.mutate(selectedFile) : setMessage("Choose a document before uploading.")}
          loading={uploadMutation.isPending}
          disabled={!selectedFile || network.isOffline}
        />
      </SummaryCard>
      {query.data?.length === 0 ? <EmptyState icon="document" title="No documents" message="Uploaded documents will appear here for status tracking." /> : null}
      {query.data?.map((document) => (
        <SummaryCard key={document.id} icon="document" title={statusLabel(document.documentType)}>
          <Pill label={statusLabel(document.status)} tone={toneForStatus(document.status)} />
          <InfoRow label="File" value={text(document.fileName)} />
          <InfoRow label="Type" value={text(document.mimeType)} />
          <InfoRow label="Uploaded" value={formatDate(document.createdAt)} />
          <InfoRow label="Verified" value={document.verifiedAt ? formatDate(document.verifiedAt) : "Not verified"} />
          {document.rejectionReason ? <InfoRow label="Reason" value={document.rejectionReason} /> : null}
          <View style={styles.actionRow}>
            <Button label="Open" onPress={() => unsupportedDocumentAction(document)} variant="secondary" style={styles.actionButton} />
            <Button label="Download" onPress={() => unsupportedDocumentAction(document)} variant="secondary" style={styles.actionButton} />
            <Button label="Share" onPress={() => unsupportedDocumentAction(document)} variant="secondary" style={styles.actionButton} />
          </View>
        </SummaryCard>
      ))}
    </KeyboardAwareScreen>
  );
}

function StatusMessage({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <SummaryCard icon="notification" title="Status">
      <AppText tone="muted">{message}</AppText>
      <Button label="Dismiss" onPress={onDismiss} variant="ghost" style={styles.signOut} />
    </SummaryCard>
  );
}

export function MessagesScreen() {
  const [mode, setMode] = useState<"inbox" | "sent">("inbox");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [recipientId, setRecipientId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const queryClient = useQueryClient();
  const inbox = useQuery({ queryKey: ["student", "messages", "inbox"], queryFn: getInboxMessages });
  const sent = useQuery({ queryKey: ["student", "messages", "sent"], queryFn: getSentMessages });
  const selectedMessage = useQuery({
    enabled: Boolean(selectedId),
    queryKey: ["student", "messages", "detail", selectedId],
    queryFn: () => getMessageDetail(String(selectedId))
  });
  const readMutation = useMutation({
    mutationFn: markMessageRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["student", "messages"] })
  });
  const sendMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: () => {
      setRecipientId("");
      setSubject("");
      setBody("");
      void queryClient.invalidateQueries({ queryKey: ["student", "messages"] });
    }
  });
  const active = mode === "inbox" ? inbox : sent;
  const messages = active.data ?? [];
  const isRefreshing = inbox.isRefetching || sent.isRefetching || selectedMessage.isRefetching;
  const hasAnyData = Boolean(inbox.data || sent.data || selectedMessage.data);

  function openMessage(message: Message) {
    setSelectedId((current) => (current === message.id ? null : message.id));
    if (mode === "inbox" && !message.readAt) {
      readMutation.mutate(message.id);
    }
  }

  return (
    <KeyboardAwareScreen
      contentStyle={styles.content}
      onRefresh={refreshAll(inbox.refetch, sent.refetch)}
      refreshing={isRefreshing}
    >
      <OfflineBanner visible={hasAnyData && hasOfflineError(inbox.error, sent.error, selectedMessage.error)} />
      <StudentHeader title="Messages" subtitle="Inbox, sent messages, and direct message sending." />
      <View style={styles.segment}>
        <Button label="Inbox" onPress={() => setMode("inbox")} variant={mode === "inbox" ? "primary" : "secondary"} style={styles.segmentButton} />
        <Button label="Sent" onPress={() => setMode("sent")} variant={mode === "sent" ? "primary" : "secondary"} style={styles.segmentButton} />
      </View>
      {active.isLoading ? <LoadingState label="Loading messages" /> : null}
      {active.isError && !active.data ? resourceError(active.error, active.refetch) : null}
      {messages.length === 0 && active.data ? <EmptyState icon="chat" title="No messages" message={`${mode === "inbox" ? "Received" : "Sent"} messages will appear here.`} /> : null}
      {messages.map((message) => (
        <SummaryCard key={message.id} icon="chat" title={text(message.subject, "Message")} onPress={() => openMessage(message)}>
          <View style={styles.pillRow}>
            <Pill label={message.readAt || mode === "sent" ? "Read" : "Unread"} tone={message.readAt || mode === "sent" ? "success" : "neutral"} />
            <Pill label={formatDate(message.createdAt)} />
          </View>
          <InfoRow label={mode === "inbox" ? "From" : "To"} value={personName(mode === "inbox" ? message.sender : message.recipient)} />
          {selectedId === message.id ? (
            selectedMessage.isLoading ? (
              <LoadingState label="Loading message" />
            ) : selectedMessage.isError ? (
              resourceError(selectedMessage.error, selectedMessage.refetch)
            ) : (
              <AppText style={styles.bodyText}>{text(selectedMessage.data?.body ?? message.body, "No message body")}</AppText>
            )
          ) : null}
        </SummaryCard>
      ))}
      <SectionTitle title="Send message" />
      <SummaryCard icon="mail" title="Direct message">
        <TextInput label="Recipient user ID" value={recipientId} onChangeText={setRecipientId} autoCapitalize="none" />
        <TextInput label="Subject" value={subject} onChangeText={setSubject} />
        <TextInput label="Message" value={body} onChangeText={setBody} multiline style={styles.multiline} />
        {sendMutation.isError ? <ErrorState message={getApiErrorMessage(sendMutation.error)} /> : null}
        <Button
          label="Send"
          onPress={() => sendMutation.mutate({ recipientId, subject, body })}
          loading={sendMutation.isPending}
          disabled={!recipientId.trim() || !subject.trim() || !body.trim()}
        />
      </SummaryCard>
    </KeyboardAwareScreen>
  );
}

export function NotificationsScreen() {
  const queryClient = useQueryClient();
  const [pushMessage, setPushMessage] = useState<string | null>(null);
  const query = useQuery({ queryKey: ["student", "notifications"], queryFn: getNotifications });
  const markOne = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["student", "notifications"] })
  });
  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["student", "notifications"] })
  });
  const pushRegistration = useMutation({
    mutationFn: registerForExpoPushNotifications,
    onSuccess: (result) => setPushMessage(result.message),
    onError: (error) => setPushMessage(error instanceof Error ? error.message : getApiErrorMessage(error))
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
          <StudentHeader
            title="Notifications"
            subtitle="Unread and read LCMP updates."
            action={<Button label="Mark all read" onPress={() => markAll.mutate()} loading={markAll.isPending} variant="secondary" style={styles.signOut} />}
          />
          {query.isLoading ? <LoadingState label="Loading notifications" variant="skeleton" /> : null}
          {query.isError && !query.data ? resourceError(query.error, query.refetch) : null}
          <SummaryCard icon="notification" title="Push notifications">
            <AppText tone="muted">Notification taps can open Messages, Exams, Schedule, or Notifications when the payload includes a supported route.</AppText>
            {pushMessage ? <InfoRow label="Status" value={pushMessage} /> : null}
            <Button
              label="Enable push"
              onPress={() => pushRegistration.mutate()}
              loading={pushRegistration.isPending}
              variant="secondary"
            />
          </SummaryCard>
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
          {isUnreadNotification(notification) ? (
            <Button
              label="Mark read"
              onPress={() => markOne.mutate(notification.id)}
              loading={markOne.isPending}
              variant="secondary"
            />
          ) : null}
        </SummaryCard>
      )}
    />
  );
}

const moreLinks = [
  { title: "Attendance", detail: "Attendance rate and history", href: "/student/attendance", icon: "check" },
  { title: "Progress", detail: "Progress reports and participation", href: "/student/progress", icon: "trend" },
  { title: "Certificates", detail: "Earned certificate status", href: "/student/certificates", icon: "ribbon" },
  { title: "Documents", detail: "Document status tracking", href: "/student/documents", icon: "document" },
  { title: "Messages", detail: "Inbox, sent messages, and direct send", href: "/student/messages", icon: "chat" },
  { title: "Notifications", detail: "Unread and read notifications", href: "/student/notifications", icon: "notification" }
] as const;

export function MoreScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const profile = useQuery({ queryKey: ["student", "profile"], queryFn: getStudentProfile });
  const enrollments = useQuery({ queryKey: ["student", "courses"], queryFn: getStudentEnrollments });
  const profileMutation = useMutation({
    mutationFn: updateStudentProfile,
    onSuccess: (updated) => {
      queryClient.setQueryData(["student", "profile"], updated);
      setIsEditingProfile(false);
    }
  });
  const enrollment = currentEnrollment(enrollments.data ?? []);
  const group = activeGroup(enrollment);
  const fullName = [profile.data?.firstName, profile.data?.lastName].filter(Boolean).join(" ");
  const isRefreshing = profile.isRefetching || enrollments.isRefetching;
  const hasAnyData = Boolean(profile.data || enrollments.data);

  useEffect(() => {
    if (!profile.data || isEditingProfile) return;
    setFirstName(profile.data.firstName ?? "");
    setLastName(profile.data.lastName ?? "");
    setPhone(profile.data.phone ?? "");
  }, [isEditingProfile, profile.data]);

  function startProfileEdit() {
    setFirstName(profile.data?.firstName ?? "");
    setLastName(profile.data?.lastName ?? "");
    setPhone(profile.data?.phone ?? "");
    setIsEditingProfile(true);
  }

  function saveProfile() {
    profileMutation.mutate({
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      phone: phone.trim() || undefined
    });
  }

  return (
    <KeyboardAwareScreen
      contentStyle={styles.content}
      onRefresh={refreshAll(profile.refetch, enrollments.refetch)}
      refreshing={isRefreshing}
    >
      <OfflineBanner visible={hasAnyData && hasOfflineError(profile.error, enrollments.error)} />
      <StudentHeader title="More" subtitle="Additional student self-service sections." />
      <SummaryCard icon="people" title="Profile">
        {profile.isLoading ? <LoadingState label="Loading profile" /> : null}
        {profile.isError && !profile.data ? resourceError(profile.error, profile.refetch) : null}
        {profile.data ? (
          <>
            {isEditingProfile ? (
              <>
                <TextInput label="First name" value={firstName} onChangeText={setFirstName} textContentType="givenName" />
                <TextInput label="Last name" value={lastName} onChangeText={setLastName} textContentType="familyName" />
                <TextInput label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" textContentType="telephoneNumber" />
                {profileMutation.isError ? <ErrorState message={getApiErrorMessage(profileMutation.error)} /> : null}
                <View style={styles.profileActions}>
                  <Button label="Cancel" onPress={() => setIsEditingProfile(false)} variant="secondary" style={styles.profileAction} />
                  <Button label="Save" onPress={saveProfile} loading={profileMutation.isPending} style={styles.profileAction} />
                </View>
              </>
            ) : (
              <>
                <InfoRow label="Name" value={text(fullName, "Name not set")} />
                <InfoRow label="Email" value={text(profile.data.email)} />
                <InfoRow label="Phone" value={text(profile.data.phone)} />
                <InfoRow label="Language" value={nameOf(enrollment?.language)} />
                <InfoRow label="Current level" value={nameOf(enrollment?.subLevel ?? enrollment?.level)} />
                <InfoRow label="Group" value={nameOf(group)} />
                <Button label="Edit profile" onPress={startProfileEdit} variant="secondary" />
              </>
            )}
          </>
        ) : null}
      </SummaryCard>
      {enrollments.isError && !enrollments.data ? resourceError(enrollments.error, enrollments.refetch) : null}
      {moreLinks.map((link) => (
        <ListItem key={link.href} icon={link.icon} title={link.title} subtitle={link.detail} onPress={() => router.push(link.href)} />
      ))}
    </KeyboardAwareScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingVertical: spacing.xxl
  },
  signOut: {
    alignSelf: "flex-start"
  },
  grid: {
    gap: spacing.md
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.sm
  },
  pressed: {
    opacity: 0.82
  },
  sectionBlock: {
    gap: spacing.md
  },
  sectionHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  textAction: {
    minHeight: 44,
    paddingHorizontal: spacing.sm
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  segment: {
    flexDirection: "row",
    gap: spacing.sm
  },
  segmentButton: {
    flex: 1
  },
  profileActions: {
    flexDirection: "row",
    gap: spacing.sm
  },
  profileAction: {
    flex: 1
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  actionButton: {
    flex: 1,
    minWidth: 96,
    paddingHorizontal: spacing.sm
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
  examNav: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  examNavButton: {
    flex: 1,
    minWidth: 96,
    paddingHorizontal: spacing.sm
  },
  progressTrack: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    height: 10,
    overflow: "hidden"
  },
  progressFill: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    height: "100%"
  },
  questionPrompt: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 24
  },
  choiceList: {
    gap: spacing.sm
  },
  choiceRow: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 52,
    padding: spacing.md
  },
  choiceSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary
  },
  choiceMarker: {
    borderColor: colors.muted,
    borderRadius: 8,
    borderWidth: 2,
    height: 16,
    width: 16
  },
  choiceMarkerSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  choiceText: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    lineHeight: 21
  }
});
