import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  AppText,
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  TextInput
} from "../../components/ui";
import { getApiErrorMessage } from "../../api/client";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { formatDateTime, nameOf, personName, statusLabel, text } from "../student/format";
import { InfoRow, Pill, SectionTitle, StudentHeader, SummaryCard, toneForStatus } from "../student/StudentUI";
import { getCourseRoom, sendCourseRoomMessage } from "./api";
import type { CourseMaterial, CourseSchedule } from "./types";

function fileSize(value?: number) {
  if (!value) return "-";
  if (value < 1024 * 1024) return `${Math.ceil(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function normalizeUrl(value?: string | null) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return value;
}

async function openUrl(value?: string | null) {
  const url = normalizeUrl(value);
  if (!url) return;
  await Linking.openURL(url);
}

function ScheduleItem({ schedule }: { schedule: CourseSchedule }) {
  const meetingUrl = normalizeUrl(schedule.meetingUrl);
  return (
    <SummaryCard icon="calendar" title={nameOf(schedule.group, "Course session")}>
      <View style={styles.pillRow}>
        <Pill label={statusLabel(schedule.status)} tone={toneForStatus(schedule.status)} />
        <Pill label={formatDateTime(schedule.startTime)} />
      </View>
      <InfoRow label="Time" value={`${formatDateTime(schedule.startTime)} - ${formatDateTime(schedule.endTime)}`} />
      <InfoRow label="Teacher" value={personName(schedule.teacher)} />
      <InfoRow label="Classroom" value={nameOf(schedule.classroom, meetingUrl ? "Online" : "Not assigned")} />
      {meetingUrl ? <Button label="Open meeting link" onPress={() => void openUrl(meetingUrl)} variant="secondary" /> : null}
    </SummaryCard>
  );
}

function MaterialItem({ material }: { material: CourseMaterial }) {
  return (
    <SummaryCard icon="document" title={text(material.title, material.fileName ?? "Course material")}>
      <InfoRow label="Description" value={text(material.description)} />
      <InfoRow label="File" value={text(material.fileName)} />
      <InfoRow label="Size" value={fileSize(material.sizeBytes)} />
      <InfoRow label="Uploaded by" value={personName(material.uploadedBy)} />
      {material.filePath ? <Button label="Open PDF" onPress={() => void openUrl(material.filePath)} variant="secondary" /> : null}
    </SummaryCard>
  );
}

export function CourseRoomScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { courseId } = useLocalSearchParams<{ courseId?: string }>();
  const [body, setBody] = useState("");
  const id = Array.isArray(courseId) ? courseId[0] : courseId;
  const room = useQuery({
    enabled: Boolean(id),
    queryKey: ["course-room", id],
    queryFn: () => getCourseRoom(String(id))
  });
  const send = useMutation({
    mutationFn: () => sendCourseRoomMessage(String(id), body.trim()),
    onSuccess: () => {
      setBody("");
      void queryClient.invalidateQueries({ queryKey: ["course-room", id] });
    }
  });

  if (!id) {
    return <Screen contentStyle={styles.content}><ErrorState message="Course id is missing." /></Screen>;
  }

  if (room.isLoading) {
    return <Screen><LoadingState label="Loading course room" /></Screen>;
  }

  if (room.isError || !room.data) {
    return <Screen contentStyle={styles.content}><ErrorState message={getApiErrorMessage(room.error)} onRetry={room.refetch} /></Screen>;
  }

  const data = room.data;
  const upcoming = data.schedules.filter((schedule) => new Date(String(schedule.endTime)).getTime() >= Date.now());

  return (
    <Screen contentStyle={styles.content} onRefresh={() => void room.refetch()} refreshing={room.isRefetching}>
      <StudentHeader title={text(data.course.title, "Course room")} subtitle="Course messages, PDF materials, meeting links, and scheduled sessions." />
      <Button label="Back" onPress={() => router.back()} variant="ghost" />

      <SummaryCard icon="book" title={text(data.course.title, "Course")}>
        <InfoRow label="Description" value={text(data.course.description)} />
        <InfoRow label="Language" value={nameOf(data.course.language)} />
        <InfoRow label="Level" value={nameOf(data.course.subLevel ?? data.course.level)} />
        <InfoRow label="Mode" value={statusLabel(data.course.teachingMode)} />
      </SummaryCard>

      <View style={styles.sectionBlock}>
        <SectionTitle title="Scheduled course sessions" />
        {upcoming.length === 0 ? <EmptyState icon="calendar" title="No course sessions" message="Scheduled course sessions will appear here once the course is configured on the calendar." /> : null}
        {upcoming.map((schedule) => <ScheduleItem key={schedule.id} schedule={schedule} />)}
      </View>

      <View style={styles.sectionBlock}>
        <SectionTitle title="PDF materials" />
        {data.materials.length === 0 ? <EmptyState icon="document" title="No PDF materials" message="Teacher or admin PDF attachments will appear here." /> : null}
        {data.materials.map((material) => <MaterialItem key={material.id} material={material} />)}
      </View>

      <View style={styles.sectionBlock}>
        <SectionTitle title="Course messages" />
        {data.messages.length === 0 ? <EmptyState icon="chat" title="No course messages" message="Teacher and student course messages will appear here." /> : null}
        {data.messages.map((message) => (
          <SummaryCard key={message.id} icon="chat" title={personName(message.sender)}>
            <InfoRow label="Sent" value={formatDateTime(message.createdAt)} />
            <AppText style={styles.messageBody}>{text(message.body)}</AppText>
          </SummaryCard>
        ))}
        <SummaryCard icon="mail" title="Send course message">
          <TextInput label="Message" value={body} onChangeText={setBody} multiline style={styles.multiline} />
          {send.isError ? <ErrorState message={getApiErrorMessage(send.error)} /> : null}
          <Button label="Send" onPress={() => send.mutate()} loading={send.isPending} disabled={!body.trim()} />
        </SummaryCard>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg
  },
  messageBody: {
    color: colors.text,
    lineHeight: 21
  },
  multiline: {
    minHeight: 110
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs
  },
  sectionBlock: {
    gap: spacing.md
  }
});
