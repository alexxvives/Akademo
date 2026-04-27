INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000241-0000-4000-a000-000000000001',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 1- TEMA 0',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Química para Veterinarios'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 1- TEMA 0' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000242-0000-4000-a000-000000000028',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 1 - TEMA 1',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Química para Veterinarios'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 1 - TEMA 1' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000243-0000-4000-a000-000000000052',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 1 - TEMA 2',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Química para Veterinarios'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 1 - TEMA 2' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000244-0000-4000-a000-000000000067',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 1 - TEMA 3',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Química para Veterinarios'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 1 - TEMA 3' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000245-0000-4000-a000-000000000081',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 2 - TEMA 0',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Química para Veterinarios'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 2 - TEMA 0' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000246-0000-4000-a000-000000000097',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST - EXAMEN FINAL PRUEBA',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Química para Veterinarios'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST - EXAMEN FINAL PRUEBA' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000167-0000-4000-a000-000000000136',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 2º CUATRIMESTRE',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Cría 2º Cuatrimestre'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 2º CUATRIMESTRE' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000145-0000-4000-a000-000000000240',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 2 - Tema 6. Degradación de glúcidos. Glucolisis. Ciclo de Krebs. Fermentaciones.',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica Veterinaria 2º C'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 2 - Tema 6. Degradación de glúcidos. Glucolisis. Ciclo de Krebs. Fermentaciones.' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000146-0000-4000-a000-000000000285',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST Tema 7. Cadena transportadora de electrones. Balance energético',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica Veterinaria 2º C'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST Tema 7. Cadena transportadora de electrones. Balance energético' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000147-0000-4000-a000-000000000304',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST Tema 8. Degradación de lípidos. Oxidación de ácidos grasos. Metabolismo de los cuerpos cetónicos.',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica Veterinaria 2º C'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST Tema 8. Degradación de lípidos. Oxidación de ácidos grasos. Metabolismo de los cuerpos cetónicos.' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000148-0000-4000-a000-000000000356',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 1- Tema 6. Degradación de glúcidos. Glucolisis. Ciclo de Krebs. Fermentaciones.',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica Veterinaria 2º C'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 1- Tema 6. Degradación de glúcidos. Glucolisis. Ciclo de Krebs. Fermentaciones.' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000044-0000-4000-a000-000000000417',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST. TEMA 1 GLUCOLISIS',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica II'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST. TEMA 1 GLUCOLISIS' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000046-0000-4000-a000-000000000501',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST. TEMA 2 GLUCONEOGÉNESIS',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica II'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST. TEMA 2 GLUCONEOGÉNESIS' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000047-0000-4000-a000-000000000547',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST. TEMA 3 - METABOLISMO DEL GLUCÓGENO',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica II'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST. TEMA 3 - METABOLISMO DEL GLUCÓGENO' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000048-0000-4000-a000-000000000576',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST TEMA 5 - DESCAROXILACIÓN OXIDATIVA DEL PIRUVATO Y CICLO DE KREBS',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica II'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST TEMA 5 - DESCAROXILACIÓN OXIDATIVA DEL PIRUVATO Y CICLO DE KREBS' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000053-0000-4000-a000-000000000631',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST TEMA 4. PENTOSAS FOSFATO',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica II'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST TEMA 4. PENTOSAS FOSFATO' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000054-0000-4000-a000-000000000678',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST TEMA 6. SISTEMA DE FOSFORILACIÓN OXIDATIVA',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica II'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST TEMA 6. SISTEMA DE FOSFORILACIÓN OXIDATIVA' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000055-0000-4000-a000-000000000700',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST. TEMA 7 Y 8. CATABOLISMO Y ANABOLISMO DE LÍPIDOS',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica II'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST. TEMA 7 Y 8. CATABOLISMO Y ANABOLISMO DE LÍPIDOS' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000056-0000-4000-a000-000000000777',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST TEMA 9. METABOLISMO DE AMINOÁCIDOS',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica II'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST TEMA 9. METABOLISMO DE AMINOÁCIDOS' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000057-0000-4000-a000-000000000796',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST TEMA 10. METABOLISMO DE NUCLEÓTIDOS',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica II'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST TEMA 10. METABOLISMO DE NUCLEÓTIDOS' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000058-0000-4000-a000-000000000800',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST SEMINARIOS',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica II'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST SEMINARIOS' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000169-0000-4000-a000-000000000848',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'PROBLEMA 2',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica II'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'PROBLEMA 2' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000172-0000-4000-a000-000000000850',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'PROBLEMA 5',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica II'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'PROBLEMA 5' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000174-0000-4000-a000-000000000852',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'PROBLEMA 9',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica II'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'PROBLEMA 9' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000175-0000-4000-a000-000000000854',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'PROBLEMA 8',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica II'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'PROBLEMA 8' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000176-0000-4000-a000-000000000856',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'PROBLEMA 7',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica II'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'PROBLEMA 7' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000177-0000-4000-a000-000000000858',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'PROBLEMA 10',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica II'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'PROBLEMA 10' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000181-0000-4000-a000-000000000860',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'MIX 1',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica II'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'MIX 1' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000012-0000-4000-a000-000000000881',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'test general 1',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica Medicina'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'test general 1' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000013-0000-4000-a000-000000000883',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'test dos preguntas',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica Medicina'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'test dos preguntas' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000014-0000-4000-a000-000000000885',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'test 25',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica Medicina'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'test 25' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000028-0000-4000-a000-000000000890',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 2º CUATRIMESTRE',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Cría'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 2º CUATRIMESTRE' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000051-0000-4000-a000-000000000994',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 1 - CRÍA 1º CUATRIMESTRE',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Cría'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 1 - CRÍA 1º CUATRIMESTRE' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000068-0000-4000-a000-000000001093',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 2 - CRIA 1º CUATRIMESTRE',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Cría'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 2 - CRIA 1º CUATRIMESTRE' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000166-0000-4000-a000-000000001166',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 2º CUATRIMESTRE',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Cría'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 2º CUATRIMESTRE' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000049-0000-4000-a000-000000001270',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST TEMA 1 GLUCIDOS',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica Veterinaria 1ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST TEMA 1 GLUCIDOS' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000050-0000-4000-a000-000000001318',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST TEMA 2 LÍPIDOS',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica Veterinaria 1ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST TEMA 2 LÍPIDOS' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000059-0000-4000-a000-000000001355',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST AMINOÁCIDOS Y PROTEÍNAS',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica Veterinaria 1ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST AMINOÁCIDOS Y PROTEÍNAS' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000112-0000-4000-a000-000000001420',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST ENZIMAS',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica Veterinaria 1ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST ENZIMAS' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000118-0000-4000-a000-000000001458',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST LEYES DE MENDEL',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Genética (Veterinaria)'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST LEYES DE MENDEL' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000119-0000-4000-a000-000000001491',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST MODIFICACIONES DE LAS PROPORCIONES DE LAS LEYES DE MENDEL',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Genética (Veterinaria)'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST MODIFICACIONES DE LAS PROPORCIONES DE LAS LEYES DE MENDEL' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000120-0000-4000-a000-000000001505',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST EFECTOS AMBIENTALES Y EXPRESIÓN GÉNICA',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Genética (Veterinaria)'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST EFECTOS AMBIENTALES Y EXPRESIÓN GÉNICA' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000121-0000-4000-a000-000000001517',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST LIGAMIENTO Y RECOMBINACIÓN',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Genética (Veterinaria)'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST LIGAMIENTO Y RECOMBINACIÓN' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000122-0000-4000-a000-000000001545',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST NATURALEZA DEL MATERIAL HEREDITARIO',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Genética (Veterinaria)'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST NATURALEZA DEL MATERIAL HEREDITARIO' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000123-0000-4000-a000-000000001573',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST ORGANIZACIÓN DEL MATERIAL GENÉTICO',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Genética (Veterinaria)'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST ORGANIZACIÓN DEL MATERIAL GENÉTICO' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000124-0000-4000-a000-000000001599',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST REPLICACIÓN',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Genética (Veterinaria)'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST REPLICACIÓN' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000125-0000-4000-a000-000000001628',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST TRANSCRIPCIÓN',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Genética (Veterinaria)'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST TRANSCRIPCIÓN' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000126-0000-4000-a000-000000001657',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST TRADUCCIÓN',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Genética (Veterinaria)'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST TRADUCCIÓN' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000127-0000-4000-a000-000000001685',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST REGULACIÓN DE LA EXPRESIÓN GÉNICA EN PROCARIOTAS',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Genética (Veterinaria)'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST REGULACIÓN DE LA EXPRESIÓN GÉNICA EN PROCARIOTAS' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000128-0000-4000-a000-000000001692',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST REGULACIÓN DE LA EXPRESIÓN GÉNICA EN EUCARIOTAS',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Genética (Veterinaria)'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST REGULACIÓN DE LA EXPRESIÓN GÉNICA EN EUCARIOTAS' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000129-0000-4000-a000-000000001704',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST GENES Y CÁNCER',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Genética (Veterinaria)'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST GENES Y CÁNCER' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000130-0000-4000-a000-000000001725',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST GENÉTICA EN LA CLÍNICA VETERINARIA',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Genética (Veterinaria)'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST GENÉTICA EN LA CLÍNICA VETERINARIA' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000131-0000-4000-a000-000000001729',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST SEMINARIOS',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Genética (Veterinaria)'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST SEMINARIOS' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000018-0000-4000-a000-000000001753',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'PRUEBA',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'PRUEBA' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000025-0000-4000-a000-000000001755',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'ZZ',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'ZZ' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000026-0000-4000-a000-000000001763',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST PRUEBA',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST PRUEBA' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000027-0000-4000-a000-000000001768',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 1- TEMA 1 MEMBRANA PLASMÁTICA',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 1- TEMA 1 MEMBRANA PLASMÁTICA' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000029-0000-4000-a000-000000001819',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 1 - TRANSPORTE',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 1 - TRANSPORTE' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000030-0000-4000-a000-000000001869',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 1- ADN, NUCLEO Y NUCLEOLO',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 1- ADN, NUCLEO Y NUCLEOLO' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000031-0000-4000-a000-000000001949',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 1 REPLICACIÓN',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 1 REPLICACIÓN' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000032-0000-4000-a000-000000002001',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST TRANSCRIPCION',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST TRANSCRIPCION' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000033-0000-4000-a000-000000002081',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST RIBOSOMA',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST RIBOSOMA' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000034-0000-4000-a000-000000002094',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 1 - TRADUCCIÓN Y CÓDIGO GENÉTICO',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 1 - TRADUCCIÓN Y CÓDIGO GENÉTICO' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000035-0000-4000-a000-000000002159',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 1 - REGULACIÓN DE LA EXPRESIÓN GÉNICA',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 1 - REGULACIÓN DE LA EXPRESIÓN GÉNICA' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000036-0000-4000-a000-000000002193',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 1 - RETÍCULO ENDOPLASMÁTICO Y TRÁFICO VESICULAR',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 1 - RETÍCULO ENDOPLASMÁTICO Y TRÁFICO VESICULAR' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000037-0000-4000-a000-000000002292',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 1 - APARATO DE GOLGI',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 1 - APARATO DE GOLGI' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000038-0000-4000-a000-000000002324',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 1 - LISOSOMA Y PROTEOSOMA',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 1 - LISOSOMA Y PROTEOSOMA' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000039-0000-4000-a000-000000002355',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 1 - MITOCONDRIA Y PEROXISOMA',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 1 - MITOCONDRIA Y PEROXISOMA' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000040-0000-4000-a000-000000002398',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 1- TEMA CITOESQUELETO',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 1- TEMA CITOESQUELETO' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000041-0000-4000-a000-000000002431',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 1 - CICLO CELULAR',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 1 - CICLO CELULAR' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000042-0000-4000-a000-000000002481',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 1 - MATRIZ Y CONEXIONES CELULARES',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 1 - MATRIZ Y CONEXIONES CELULARES' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000043-0000-4000-a000-000000002507',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST EMBRIOLOGÍA',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST EMBRIOLOGÍA' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000060-0000-4000-a000-000000002560',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 2 - TEMA 1. MEMBRANA PLASMÁTICA',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 2 - TEMA 1. MEMBRANA PLASMÁTICA' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000061-0000-4000-a000-000000002610',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 2 - TRANSPORTE',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 2 - TRANSPORTE' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000062-0000-4000-a000-000000002686',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 2- ADN, NUCLEO Y NUCLEOLO',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 2- ADN, NUCLEO Y NUCLEOLO' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000063-0000-4000-a000-000000002779',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 2 REPLICACIÓN',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 2 REPLICACIÓN' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000066-0000-4000-a000-000000002794',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 3 MEMBRANA PLASMÁTICA',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 3 MEMBRANA PLASMÁTICA' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000067-0000-4000-a000-000000002821',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 3. TRANSPORTE',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 3. TRANSPORTE' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000071-0000-4000-a000-000000002872',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 3- ADN, NUCLEO Y NUCLEOLO',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 3- ADN, NUCLEO Y NUCLEOLO' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000093-0000-4000-a000-000000002882',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 2- TEMA CITOESQUELETO',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 2- TEMA CITOESQUELETO' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000094-0000-4000-a000-000000002895',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TETS 2- TEMA RIBOSOMA',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TETS 2- TEMA RIBOSOMA' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000095-0000-4000-a000-000000002900',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 2 - MATRIZ EXTRACELULAR Y CONEXIONES INTRACELULARES',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 2 - MATRIZ EXTRACELULAR Y CONEXIONES INTRACELULARES' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000096-0000-4000-a000-000000002912',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 2- TRADUCCIÓN Y CÓDIGO GENÉTICO',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 2- TRADUCCIÓN Y CÓDIGO GENÉTICO' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000097-0000-4000-a000-000000002935',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 2 - REGULACIÓN DE LA EXPRESIÓN GÉNICA',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 2 - REGULACIÓN DE LA EXPRESIÓN GÉNICA' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000098-0000-4000-a000-000000002982',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 2 - RETÍCULO ENDOPLASMÁTICO',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 2 - RETÍCULO ENDOPLASMÁTICO' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000099-0000-4000-a000-000000003012',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 1 - TRÁFICO VESICULAR',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 1 - TRÁFICO VESICULAR' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000100-0000-4000-a000-000000003050',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 2 - APARATO DE GOLGI',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 2 - APARATO DE GOLGI' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000101-0000-4000-a000-000000003061',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 2 - LISOSOMA Y PROTEOSOMA',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 2 - LISOSOMA Y PROTEOSOMA' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000102-0000-4000-a000-000000003083',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 2 - MITOCONDRIA Y PEROXISOMA',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 2 - MITOCONDRIA Y PEROXISOMA' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000178-0000-4000-a000-000000003108',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'EXAMEN EMBRIOLOGÍA 2023-2024',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'EXAMEN EMBRIOLOGÍA 2023-2024' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000179-0000-4000-a000-000000003118',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'EXAMEN 2023-2024',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'EXAMEN 2023-2024' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000210-0000-4000-a000-000000003167',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'EXAMENES NOVIEMBRE-DICIEMBRE 2024',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'EXAMENES NOVIEMBRE-DICIEMBRE 2024' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000240-0000-4000-a000-000000003206',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'EXAMEN PARCIAL MARZO 2025 - 50% PREGUNTAS EMBRIOLOGIA',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'EXAMEN PARCIAL MARZO 2025 - 50% PREGUNTAS EMBRIOLOGIA' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000254-0000-4000-a000-000000003247',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'EXAMEN BIOLOGIA ODONTO 2º CUATRIMESTRE 2025',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'EXAMEN BIOLOGIA ODONTO 2º CUATRIMESTRE 2025' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000052-0000-4000-a000-000000003283',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'Prueba cuestionario',
  'Un cuestionario de prueba',
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Prueba'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'Prueba cuestionario' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000064-0000-4000-a000-000000003285',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 1- CARDIACO',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Fisiología Veterinaria  2ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 1- CARDIACO' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000065-0000-4000-a000-000000003393',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 1- SISTEMA NERVIOSO Y MUSCULAR',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Fisiología Veterinaria  2ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 1- SISTEMA NERVIOSO Y MUSCULAR' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000069-0000-4000-a000-000000003534',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 2 - CARDIACO',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Fisiología Veterinaria  2ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 2 - CARDIACO' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000070-0000-4000-a000-000000003590',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 2- SISTEMA NERVIOSO Y MUSCULAR',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Fisiología Veterinaria  2ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 2- SISTEMA NERVIOSO Y MUSCULAR' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000113-0000-4000-a000-000000003640',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 1 RENAL',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Fisiología Veterinaria  2ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 1 RENAL' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000114-0000-4000-a000-000000003679',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 2 RENAL',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Fisiología Veterinaria  2ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 2 RENAL' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000115-0000-4000-a000-000000003720',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 1 DIGESTIVO',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Fisiología Veterinaria  2ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 1 DIGESTIVO' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000116-0000-4000-a000-000000003771',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 2 DIGESTIVO',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Fisiología Veterinaria  2ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 2 DIGESTIVO' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000117-0000-4000-a000-000000003821',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 3 RENAL',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Fisiología Veterinaria  2ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 3 RENAL' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000132-0000-4000-a000-000000003872',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 3 DIGESTIVO',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Fisiología Veterinaria  2ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 3 DIGESTIVO' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000133-0000-4000-a000-000000003915',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 1 ENDOCRINO',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Fisiología Veterinaria  2ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 1 ENDOCRINO' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000134-0000-4000-a000-000000003966',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 2 ENDOCRINO',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Fisiología Veterinaria  2ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 2 ENDOCRINO' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000135-0000-4000-a000-000000004017',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 3 ENDOCRINO',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Fisiología Veterinaria  2ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 3 ENDOCRINO' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000136-0000-4000-a000-000000004076',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 4 ENDOCRINO',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Fisiología Veterinaria  2ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 4 ENDOCRINO' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000137-0000-4000-a000-000000004164',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 1 REPRODUCTOR',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Fisiología Veterinaria  2ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 1 REPRODUCTOR' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000138-0000-4000-a000-000000004221',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 2 REPRODUCTOR',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Fisiología Veterinaria  2ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 2 REPRODUCTOR' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000139-0000-4000-a000-000000004270',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 3 REPRODUCTOR',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Fisiología Veterinaria  2ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 3 REPRODUCTOR' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000143-0000-4000-a000-000000004325',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 4 RENAL',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Fisiología Veterinaria  2ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 4 RENAL' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000144-0000-4000-a000-000000004337',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 4 DIGESTIVO',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Fisiología Veterinaria  2ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 4 DIGESTIVO' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000149-0000-4000-a000-000000004348',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 1- CARDIACO',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Fisiología Veterinaria  2ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 1- CARDIACO' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000150-0000-4000-a000-000000004456',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 2 - CARDIACO',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Fisiología Veterinaria  2ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 2 - CARDIACO' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000151-0000-4000-a000-000000004512',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 1- SISTEMA NERVIOSO Y MUSCULAR',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Fisiología Veterinaria  2ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 1- SISTEMA NERVIOSO Y MUSCULAR' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000152-0000-4000-a000-000000004653',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 2- SISTEMA NERVIOSO Y MUSCULAR',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Fisiología Veterinaria  2ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 2- SISTEMA NERVIOSO Y MUSCULAR' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000020-0000-4000-a000-000000004703',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'test de prueba',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Patología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'test de prueba' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000021-0000-4000-a000-000000004705',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'qq',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Patología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'qq' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000022-0000-4000-a000-000000004707',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'rr',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Patología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'rr' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000023-0000-4000-a000-000000004714',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'zz',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Patología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'zz' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000072-0000-4000-a000-000000004718',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST TEMA 1',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica Enfermería'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST TEMA 1' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000074-0000-4000-a000-000000004735',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST TEMA 2 Y 3',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica Enfermería'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST TEMA 2 Y 3' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000083-0000-4000-a000-000000004752',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST TEMA 4 Y 5',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica Enfermería'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST TEMA 4 Y 5' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000084-0000-4000-a000-000000004786',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST TEMA 6 Y 7',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica Enfermería'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST TEMA 6 Y 7' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000085-0000-4000-a000-000000004799',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST TEMA 8 Y 9',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica Enfermería'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST TEMA 8 Y 9' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000104-0000-4000-a000-000000004824',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST TEMA 12. METABOLISMO',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica Enfermería'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST TEMA 12. METABOLISMO' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000105-0000-4000-a000-000000004845',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST TEMA 13. GLUCOLISIS',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica Enfermería'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST TEMA 13. GLUCOLISIS' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000106-0000-4000-a000-000000004880',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST TEMA 14. CICLO DE KREBS',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica Enfermería'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST TEMA 14. CICLO DE KREBS' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000107-0000-4000-a000-000000004899',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST TEMA 15. SISTEMA DE FOSFORILACIÓN OXITATIVA',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica Enfermería'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST TEMA 15. SISTEMA DE FOSFORILACIÓN OXITATIVA' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000108-0000-4000-a000-000000004920',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST TEMA 16- METABOLISMO GLUCÓGENO',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica Enfermería'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST TEMA 16- METABOLISMO GLUCÓGENO' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000109-0000-4000-a000-000000004944',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST TEMA 17 -METABOLISMO DE LÍPIDOS',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica Enfermería'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST TEMA 17 -METABOLISMO DE LÍPIDOS' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000110-0000-4000-a000-000000004959',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST TEMA 18 - BIOSÍNTESIS DE COLESTEROL',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica Enfermería'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST TEMA 18 - BIOSÍNTESIS DE COLESTEROL' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000188-0000-4000-a000-000000004974',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST METABOLISMO',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica Enfermería'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST METABOLISMO' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000189-0000-4000-a000-000000004995',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST GLUCOLISIS',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica Enfermería'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST GLUCOLISIS' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000190-0000-4000-a000-000000005030',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST CICLO DE KREBS',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica Enfermería'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST CICLO DE KREBS' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000191-0000-4000-a000-000000005049',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST SISTEMA DE FOSFORILACIÓN OXITATIVA',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica Enfermería'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST SISTEMA DE FOSFORILACIÓN OXITATIVA' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000192-0000-4000-a000-000000005070',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST METABOLISMO GLUCÓGENO',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica Enfermería'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST METABOLISMO GLUCÓGENO' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000193-0000-4000-a000-000000005094',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST TEMA 5 -METABOLISMO DE LÍPIDOS',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica Enfermería'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST TEMA 5 -METABOLISMO DE LÍPIDOS' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000194-0000-4000-a000-000000005109',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST TEMA 5 - BIOSÍNTESIS DE COLESTEROL',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica Enfermería'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST TEMA 5 - BIOSÍNTESIS DE COLESTEROL' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000195-0000-4000-a000-000000005124',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST TEMA 5 LÍPIDOS',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica Enfermería'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST TEMA 5 LÍPIDOS' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000211-0000-4000-a000-000000005137',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST TEMA AMINOÁCIDOS Y PROTEÍNAS',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica Enfermería'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST TEMA AMINOÁCIDOS Y PROTEÍNAS' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000212-0000-4000-a000-000000005172',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST ANTROPOMETRÍA',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica Enfermería'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST ANTROPOMETRÍA' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000247-0000-4000-a000-000000005189',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'AUTOEVALUACION TEMA 6',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica Enfermería'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'AUTOEVALUACION TEMA 6' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000248-0000-4000-a000-000000005200',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'AUTOEVALUACION TEMA 7',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica Enfermería'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'AUTOEVALUACION TEMA 7' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000249-0000-4000-a000-000000005210',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'AUTOEVALUACION TEMA 8',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica Enfermería'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'AUTOEVALUACION TEMA 8' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000250-0000-4000-a000-000000005221',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'AUTOEVALUACION TEMA 9',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Bioquímica Enfermería'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'AUTOEVALUACION TEMA 9' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000086-0000-4000-a000-000000005232',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 1',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología Enfermería'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 1' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000087-0000-4000-a000-000000005261',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 7',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología Enfermería'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 7' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000088-0000-4000-a000-000000005290',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 6',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología Enfermería'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 6' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000089-0000-4000-a000-000000005320',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 5',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología Enfermería'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 5' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000090-0000-4000-a000-000000005346',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 4',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología Enfermería'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 4' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000091-0000-4000-a000-000000005372',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 3',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología Enfermería'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 3' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000092-0000-4000-a000-000000005399',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 2',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Biología Enfermería'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 2' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000153-0000-4000-a000-000000005426',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 1- CARDIACO',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Fisiología Vet 1ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 1- CARDIACO' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000154-0000-4000-a000-000000005534',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 2 - CARDIACO',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Fisiología Vet 1ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 2 - CARDIACO' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000155-0000-4000-a000-000000005590',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 1- CARDIACO',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Fisiología Vet 1ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 1- CARDIACO' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000156-0000-4000-a000-000000005698',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 2 - CARDIACO',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Fisiología Vet 1ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 2 - CARDIACO' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000157-0000-4000-a000-000000005754',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 1- SISTEMA NERVIOSO Y MUSCULAR',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Fisiología Vet 1ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 1- SISTEMA NERVIOSO Y MUSCULAR' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000158-0000-4000-a000-000000005895',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 2- SISTEMA NERVIOSO Y MUSCULAR',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Fisiología Vet 1ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 2- SISTEMA NERVIOSO Y MUSCULAR' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000159-0000-4000-a000-000000005945',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 1- SISTEMA NERVIOSO Y MUSCULAR',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Fisiología Vet 1ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 1- SISTEMA NERVIOSO Y MUSCULAR' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000160-0000-4000-a000-000000006086',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 2- SISTEMA NERVIOSO Y MUSCULAR',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Fisiología Vet 1ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 2- SISTEMA NERVIOSO Y MUSCULAR' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000161-0000-4000-a000-000000006136',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 1 - RESPIRATORIO',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Fisiología Vet 1ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 1 - RESPIRATORIO' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000162-0000-4000-a000-000000006185',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 2- RESPIRATORIO',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Fisiología Vet 1ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 2- RESPIRATORIO' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000163-0000-4000-a000-000000006235',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 1 - MEDIO INTERNO',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Fisiología Vet 1ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 1 - MEDIO INTERNO' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000164-0000-4000-a000-000000006286',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 2- MEDIO INTERNO',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Fisiología Vet 1ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 2- MEDIO INTERNO' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000165-0000-4000-a000-000000006337',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 3- MEDIO INTERNO',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Fisiología Vet 1ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 3- MEDIO INTERNO' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000252-0000-4000-a000-000000006379',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'EXAMEN 1º PARCIAL 2024-2025',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Fisiología Vet 1ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'EXAMEN 1º PARCIAL 2024-2025' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000253-0000-4000-a000-000000006400',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'EXAMEN 2º PARCIAL 2024-2025',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Fisiología Vet 1ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'EXAMEN 2º PARCIAL 2024-2025' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000196-0000-4000-a000-000000006437',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST - TEMA 1',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Microbiología Odontología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST - TEMA 1' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000197-0000-4000-a000-000000006449',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST - TEMA 2',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Microbiología Odontología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST - TEMA 2' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000198-0000-4000-a000-000000006483',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST - TEMA 3',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Microbiología Odontología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST - TEMA 3' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000199-0000-4000-a000-000000006502',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST - TEMA 4 GENÉTICA BACTERIANA',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Microbiología Odontología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST - TEMA 4 GENÉTICA BACTERIANA' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000200-0000-4000-a000-000000006519',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST - TEMA 7',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Microbiología Odontología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST - TEMA 7' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000202-0000-4000-a000-000000006539',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST - TEMA 5',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Microbiología Odontología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST - TEMA 5' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000203-0000-4000-a000-000000006555',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST - TEMA 8',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Microbiología Odontología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST - TEMA 8' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000204-0000-4000-a000-000000006569',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST - TEMA 9',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Microbiología Odontología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST - TEMA 9' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000205-0000-4000-a000-000000006579',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST - TEMA 10',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Microbiología Odontología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST - TEMA 10' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000206-0000-4000-a000-000000006607',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST TEMA 11 - RESPUESTA INMUNE ADAPTATIVA',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Microbiología Odontología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST TEMA 11 - RESPUESTA INMUNE ADAPTATIVA' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000208-0000-4000-a000-000000006633',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 2 - examen 1º cuatrimestre',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Microbiología Odontología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 2 - examen 1º cuatrimestre' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000209-0000-4000-a000-000000006701',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST - examen 1º cuatrimestre',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Microbiología Odontología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST - examen 1º cuatrimestre' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000213-0000-4000-a000-000000006756',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST STAPHYLOCOCCUS',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Microbiología Odontología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST STAPHYLOCOCCUS' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000214-0000-4000-a000-000000006773',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST STREPTOCOCCUS',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Microbiología Odontología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST STREPTOCOCCUS' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000215-0000-4000-a000-000000006793',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST CORYNEBACTERIUM',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Microbiología Odontología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST CORYNEBACTERIUM' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000216-0000-4000-a000-000000006807',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST NEISSERIA',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Microbiología Odontología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST NEISSERIA' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000217-0000-4000-a000-000000006823',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST ENTEROBACTERIAS',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Microbiología Odontología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST ENTEROBACTERIAS' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000220-0000-4000-a000-000000006850',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST - TEMA 18 - BACTERIAS ANAEROBIAS',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Microbiología Odontología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST - TEMA 18 - BACTERIAS ANAEROBIAS' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000221-0000-4000-a000-000000006868',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST - TEMA 19 - TUBERCULOSIS Y LEPRA',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Microbiología Odontología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST - TEMA 19 - TUBERCULOSIS Y LEPRA' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000222-0000-4000-a000-000000006880',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST TEMA 20 - ESPIROQUETAS',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Microbiología Odontología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST TEMA 20 - ESPIROQUETAS' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000223-0000-4000-a000-000000006892',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST GENERALIDADES DE VIRUS',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Microbiología Odontología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST GENERALIDADES DE VIRUS' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000224-0000-4000-a000-000000006902',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST ORTHOMYXOVIRUS Y PARAMYXOVIRUS',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Microbiología Odontología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST ORTHOMYXOVIRUS Y PARAMYXOVIRUS' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000226-0000-4000-a000-000000006910',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST TEMA 23 Y 24',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Microbiología Odontología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST TEMA 23 Y 24' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000227-0000-4000-a000-000000006925',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST - TEMA 25 - VIH',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Microbiología Odontología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST - TEMA 25 - VIH' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000228-0000-4000-a000-000000006932',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST TEMA 26 - MICOLOGÍA',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Microbiología Odontología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST TEMA 26 - MICOLOGÍA' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000229-0000-4000-a000-000000006942',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST - ANTIMICROBIANOS - ANTIVIRALES - ANTIFÚNGICOS',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Microbiología Odontología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST - ANTIMICROBIANOS - ANTIVIRALES - ANTIFÚNGICOS' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'a000230-0000-4000-a000-000000006955',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST - TEMA 28 - MICROBIOLOGIA ORAL',
  NULL,
  'quiz',
  100,
  '2026-04-17 15:42:45',
  '2026-04-17 15:42:45'
FROM Class c
WHERE c.name = 'Microbiología Odontología'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST - TEMA 28 - MICROBIOLOGIA ORAL' AND a.type = 'quiz')
LIMIT 1;
