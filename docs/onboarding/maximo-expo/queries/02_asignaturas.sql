-- Export to: asignaturas.csv
-- Course list with start dates
-- Replace {PREFIX} with the actual Moodle DB prefix (e.g. mdl3y_)

SELECT
  fullname AS nombre,
  FROM_UNIXTIME(startdate, '%d/%m/%Y') AS fechaInicio
FROM {PREFIX}_course
WHERE id > 1
  AND visible = 1
ORDER BY fullname;
