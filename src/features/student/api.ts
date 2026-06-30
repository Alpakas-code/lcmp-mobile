import { apiClient, unwrapResponse } from "../../api/client";
import type {
  AttendanceSummary,
  CalendarEvent,
  Certificate,
  Enrollment,
  ExamAttempt,
  ExamSession,
  Message,
  Notification,
  Paginated,
  ParticipationSummary,
  PlacementTest,
  ProgressReport,
  StudentDocument,
  StudentProfile
} from "./types";

function itemsFrom<T>(value: T[] | Paginated<T>): T[] {
  if (Array.isArray(value)) return value;
  return value.items;
}

async function getArray<T>(path: string, params?: Record<string, unknown>) {
  const response = await apiClient.get<T[] | Paginated<T>>(path, { params });
  return itemsFrom(unwrapResponse<T[] | Paginated<T>>(response));
}

async function getValue<T>(path: string, params?: Record<string, unknown>) {
  const response = await apiClient.get<T>(path, { params });
  return unwrapResponse<T>(response);
}

export function getStudentEnrollments() {
  return getArray<Enrollment>("/students/me/enrollments");
}

export function getStudentProfile() {
  return getValue<StudentProfile>("/profile/me");
}

export function updateStudentProfile(input: { firstName?: string; lastName?: string; phone?: string }) {
  return apiClient.patch("/profile/me", input).then((response) => unwrapResponse<StudentProfile>(response));
}

export function getStudentCalendar(from?: Date, to?: Date) {
  return getArray<CalendarEvent>("/calendar", {
    from: from?.toISOString(),
    to: to?.toISOString()
  });
}

export function getStudentAttendance() {
  return getValue<AttendanceSummary>("/students/me/attendance");
}

export function getPlacementTests() {
  return getArray<PlacementTest>("/placement-tests", { page: 1, limit: 50 });
}

export function getPlacementAttempts() {
  return getArray<ExamAttempt>("/placement-attempts", { page: 1, limit: 50 });
}

export function getExamSessions() {
  return getArray<ExamSession>("/exam-sessions", { page: 1, limit: 50 });
}

export function getExamAttempts() {
  return getArray<ExamAttempt>("/exam-attempts", { page: 1, limit: 50 });
}

export function getProgressReports() {
  return getArray<ProgressReport>("/progress-reports", { page: 1, limit: 20 });
}

export function getStudentParticipation() {
  return getValue<ParticipationSummary>("/students/me/participation");
}

export function getCertificates() {
  return getArray<Certificate>("/certificates", { page: 1, limit: 50 });
}

export function getStudentDocuments() {
  return getArray<StudentDocument>("/students/me/documents");
}

export function getInboxMessages() {
  return getArray<Message>("/messages/inbox");
}

export function getSentMessages() {
  return getArray<Message>("/messages/sent");
}

export function getUnreadMessageCount() {
  return getValue<{ count: number }>("/messages/unread-count");
}

export function getMessageDetail(id: string) {
  return getValue<Message>(`/messages/${id}`);
}

export function sendMessage(input: { recipientId: string; subject: string; body: string }) {
  return apiClient.post("/messages", input).then((response) => unwrapResponse<Message>(response));
}

export function markMessageRead(id: string) {
  return apiClient.patch(`/messages/${id}/read`).then((response) => unwrapResponse<Message>(response));
}

export function getNotifications() {
  return getArray<Notification>("/notifications/me", { page: 1, limit: 50 });
}

export function markNotificationRead(id: string) {
  return apiClient
    .patch(`/notifications/${id}/read`)
    .then((response) => unwrapResponse<Notification>(response));
}

export function markAllNotificationsRead() {
  return apiClient.patch("/notifications/read-all").then((response) => unwrapResponse<unknown>(response));
}

export async function getStudentDashboardData() {
  const now = new Date();
  const until = new Date(now);
  until.setDate(until.getDate() + 45);

  const [
    enrollments,
    profile,
    calendar,
    attendance,
    progressReports,
    certificates,
    notifications,
    unreadMessages,
    examSessions
  ] = await Promise.all([
    getStudentEnrollments(),
    getStudentProfile(),
    getStudentCalendar(now, until),
    getStudentAttendance(),
    getProgressReports(),
    getCertificates(),
    getNotifications(),
    getUnreadMessageCount(),
    getExamSessions()
  ]);

  return {
    enrollments,
    profile,
    calendar,
    attendance,
    progressReports,
    certificates,
    notifications,
    unreadMessages,
    examSessions
  };
}
