-- Export to: enrollments.csv
-- Users + course enrolments (students and teachers)
-- Replace {PREFIX} with the actual Moodle DB prefix (e.g. mdl3y_)

SELECT
  u.email,
  u.firstname AS nombre,
  u.lastname  AS apellido,
  c.fullname  AS asignatura,
  r.shortname AS moodle_rol
FROM {PREFIX}_user_enrolments ue
JOIN {PREFIX}_enrol e   ON ue.enrolid   = e.id
JOIN {PREFIX}_course c  ON e.courseid   = c.id
JOIN {PREFIX}_context ctx ON ctx.instanceid = c.id AND ctx.contextlevel = 50
JOIN {PREFIX}_role_assignments ra ON ra.userid = ue.userid AND ra.contextid = ctx.id
JOIN {PREFIX}_role r  ON r.id  = ra.roleid
JOIN {PREFIX}_user u  ON u.id  = ue.userid
WHERE u.deleted = 0 AND u.suspended = 0
  AND r.shortname IN ('student','editingteacher')
  AND c.visible = 1
ORDER BY u.email;
