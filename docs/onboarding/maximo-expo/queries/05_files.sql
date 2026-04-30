-- Export to: files.csv
-- PDF references for FTP upload to R2 (Step 5 of migration)
-- Replace {PREFIX} with the actual Moodle DB prefix (e.g. mdl3y_)
--
-- Captures BOTH:
--   mod_resource  → single-file resources (most PDFs)
--   mod_folder    → PDFs inside folder modules (previously missed in original migration)

SELECT
  r.name AS file_title,
  c.fullname AS course_name,
  cs.section AS section_number,
  COALESCE(NULLIF(TRIM(cs.name), ''), CONCAT('Tema ', cs.section)) AS section_name,
  f.filename,
  f.filesize,
  CONCAT(LEFT(f.contenthash,2), '/', MID(f.contenthash,3,2), '/', f.contenthash) AS file_path,
  f.timecreated AS file_timestamp
FROM {PREFIX}_files f
JOIN {PREFIX}_context ctx ON ctx.id = f.contextid AND ctx.contextlevel = 70
JOIN {PREFIX}_course_modules cm ON cm.id = ctx.instanceid
JOIN {PREFIX}_course c ON c.id = cm.course
JOIN {PREFIX}_course_sections cs ON cs.id = cm.section
JOIN {PREFIX}_resource r ON cm.instance = r.id AND cm.module = (SELECT id FROM {PREFIX}_modules WHERE name = 'resource')
WHERE f.component = 'mod_resource'
  AND f.filearea = 'content'
  AND f.filename != '.'
  AND f.filesize > 0
  AND c.visible = 1

UNION ALL

SELECT
  f.filename AS file_title,
  c.fullname AS course_name,
  cs.section AS section_number,
  COALESCE(NULLIF(TRIM(cs.name), ''), CONCAT('Tema ', cs.section)) AS section_name,
  f.filename,
  f.filesize,
  CONCAT(LEFT(f.contenthash,2), '/', MID(f.contenthash,3,2), '/', f.contenthash) AS file_path,
  f.timecreated AS file_timestamp
FROM {PREFIX}_files f
JOIN {PREFIX}_context ctx ON ctx.id = f.contextid AND ctx.contextlevel = 70
JOIN {PREFIX}_course_modules cm ON cm.id = ctx.instanceid
JOIN {PREFIX}_course c ON c.id = cm.course
JOIN {PREFIX}_course_sections cs ON cs.id = cm.section
WHERE f.component = 'mod_folder'
  AND f.filearea = 'content'
  AND f.filename != '.'
  AND f.filesize > 0
  AND c.visible = 1

ORDER BY course_name, section_number, file_title;
