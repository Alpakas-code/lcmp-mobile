export type AnyRecord = Record<string, any>;

export type CourseMessage = AnyRecord & {
  id: string;
  body?: string;
  createdAt?: string;
  sender?: AnyRecord;
};

export type CourseMaterial = AnyRecord & {
  id: string;
  title?: string;
  description?: string | null;
  fileName?: string;
  filePath?: string;
  mimeType?: string;
  sizeBytes?: number;
  createdAt?: string;
  uploadedBy?: AnyRecord;
};

export type CourseSchedule = AnyRecord & {
  id: string;
  status?: string;
  startTime?: string;
  endTime?: string;
  meetingUrl?: string | null;
  group?: AnyRecord | null;
  teacher?: AnyRecord | null;
  classroom?: AnyRecord | null;
};

export type CourseRoom = {
  course: AnyRecord;
  messages: CourseMessage[];
  materials: CourseMaterial[];
  schedules: CourseSchedule[];
};
