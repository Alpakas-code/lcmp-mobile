import { apiClient, unwrapResponse } from "../../api/client";
import type {
  AttendanceSession,
  GroupStudentAssignment,
  Paginated,
  ParticipationRecord,
  ProgressReport,
  TeacherCalendarEvent,
  TeacherGroup,
  TeacherMessage,
  TeacherNotification,
  TeacherProfile
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

export function getTeacherProfile() {
  return getValue<TeacherProfile>("/profile/me");
}

export function updateTeacherProfile(input: { firstName?: string; lastName?: string; phone?: string }) {
  return apiClient.patch("/profile/me", input).then((response) => unwrapResponse<TeacherProfile>(response));
}

export function getTeacherGroups() {
  return getArray<TeacherGroup>("/groups", { page: 1, limit: 100 });
}

export function getTeacherGroupStudents(groupId: string) {
  return getArray<GroupStudentAssignment>(`/groups/${groupId}/students`);
}

export function getTeacherCalendar(from?: Date, to?: Date) {
  return getArray<TeacherCalendarEvent>("/calendar", {
    from: from?.toISOString(),
    to: to?.toISOString()
  });
}

export function getAttendanceSessions(groupId?: string) {
  return getArray<AttendanceSession>("/attendance-sessions", { page: 1, limit: 100, groupId });
}

export function createAttendanceSession(input: {
  groupId: string;
  scheduleId?: string;
  title?: string;
  sessionDate: string;
  notes?: string;
}) {
  return apiClient.post("/attendance-sessions", input).then((response) => unwrapResponse<AttendanceSession>(response));
}

export function saveAttendanceRecords(sessionId: string, records: { studentId: string; status: string; remarks?: string }[]) {
  return apiClient.post(`/attendance-sessions/${sessionId}/records`, { records }).then((response) => unwrapResponse<unknown>(response));
}

export function updateAttendanceRecord(id: string, input: { status: string; remarks?: string; updateReason?: string }) {
  return apiClient.patch(`/attendance-records/${id}`, input).then((response) => unwrapResponse<unknown>(response));
}

export function getParticipationRecords(params?: { groupId?: string; studentId?: string }) {
  return getArray<ParticipationRecord>("/participation", { page: 1, limit: 100, ...params });
}

export function createParticipationRecord(input: {
  groupId: string;
  studentId: string;
  scheduleId?: string;
  score: number;
  remarks?: string;
}) {
  return apiClient.post("/participation", input).then((response) => unwrapResponse<ParticipationRecord>(response));
}

export function updateParticipationRecord(id: string, input: Partial<{ groupId: string; studentId: string; score: number; remarks: string }>) {
  return apiClient.patch(`/participation/${id}`, input).then((response) => unwrapResponse<ParticipationRecord>(response));
}

export function getProgressReports(params?: { groupId?: string; studentId?: string }) {
  return getArray<ProgressReport>("/progress-reports", { page: 1, limit: 100, ...params });
}

export function generateProgressReport(input: {
  groupId: string;
  studentId: string;
  periodStart?: string;
  periodEnd?: string;
  teacherRemarks?: string;
}) {
  return apiClient.post("/progress-reports/generate", input).then((response) => unwrapResponse<ProgressReport>(response));
}

export function getTeacherInboxMessages() {
  return getArray<TeacherMessage>("/messages/inbox");
}

export function getTeacherSentMessages() {
  return getArray<TeacherMessage>("/messages/sent");
}

export function getTeacherUnreadMessageCount() {
  return getValue<{ count: number }>("/messages/unread-count");
}

export function getTeacherMessageDetail(id: string) {
  return getValue<TeacherMessage>(`/messages/${id}`);
}

export function sendTeacherMessage(input: { recipientId: string; subject: string; body: string }) {
  return apiClient.post("/messages", input).then((response) => unwrapResponse<TeacherMessage>(response));
}

export function markTeacherMessageRead(id: string) {
  return apiClient.patch(`/messages/${id}/read`).then((response) => unwrapResponse<TeacherMessage>(response));
}

export function getTeacherNotifications() {
  return getArray<TeacherNotification>("/notifications/me", { page: 1, limit: 100 });
}

export function markTeacherNotificationRead(id: string) {
  return apiClient.patch(`/notifications/${id}/read`).then((response) => unwrapResponse<TeacherNotification>(response));
}

export function markAllTeacherNotificationsRead() {
  return apiClient.patch("/notifications/read-all").then((response) => unwrapResponse<unknown>(response));
}

export function getNotificationPreference() {
  return getValue<{ pushEnabled?: boolean; inAppEnabled?: boolean; emailEnabled?: boolean }>("/notification-preferences/me");
}

export function updateNotificationPreference(input: { pushEnabled?: boolean; inAppEnabled?: boolean; emailEnabled?: boolean }) {
  return apiClient.patch("/notification-preferences/me", input).then((response) => unwrapResponse<unknown>(response));
}

export async function getTeacherDashboardData() {
  const now = new Date();
  const until = new Date(now);
  until.setDate(until.getDate() + 45);
  const [profile, groups, calendar, inboxCount, notifications] = await Promise.all([
    getTeacherProfile(),
    getTeacherGroups(),
    getTeacherCalendar(now, until),
    getTeacherUnreadMessageCount(),
    getTeacherNotifications()
  ]);
  return { profile, groups, calendar, inboxCount, notifications };
}
