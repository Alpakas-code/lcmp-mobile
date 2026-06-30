export type AnyRecord = Record<string, any>;

export type Paginated<T> = {
  items: T[];
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
};

export type Enrollment = AnyRecord & {
  id: string;
  status?: string;
  paymentStatus?: string;
  progressionText?: string | null;
  language?: AnyRecord;
  level?: AnyRecord;
  subLevel?: AnyRecord | null;
  course?: AnyRecord | null;
  groupAssignments?: (AnyRecord & { group?: AnyRecord })[];
};

export type CalendarEvent = AnyRecord & {
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

export type AttendanceSummary = {
  attendanceRate: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  records: AnyRecord[];
};

export type ParticipationSummary = {
  averageScore: number | null;
  records: AnyRecord[];
};

export type ProgressReport = AnyRecord & {
  id: string;
  attendanceRate?: number;
  averageParticipationScore?: number | null;
  teacherRemarks?: string | null;
  examEligibilityStatus?: string;
  generatedAt?: string;
  group?: AnyRecord;
};

export type Certificate = AnyRecord & {
  id: string;
  title?: string;
  status?: string;
  issuedAt?: string;
  level?: AnyRecord | null;
  group?: AnyRecord | null;
};

export type StudentDocument = AnyRecord & {
  id: string;
  documentType?: string;
  status?: string;
  fileName?: string;
  createdAt?: string;
  verifiedAt?: string | null;
};

export type StudentProfile = AnyRecord & {
  userId: string;
  email: string;
  role?: string;
  status?: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
};

export type Message = AnyRecord & {
  id: string;
  subject?: string;
  body?: string;
  readAt?: string | null;
  createdAt?: string;
  sender?: AnyRecord;
  recipient?: AnyRecord;
};

export type Notification = AnyRecord & {
  id: string;
  title?: string;
  message?: string;
  type?: string;
  status?: string;
  readAt?: string | null;
  createdAt?: string;
};

export type PlacementTest = AnyRecord & {
  id: string;
  title?: string;
  description?: string | null;
  durationMinutes?: number;
  status?: string;
  language?: AnyRecord;
};

export type ExamSession = AnyRecord & {
  id: string;
  title?: string;
  status?: string;
  startTime?: string;
  endTime?: string;
  group?: AnyRecord | null;
  teacher?: AnyRecord | null;
  classroom?: AnyRecord | null;
  examTemplate?: AnyRecord | null;
};

export type ExamAttempt = AnyRecord & {
  id: string;
  status?: string;
  finalScore?: number | string | null;
  maxScore?: number | string | null;
  passed?: boolean | null;
  retakeAllowed?: boolean | null;
  validatedAt?: string | null;
  examSession?: ExamSession;
};
