import { apiClient, unwrapResponse } from "../../api/client";
import type { CourseMessage, CourseRoom } from "./types";

export function getCourseRoom(courseId: string) {
  return apiClient.get(`/courses/${courseId}/room`).then((response) => unwrapResponse<CourseRoom>(response));
}

export function sendCourseRoomMessage(courseId: string, body: string) {
  return apiClient
    .post(`/courses/${courseId}/messages`, { body })
    .then((response) => unwrapResponse<CourseMessage>(response));
}
