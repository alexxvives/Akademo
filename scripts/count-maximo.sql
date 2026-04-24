-- Count all data associated with Maximo Exponente academy
-- Academy ID: 93ab97cf-271b-48de-924b-10fb7eab0a38
SELECT
  (SELECT COUNT(*) FROM Class WHERE academyId='93ab97cf-271b-48de-924b-10fb7eab0a38') AS classes,
  (SELECT COUNT(*) FROM Teacher WHERE academyId='93ab97cf-271b-48de-924b-10fb7eab0a38') AS teachers,
  (SELECT COUNT(*) FROM ClassEnrollment ce JOIN Class c ON ce.classId=c.id WHERE c.academyId='93ab97cf-271b-48de-924b-10fb7eab0a38') AS enrollments,
  (SELECT COUNT(*) FROM Topic t JOIN Class c ON t.classId=c.id WHERE c.academyId='93ab97cf-271b-48de-924b-10fb7eab0a38') AS topics,
  (SELECT COUNT(*) FROM Lesson l JOIN Topic t ON l.topicId=t.id JOIN Class c ON t.classId=c.id WHERE c.academyId='93ab97cf-271b-48de-924b-10fb7eab0a38') AS lessons,
  (SELECT COUNT(*) FROM Document d JOIN Lesson l ON d.lessonId=l.id JOIN Topic t ON l.topicId=t.id JOIN Class c ON t.classId=c.id WHERE c.academyId='93ab97cf-271b-48de-924b-10fb7eab0a38') AS documents,
  (SELECT COUNT(*) FROM Video v JOIN Lesson l ON v.lessonId=l.id JOIN Topic t ON l.topicId=t.id JOIN Class c ON t.classId=c.id WHERE c.academyId='93ab97cf-271b-48de-924b-10fb7eab0a38') AS videos,
  (SELECT COUNT(*) FROM Assignment a JOIN Class c ON a.classId=c.id WHERE c.academyId='93ab97cf-271b-48de-924b-10fb7eab0a38') AS assignments,
  (SELECT COUNT(*) FROM Payment WHERE receiverId='93ab97cf-271b-48de-924b-10fb7eab0a38') AS payments,
  (SELECT COUNT(*) FROM ArchivedVideo WHERE academyId='93ab97cf-271b-48de-924b-10fb7eab0a38') AS archived_videos,
  (SELECT COUNT(*) FROM LiveStream ls JOIN Class c ON ls.classId=c.id WHERE c.academyId='93ab97cf-271b-48de-924b-10fb7eab0a38') AS streams,
  (SELECT COUNT(*) FROM ZoomAccount WHERE academyId='93ab97cf-271b-48de-924b-10fb7eab0a38') AS zoom_accounts,
  (SELECT COUNT(*) FROM CalendarScheduledEvent WHERE academyId='93ab97cf-271b-48de-924b-10fb7eab0a38') AS calendar_events;
