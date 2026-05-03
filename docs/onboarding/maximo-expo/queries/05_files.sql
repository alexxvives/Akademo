-- Export to: files.csv
-- PDF references for FTP upload to R2 (Step 5 of migration)
-- DB prefix: mdl3y_
--
-- Captures BOTH:
--   mod_resource  → single-file resources (most PDFs)
--   mod_folder    → PDFs inside folder modules (previously missed in original migration)

-- Wrapping UNION ALL in a subquery so we can ORDER BY the aliased `visible` column globally.
-- Visible entries sort FIRST (visible DESC): when the same file_path appears in both a hidden
-- section (e.g. section 2) and a visible section (e.g. section 8), the migration's seen-Set
-- dedup keeps the visible (correct) entry and discards the hidden duplicate.
SELECT * FROM (
  SELECT
    r.name AS file_title,
    c.fullname AS course_name,
    cs.section AS section_number,
    COALESCE(NULLIF(TRIM(cs.name), ''), CONCAT('Tema ', cs.section)) AS section_name,
    f.filename,
    f.filesize,
    CONCAT(LEFT(f.contenthash,2), '/', MID(f.contenthash,3,2), '/', f.contenthash) AS file_path,
    f.timecreated AS file_timestamp,
    cm.visible
  FROM mdl3y_files f
  JOIN mdl3y_context ctx ON ctx.id = f.contextid AND ctx.contextlevel = 70
  JOIN mdl3y_course_modules cm ON cm.id = ctx.instanceid
  JOIN mdl3y_course c ON c.id = cm.course
  JOIN mdl3y_course_sections cs ON cs.id = cm.section
  JOIN mdl3y_resource r ON cm.instance = r.id AND cm.module = (SELECT id FROM mdl3y_modules WHERE name = 'resource')
  WHERE f.component = 'mod_resource'
    AND f.filearea = 'content'
    AND f.filename != '.'
    AND f.filesize > 0
    AND c.visible = 1
    AND cm.deletioninprogress = 0

  UNION ALL

  SELECT
    f.filename AS file_title,
    c.fullname AS course_name,
    cs.section AS section_number,
    COALESCE(NULLIF(TRIM(cs.name), ''), CONCAT('Tema ', cs.section)) AS section_name,
    f.filename,
    f.filesize,
    CONCAT(LEFT(f.contenthash,2), '/', MID(f.contenthash,3,2), '/', f.contenthash) AS file_path,
    f.timecreated AS file_timestamp,
    cm.visible
  FROM mdl3y_files f
  JOIN mdl3y_context ctx ON ctx.id = f.contextid AND ctx.contextlevel = 70
  JOIN mdl3y_course_modules cm ON cm.id = ctx.instanceid
  JOIN mdl3y_course c ON c.id = cm.course
  JOIN mdl3y_course_sections cs ON cs.id = cm.section
  WHERE f.component = 'mod_folder'
    AND f.filearea = 'content'
    AND f.filename != '.'
    AND f.filesize > 0
    AND c.visible = 1
    AND cm.deletioninprogress = 0
) AS all_files
ORDER BY course_name, visible DESC, section_number, file_title;
