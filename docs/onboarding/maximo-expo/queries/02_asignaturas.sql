-- Export to: asignaturas.csv
-- Course list with start dates
-- DB prefix: mdl3y_

SELECT
  fullname AS nombre,
  FROM_UNIXTIME(startdate, '%d/%m/%Y') AS fechaInicio
FROM mdl3y_course
WHERE id > 1
  AND visible = 1
ORDER BY fullname;
