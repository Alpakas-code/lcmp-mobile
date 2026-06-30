import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  AppText,
  Button,
  CourseCard as MDSCourseCard,
  EmptyState,
  ErrorState,
  GreetingHeader,
  HorizontalRail,
  IconButton,
  KeyboardAwareScreen,
  ListItem,
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
  sendMessage,
  updateStudentProfile
} from "./api";
import { activeGroup, formatDate, formatDateTime, nameOf, paymentStatus, personName, statusLabel, text } from "./format";
import { InfoRow, OfflineBanner, Pill, SectionTitle, StudentHeader, SummaryCard, toneForStatus } from "./StudentUI";
import type { CalendarEvent, Enrollment, ExamSession, Message, Notification } from "./types";

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

function currentEnrollment(enrollments: Enrollment[]) {
  return (
    enrollments.find((item) => item.status === "APPROVED" || item.status === "ACTIVE") ??
    enrollments[0] ??
    null
  );
}

function EnrollmentCard({ enrollment }: { enrollment: Enrollment }) {
  const group = activeGroup(enrollment);
  return (
    <SummaryCard icon="book" title={nameOf(enrollment.course, "Course")}>
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
  const query = useQuery({ queryKey: ["student", "courses"], queryFn: getStudentEnrollments });

  return (
    <Screen contentStyle={styles.content} onRefresh={() => void query.refetch()} refreshing={query.isRefetching} testID="student-courses-screen">
      <OfflineBanner visible={Boolean(query.data && query.error && isNetworkError(query.error))} />
      <StudentHeader title="Courses" subtitle="Your enrollments, groups, levels, and payment validation status." />
      {query.isLoading ? <LoadingState label="Loading courses" /> : null}
      {query.isError && !query.data ? resourceError(query.error, query.refetch) : null}
      {query.data?.length === 0 ? (
        <EmptyState icon="book" title="No courses yet" message="Approved enrollments will appear here once LCMP assigns them." />
      ) : null}
      {query.data?.map((enrollment) => <EnrollmentCard key={enrollment.id} enrollment={enrollment} />)}
    </Screen>
  );
}

export function ScheduleScreen() {
  const range = useMemo(() => {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 60);
    return { from, to };
  }, []);
  const query = useQuery({
    queryKey: ["student", "schedule", range.from.toISOString(), range.to.toISOString()],
    queryFn: () => getStudentCalendar(range.from, range.to)
  });
  const split = query.data ? splitCalendar(query.data) : { today: [], upcoming: [] };

  return (
    <Screen contentStyle={styles.content} onRefresh={() => void query.refetch()} refreshing={query.isRefetching} testID="student-schedule-screen">
      <OfflineBanner visible={Boolean(query.data && query.error && isNetworkError(query.error))} />
      <StudentHeader title="Schedule" subtitle="Classes and final exam sessions returned by the calendar." />
      {query.isLoading ? <LoadingState label="Loading schedule" /> : null}
      {query.isError && !query.data ? resourceError(query.error, query.refetch) : null}
      {query.data?.length === 0 ? <EmptyState icon="calendar" title="No sessions" message="There are no upcoming sessions for your groups." /> : null}
      {split.today.length ? <SectionTitle title="Today" /> : null}
      {split.today.map((event) => <EventCard key={event.id} event={event} />)}
      {split.upcoming.length ? <SectionTitle title="Upcoming" /> : null}
      {split.upcoming.map((event) => <EventCard key={event.id} event={event} />)}
    </Screen>
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
  const placementTests = useQuery({ queryKey: ["student", "placement-tests"], queryFn: getPlacementTests });
  const placementAttempts = useQuery({ queryKey: ["student", "placement-attempts"], queryFn: getPlacementAttempts });
  const examSessions = useQuery({ queryKey: ["student", "exam-sessions"], queryFn: getExamSessions });
  const examAttempts = useQuery({ queryKey: ["student", "exam-attempts"], queryFn: getExamAttempts });
  const isLoading = placementTests.isLoading || placementAttempts.isLoading || examSessions.isLoading || examAttempts.isLoading;
  const error = placementTests.error ?? placementAttempts.error ?? examSessions.error ?? examAttempts.error;
  const isRefreshing = placementTests.isRefetching || placementAttempts.isRefetching || examSessions.isRefetching || examAttempts.isRefetching;
  const hasAnyData = Boolean(placementTests.data || placementAttempts.data || examSessions.data || examAttempts.data);

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
      <SectionTitle title="Placement tests" />
      {placementTests.data?.length === 0 ? <EmptyState icon="school" title="No placement tests" message="Available placement tests will appear here." /> : null}
      {placementTests.data?.map((test) => (
        <SummaryCard key={test.id} icon="school" title={text(test.title, "Placement test")}>
          <InfoRow label="Language" value={nameOf(test.language)} />
          <InfoRow label="Duration" value={test.durationMinutes ? `${test.durationMinutes} minutes` : "Not specified"} />
          <InfoRow label="Action" value="Open exam on web" />
        </SummaryCard>
      ))}
      <SectionTitle title="Placement results" />
      {placementAttempts.data?.length === 0 ? <EmptyState icon="trend" title="No placement results" message="Placement attempts and results will appear here." /> : null}
      {placementAttempts.data?.map((attempt) => (
        <SummaryCard key={attempt.id} icon="trend" title={text(attempt.placementTest?.title, "Placement attempt")}>
          <Pill label={statusLabel(attempt.status)} tone={toneForStatus(attempt.status)} />
          <InfoRow label="Score" value={text(attempt.finalScore ?? attempt.score)} />
          <InfoRow label="Validated level" value={nameOf(attempt.validatedLevel ?? attempt.recommendedLevel)} />
        </SummaryCard>
      ))}
      <SectionTitle title="Final exam sessions" />
      {examSessions.data?.length === 0 ? <EmptyState icon="calendar" title="No final exams" message="Scheduled final exams will appear here." /> : null}
      {examSessions.data?.map((session) => <EventCard key={session.id} event={session} />)}
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
    </Screen>
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

  return (
    <Screen contentStyle={styles.content} onRefresh={() => void query.refetch()} refreshing={query.isRefetching}>
      <OfflineBanner visible={Boolean(query.data && query.error && isNetworkError(query.error))} />
      <StudentHeader title="Certificates" subtitle="Earned certificates and issue status." />
      {query.isLoading ? <LoadingState label="Loading certificates" /> : null}
      {query.isError && !query.data ? resourceError(query.error, query.refetch) : null}
      {query.data?.length === 0 ? <EmptyState icon="ribbon" title="No certificates" message="Certificates will appear after validated passed final exams." /> : null}
      {query.data?.map((certificate) => (
        <SummaryCard key={certificate.id} icon="ribbon" title={text(certificate.title, "Certificate")}>
          <Pill label={statusLabel(certificate.status)} tone={toneForStatus(certificate.status)} />
          <InfoRow label="Level" value={nameOf(certificate.level)} />
          <InfoRow label="Group" value={nameOf(certificate.group)} />
          <InfoRow label="Issue date" value={formatDate(certificate.issuedAt)} />
          <InfoRow label="Download" value="Available through authenticated web export" />
        </SummaryCard>
      ))}
    </Screen>
  );
}

export function DocumentsScreen() {
  const query = useQuery({ queryKey: ["student", "documents"], queryFn: getStudentDocuments });

  return (
    <Screen contentStyle={styles.content} onRefresh={() => void query.refetch()} refreshing={query.isRefetching}>
      <OfflineBanner visible={Boolean(query.data && query.error && isNetworkError(query.error))} />
      <StudentHeader title="Documents" subtitle="Read-only status of documents already uploaded to LCMP." />
      {query.isLoading ? <LoadingState label="Loading documents" /> : null}
      {query.isError && !query.data ? resourceError(query.error, query.refetch) : null}
      {query.data?.length === 0 ? <EmptyState icon="document" title="No documents" message="Uploaded documents will appear here for status tracking." /> : null}
      {query.data?.map((document) => (
        <SummaryCard key={document.id} icon="document" title={statusLabel(document.documentType)}>
          <Pill label={statusLabel(document.status)} tone={toneForStatus(document.status)} />
          <InfoRow label="File" value={text(document.fileName)} />
          <InfoRow label="Uploaded" value={formatDate(document.createdAt)} />
          <InfoRow label="Verified" value={document.verifiedAt ? formatDate(document.verifiedAt) : "Not verified"} />
        </SummaryCard>
      ))}
    </Screen>
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
  const query = useQuery({ queryKey: ["student", "notifications"], queryFn: getNotifications });
  const markOne = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["student", "notifications"] })
  });
  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["student", "notifications"] })
  });

  return (
    <Screen contentStyle={styles.content} onRefresh={() => void query.refetch()} refreshing={query.isRefetching}>
      <OfflineBanner visible={Boolean(query.data && query.error && isNetworkError(query.error))} />
      <StudentHeader
        title="Notifications"
        subtitle="Unread and read LCMP updates."
        action={<Button label="Mark all read" onPress={() => markAll.mutate()} loading={markAll.isPending} variant="secondary" style={styles.signOut} />}
      />
      {query.isLoading ? <LoadingState label="Loading notifications" /> : null}
      {query.isError && !query.data ? resourceError(query.error, query.refetch) : null}
      {query.data?.length === 0 ? <EmptyState icon="notification" title="No notifications" message="LCMP notifications will appear here." /> : null}
      {query.data?.map((notification) => (
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
      ))}
    </Screen>
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
