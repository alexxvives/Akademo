-- Export to: enrollments.csv
-- Users + course enrolments (students and teachers)
-- DB prefix: mdl3y_

SELECT
  u.email,
  u.firstname AS nombre,
  u.lastname  AS apellido,
  c.fullname  AS asignatura,
  r.shortname AS moodle_rol
FROM mdl3y_user_enrolments ue
JOIN mdl3y_enrol e   ON ue.enrolid   = e.id
JOIN mdl3y_course c  ON e.courseid   = c.id
JOIN mdl3y_context ctx ON ctx.instanceid = c.id AND ctx.contextlevel = 50
JOIN mdl3y_role_assignments ra ON ra.userid = ue.userid AND ra.contextid = ctx.id
JOIN mdl3y_role r  ON r.id  = ra.roleid
JOIN mdl3y_user u  ON u.id  = ue.userid
WHERE u.deleted = 0 AND u.suspended = 0
  AND r.shortname IN ('student','editingteacher')
  AND c.visible = 1
ORDER BY u.email;
