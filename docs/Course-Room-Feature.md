# Course Room Feature

This feature gives each course a room for learning operations:

- Teacher/student course messages
- PDF course materials
- Online meeting links through scheduled course sessions
- Course sessions visible on the student and teacher calendars

## Backend

New course-room endpoints:

```text
GET    /api/v1/courses/:id/room
GET    /api/v1/courses/:id/messages
POST   /api/v1/courses/:id/messages
GET    /api/v1/courses/:id/materials
POST   /api/v1/courses/:id/materials
DELETE /api/v1/courses/:id/materials/:materialId
GET    /api/v1/courses/:id/schedules
```

Visibility:

- Students can open a course room when they have an approved enrollment or active group assignment for that course.
- Teachers can open a course room when they are assigned to a group for that course.
- Admins can open all course rooms.

PDF materials:

- Only `application/pdf` files with `.pdf` names are accepted.
- The current upload contract stores PDF metadata: title, file name, file path or URL, size, and uploader.

Course messages:

- Course-room messages are not private one-to-one messages.
- They are visible inside the course room to authorized course participants.
- New course-room messages create in-app notifications for other course participants.

## Scheduling Courses

Course sessions already use the existing schedule/calendar system.

To schedule a course:

1. Create or choose a group linked to the course.
2. Open the admin Calendar workspace.
3. Create a session for that group.
4. Set teacher, date, start time, end time, and optional meeting URL.
5. The session appears in:
   - `GET /api/v1/calendar`
   - `GET /api/v1/courses/:id/schedules`
   - Mobile student/teacher calendar screens
   - Mobile course room

The meeting link is stored on the schedule as `meetingUrl`.

## Mobile

Students:

- Open the `Courses` tab.
- Tap a course card.
- The course room shows:
  - Course details
  - Upcoming scheduled sessions
  - Meeting links
  - PDF materials
  - Course messages
  - Send message form

Teachers:

- Open the `Groups` tab.
- Tap `Open course room` on a group with a linked course.
- Teachers see the same course room and can post course messages.

## Admin

Course profile:

- New `Room` tab.
- Shows course PDF materials, course messages, and scheduled course sessions.
- Admins can attach a PDF material by providing metadata and a PDF URL/file path.

Calendar:

- Create, edit, cancel, and reschedule session forms now call the real schedule API.
- Backend conflict checks apply for teacher, group, and classroom scheduling.

## Required Database Step

Apply the new backend migration before using the feature:

```bash
cd /Users/devmobile/Desktop/LCMP/LCMP
npx prisma migrate deploy
```

Then restart the backend.
