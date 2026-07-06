export type AnyRecord = Record<string, any>;

export type Paginated<T> = {
  items: T[];
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
};

export type TeacherProfile = AnyRecord & {
  userId: string;
  email: string;
  role?: string;
  status?: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
};

export type TeacherGroup = AnyRecord & {
  id: string;
  name?: string;
  language?: AnyRecord | null;
  level?: AnyRecord | null;
  subLevel?: AnyRecord | null;
  course?: AnyRecord | null;
  isActive?: boolean;
  _count?: { assignments?: number; schedules?: number };
};

export type GroupStudentAssignment = AnyRecord & {
  id: string;
  studentId: string;
  student?: AnyRecord;
  enrollment?: AnyRecord | null;
};

export type TeacherCalendarEvent = AnyRecord & {
  id: string;
  type?: "SCHEDULE" | "EXAM_SESSION" | string;
  title?: string;
  status?: string;
  startTime?: string;
  endTime?: string;
  group?: AnyRecord | null;
  teacher?: AnyRecord | null;
  classroom?: AnyRecord | null;
  examTemplate?: AnyRecord | null;
};

export type AttendanceRecord = AnyRecord & {
  id?: string;
  studentId: string;
  status?: string;
  remarks?: string | null;
  student?: AnyRecord;
};

export type AttendanceSession = AnyRecord & {
  id: string;
  title?: string | null;
  groupId?: string;
  sessionDate?: string;
  group?: TeacherGroup;
  schedule?: AnyRecord | null;
  records?: AttendanceRecord[];
};

export type ParticipationRecord = AnyRecord & {
  id: string;
  groupId?: string;
  studentId?: string;
  score?: number | string;
  remarks?: string | null;
  createdAt?: string;
  group?: TeacherGroup;
  student?: AnyRecord;
};

export type ProgressReport = AnyRecord & {
  id: string;
  groupId?: string;
  studentId?: string;
  attendanceRate?: number | string;
  averageParticipationScore?: number | string | null;
  teacherRemarks?: string | null;
  examEligibilityStatus?: string;
  generatedAt?: string;
  group?: TeacherGroup;
  student?: AnyRecord;
};

export type TeacherMessage = AnyRecord & {
  id: string;
  subject?: string;
  body?: string;
  readAt?: string | null;
  createdAt?: string;
  sender?: AnyRecord;
  recipient?: AnyRecord;
};

export type TeacherNotification = AnyRecord & {
  id: string;
  title?: string;
  message?: string;
  type?: string;
  status?: string;
  readAt?: string | null;
  createdAt?: string;
};
