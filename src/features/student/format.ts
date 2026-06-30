import type { AnyRecord, Enrollment } from "./types";

export function text(value: unknown, fallback = "Not available") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

export function nameOf(value: AnyRecord | null | undefined, fallback = "Not available") {
  if (!value) return fallback;
  return text(value.name ?? value.title ?? value.label ?? value.email, fallback);
}

export function personName(value: AnyRecord | null | undefined, fallback = "Not assigned") {
  if (!value) return fallback;
  const profile = value.profile as AnyRecord | undefined;
  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ");
  return text(fullName || value.email, fallback);
}

export function formatDate(value: unknown) {
  if (!value) return "Date not set";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "Date not set";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

export function formatDateTime(value: unknown) {
  if (!value) return "Time not set";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "Time not set";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function statusLabel(value: unknown) {
  return text(value, "Pending").replace(/_/g, " ");
}

export function activeGroup(enrollment: Enrollment | null | undefined) {
  const assignment =
    enrollment?.groupAssignments?.find((item) => item.status === "ACTIVE" && !item.removedAt) ??
    enrollment?.groupAssignments?.[0];
  return assignment?.group;
}

export function paymentStatus(enrollment: Enrollment) {
  const direct = enrollment.paymentStatus;
  const payments = Array.isArray(enrollment.payments) ? enrollment.payments : [];
  const latest = payments[0] as AnyRecord | undefined;
  const value = String(direct ?? latest?.status ?? latest?.paymentStatus ?? "").toUpperCase();
  return value === "PAID" || value === "VALIDATED" || value === "APPROVED" ? "Validated" : "Pending Validation";
}
