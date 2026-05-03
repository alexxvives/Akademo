-- Export to: urls.csv
-- External URL links placed in course sections (mod_url)
-- DB prefix: mdl3y_
--
-- These are "link" resources in Moodle — external URLs placed in a section.
-- 141 rows found. Migrate as link-type documents in AKADEMO.
-- NOTE: These do NOT require FTP upload — they are just URLs, no file to transfer.

SELECT
  u.name AS link_title,
  u.externalurl AS url,
  c.fullname AS course_name,
  cs.section AS section_number,
  COALESCE(NULLIF(TRIM(cs.name), ''), CONCAT('Tema ', cs.section)) AS section_name,
  u.intro AS description
FROM mdl3y_url u
JOIN mdl3y_course_modules cm ON cm.instance = u.id
  AND cm.module = (SELECT id FROM mdl3y_modules WHERE name = 'url')
JOIN mdl3y_course c ON c.id = cm.course
JOIN mdl3y_course_sections cs ON cs.id = cm.section
WHERE c.visible = 1
ORDER BY course_name, section_number, link_title;
