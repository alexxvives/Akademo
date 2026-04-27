-- quiz-missing-9.sql
-- Generated: 2026-04-27T17:01:04.595Z
-- Inserts the 9 quizzes that were blocked by NOT EXISTS in quiz-import.sql
-- (same title+course as an existing quiz — renamed with "(2)" suffix)
-- Run once:
--   npx wrangler d1 execute akademo-db --remote --file=docs/onboarding/maximoexponente/quiz-missing-9.sql

-- Quiz: "TEST 2º CUATRIMESTRE" → Course: "Cría" (103 questions) [renamed to add "(2)"]
INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'c000166-0000-4000-b000-000000009001',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 2º CUATRIMESTRE (2)',
  NULL,
  'quiz',
  100,
  '2026-04-27 17:01:04',
  '2026-04-27 17:01:04'
FROM Class c
WHERE c.name = 'Cría'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 2º CUATRIMESTRE (2)' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x0-0000-4000-b000-000000009002',
  'c000166-0000-4000-b000-000000009001',
  '&iquest;Cu&aacute;l de las siguientes t&eacute;cnicas se utiliza para detectar un GEN DESCONOCIDO?',
  0,
  '[{"id":"739","text":"Secuenciaci&oacute;n masiva de alto rendimiento"},{"id":"735","text":"NS/NC"},{"id":"736","text":"PCR"},{"id":"737","text":"RT-PCR"},{"id":"738","text":"SSCP"}]',
  '739',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x1-0000-4000-b000-000000009003',
  'c000166-0000-4000-b000-000000009001',
  'Respecto a la inserci&oacute;n del ADN donante en la t&eacute;cnica de CrispCas9',
  1,
  '[{"id":"743","text":"Se realiza durante recombinaci&oacute;n directa hom&oacute;loga"},{"id":"740","text":"Seria durante la activaci&oacute;n del ARNgu&iacute;a"},{"id":"741","text":"Se pone en marcha junto al complejo tracARN-crARN-Cas9"},{"id":"742","text":"NS/NC"},{"id":"744","text":"Es efectiva en la recombinaci&oacute;n no hom&oacute;loga"}]',
  '743',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x2-0000-4000-b000-000000009004',
  'c000166-0000-4000-b000-000000009001',
  'Si hacemos una evaluaci&oacute;n gen&eacute;tica mediante &iacute;ndices de selecci&oacute;n siguiendo una evaluaci&oacute;n geneal&oacute;gica utilizaremos datos fenot&iacute;picos de',
  2,
  '[{"id":"746","text":"Progenitores del individuo a evaluar"},{"id":"745","text":"NS/NC"},{"id":"747","text":"Hijos/as del individuo a evaluar"},{"id":"748","text":"El individuo a evaluar"},{"id":"749","text":"Progenitores y datos prios del individuo a evaluar"}]',
  '746',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x3-0000-4000-b000-000000009005',
  'c000166-0000-4000-b000-000000009001',
  'En una RT-PCR, la transcriptasa sirve para',
  3,
  '[{"id":"750","text":"Transformar el ARN en ADN"},{"id":"751","text":"Polimerizar el ARN"},{"id":"752","text":"NS/NC"},{"id":"753","text":"Transcribir el ADN"},{"id":"754","text":"Transformar el ADN en ARN"}]',
  '750',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x4-0000-4000-b000-000000009006',
  'c000166-0000-4000-b000-000000009001',
  'Si hacemos una evaluaci&oacute;n gen&eacute;tica mediante &iacute;ndices de selecci&oacute;n siguiendo un Progeny test utilizaremos datos fenot&iacute;picos de',
  4,
  '[{"id":"759","text":"Hijos/as del individuo a evaluar"},{"id":"755","text":"Progenitores y datos prios del individuo a evaluar"},{"id":"756","text":"Progenitores del individuo a evaluar"},{"id":"757","text":"NS/NC"},{"id":"758","text":"El individuo a evaluar"}]',
  '759',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x5-0000-4000-b000-000000009007',
  'c000166-0000-4000-b000-000000009001',
  'En una poblaci&oacute;n de vacuno cuya F media es de 0,25 y cuya frecuencia al&eacute;lica del alelo responsable de BLAD (enfermedad gen&eacute;tica recesiva) es q= 0,05. El numero de animales que muestran BLAD al nacimiento ser&aacute; aproximadamente de',
  5,
  '[{"id":"760","text":"NS/NC"},{"id":"761","text":"31 por cada 10.000 animales"},{"id":"762","text":"25 por cada 10.000 animales"},{"id":"763","text":"62 por cada 10.000 animales"},{"id":"764","text":"5 para cada 100 animales"}]',
  '760',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x6-0000-4000-b000-000000009008',
  'c000166-0000-4000-b000-000000009001',
  'Un banco de germoplasma es',
  6,
  '[{"id":"773","text":"El almacenamiento de material gen&eacute;tico (semen y embriones) de los individuos reproductores de las poblaciones"},{"id":"770","text":"La tenencia de los candidatos a reproductores de inseminaci&oacute;n artificial en un centro de testaje"},{"id":"771","text":"La tenencia de los candidatos a reproductores de inseminaci&oacute;n artificial en un n&uacute;cleo ganadero"},{"id":"772","text":"NS/NC"},{"id":"774","text":"El almacenamiento de material gen&eacute;tico (semen y embriones) del mejor individuo de cada raza"}]',
  '773',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x7-0000-4000-b000-000000009009',
  'c000166-0000-4000-b000-000000009001',
  'En un programa de conservaci&oacute;n de una raza ganadera en extinci&oacute;n la conservaci&oacute;n ex situ in vivo consiste:',
  7,
  '[{"id":"776","text":"La conservaci&oacute;n de animales en centros de referencia, apartados de su medio habitual"},{"id":"775","text":"NS/NC"},{"id":"777","text":"La conservaci&oacute;n de embriones criopreservados"},{"id":"778","text":"La conservaci&oacute;n de animales a nivel de ganader&iacute;as locales"},{"id":"779","text":"La creaci&oacute;n de bancos de germoplasma"}]',
  '776',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x8-0000-4000-b000-000000009010',
  'c000166-0000-4000-b000-000000009001',
  'La suma de todos los valores mejorantes de un car&aacute;cter gen&eacute;tico de una poblaci&oacute;n',
  8,
  '[{"id":"780","text":""},{"id":"781","text":"NS/NC"},{"id":"782","text":"Nunca debe ser cero"},{"id":"783","text":"1 depende del numero de individuos de la poblaci&oacute;n"}]',
  '780',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x9-0000-4000-b000-000000009011',
  'c000166-0000-4000-b000-000000009001',
  'El coeficiente de consanguinidad',
  9,
  '[{"id":"784","text":"Todas son verdaderas"},{"id":"785","text":"Su valor es superior a 1"},{"id":"786","text":"Es el valor obtenido en la diagonal de las matrices de parentesco"},{"id":"787","text":"NS/NC"},{"id":"788","text":"Es un valor intraindividual"}]',
  '784',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x10-0000-4000-b000-000000009012',
  'c000166-0000-4000-b000-000000009001',
  '&iquest;En cu&aacute;l de las siguientes t&eacute;cnicas se utiliza una TRANSCRIPTASA INVERSA (RETROTRANSCRIPTASA)?',
  10,
  '[{"id":"825","text":"RT-PCR"},{"id":"821","text":"NS/NC"},{"id":"822","text":"PC-RFLP"},{"id":"823","text":"PCR anidada"},{"id":"824","text":"PCR en tiempo real"}]',
  '825',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x11-0000-4000-b000-000000009013',
  'c000166-0000-4000-b000-000000009001',
  'En la valoraci&oacute;n gen&eacute;tica BLUP en el car&aacute;cter del peso en Kg, el individuo 1 tiene un valor mejorante de 0,1, el individuo 2 tiene un valor mejorante de -0,1. &iquest;C&oacute;mo se comportan los descendientes del individuo 1 con respecto a los descendientes del individuo 2?',
  11,
  '[{"id":"879","text":"Los descendientes del 1 pesar&aacute;n 0,1 kg m&aacute;s que los descendientes del 2"},{"id":"877","text":"Los descendientes del 2 pesar&aacute;n 0,1 kg m&aacute;s que los descendientes del 1"},{"id":"878","text":"NS/NC"},{"id":"880","text":"Los descendientes del 1 pesar&aacute;n 0,2 kg m&aacute;s que los descendientes del 2"},{"id":"881","text":"Los descendientes del 2 pesar&aacute;n 0,1 kg menos que los descendientes del 1"}]',
  '879',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x12-0000-4000-b000-000000009014',
  'c000166-0000-4000-b000-000000009001',
  'Se&ntilde;alar que factor NO se tiene en cuenta en la selecci&oacute;n de la raza Asturiana de los Valles',
  12,
  '[{"id":"890","text":"La inserci&oacute;n de 25 pares de bases en el cromosoma X"},{"id":"887","text":"La deleci&oacute;n de 11 pares de bases en el gen de la miostatina"},{"id":"888","text":"La ausencia de la translocaci&oacute;n 1/29"},{"id":"889","text":"La creaci&oacute;n de un banco de ADN"},{"id":"891","text":"NS/NC"}]',
  '890',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x13-0000-4000-b000-000000009015',
  'c000166-0000-4000-b000-000000009001',
  'La heterosis suele conllevar una mejora en:',
  13,
  '[{"id":"899","text":"Todos ellos"},{"id":"897","text":"NS/NC"},{"id":"898","text":"Par&aacute;metros reproductivos"},{"id":"900","text":"Par&aacute;metros productivos"},{"id":"901","text":"Par&aacute;metros de viabilidad"}]',
  '899',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x14-0000-4000-b000-000000009016',
  'c000166-0000-4000-b000-000000009001',
  'Cuando la heredabilidad de un car&aacute;cter gen&eacute;tico es 0,5, el valor de alpha es:',
  14,
  '[{"id":"902","text":"1"},{"id":"903","text":"4"},{"id":"904","text":"2"},{"id":"905","text":"3"},{"id":"906","text":"NS/NC"}]',
  '902',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x15-0000-4000-b000-000000009017',
  'c000166-0000-4000-b000-000000009001',
  'El BLUP al ser un modelo animal',
  15,
  '[{"id":"910","text":"Proporciona un valor mejorante para todos los individuos de la poblaci&oacute;n en estudio"},{"id":"907","text":"Proporciona un valor mejorante exclusivamente para los individuos con ascendencia conocida"},{"id":"908","text":"NS/NC"},{"id":"909","text":"Ninguna es cierta"},{"id":"911","text":"Facilita los valores fijos de todos los individuos"}]',
  '910',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x16-0000-4000-b000-000000009018',
  'c000166-0000-4000-b000-000000009001',
  'En la tecnolog&iacute;a de Crisp Casp 9',
  16,
  '[{"id":"912","text":"Se fuerza el sistema de reparaci&oacute;n del ADN"},{"id":"913","text":"Se revierten mutaciones mediante el cambio del pH"},{"id":"914","text":"NS/NC"},{"id":"915","text":"Se produce una mutaci&oacute;n mediante la lisis celular"},{"id":"916","text":"Se inhibe el sistema de recombinaci&oacute;n hom&oacute;logo"}]',
  '912',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x17-0000-4000-b000-000000009019',
  'c000166-0000-4000-b000-000000009001',
  'Respecto a la metodolog&iacute;a de edici&oacute;n gen&eacute;tica, se&ntilde;ala la respuesta correcta:',
  17,
  '[{"id":"921","text":"Por recombinaci&oacute;n hom&oacute;loga se inserta el ADN donante"},{"id":"917","text":"El ARN guia lleva unido el ADN donante"},{"id":"918","text":"NS/NC"},{"id":"919","text":"El espaciador inserta el ADN donante"},{"id":"920","text":"Por interespaciador lleva insertado el ADN donante"}]',
  '921',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x18-0000-4000-b000-000000009020',
  'c000166-0000-4000-b000-000000009001',
  'Con respecto a la PCR cuantitativa',
  18,
  '[{"id":"928","text":"Todas son verdaderas"},{"id":"929","text":"Tambi&eacute;n se denomina PCR a tiempo real"},{"id":"930","text":"Es necesario fluorescencia para cuantificar"},{"id":"931","text":"NS/NC"},{"id":"932","text":"Se utiliza para expresi&oacute;n g&eacute;nica"}]',
  '928',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x19-0000-4000-b000-000000009021',
  'c000166-0000-4000-b000-000000009001',
  'Se&ntilde;ala la afirmaci&oacute;n correcta, las relaciones geneal&oacute;gicas en una poblaci&oacute;n se establecen a trav&eacute;s de',
  19,
  '[{"id":"937","text":"Un control de filiaci&oacute;n"},{"id":"933","text":"NS/NC"},{"id":"934","text":"El registro de los datos fenot&iacute;picos"},{"id":"935","text":"Evaluaci&oacute;n del parecido morfol&oacute;gico"},{"id":"936","text":"Un control de rendimientos"}]',
  '937',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x20-0000-4000-b000-000000009022',
  'c000166-0000-4000-b000-000000009001',
  'Respecto a la t&eacute;cnica Crisp-Cas 9 es/son:',
  20,
  '[{"id":"941","text":"Son unas tijeras moleculares capaces de cortar ADN de forma espec&iacute;fica para permitir la inserci&oacute;n de ADN externo"},{"id":"938","text":"NS/NC"},{"id":"939","text":"Es una replicaci&oacute;n in vitro"},{"id":"940","text":"Su herramienta de transporte es el virus"},{"id":"942","text":"Es una mutag&eacute;nesis dirigida hacia un fago invasor"}]',
  '941',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x21-0000-4000-b000-000000009023',
  'c000166-0000-4000-b000-000000009001',
  'Para la localizaci&oacute;n de la translocaci&oacute;n robersionana 1/29 de ganado vacuno se utiliza la t&eacute;cnica de,',
  21,
  '[{"id":"944","text":"Cariotipo"},{"id":"943","text":"FISH"},{"id":"945","text":"NS/NC"},{"id":"946","text":"RT-PCR"},{"id":"947","text":"PCR"}]',
  '944',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x22-0000-4000-b000-000000009024',
  'c000166-0000-4000-b000-000000009001',
  'Un valor F4= 0,5 y a14= 0,3',
  22,
  '[{"id":"950","text":"Incida que el individuo 4 es consangu&iacute;neo adem&aacute;s de pariente del individuo 1"},{"id":"948","text":"Es un valor err&oacute;neo"},{"id":"949","text":"Los individuos 1 y 4 son consangu&iacute;neos"},{"id":"951","text":"NS/NC"},{"id":"952","text":"El coeficiente de parentesco del individuo 4 es 0,5"}]',
  '950',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x23-0000-4000-b000-000000009025',
  'c000166-0000-4000-b000-000000009001',
  'Se&ntilde;ala la afirmaci&oacute;n correcta: la evaluaci&oacute;n gen&eacute;tica gen&oacute;mica',
  23,
  '[{"id":"954","text":"Consiste en utilizar informaci&oacute;n molecular para la predicci&oacute;n del merito gen&eacute;tico complementando los datos fenot&iacute;picos y geneal&oacute;gicos"},{"id":"953","text":"Consiste en analizar un gen concreto relacionado con el car&aacute;cter evaluado"},{"id":"955","text":"No necesita de estudio previo del genoma en la poblaci&oacute;n"},{"id":"956","text":"NS/NC"},{"id":"957","text":"Se ha de hacer en todos los posibles candidatos a reproductores de la poblaci&oacute;n para que sea eficiente"}]',
  '954',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x24-0000-4000-b000-000000009026',
  'c000166-0000-4000-b000-000000009001',
  'Con respecto a la mutaci&oacute;n nt821del11 en el gen de miostatina en la raza Asturiana de los Valles',
  24,
  '[{"id":"960","text":"La mutaci&oacute;n se expresa en los individuos"},{"id":"958","text":"Los individuos que expresan dicha mutaci&oacute;n no se cruzan"},{"id":"959","text":"NS/NC"},{"id":"961","text":"No se estudia dicha mutaci&oacute;n en esta raza"},{"id":"962","text":"Se hace selecci&oacute;n gen&eacute;tica para evitar dicha mutaci&oacute;n"}]',
  '960',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x25-0000-4000-b000-000000009027',
  'c000166-0000-4000-b000-000000009001',
  'Un valor F1= 1,75 y a12= 0,3',
  25,
  '[{"id":"965","text":"Indica que el individuo 1 es consangu&iacute;neo adem&aacute;s de pariente del individuo 2"},{"id":"963","text":"Los individuos 1 y 2 son consangu&iacute;neos"},{"id":"964","text":"NS/NC"},{"id":"966","text":"El coeficiente de consanguinidad el individuo 1 es 1,75"},{"id":"967","text":"Es un valor err&oacute;neo"}]',
  '965',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x26-0000-4000-b000-000000009028',
  'c000166-0000-4000-b000-000000009001',
  'Respecto al coeficiente de parentesco',
  26,
  '[{"id":"972","text":"Es un valor entre dos individuos"},{"id":"968","text":"Corresponde a los valores de fuera de la diagonal en la matriz de parentesco"},{"id":"969","text":"NS/NC"},{"id":"970","text":"Todas son correctas"},{"id":"971","text":"Su valor nunca es mayor de 1"}]',
  '972',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x27-0000-4000-b000-000000009029',
  'c000166-0000-4000-b000-000000009001',
  'Las subpoblaciones que difieren entre si ligeramente por haber tenido un aislamiento reproductivo y/o por haber sido seleccionados para distintos objetivos se conocen como:',
  27,
  '[{"id":"973","text":"Estirpe"},{"id":"974","text":"Raza"},{"id":"975","text":"Especie"},{"id":"976","text":"Familia"},{"id":"977","text":"NS/NC"}]',
  '973',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x28-0000-4000-b000-000000009030',
  'c000166-0000-4000-b000-000000009001',
  'En la evaluaci&oacute;n gen&eacute;tica del &iacute;ndice materno en el programa de mejora de la raza porcina ib&eacute;rica',
  28,
  '[{"id":"980","text":"Toda son ciertas"},{"id":"978","text":"El efecto fijo es el tipo de verraco"},{"id":"979","text":"El vector de observaci&oacute;n siempre es el n&uacute;mero de individuos nacidos vivos"},{"id":"981","text":"El efecto aleatorio siempre es el tama&ntilde;o de la camada"},{"id":"982","text":"NS/NC"}]',
  '980',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x29-0000-4000-b000-000000009031',
  'c000166-0000-4000-b000-000000009001',
  '&iquest;Cu&aacute;l es el coeficiente de consanguinidad del individuo 3, si el valor a33 es 1?',
  29,
  '[{"id":"983","text":""},{"id":"984","text":"75"},{"id":"985","text":"1"},{"id":"986","text":"NS/NC"},{"id":"987","text":"175"}]',
  '983',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x30-0000-4000-b000-000000009032',
  'c000166-0000-4000-b000-000000009001',
  'La desviaci&oacute;n de dominancia va a producir un mayor efecto en la depresi&oacute;n consangu&iacute;nea cuando hablamos de',
  30,
  '[{"id":"991","text":"Dominancia incompleta"},{"id":"988","text":"Codominancia"},{"id":"989","text":"NS/NC"},{"id":"990","text":"Dominancia completa"},{"id":"992","text":"Dominancia intermedia"}]',
  '991',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x31-0000-4000-b000-000000009033',
  'c000166-0000-4000-b000-000000009001',
  'El aislamiento estacional entre dos especies se produce cuando',
  31,
  '[{"id":"993","text":"La etapa reproductiva tiene lugar en distinto momento del a&ntilde;o"},{"id":"994","text":"NS/NC"},{"id":"995","text":"El ritual o se&ntilde;ales de cortejo son diferentes"},{"id":"996","text":"No coinciden en el mismo h&aacute;bitat"},{"id":"997","text":"Producen descendencia no f&eacute;rtil"}]',
  '993',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x32-0000-4000-b000-000000009034',
  'c000166-0000-4000-b000-000000009001',
  'Con respecto a la deleci&oacute;n de 11 pares de bases en el gen de la miostatina, en la raza bovina Asturiana de los Valles',
  32,
  '[{"id":"1001","text":"Su presencia asegura una hipertrofia muscular que aumenta el rendimiento c&aacute;rnico del individuo"},{"id":"998","text":"NS/NC"},{"id":"999","text":"Su presencia en los machos asegura la no presencia de la translocaci&oacute;n 1/29 en su descendencia"},{"id":"1000","text":"Los animales generan una patolog&iacute;a muscular que baja el rendimiento c&aacute;rnico del ejemplar"},{"id":"1002","text":"Su presencia en las hembras garantiza la no presencia de la translocaci&oacute;n 1/29"}]',
  '1001',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x33-0000-4000-b000-000000009035',
  'c000166-0000-4000-b000-000000009001',
  'Se&ntilde;ala la respuesta INCORRECTA, con respecto a las mejoras para maximizar el potencial de producci&oacute;n de carne en la raza bovina Asturiana de los valles',
  33,
  '[{"id":"1003","text":"Mejorar la capacidad lechera"},{"id":"1004","text":"Mejorar el formato carnicero"},{"id":"1005","text":"NS/NC"},{"id":"1006","text":"Mejorar el crecimiento de los terneros"},{"id":"1007","text":"Mejorar las caracter&iacute;sticas de la canal"}]',
  '1003',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x34-0000-4000-b000-000000009036',
  'c000166-0000-4000-b000-000000009001',
  'Una alta consanguinidad en una poblaci&oacute;n viene determinada por la utilizaci&oacute;n de',
  34,
  '[{"id":"1011","text":"Cruzamiento entre animales emparentados"},{"id":"1008","text":"Cruzamiento al azar"},{"id":"1009","text":"Cruzamiento de algunos animales seleccionados"},{"id":"1010","text":"NS/NC"},{"id":"1012","text":"Los mejores animales de la poblaci&oacute;n como reproductores"}]',
  '1011',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x35-0000-4000-b000-000000009037',
  'c000166-0000-4000-b000-000000009001',
  'Con respecto a la Taq polimerasa, identifica la respuesta correcta:',
  35,
  '[{"id":"1017","text":"Todas son correctas"},{"id":"1015","text":"Es termoestable"},{"id":"1016","text":"Su temperatura optima es de 72ºC"},{"id":"1018","text":"NS/NC"},{"id":"1019","text":"Es fundamental para la polimerización de las nuevas cadenas"}]',
  '1017',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x36-0000-4000-b000-000000009038',
  'c000166-0000-4000-b000-000000009001',
  '¿Cuál de ellos es certamen ganadero?',
  36,
  '[{"id":"1022","text":"Todos ellos"},{"id":"1020","text":"Concurso de raza"},{"id":"1021","text":"NS/NC"},{"id":"1023","text":"Exposición de raza"},{"id":"1024","text":"Subasta de raza"}]',
  '1022',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x37-0000-4000-b000-000000009039',
  'c000166-0000-4000-b000-000000009001',
  'Con la técnica de CrispCas9 se puede:',
  37,
  '[{"id":"1029","text":"Todas son ciertas"},{"id":"1025","text":"Activar genes específicos"},{"id":"1026","text":"NS/NC"},{"id":"1027","text":"Desactivar genes objetivos"},{"id":"1028","text":"Corregir mutaciones dañinas"}]',
  '1029',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x38-0000-4000-b000-000000009040',
  'c000166-0000-4000-b000-000000009001',
  '¿Cuál de estas combinaciones es correcta?',
  38,
  '[{"id":"1032","text":"Cariotipo – Aneuploidia"},{"id":"1030","text":"Secuenciación masiva de alto rendimiento – Mutaciones genómicas"},{"id":"1031","text":"NS/NC"},{"id":"1033","text":"Pirosecuenciación – Mutaciones génicas"},{"id":"1034","text":"Técnicas de bandeo convencional – FISH"}]',
  '1032',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x39-0000-4000-b000-000000009041',
  'c000166-0000-4000-b000-000000009001',
  'En una PCR multiplex que se utilizan 3 pares de cebadores diferentes, cuantos amplicones habrá',
  39,
  '[{"id":"1035","text":"3"},{"id":"1036","text":"1"},{"id":"1037","text":"0"},{"id":"1038","text":"NS/NC"},{"id":"1039","text":"2"}]',
  '1035',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x40-0000-4000-b000-000000009042',
  'c000166-0000-4000-b000-000000009001',
  'Los centros de testaje sirven para:',
  40,
  '[{"id":"1041","text":"Criar los candidatos a reproductor en las mismas condiciones y pasar a ser machos en prueba"},{"id":"1040","text":"Hacer pruebas de filiación"},{"id":"1042","text":"Hacer los concursos de la raza"},{"id":"1043","text":"Generar embriones"},{"id":"1044","text":"NS/NC"}]',
  '1041',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x41-0000-4000-b000-000000009043',
  'c000166-0000-4000-b000-000000009001',
  'Con respecto a la RT-PCR señala la ocpión FALSA',
  41,
  '[{"id":"1046","text":"Se utilizan para estudiar mutaciones en zonas intrónicas"},{"id":"1045","text":"Se utiliza la transcriptasa inversa"},{"id":"1047","text":"Es fundamental para cuantificar el ADN de una célula"},{"id":"1048","text":"NS/NC"},{"id":"1049","text":"El material de partida es el ARN"}]',
  '1046',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x42-0000-4000-b000-000000009044',
  'c000166-0000-4000-b000-000000009001',
  '¿En cuál de las siguientes técnicas NO se utiliza marcaje fluorescente?',
  42,
  '[{"id":"1051","text":"PCR-RFLP"},{"id":"1050","text":"Micromatrices de ADN (microarrays)"},{"id":"1052","text":"Secuenciación masiva de alto rendimiento en plataforma illumina"},{"id":"1053","text":"FISH"},{"id":"1054","text":"NS/NC"}]',
  '1051',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x43-0000-4000-b000-000000009045',
  'c000166-0000-4000-b000-000000009001',
  'En el libro genealógico de una raza bovina de carne, los terneros destinados a cebo cuyos padres están inscritos se deben registrar en:',
  43,
  '[{"id":"1059","text":"Registro de Nacimientos"},{"id":"1055","text":"Registro Definitivo"},{"id":"1056","text":"NS/NC"},{"id":"1057","text":"Registro Auxiliar"},{"id":"1058","text":"Registro de Méritos"}]',
  '1059',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x44-0000-4000-b000-000000009046',
  'c000166-0000-4000-b000-000000009001',
  'El “año-época de parto” dentro del Programa de Mejora de Asturiana de los Valles es',
  44,
  '[{"id":"1064","text":"Un efecto fijo del modelo"},{"id":"1060","text":"NS/NC"},{"id":"1061","text":"Un criterio de selección"},{"id":"1062","text":"Un efecto aleatorio del modelo"},{"id":"1063","text":"Un objetivo de selección"}]',
  '1064',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x45-0000-4000-b000-000000009047',
  'c000166-0000-4000-b000-000000009001',
  'En una población de vacuno cuya F media es de 0,125 y cuya frecuencia alélica del alelo responsable de BLAD (enfermedad genética recesiva) número de animales que muestran BLAD al nacimiento será aproximadamente de:',
  45,
  '[{"id":"1068","text":"NS/NC"},{"id":"1065","text":"13 por cada 10.000 animales"},{"id":"1066","text":"1 por cada 100 animales"},{"id":"1067","text":"1 por cada de 10.000 animales"},{"id":"1069","text":"26 por cada 10.000 animales"}]',
  '1068',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x46-0000-4000-b000-000000009048',
  'c000166-0000-4000-b000-000000009001',
  '¿Cuál es el coeficiente de parentesco de los individuos 4 y 5? Si a44= 1,25, a55= 1, a45= 0,5',
  46,
  '[{"id":"1074","text":"0,5"},{"id":"1070","text":"NS/NC"},{"id":"1071","text":"1"},{"id":"1072","text":"1,25"},{"id":"1073","text":"0"}]',
  '1074',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x47-0000-4000-b000-000000009049',
  'c000166-0000-4000-b000-000000009001',
  '¿Cuál de los siguientes tipos de mutaciones NO se relaciona típicamente con la inestabilidad genética?',
  47,
  '[{"id":"1079","text":"Génicas"},{"id":"1075","text":"Genómicas"},{"id":"1076","text":"Ninguna de los anteriores"},{"id":"1077","text":"Cromosómicas"},{"id":"1078","text":"NS/NC"}]',
  '1079',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x48-0000-4000-b000-000000009050',
  'c000166-0000-4000-b000-000000009001',
  'En la matriz de coeficiente del modelo BLUP',
  48,
  '[{"id":"1082","text":"Sus elementos con cuatro submatrices"},{"id":"1080","text":"NS/NC"},{"id":"1081","text":"La diagonal de las distintas matrices siempre es la misma"},{"id":"1083","text":"Para su calculo tendremos en cuenta los valores mejorantes"},{"id":"1084","text":"Sus elementos son los valores mejorante"}]',
  '1082',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x49-0000-4000-b000-000000009051',
  'c000166-0000-4000-b000-000000009001',
  'En la valoración del programa de mejora genética de la raza bovina Asturiana de los Valles, en el modelo matemático que se ajusta (y=Xb + Zu + Pp + e), la Xb es:',
  49,
  '[{"id":"1088","text":"Una matriz de incidencia de un efecto aleatorio debido al componente genético aditivo"},{"id":"1085","text":"NS/NC"},{"id":"1086","text":"Es un vector de incidencia"},{"id":"1087","text":"Una matriz de incidencia de un efecto fijo"},{"id":"1089","text":"Un efecto aleatorio residual"}]',
  '1088',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x50-0000-4000-b000-000000009052',
  'c000166-0000-4000-b000-000000009001',
  'En un amplificado de 500 pb, con una secuencia diana en una enzima de restricción den la posición 150 pb, los posibles resultados electroforéticos son:',
  50,
  '[{"id":"1094","text":"Todas posibles"},{"id":"1090","text":"500 pb"},{"id":"1091","text":"NS/NC"},{"id":"1092","text":"500 pb, 350 pb y 150 pb"},{"id":"1093","text":"350 pb y 150 pb"}]',
  '1094',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x51-0000-4000-b000-000000009053',
  'c000166-0000-4000-b000-000000009001',
  'La depresión consanguínea se refiera a',
  51,
  '[{"id":"1099","text":"El descenso de la media productiva/reproductiva de una población por efecto de una alta consanguinidad media"},{"id":"1095","text":"El nivel de consanguinidad medio de una población"},{"id":"1096","text":"NS/NC"},{"id":"1097","text":"La aparición de una mayor frecuencia de enfermedades genéticas recesivas"},{"id":"1098","text":"El nivel de consanguinidad de un individuo"}]',
  '1099',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x52-0000-4000-b000-000000009054',
  'c000166-0000-4000-b000-000000009001',
  'En el programa de mejora genética de la raza porcina ibérica, uno de sus objetivos es la conservación de,',
  52,
  '[{"id":"1101","text":"Torviscal, lampiño y manchego jabugo"},{"id":"1100","text":"Entrepelado, torviscal y retinto"},{"id":"1102","text":"NS/NC"},{"id":"1103","text":"Manchego, retinto y lampiño"},{"id":"1104","text":"Manchego jabugo, lampiño y negro"}]',
  '1101',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x53-0000-4000-b000-000000009055',
  'c000166-0000-4000-b000-000000009001',
  'Las unidades del valor mejorante,',
  53,
  '[{"id":"1106","text":"Son las unidades del carácter genético en estudio"},{"id":"1105","text":"Son las unidades en el sistema métrico internacional"},{"id":"1107","text":"NS/NC"},{"id":"1108","text":"Siempre son Kg"},{"id":"1109","text":"Son las unidades del efecto fijo"}]',
  '1106',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x54-0000-4000-b000-000000009056',
  'c000166-0000-4000-b000-000000009001',
  'La utilización de los índices de selección como método de evaluación genética sería correcto en el caso de. Seleccione una:',
  54,
  '[{"id":"24631","text":"granjas de producci&oacute;n de carne av&iacute;cola"},{"id":"24630","text":"No sabe/No contesta"},{"id":"24632","text":"granjas de selecci&oacute;n de porcino blanco"},{"id":"24633","text":"la poblaci&oacute;n de cerdo ib&eacute;rico explotado en dehesa"},{"id":"24634","text":"una poblaci&oacute;n de una raza aut&oacute;ctona de bovino de carne"}]',
  '24631',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x55-0000-4000-b000-000000009057',
  'c000166-0000-4000-b000-000000009001',
  'Respecto al coeficiente de parentesco, Seleccione una:',
  55,
  '[{"id":"24636","text":"Es la probabilidad de que dos individuos tengan alelos id&eacute;nticos por ascendencia"},{"id":"24635","text":"Corresponde al coeficiente de consanguinidad"},{"id":"24637","text":"Es la probabilidad de que un individuo tenga los dos alelos id&eacute;nticos por ascendencia"},{"id":"24638","text":"No sabe/No contesta"},{"id":"24639","text":"Es un valor intraindividual"}]',
  '24636',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x56-0000-4000-b000-000000009058',
  'c000166-0000-4000-b000-000000009001',
  'En una matriz de parentesco la obtención de un valor de a12=0,5 indica que existe un 50% de probabilidad de que Seleccione una:',
  56,
  '[{"id":"24641","text":"Los alelos iguales de los dos individuos sean id&eacute;nticos por ascendencia"},{"id":"24640","text":"Los alelos de sus descendencias sean 25% diferentes"},{"id":"24642","text":"Los alelos del individuo 1 y 2 sean id&eacute;nticos."},{"id":"24643","text":"Los alelos del individuo 1 sean id&eacute;nticos por ascendencia"},{"id":"24644","text":"No sabe/No contesta"}]',
  '24641',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x57-0000-4000-b000-000000009059',
  'c000166-0000-4000-b000-000000009001',
  'En el método de selección por niveles independientes. Seleccione una:',
  57,
  '[{"id":"24647","text":"Todas son correctas"},{"id":"24645","text":"Se pueden eliminar individuos que no alcancen el m&iacute;nimo prefijado"},{"id":"24646","text":"Se miden todos los caracteres en cada generaci&oacute;n, pero no de todos los individuos"},{"id":"24648","text":"Se seleccionan individuos con niveles m&iacute;nimos prefijados para varios caracteres"},{"id":"24649","text":"No sabe/No contesta"}]',
  '24647',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x58-0000-4000-b000-000000009060',
  'c000166-0000-4000-b000-000000009001',
  'Si hacemos una evaluación genética mediante índices de selección siguiendo un progeny test utilizaremos datos fenotípicos de:',
  58,
  '[{"id":"24654","text":"hijos/as del individuo a evaluar"},{"id":"24650","text":"progenitores del individuo a evaluar"},{"id":"24651","text":"No sabe/No contesta"},{"id":"24652","text":"progenitores y datos propios del individuo a evaluar"},{"id":"24653","text":"el individuo a evaluar"}]',
  '24654',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x59-0000-4000-b000-000000009061',
  'c000166-0000-4000-b000-000000009001',
  'El coeficiente de consanguinidad. Seleccione una:',
  59,
  '[{"id":"24659","text":"Es un valor intraindividual"},{"id":"24655","text":"Es el valor obtenido en la diagonal de las matrices de parentesco"},{"id":"24656","text":"Su valor es superior a 1"},{"id":"24657","text":"No sabe/No contesta"},{"id":"24658","text":"Todas son verdaderas"}]',
  '24659',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x60-0000-4000-b000-000000009062',
  'c000166-0000-4000-b000-000000009001',
  'En el análisis del índice de selección global Seleccione una:',
  60,
  '[{"id":"24664","text":"Ninguna es correcta"},{"id":"24660","text":"No se tiene en cuenta la heredabilidad"},{"id":"24661","text":"No sabe/No contesta"},{"id":"24662","text":"No se considera el valor econ&oacute;mico"},{"id":"24663","text":"No se tiene en cuenta las asociaciones gen&eacute;ticas entre los caracteres"}]',
  '24664',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x61-0000-4000-b000-000000009063',
  'c000166-0000-4000-b000-000000009001',
  'En una valoración BLUP donde se obtienen 10 valores mejorantes, Seleccione una:',
  61,
  '[{"id":"24668","text":"La poblaci&oacute;n en estudio son 10 individuos"},{"id":"24665","text":"Los 10 valores mejorantes correspondes al estudio de un car&aacute;cter monog&eacute;nico"},{"id":"24666","text":"Los valores fijos son 10"},{"id":"24667","text":"Diez son los animales de los que tenemos la ascendencia."},{"id":"24669","text":"No sabe/No contesta"}]',
  '24668',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x62-0000-4000-b000-000000009064',
  'c000166-0000-4000-b000-000000009001',
  'La evaluación genética asistida por genes/marcadores consiste en elegir reproductores en función de:',
  62,
  '[{"id":"24673","text":"su genotipo para los genes de inter&eacute;s conocidos complementando a los datos fenot&iacute;picos y geneal&oacute;gicos"},{"id":"24670","text":"No sabe/No contesta"},{"id":"24671","text":"su genotipo para un gen de inter&eacute;s exclusivamente"},{"id":"24672","text":"su genotipo para un gen de inter&eacute;s para cada car&aacute;cter que estemos evaluando"},{"id":"24674","text":"su genotipo para varios genes de inter&eacute;s exclusivamente"}]',
  '24673',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x63-0000-4000-b000-000000009065',
  'c000166-0000-4000-b000-000000009001',
  'El BLUP es un modelo animal que:',
  63,
  '[{"id":"24677","text":"Proporciona un valor mejorante para todos los individuos de la poblaci&oacute;n en estudio"},{"id":"24675","text":"No sabe/No contesta"},{"id":"24676","text":"Proporciona un valor mejorante exclusivamente para los individuos con ascendencia conocida"},{"id":"24678","text":"Proporciona los &iacute;ndices de selecci&oacute;n de cada individuo"},{"id":"24679","text":"Facilita los valores fijos de todos los individuos"}]',
  '24677',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x64-0000-4000-b000-000000009066',
  'c000166-0000-4000-b000-000000009001',
  'Cuando la heredabilidad de un carácter genético es 0,8, el valor de alfa en la diagonal de la matriz de parentesco es,',
  64,
  '[{"id":"24684","text":"25"},{"id":"24680","text":"No sabe/No contesta"},{"id":"24681","text":"50"},{"id":"24682","text":"1"},{"id":"24683","text":"2"}]',
  '24684',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x65-0000-4000-b000-000000009067',
  'c000166-0000-4000-b000-000000009001',
  'En una población de bovino extensivo la metodología idónea para realizar las evaluaciones genéticas de los individuos candidatos a reproductores para el carácter ganancia media diaria es:',
  65,
  '[{"id":"24685","text":"BLUP"},{"id":"24686","text":"Selecci&oacute;n multivariante"},{"id":"24687","text":"Indice de selecci&oacute;n individual"},{"id":"24688","text":"No sabe/No contesta"},{"id":"24689","text":"Indice de selecci&oacute;n general"}]',
  '24685',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x66-0000-4000-b000-000000009068',
  'c000166-0000-4000-b000-000000009001',
  'En la metodología BLUP,',
  66,
  '[{"id":"24692","text":"Se estiman los efectos fijos y se predicen los efectos aleatorios"},{"id":"24690","text":"No sabe/No contesta"},{"id":"24691","text":"Se estiman los efectos fijos y se predicen los factores ambientales"},{"id":"24693","text":"Se estiman los efectos aleatorios y se predicen los valores mejorantes"},{"id":"24694","text":"Se predicen los efectos aleatorios y se estiman los valores mejorantes"}]',
  '24692',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x67-0000-4000-b000-000000009069',
  'c000166-0000-4000-b000-000000009001',
  'Si se obtiene un valor de coeficiente de consanguinidad F22=1,25, significa que,',
  67,
  '[{"id":"24695","text":"El animal 2 es consangu&iacute;neo"},{"id":"24696","text":"Ninguna es correcta"},{"id":"24697","text":"Este valor indica que el individuo 2 es gemelo"},{"id":"24698","text":"No sabe/No contesta"},{"id":"24699","text":"Es un valor err&oacute;neo"}]',
  '24695',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x68-0000-4000-b000-000000009070',
  'c000166-0000-4000-b000-000000009001',
  'Los índices de selección siempre se pueden estimar, sea el carácter que sea, haciendo evaluación de tipo',
  68,
  '[{"id":"24700","text":"individual"},{"id":"24701","text":"individual con medidas repetidas"},{"id":"24702","text":"por descendencia"},{"id":"24703","text":"ambiental"},{"id":"24704","text":"No sabe/No contesta"}]',
  '24700',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x69-0000-4000-b000-000000009071',
  'c000166-0000-4000-b000-000000009001',
  'La evaluación individual con medidas repetidas tienen en cuenta datos fenotípicos de',
  69,
  '[{"id":"24709","text":"candidatos a reproductor (varios por individuo)"},{"id":"24705","text":"varios hijos de cada candidato"},{"id":"24706","text":"candidatos a reproductor (uno por individuo)"},{"id":"24707","text":"progenitores de los candidatos (ambos)"},{"id":"24708","text":"No sabe/No contesta"}]',
  '24709',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x70-0000-4000-b000-000000009072',
  'c000166-0000-4000-b000-000000009001',
  'Las unidades del valor mejorante,',
  70,
  '[{"id":"24713","text":"Son las unidades del car&aacute;cter gen&eacute;tico en estudio"},{"id":"24710","text":"Siempre son Kg"},{"id":"24711","text":"Son las unidades del efecto fijo"},{"id":"24712","text":"Son las unidades en el sistema m&eacute;trico internacional"},{"id":"24714","text":"No sabe/No contesta"}]',
  '24713',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x71-0000-4000-b000-000000009073',
  'c000166-0000-4000-b000-000000009001',
  '¿Cuál es el coeficiente de consanguinidad del individuo 6, si el valor a66 es 1,75? Seleccione una:',
  71,
  '[{"id":"24715","text":"75"},{"id":"24716","text":""},{"id":"24717","text":"1"},{"id":"24718","text":"175"},{"id":"24719","text":"No sabe/No contesta"}]',
  '24715',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x72-0000-4000-b000-000000009074',
  'c000166-0000-4000-b000-000000009001',
  'En una comparación de los métodos de selección multicarácter, teniendo en cuenta la selección de la población, sobre su eficacia',
  72,
  '[{"id":"24723","text":"Tamden < Niveles independencia < &iacute;ndices de selecci&oacute;n global"},{"id":"24720","text":"No sabe/ No contestas"},{"id":"24721","text":"Tamden > Niveles independencia < &iacute;ndices de selecci&oacute;n global"},{"id":"24722","text":"Tamden > Niveles independencia > &iacute;ndices de selecci&oacute;n global"},{"id":"24724","text":"Niveles independencia > &iacute;ndices de selecci&oacute;n global > Tamden"}]',
  '24723',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x73-0000-4000-b000-000000009075',
  'c000166-0000-4000-b000-000000009001',
  'La utilización de los índices de selección como método de evaluación genética sería correcto en el caso de:',
  73,
  '[{"id":"24728","text":"Granjas de producci&oacute;n de carne av&iacute;cola"},{"id":"24725","text":"No sabe/ No contesta"},{"id":"24726","text":"La poblaci&oacute;n de cerdo ib&eacute;rico explotado de dehesa"},{"id":"24727","text":"Granjas de selecci&oacute;n de porcino blanco"},{"id":"24729","text":"Una poblaci&oacute;n de una raza aut&oacute;ctona de bovino de carne"}]',
  '24728',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x74-0000-4000-b000-000000009076',
  'c000166-0000-4000-b000-000000009001',
  'Señala la respuesta correcta en cuanto a la selección multicarácter:',
  74,
  '[{"id":"24734","text":"La selecci&oacute;n por niveles independientes establece niveles de rechazo"},{"id":"24730","text":"En los &iacute;ndices de selecci&oacute;n no se tiene en cuenta la heredabilidad"},{"id":"24731","text":"No sabe/ No contesta"},{"id":"24732","text":"La selecci&oacute;n por niveles independientes se realiza de forma conjunta en una sola generaci&oacute;n"},{"id":"24733","text":"La selecci&oacute;n en t&aacute;ndem equivale a los &iacute;ndices de selecci&oacute;n"}]',
  '24734',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x75-0000-4000-b000-000000009077',
  'c000166-0000-4000-b000-000000009001',
  'El análisis de índices de selección engloba:',
  75,
  '[{"id":"24739","text":"No se tiene en cuenta las asociaciones gen&eacute;ticas entre los caracteres"},{"id":"24735","text":"No sabes / No contestas"},{"id":"24736","text":"No se tiene en cuenta la heredabilidad"},{"id":"24737","text":"No se considera el valor econ&oacute;mico"},{"id":"24738","text":"Ninguna es correcta"}]',
  '24739',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x76-0000-4000-b000-000000009078',
  'c000166-0000-4000-b000-000000009001',
  'El coeficiente de consanguinidad',
  76,
  '[{"id":"24741","text":"Todas son verdaderas"},{"id":"24740","text":"No sabe/no contesta"},{"id":"24742","text":"Es el Valor obtenido en la diagonal de las matrices de parentesco"},{"id":"24743","text":"Es un Valor intraindividual"},{"id":"24744","text":"Su Valor es superior a la 1"}]',
  '24741',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x77-0000-4000-b000-000000009079',
  'c000166-0000-4000-b000-000000009001',
  'Respecto al coeficiente de parentesco:',
  77,
  '[{"id":"24748","text":"Es la probabilidad de que dos individuos tengan alelos id&eacute;nticos por ascendencia"},{"id":"24745","text":"No saben/no contesta"},{"id":"24746","text":"Corresponde al coeficiente de consanguinidad"},{"id":"24747","text":"La probabilidad de que un individuo tenga dos alelos id&eacute;nticos por ascendencia"},{"id":"24749","text":"Es un Valor intraindividual"}]',
  '24748',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x78-0000-4000-b000-000000009080',
  'c000166-0000-4000-b000-000000009001',
  'Los índices de selección siempre se pueden estimar, sea el carácter que sea, haciendo evaluación de tipo',
  78,
  '[{"id":"24752","text":"Individual"},{"id":"24750","text":"Individual con medidas repetidas"},{"id":"24751","text":"Ambiental"},{"id":"24753","text":"No sabe/no contesta"},{"id":"24754","text":"Por descendencia"}]',
  '24752',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x79-0000-4000-b000-000000009081',
  'c000166-0000-4000-b000-000000009001',
  'En una matriz de parentesco la obtención de un Valor de a12=0,3 indica que existe un 30% de probabilidad de:',
  79,
  '[{"id":"24757","text":"Los alelos del individuo 1 y del individuo 2 sean id&eacute;nticos"},{"id":"24755","text":"No sabe/no contesta"},{"id":"24756","text":"Los alelos de sus descendencias sean 15% diferente"},{"id":"24758","text":"Los alelos de los individuos 1 y 2 sean id&eacute;nticos por ascendencia"},{"id":"24759","text":"Los alelos de sus descendencias sean iguales"}]',
  '24757',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x80-0000-4000-b000-000000009082',
  'c000166-0000-4000-b000-000000009001',
  'Respecto al coeficiente de consanguinidad',
  80,
  '[{"id":"24763","text":"Es la probabilidad de que un individuo tenga dos alelos id&eacute;nticos por ascendencia"},{"id":"24760","text":"Son los valores fuera de la diagonal de la matriz de parentesco"},{"id":"24761","text":"La probabilidad de que dos individuos tengan alelos id&eacute;nticos por ascendencia"},{"id":"24762","text":"No sabe/no contesta"},{"id":"24764","text":"Es el Valor de la diagonal en la matriz de parentesco"}]',
  '24763',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x81-0000-4000-b000-000000009083',
  'c000166-0000-4000-b000-000000009001',
  'La diferencia entre una evaluación genética individual e individual con medidas repetidas es que la primera se utiliza:',
  81,
  '[{"id":"24766","text":"Un &uacute;nico dato por individuo a evaluar y en la segunda varios datos por individuo"},{"id":"24765","text":"Un dato por animal de la poblaci&oacute;n y la segunda la media de la poblaci&oacute;n"},{"id":"24767","text":"Datos del individuo a valorar y en la segunda datos interconectados de toda la poblaci&oacute;n"},{"id":"24768","text":"La medida de los datos del individuo y la segunda el conjunto de datos del individuo a evaluar"},{"id":"24769","text":"No sabe/no contesta"}]',
  '24766',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x82-0000-4000-b000-000000009084',
  'c000166-0000-4000-b000-000000009001',
  'Sí se obtiene un Valor de coeficiente de consanguinidad de F44=1,5 significa que:',
  82,
  '[{"id":"24772","text":"El animal 4 es consangu&iacute;neo"},{"id":"24770","text":"No sabe /no contesta"},{"id":"24771","text":"Es un Valor err&oacute;neo"},{"id":"24773","text":"Todas son correctas"},{"id":"24774","text":"Este Valor indica que el individuo 4 es gemelo"}]',
  '24772',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x83-0000-4000-b000-000000009085',
  'c000166-0000-4000-b000-000000009001',
  'Al calcular un índice de selección General para los distintos candidatos a reproductor:',
  83,
  '[{"id":"24775","text":"Se determina separadamente el Valor para cada car&aacute;cter seleccionado"},{"id":"24776","text":"Se produce un Valor mejorante de un &uacute;nico car&aacute;cter gen&eacute;tico"},{"id":"24777","text":"Se determina conjuntamente el valor para todos los objetivos de selecci&oacute;n"},{"id":"24778","text":"No sabe/no contesta"},{"id":"24779","text":"Ninguna es cierta"}]',
  '24775',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x84-0000-4000-b000-000000009086',
  'c000166-0000-4000-b000-000000009001',
  'La evaluación genética por índices de selección es más precisa cuando se hace una evaluación',
  84,
  '[{"id":"24782","text":"Combinada"},{"id":"24780","text":"Geneal&oacute;gica"},{"id":"24781","text":"Individual con medidas repetidas"},{"id":"24783","text":"Por descienden"},{"id":"24784","text":"No sabe/no contesta"}]',
  '24782',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x85-0000-4000-b000-000000009087',
  'c000166-0000-4000-b000-000000009001',
  'Si hacemos una evaluación genética de índices de selección siguiendo una evaluación genealógica utilizaremos datos fenotípicos de:',
  85,
  '[{"id":"24786","text":"Progenitores del individuo a evaluar"},{"id":"24785","text":"El individuo a evaluar"},{"id":"24787","text":"Progenitores y datos propios del individuo a evaluar"},{"id":"24788","text":"Hijos/as del individuo a evaluar"},{"id":"24789","text":"No sabe/no contesta"}]',
  '24786',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x86-0000-4000-b000-000000009088',
  'c000166-0000-4000-b000-000000009001',
  'En una población de bovino extensivo, la metodología idónea para realizar evaluaciones genéticas de los individuos para carácter "infiltración grasa" es:',
  86,
  '[{"id":"24792","text":"BLUP"},{"id":"24790","text":"&iacute;ndice de selecci&oacute;n individual"},{"id":"24791","text":"&iacute;ndice de selecci&oacute;n General"},{"id":"24793","text":"No sabe/no"},{"id":"24794","text":"Selecci&oacute;n multivariante"}]',
  '24792',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x87-0000-4000-b000-000000009089',
  'c000166-0000-4000-b000-000000009001',
  'En una valoración BLUP donde se obtienen 15 valores mejorantes:',
  87,
  '[{"id":"24799","text":"Hay 15 individuos en la poblaci&oacute;n"},{"id":"24795","text":"Los 15 valores mejorantes correspondes al estudio de un car&aacute;cter monog&eacute;nico"},{"id":"24796","text":"Quince son los animales en los que tenemos la ascendencia"},{"id":"24797","text":"No sabe/ no contesta"},{"id":"24798","text":"Los valores fijos son 15"}]',
  '24799',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x88-0000-4000-b000-000000009090',
  'c000166-0000-4000-b000-000000009001',
  'En la matriz de coeficientes del modelo BLUP',
  88,
  '[{"id":"24802","text":"Sus elementos son cuatro submatrices"},{"id":"24800","text":"Sus elementos son los valores mejorante"},{"id":"24801","text":"Para su c&aacute;lculo tendremos en cuenta los valores mejora"},{"id":"24803","text":"La diagonal de las distintas matrices siempre es la misma"},{"id":"24804","text":"No sabe/no contesta"}]',
  '24802',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x89-0000-4000-b000-000000009091',
  'c000166-0000-4000-b000-000000009001',
  'La selección en tándem se hace',
  89,
  '[{"id":"24809","text":"Selecci&oacute;n de cada car&aacute;cter de manera alternativa por generaci&oacute;n"},{"id":"24805","text":"Selecci&oacute;n conjunta de varios caracteres por gemaci&oacute;n"},{"id":"24806","text":"No sabe/no con"},{"id":"24807","text":"Selecci&oacute;n de forma simult&aacute;nea dependiendo de la heredabilidad de cada car&aacute;cter"},{"id":"24808","text":"Selecci&oacute;n de un car&aacute;cter elegido teniendo en cuenta la heredabilidad"}]',
  '24809',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x90-0000-4000-b000-000000009092',
  'c000166-0000-4000-b000-000000009001',
  'Cuando la heredabilidad de un carácter genético es 0,5 el Valor de alfa en la diagonal de la matriz de parentesco es:',
  90,
  '[{"id":"24811","text":"1"},{"id":"24810","text":"3"},{"id":"24812","text":"2"},{"id":"24813","text":"4"}]',
  '24811',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x91-0000-4000-b000-000000009093',
  'c000166-0000-4000-b000-000000009001',
  'El individuo 2 de la población tiene de Padre al individuo 1 y Madre desconocido, el individuo 3 tiene de Padre al individuo 1 y Madre desconocido. ¿cuál es el coeficiente de parentesco entre los individuos 2 y 3?',
  91,
  '[{"id":"24817","text":"25"},{"id":"24814","text":""},{"id":"24815","text":"No sabe/no contesta"},{"id":"24816","text":"5"},{"id":"24818","text":"1"}]',
  '24817',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x92-0000-4000-b000-000000009094',
  'c000166-0000-4000-b000-000000009001',
  '1. Señala la respuesta correcta:',
  92,
  '[{"id":"24823","text":"a) Los índices de selección no tienen en cuenta los efectos ambientales"},{"id":"24819","text":"a) Los índices de selección tienen en cuenta los aspectos ambientales"},{"id":"24820","text":"a) Los índices de selección tienen en cuenta el efecto materno"},{"id":"24821","text":"a) No sabe no contesta"},{"id":"24822","text":"a) Los índices de selección se ajustan para dos efectos fijos"}]',
  '24823',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x93-0000-4000-b000-000000009095',
  'c000166-0000-4000-b000-000000009001',
  'Una evaluación genealógica se estima con:',
  93,
  '[{"id":"24828","text":"Datos fenotípicos de los progenitores"},{"id":"24824","text":"No sabe no contesta"},{"id":"24825","text":"Datos fenotípicos de la progenie"},{"id":"24826","text":"Datos genotípicos de los progenitores"},{"id":"24827","text":"Datos genotípicos de la progenie"}]',
  '24828',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x94-0000-4000-b000-000000009096',
  'c000166-0000-4000-b000-000000009001',
  'En la metodología BLUP, en el contexto de una única observación por animal:',
  94,
  '[{"id":"24829","text":"Z´ Z= I"},{"id":"24830","text":"la diagonal de la matriz de identidad es siempre igual a 4"},{"id":"24831","text":"h2 equivale a la matriz de incidencia"},{"id":"24832","text":"Ninguna es verdadera"},{"id":"24833","text":"No sabe no contesta"}]',
  '24829',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x95-0000-4000-b000-000000009097',
  'c000166-0000-4000-b000-000000009001',
  'Respecto al Valor mejorante y a la valoración genética mediante BLUP',
  95,
  '[{"id":"24836","text":"Los valores mejorantes son intrínsecos de cada individuo"},{"id":"24834","text":"la suma de todos los valores mejorantes de la producción el estudio es 1"},{"id":"24835","text":"todos los valores mejorantes tiene un Valor mayor de 1"},{"id":"24837","text":"los valores mejorantes no tiene unidades"},{"id":"24838","text":"no sabe no contesta"}]',
  '24836',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x96-0000-4000-b000-000000009098',
  'c000166-0000-4000-b000-000000009001',
  'La metodología BLUP como valoración genética',
  96,
  '[{"id":"24840","text":"genera valores mejorantes de cada individuo de la población"},{"id":"24839","text":"no sabe no contesta"},{"id":"24841","text":"es fundamental en valoraciones de caracteres genéticos en equilibrio de Hardy Weinberg"},{"id":"24842","text":"se realiza en análisis de un carácter genético monogénico"},{"id":"24843","text":"se estimar efectos fijos pero no se predice efectos aleatorios"}]',
  '24840',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x97-0000-4000-b000-000000009099',
  'c000166-0000-4000-b000-000000009001',
  'La individuo 2 de la población tiene de padre al individuo 1 y madre desconocido, el individuo 3 tiene de padre al individuo 2 y Madre desconocido ¿cuál es el coeficiente de parentesco entre los individuos 2 y 3?',
  97,
  '[{"id":"24844","text":"0,5"},{"id":"24845","text":"1"},{"id":"24846","text":"0"},{"id":"24847","text":"no sabe no contesta"},{"id":"24848","text":"0,25"}]',
  '24844',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x98-0000-4000-b000-000000009100',
  'c000166-0000-4000-b000-000000009001',
  'El peso económico es fundamental a la hora de calcular',
  98,
  '[{"id":"24851","text":"el genotipo agregado"},{"id":"24849","text":"el Valor mejorante mediante BLUP"},{"id":"24850","text":"el Valor mejorante de caracteres productivos"},{"id":"24852","text":"el Valor económico de los candidatos"},{"id":"24853","text":"no sabe no contesta"}]',
  '24851',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x99-0000-4000-b000-000000009101',
  'c000166-0000-4000-b000-000000009001',
  '¿Cómo se denomina la selección apoyada en un gen de interés además de hacer evaluaciones genéticas tradicionales?',
  99,
  '[{"id":"24856","text":"selección asistida por marcadores/genes"},{"id":"24854","text":"selección genómica"},{"id":"24855","text":"no sabe no contesta"},{"id":"24857","text":"índices de selección"},{"id":"24858","text":"BLUP"}]',
  '24856',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd166x100-0000-4000-b000-000000009102',
  'c000166-0000-4000-b000-000000009001',
  'El coeficiente de consanguinidad:',
  100,
  '[{"id":"24861","text":"es un Valor generado entre los dos alelos de un único individuo"},{"id":"24859","text":"es un Valor generado entre dos individuos"},{"id":"24860","text":"es un Valor de la población"},{"id":"24862","text":"su Valor siempre es mayor de 1"},{"id":"24863","text":"no sabe no contesta"}]',
  '24861',
  '2026-04-27 17:01:04'
);

-- Quiz: "TEST 1- CARDIACO" → Course: "Fisiología Veterinaria  2ºC" (107 questions) [renamed to add "(2)"]
INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'c000149-0000-4000-b000-000000009103',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 1- CARDIACO (2)',
  NULL,
  'quiz',
  100,
  '2026-04-27 17:01:04',
  '2026-04-27 17:01:04'
FROM Class c
WHERE c.name = 'Fisiología Veterinaria  2ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 1- CARDIACO (2)' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x0-0000-4000-b000-000000009104',
  'c000149-0000-4000-b000-000000009103',
  'Con respecto al dise&ntilde;o de la circulaci&oacute;n general. El sistema porta hipofisiario es un sistema porta del tipo.',
  0,
  '[{"id":"9385","text":"Vena-capilar-vena"},{"id":"9383","text":"Arteria-capilar-vena"},{"id":"9384","text":"Arteria-capilar-arteria"},{"id":"9386","text":"Ninguna de las anteriores es correcta"}]',
  '9385',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x1-0000-4000-b000-000000009105',
  'c000149-0000-4000-b000-000000009103',
  'Con respecto al ciclo cardiaco. Se&ntilde;ale la afirmaci&oacute;n correcta:',
  1,
  '[{"id":"9388","text":"La apertura de las v&aacute;lvulas atrioventriculares coincide con el final de la relajaci&oacute;n isovolum&eacute;trica"},{"id":"9387","text":"La onda R del ECG coincide con la di&aacute;stasis"},{"id":"9389","text":"La s&iacute;stole auricular aporta m&aacute;s del 70% del volumen telediast&oacute;lico"},{"id":"9390","text":"El cierre de las v&aacute;lvulas semilunares coincide con el periodo de eyecci&oacute;n lenta."}]',
  '9388',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x2-0000-4000-b000-000000009106',
  'c000149-0000-4000-b000-000000009103',
  'Con respecto a las fuerzas de Starling. Se&ntilde;ala la afirmaci&oacute;n correcta:',
  2,
  '[{"id":"9393","text":"Si aumenta la presi&oacute;n hidrost&aacute;tica del capilar se favorece la filtraci&oacute;n de agua"},{"id":"9391","text":"Si aumenta la presi&oacute;n hidrost&aacute;tica del capilar se favorece la absorci&oacute;n de agua"},{"id":"9392","text":"Si disminuye la presi&oacute;n onc&oacute;tica del capilar se favorece la absorci&oacute;n de agua"},{"id":"9394","text":"Si aumenta la presi&oacute;n onc&oacute;tica del intersticio se favorece la absorci&oacute;n de agua"}]',
  '9393',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x3-0000-4000-b000-000000009107',
  'c000149-0000-4000-b000-000000009103',
  'Con respecto al control local de la circulaci&oacute;n, se&ntilde;ala cu&aacute;l de las siguientes opciones favorece la vasodilataci&oacute;n (en tejido no pulmonar):',
  3,
  '[{"id":"9395","text":"Aumento de potasio"},{"id":"9396","text":"Aumento de la presi&oacute;n parcia de ox&iacute;geno"},{"id":"9397","text":"Disminuci&oacute;n de la presi&oacute;n parcial de CO2"},{"id":"9398","text":"Disminuci&oacute;n de la adenosina"}]',
  '9395',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x4-0000-4000-b000-000000009108',
  'c000149-0000-4000-b000-000000009103',
  'Se&ntilde;ale cu&aacute;l de las siguientes hormonas tiene acci&oacute;n vasoconstrictora:',
  4,
  '[{"id":"9400","text":"ADH"},{"id":"9399","text":"Bradicinina"},{"id":"9401","text":"Histamina"},{"id":"9402","text":"&OACUTE;xido n&iacute;trico"}]',
  '9400',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x5-0000-4000-b000-000000009109',
  'c000149-0000-4000-b000-000000009103',
  'Con respecto al reflejo baroreceptor. Se&ntilde;ala la afirmaci&oacute;n correcta:',
  5,
  '[{"id":"9404","text":"Un aumento de la presi&oacute;n arterial provocar&iacute;a liberaci&oacute;n de acetilcolina sobre los receptores del coraz&oacute;n"},{"id":"9403","text":"Las regiones barorreceptoras se encuentran en las arterias pulmonares y sus ramificaciones derecha fundamentalmente"},{"id":"9405","text":"Una disminuci&oacute;n de la presi&oacute;n arterial provocar&iacute;a liberaci&oacute;n de acetilcolina sobre los receptores del coraz&oacute;n"},{"id":"9406","text":"Un aumento de la presi&oacute;n arterial provocar&iacute;a la liberaci&oacute;n de adrenalina sobre los receptores alfa2 de los vasos"}]',
  '9404',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x6-0000-4000-b000-000000009110',
  'c000149-0000-4000-b000-000000009103',
  'Con respecto a las funciones de la angiotensina II. Se&ntilde;ala la afirmaci&oacute;n correcta:',
  6,
  '[{"id":"9408","text":"Aumenta el crecimiento del m&uacute;sculo vascular liso"},{"id":"9407","text":"Disminuci&oacute;n de la s&iacute;ntesis de hormona antidiur&eacute;tica"},{"id":"9409","text":"Disminuye la s&iacute;ntesis de aldosterona"},{"id":"9410","text":"Aumenta la s&iacute;ntesis de bradicinina"}]',
  '9408',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x7-0000-4000-b000-000000009111',
  'c000149-0000-4000-b000-000000009103',
  'Entre las respuestas a corto plazo del organismo frente a una situaci&oacute;n de hipoxia se encuentra: se&ntilde;ale la respuesta correcta.',
  7,
  '[{"id":"9414","text":"Ninguna respuesta es correcta"},{"id":"9411","text":"Aparece bradicardia para evitar mandar la sangre con poco ox&iacute;geno a los &oacute;rganos"},{"id":"9412","text":"Aumenta el volumen plasm&aacute;tico para compensar la falta de ox&iacute;geno en sangre"},{"id":"9413","text":"Hay una hemoconcentraci&oacute;n para aumentar el porcentaje de ox&iacute;geno transportado por unidad de volumen sangre"}]',
  '9414',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x8-0000-4000-b000-000000009112',
  'c000149-0000-4000-b000-000000009103',
  'Con respecto a la anatom&iacute;a cardiaca y circulatoria. Entre la vena craneal y el atrio derecho se encuentra:',
  8,
  '[{"id":"9418","text":"Ninguna de las anteriores es correcta"},{"id":"9415","text":"La v&aacute;lvula tric&uacute;spide"},{"id":"9416","text":"La v&aacute;lvula mitral"},{"id":"9417","text":"La v&aacute;lvula pulmonar"}]',
  '9418',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x9-0000-4000-b000-000000009113',
  'c000149-0000-4000-b000-000000009103',
  'Con respecto al ciclo cardiaco. Se&ntilde;ala la afirmaci&oacute;n correcta:',
  9,
  '[{"id":"9422","text":"El cierre de las v&aacute;lvulas semilunares coincide con el inicio de la relajaci&oacute;n isovolum&eacute;trica"},{"id":"9419","text":"La onda R del ECG coincide con el inicio de la relajaci&oacute;n isovolum&eacute;trica"},{"id":"9420","text":"La apertura de las v&aacute;lvulas atrioventriculares coincide con el inicio del periodo de contracci&oacute;n isovolum&eacute;trica"},{"id":"9421","text":"La s&iacute;stole auricular aporta m&aacute;s del 60% del volumen telediast&oacute;lico"}]',
  '9422',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x10-0000-4000-b000-000000009114',
  'c000149-0000-4000-b000-000000009103',
  'Con respecto a las fibras musculares cardiacas. Se&ntilde;ala la afirmaci&oacute;n correcta:',
  10,
  '[{"id":"9423","text":"Las fibras musculares espec&iacute;ficas con capaces de generar espont&aacute;neamente potenciales de acci&oacute;n"},{"id":"9424","text":"Las fibras musculares espec&iacute;ficas presentan una curva de potencial de acci&oacute;n igual al de las fibras musculares no espec&iacute;ficas"},{"id":"9425","text":"Las c&eacute;lulas nerviosas que conforman el marcapasos del coraz&oacute;n son las c&eacute;lulas del n&oacute;dulo sinusal"},{"id":"9426","text":"Las fibras musculares espec&iacute;ficas est&aacute;n especializadas en la contracci&oacute;n porque su potencial de acci&oacute;n es m&aacute;s lento."}]',
  '9423',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x11-0000-4000-b000-000000009115',
  'c000149-0000-4000-b000-000000009103',
  'Con respecto a la precarga y la ley de Frank-Starling. Se&ntilde;ala la afirmaci&oacute;n correcta:',
  11,
  '[{"id":"9428","text":"La precarga ventricular es la presi&oacute;n que ejerce la sangre dentro del ventr&iacute;culo en la Teledi&aacute;stole"},{"id":"9427","text":"La precarga ventricular es el volumen de sangre que existe en el ventr&iacute;culo en la teles&iacute;stole"},{"id":"9429","text":"La ley de Starling propone que una disminuci&oacute;n de la precarga conduce a un aumento de la fuerza de contracci&oacute;n"},{"id":"9430","text":"La ley de Starling es un tipo de regulaci&oacute;n homeom&eacute;trica"}]',
  '9428',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x12-0000-4000-b000-000000009116',
  'c000149-0000-4000-b000-000000009103',
  'Con respecto a la fase de despolarizaci&oacute;n de las c&eacute;lulas musculares cardiacas. Se&ntilde;ala la afirmaci&oacute;n correcta.',
  12,
  '[{"id":"9431","text":"En la fase 0 los canales de sodio se abren con rapidez"},{"id":"9432","text":"En la fase 2 (meseta) se produce el cierre de los canales de calcio y disminuye la permeabilidad al calcio"},{"id":"9433","text":"En la fase 3 se produce el cierre de los canales de potasio y el potencial de membrana se vuelve m&aacute;s negativo"},{"id":"9434","text":"En la fase 2 (meseta) muchos canales de potasio se abren y por tanto la permeabilidad el potasio disminuye"}]',
  '9431',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x13-0000-4000-b000-000000009117',
  'c000149-0000-4000-b000-000000009103',
  'Con respecto a la fisiolog&iacute;a de los vasos sangu&iacute;neos. Se&ntilde;ala la afirmaci&oacute;n correcta:',
  13,
  '[{"id":"9437","text":"La distensibilidad de las venas es mucho mayor que la de las arterias"},{"id":"9435","text":"Las arterias son reservorios de volumen"},{"id":"9436","text":"Las arteriolas poseen paredes el&aacute;sticas, que permiten su contracci&oacute;n"},{"id":"9438","text":"La aorta es m&aacute;s adaptable que la vena cava y soporta presiones m&aacute;s altas."}]',
  '9437',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x14-0000-4000-b000-000000009118',
  'c000149-0000-4000-b000-000000009103',
  'La circulaci&oacute;n portal espl&aacute;cnica es del tipo:',
  14,
  '[{"id":"9441","text":"Vena capilar vena"},{"id":"9439","text":"Arteria capilar arteria"},{"id":"9440","text":"Arteria capilar vena"},{"id":"9442","text":"Vena capilar arteria"}]',
  '9441',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x15-0000-4000-b000-000000009119',
  'c000149-0000-4000-b000-000000009103',
  'El n&oacute;dulo sinusal se sit&uacute;a:',
  15,
  '[{"id":"9443","text":"Entre la uni&oacute;n de la vena cava superior con la aur&iacute;cula derecha"},{"id":"9444","text":"En el tabique interventricular"},{"id":"9445","text":"En el atrio izquierdo"},{"id":"9446","text":"Ventr&iacute;culo izquierdo"}]',
  '9443',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x16-0000-4000-b000-000000009120',
  'c000149-0000-4000-b000-000000009103',
  'La fase 2 del potencial de acci&oacute;n de una c&eacute;lula especializada en la contracci&oacute;n se caracteriza por:',
  16,
  '[{"id":"9448","text":"Apertura de los canales de calcio lentos"},{"id":"9447","text":"Apertura de los canales sodio r&aacute;pidos"},{"id":"9449","text":"Cierre de los canales de sodio r&aacute;pidos"},{"id":"9450","text":"Apertura de los canales de potasio"}]',
  '9448',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x17-0000-4000-b000-000000009121',
  'c000149-0000-4000-b000-000000009103',
  'Indica cu&aacute;l de las siguientes c&eacute;lulas especializadas en la conducci&oacute;n presenta un potencial m&aacute;s corto:',
  17,
  '[{"id":"9451","text":"N&oacute;dulo sinusal"},{"id":"9452","text":"N&oacute;dulo aur&iacute;culo ventricular"},{"id":"9453","text":"Haces internodales"},{"id":"9454","text":"Rama izquierda del haz de Hiss"}]',
  '9451',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x18-0000-4000-b000-000000009122',
  'c000149-0000-4000-b000-000000009103',
  'La precarga es:',
  18,
  '[{"id":"9458","text":"La presi&oacute;n que ejerce la sangre en el ventr&iacute;culo en la Teledi&aacute;stole"},{"id":"9455","text":"El volumen de sangre en el ventr&iacute;culo en la teledi&aacute;stole"},{"id":"9456","text":"El volumen de sangre en el ventr&iacute;culo en la teles&iacute;stole"},{"id":"9457","text":"La presi&oacute;n que ejerce la sangre en el ventr&iacute;culo en la teles&iacute;stole"}]',
  '9458',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x19-0000-4000-b000-000000009123',
  'c000149-0000-4000-b000-000000009103',
  'Ciclo cardiaco. El periodo en el que existe mayor p&eacute;rdida de volumen ventricular',
  19,
  '[{"id":"9461","text":"Periodo de eyecci&oacute;n r&aacute;pido"},{"id":"9459","text":"Periodo de contracci&oacute;n isovolum&eacute;trico"},{"id":"9460","text":"Diastasis"},{"id":"9462","text":"Contracci&oacute;n atrial"}]',
  '9461',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x20-0000-4000-b000-000000009124',
  'c000149-0000-4000-b000-000000009103',
  'Cu&aacute;l de los siguientes tipos de capilares predominan en el cerebro:',
  20,
  '[{"id":"9463","text":"Continuos"},{"id":"9464","text":"Discontinuos"},{"id":"9465","text":"Fenestrados"},{"id":"9466","text":"Ninguna de las respuestas es correcta"}]',
  '9463',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x21-0000-4000-b000-000000009125',
  'c000149-0000-4000-b000-000000009103',
  'Los vasos pulmonares, con respecto a los vasos sist&eacute;micos:',
  21,
  '[{"id":"9469","text":"Son m&aacute;s adaptables"},{"id":"9467","text":"Ofrecen una gran resistencia al paso de la sangre"},{"id":"9468","text":"Son poco distensibles"},{"id":"9470","text":"Ninguna de las respuestas es correcta"}]',
  '9469',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x22-0000-4000-b000-000000009126',
  'c000149-0000-4000-b000-000000009103',
  'La difusi&oacute;n de una sustancia en una capilar a una c&eacute;lula ser&aacute; mayor:',
  22,
  '[{"id":"9472","text":"Si disminuye la distancia entre el capilar y la c&eacute;lula"},{"id":"9471","text":"Si el diferencial de concentraci&oacute;n entre el capilar y la c&eacute;lula es bajo"},{"id":"9473","text":"Si disminuye la temperatura"},{"id":"9474","text":"Si disminuye el coeficiente de difusi&oacute;n"}]',
  '9472',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x23-0000-4000-b000-000000009127',
  'c000149-0000-4000-b000-000000009103',
  'Con respecto al reflejo barorreceptor. Si disminuye la presi&oacute;n arterial:',
  23,
  '[{"id":"9477","text":"Aumentar&aacute; la liberaci&oacute;n de norepinefrina sobre los receptores beta1 del coraz&oacute;n"},{"id":"9475","text":"Disminuir&aacute; la liberaci&oacute;n de adrenalina sobre los receptores alfa1 y alfa2 de los vasos"},{"id":"9476","text":"Aumenta la liberaci&oacute;n de acetilcolina sobre los receptores beta2 del coraz&oacute;n"},{"id":"9478","text":"Aumenta la liberaci&oacute;n de acetilcolina sobre los receptores M3 de los vasos"}]',
  '9477',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x24-0000-4000-b000-000000009128',
  'c000149-0000-4000-b000-000000009103',
  'La circulaci&oacute;n portal renal es del tipo:',
  24,
  '[{"id":"9479","text":"Arteria capilar arteria"},{"id":"9480","text":"Vena capilar vena"},{"id":"9481","text":"Arteria capilar vena"},{"id":"9482","text":"Vena capilar arteria"}]',
  '9479',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x25-0000-4000-b000-000000009129',
  'c000149-0000-4000-b000-000000009103',
  '&iquest;De cu&aacute;l de estos &oacute;rganos No recoge sangre la vena porta?',
  25,
  '[{"id":"9486","text":"Ri&ntilde;ones"},{"id":"9483","text":"Est&oacute;mago"},{"id":"9484","text":"P&aacute;ncreas"},{"id":"9485","text":"Bazo"}]',
  '9486',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x26-0000-4000-b000-000000009130',
  'c000149-0000-4000-b000-000000009103',
  'La fase 0 del potencial de acci&oacute;n de una c&eacute;lula especializada en la contracci&oacute;n se caracteriza:',
  26,
  '[{"id":"9487","text":"Apertura de los canales de sodio r&aacute;pido"},{"id":"9488","text":"Cierre de los canales de sodio r&aacute;pido"},{"id":"9489","text":"Apertura de los canales de calcio"},{"id":"9490","text":"Apertura de los canales de potasio"}]',
  '9487',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x27-0000-4000-b000-000000009131',
  'c000149-0000-4000-b000-000000009103',
  'Indica cu&aacute;l de las siguientes c&eacute;lulas especializadas en la conducci&oacute;n presenta un potencial de acci&oacute;n m&aacute;s corto:',
  27,
  '[{"id":"9493","text":"N&oacute;dulo sinusal"},{"id":"9491","text":"N&oacute;dulo aur&iacute;culo ventricular"},{"id":"9492","text":"Haces internodales"},{"id":"9494","text":"Rama izquierda del haz de Hiss"}]',
  '9493',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x28-0000-4000-b000-000000009132',
  'c000149-0000-4000-b000-000000009103',
  'La precarga es:',
  28,
  '[{"id":"9495","text":"La presi&oacute;n que ejerce la sangre en el ventr&iacute;culo en la Teledi&aacute;stole"},{"id":"9496","text":"El volumen de sangre en el ventr&iacute;culo en la Teledi&aacute;stole"},{"id":"9497","text":"El volumen de sangre en el ventr&iacute;culo en al teles&iacute;stole"},{"id":"9498","text":"La presi&oacute;n que ejerce la sangre en el ventr&iacute;culo en al teles&iacute;stole"}]',
  '9495',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x29-0000-4000-b000-000000009133',
  'c000149-0000-4000-b000-000000009103',
  'Ciclo cardiaco. La onda R coincide con:',
  29,
  '[{"id":"9502","text":"El comienzo de la s&iacute;stole ventricular"},{"id":"9499","text":"El cierre de las v&aacute;lvulas semilunares"},{"id":"9500","text":"El inicio del periodo de relajaci&oacute;n isovolum&eacute;trica"},{"id":"9501","text":"El final del periodo de llenado lento"}]',
  '9502',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x30-0000-4000-b000-000000009134',
  'c000149-0000-4000-b000-000000009103',
  'El principal lugar de resistencia al flujo de sangre se encuentra en:',
  30,
  '[{"id":"9503","text":"Metaarteriolas"},{"id":"9504","text":"Capilares"},{"id":"9505","text":"Venas"},{"id":"9506","text":"Arterias el&aacute;sticas"}]',
  '9503',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x31-0000-4000-b000-000000009135',
  'c000149-0000-4000-b000-000000009103',
  'Ley de Poiseulle. La resistencia al paso de un fluido por un tubo:',
  31,
  '[{"id":"9507","text":"Aumenta a mayor longitud del tubo"},{"id":"9508","text":"Disminuye cuando disminuye el radio"},{"id":"9509","text":"Disminuye a mayor viscosidad del fluido"},{"id":"9510","text":"Ninguna de las respuestas dadas es correcta"}]',
  '9507',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x32-0000-4000-b000-000000009136',
  'c000149-0000-4000-b000-000000009103',
  'Conociendo los siguientes par&aacute;metros medidos en la microcirculaci&oacute;n del m&uacute;sculo esquel&eacute;tico: presi&oacute;n hidrost&aacute;tica del capilar, 34 mmHg; presi&oacute;n hidrost&aacute;tica intersticial, 10 mmHg; presi&oacute;n onc&oacute;tica del capilar, 24 mmHg; presi&oacute;n onc&oacute;tica intersticial, 1 mmHg. &iquest;Cu&aacute;l de las siguientes afirmaciones es correcta?',
  32,
  '[{"id":"9513","text":"En estas condiciones se favorece la filtraci&oacute;n"},{"id":"9511","text":"En esas condiciones se favorece la reabsorci&oacute;n"},{"id":"9512","text":"En esas condiciones no se favorece ni la reabsorci&oacute;n ni la filtraci&oacute;n"},{"id":"9514","text":"No est&aacute; claro lo que se favorece en estas condiciones, ya que no se ha especificado la concentraci&oacute;n de prote&iacute;nas plasm&aacute;ticas"}]',
  '9513',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x33-0000-4000-b000-000000009137',
  'c000149-0000-4000-b000-000000009103',
  'Con respecto a las fuerzas de Starling. Se&ntilde;ala la afirmaci&oacute;n correcta:',
  33,
  '[{"id":"9518","text":"Si aumenta la presi&oacute;n onc&oacute;tica del capilar se favorece la absorci&oacute;n de agua"},{"id":"9515","text":"Si disminuye la presi&oacute;n hidrost&aacute;tica del capilar se favorece la filtraci&oacute;n de agua"},{"id":"9516","text":"Se favorece la absorci&oacute;n si aumenta el coeficiente de filtraci&oacute;n"},{"id":"9517","text":"Si aumenta la presi&oacute;n onc&oacute;tica del intersticio se favorece la absorci&oacute;n de agua"}]',
  '9518',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x34-0000-4000-b000-000000009138',
  'c000149-0000-4000-b000-000000009103',
  'Con respecto al control local de la circulaci&oacute;n, se&ntilde;ala cu&aacute;l de las siguientes opciones favorece la vasodilataci&oacute;n (en tejido no pulmonar):',
  34,
  '[{"id":"9520","text":"Aumento del potasio"},{"id":"9519","text":"Disminuci&oacute;n del &aacute;cido l&aacute;ctico"},{"id":"9521","text":"Aumento de la presi&oacute;n parcial de ox&iacute;geno"},{"id":"9522","text":"Disminuci&oacute;n de la adenosina"}]',
  '9520',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x35-0000-4000-b000-000000009139',
  'c000149-0000-4000-b000-000000009103',
  'Con respecto al reflejo barorreceptor. Si aumenta la presi&oacute;n arterial:',
  35,
  '[{"id":"9523","text":"Aumenta la liberaci&oacute;n de acetilcolina sobre los receptores M2 del coraz&oacute;n"},{"id":"9524","text":"Aumenta la liberaci&oacute;n de norepinefrina sobre los receptores alfa1 y alfa 2 de los .."},{"id":"9525","text":"Disminuir&aacute; la liberaci&oacute;n de acetilcolina sobre los receptores M3 de las arterias"},{"id":"9526","text":"Aumentar&aacute; la liberaci&oacute;n de adrenalina"}]',
  '9523',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x36-0000-4000-b000-000000009140',
  'c000149-0000-4000-b000-000000009103',
  'Se&ntilde;ala la afirmaci&oacute;n correcta:',
  36,
  '[{"id":"9528","text":"Las fibras musculares auriculares y ventriculares est&aacute;n separadas por un anillo fibroso"},{"id":"9527","text":"Los circuitos sist&eacute;mico y pulmonar funcional simult&aacute;neamente y paralelamente"},{"id":"9529","text":"La aorta tiene una pared poco el&aacute;stica"}]',
  '9528',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x37-0000-4000-b000-000000009141',
  'c000149-0000-4000-b000-000000009103',
  'Con respecto a las fibras musculares cardiacas. Se&ntilde;ala la afirmaci&oacute;n incorrecta',
  37,
  '[{"id":"9532","text":"Las c&eacute;lulas nerviosas que forman el marcapasos del coraz&oacute;n son c&eacute;lulas de n&oacute;dulo sinusal."},{"id":"9530","text":"Las fibras musculares espec&iacute;ficas son capaces de generar espont&aacute;neamente potenciales de acci&oacute;n"},{"id":"9531","text":"Las fibras musculares espec&iacute;ficas presentan una curva de potencial de acci&oacute;n diferente a la de las fibras musculares no espec&iacute;ficas"}]',
  '9532',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x38-0000-4000-b000-000000009142',
  'c000149-0000-4000-b000-000000009103',
  'Con respecto a las fases de despolarizaci&oacute;n de las c&eacute;lulas musculares ventriculares cardiacas (c&eacute;lulas no espec&iacute;ficas). Se&ntilde;ala la afirmaci&oacute;n incorrecta:',
  38,
  '[{"id":"9535","text":"En la fase 3 se produce el cierre de los canales de potasio de manera que el potencial de membrana se vuelve m&aacute;s negativo"},{"id":"9533","text":"En la fase 2 (meseta) se produce la apertura de los canales de calcio y aumenta la permeabilidad al calcio"},{"id":"9534","text":"De la fase 2 (meseta) muchos canales de potasio se cierran y por tanto la permeabilidad al potasio disminuye"}]',
  '9535',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x39-0000-4000-b000-000000009143',
  'c000149-0000-4000-b000-000000009103',
  'Con respecto a la fisiolog&iacute;a de los vasos sangu&iacute;neos se&ntilde;ala la afirmaci&oacute;n correcta:',
  39,
  '[{"id":"9536","text":"Las venas son reservorios de volumen."},{"id":"9537","text":"Las arteriolas poseen paredes el&aacute;sticas provistas de un alto contenido en col&aacute;geno que permite su contracci&oacute;n."},{"id":"9538","text":"La distensibilidad de las arterias es mucho mayor que la de las venas."},{"id":"9539","text":"La aorta es m&aacute;s adaptable que la vena cava, y soporta presiones m&aacute;s altas."}]',
  '9536',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x40-0000-4000-b000-000000009144',
  'c000149-0000-4000-b000-000000009103',
  'Con respecto a las Fuerzas de Starling, se&ntilde;ala la afirmaci&oacute;n correcta:',
  40,
  '[{"id":"9542","text":"Si aumenta la presi&oacute;n hidrost&aacute;tica del capilar se favorece la filtraci&oacute;n de agua."},{"id":"9540","text":"Si disminuye la presi&oacute;n hidrost&aacute;tica del capilar se favorece la filtraci&oacute;n de agua."},{"id":"9541","text":"Si aumenta la presi&oacute;n onc&oacute;tica del intersticio se favorece la absorci&oacute;n de agua."},{"id":"9543","text":"Si disminuye la presi&oacute;n onc&oacute;tica del capilar se favorece la absorci&oacute;n de agua."}]',
  '9542',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x41-0000-4000-b000-000000009145',
  'c000149-0000-4000-b000-000000009103',
  'Con respecto al ciclo cardiaco &iquest;Qu&eacute; fase se inicia en la s&iacute;stole ventricular y termina cuando se inicia el periodo de eyecci&oacute;n ventricular?',
  41,
  '[{"id":"9546","text":"Contracci&oacute;n isovolum&eacute;trica ventricular"},{"id":"9544","text":"Teledi&aacute;stole"},{"id":"9545","text":"Relajaci&oacute;n isovolum&eacute;trica"}]',
  '9546',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x42-0000-4000-b000-000000009146',
  'c000149-0000-4000-b000-000000009103',
  'Se&ntilde;ala la afirmaci&oacute;n correcta:',
  42,
  '[{"id":"9548","text":"Las circulaciones portales que existen en el organismo son: la espl&aacute;cnica, la de los ri&ntilde;ones y la de la gl&aacute;ndula pituitaria"},{"id":"9547","text":"Las circulaciones espl&aacute;cnica se refiere a la sangre que abandona los capilares espl&eacute;cnicos, g&aacute;stricos o mesent&eacute;ricos y entran directamente en la vena cava"},{"id":"9549","text":"La circulaci&oacute;n sist&eacute;mica y pulmonar son circuitos conectados en paralelo"}]',
  '9548',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x43-0000-4000-b000-000000009147',
  'c000149-0000-4000-b000-000000009103',
  'Con respecto a la precarga ventricular, se&ntilde;ala la afirmaci&oacute;n incorrecta.',
  43,
  '[{"id":"9551","text":"La precarga se define como el volumen de sangre que hay dentro de un ventr&iacute;culo durante el llenado diast&oacute;lico"},{"id":"9550","text":"Al final de la di&aacute;stole la presi&oacute;n auricular derecha y la de la vena cava son medidas esencialmente equivalentes a las de la precarga ventricular derecha"},{"id":"9552","text":"La ley de Starling proponen que un aumento de la precarga conduce a un aumento de la fuerza de contracci&oacute;n"}]',
  '9551',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x44-0000-4000-b000-000000009148',
  'c000149-0000-4000-b000-000000009103',
  'Se&ntilde;ala la afirmaci&oacute;n incorrecta',
  44,
  '[{"id":"9554","text":"La aorta es m&aacute;s adaptable que la vena cava puesto que soporta presiones m&aacute;s altas"},{"id":"9553","text":"Las arteriolas poseen c&eacute;lulas musculares en su pared que permiten su contracci&oacute;n"},{"id":"9555","text":"Las anastomosis arteriovenosas son abundantes en la piel y tienen un papel importante en la termorregulaci&oacute;n"}]',
  '9554',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x45-0000-4000-b000-000000009149',
  'c000149-0000-4000-b000-000000009103',
  'Con respecto a los capilares. Se&ntilde;ala la opci&oacute;n incorrecta',
  45,
  '[{"id":"9556","text":"El &iacute;ndice de difusi&oacute;n de una sustancia es inversamente proporcional a la diferencia de concentraci&oacute;n entre el capilar y el l&iacute;quido intersticial"},{"id":"9557","text":"La barrera hematoencef&aacute;lica constituye una red de capilares donde la glucosa no puede atravesarlos si no es a trav&eacute;s de un transportador especifico"},{"id":"9558","text":"Durante la fase el ejercicio la difusi&oacute;n del ox&iacute;geno aumenta debido a que la distancia entre cada fibra musculoesquel&eacute;tica y el capilar m&aacute;s pr&oacute;ximo disminuye, entre otros factores"}]',
  '9556',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x46-0000-4000-b000-000000009150',
  'c000149-0000-4000-b000-000000009103',
  'Se&ntilde;alar la afirmaci&oacute;n incorrecta.',
  46,
  '[{"id":"9560","text":"Si disminuye la presi&oacute;n onc&oacute;tica en un capilar aumenta la tasa de absorci&oacute;n"},{"id":"9559","text":"Si aumenta la presi&oacute;n hidrost&aacute;tica de un capilar se favorece de una mayor filtraci&oacute;n de agua"},{"id":"9561","text":"Si el drenaje por parte de los vasos linf&aacute;ticos es deficiente aumenta la presi&oacute;n del l&iacute;quido intersticial"}]',
  '9560',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x47-0000-4000-b000-000000009151',
  'c000149-0000-4000-b000-000000009103',
  'Con respecto a la precarga ventricular, la afirmaci&oacute;n incorrecta:',
  47,
  '[{"id":"9564","text":"La precarga se define como el volumen de sangre que hay dentro de un ventr&iacute;culo durante el llenado diast&oacute;lico"},{"id":"9563","text":"Al final de la di&aacute;stole la presi&oacute;n auricular derecha y la de la vena cava son medidas esencialmente equivalentes a las de la precarga ventricular derecha"},{"id":"9565","text":"La ley de Starling propone que un aumento de la precarga conduce a un aumento de la fuerza de contracci&oacute;n"}]',
  '9564',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x48-0000-4000-b000-000000009152',
  'c000149-0000-4000-b000-000000009103',
  'Se&ntilde;ala la afirmaci&oacute;n incorrecta',
  48,
  '[{"id":"9567","text":"Si disminuye la presi&oacute;n oncotica de un capilar aumenta la tasa de absorci&oacute;n"},{"id":"9566","text":"Si aumenta la presi&oacute;n hidrost&aacute;tica de un capilar se favorece una mayor filtraci&oacute;n de agua"},{"id":"9568","text":"Si el drenaje por parte de los vasos linf&aacute;ticos es deficiente aumenta la presi&oacute;n del liquido intersticial"}]',
  '9567',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x49-0000-4000-b000-000000009153',
  'c000149-0000-4000-b000-000000009103',
  'Con respecto a las c&eacute;lulas musculares cardiacas y esquel&eacute;ticas. Se&ntilde;ala la afirmaci&oacute;n correcta:',
  49,
  '[{"id":"9571","text":"El fen&oacute;meno de sumaci&oacute;n temporal puede darse en las fibras musculares esquel&eacute;ticas pero no en las cardiacas."},{"id":"9569","text":"Las c&eacute;lulas musculares esquel&eacute;ticas tienen un periodo refractario m&aacute;s prolongado que las c&eacute;lulas musculares cardiacas"},{"id":"9570","text":"Las c&eacute;lulas musculares esquel&eacute;ticas est&aacute;n el&eacute;ctricamente conectadas por disco intercalares o uniones GAP"}]',
  '9571',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x50-0000-4000-b000-000000009154',
  'c000149-0000-4000-b000-000000009103',
  'Se&ntilde;ala la afirmaci&oacute;n correcta:',
  50,
  '[{"id":"9573","text":"Las fibras musculares auriculares y ventriculares est&aacute;n separadas por un anillo fibroso"},{"id":"9572","text":"El circuito sist&eacute;mico y pulmonar funciona simult&aacute;nea y paralelamente"},{"id":"9574","text":"La aorta tiene una pared poco el&aacute;stica"}]',
  '9573',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x51-0000-4000-b000-000000009155',
  'c000149-0000-4000-b000-000000009103',
  'Con respecto a las fibras musculares cardiacas. Se&ntilde;ala la afirmaci&oacute;n incorrecta:',
  51,
  '[{"id":"9577","text":"Las c&eacute;lulas nerviosas que conforman el marcapasos del coraz&oacute;n son las c&eacute;lulas del n&oacute;dulo sinusal"},{"id":"9575","text":"Las fibras musculares espec&iacute;ficas son capaces de generar espont&aacute;neamente potenciales de acci&oacute;n"},{"id":"9576","text":"Las fibras musculares espec&iacute;ficas presentan una curva de potencial de acci&oacute;n diferente a la de las fibras musculares no espec&iacute;ficas"}]',
  '9577',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x52-0000-4000-b000-000000009156',
  'c000149-0000-4000-b000-000000009103',
  'Con respecto al tema cardiaco y circulatorio. Se&ntilde;ala la afirmaci&oacute;n correcta:',
  52,
  '[{"id":"9580","text":"El epicardio es la capa del pericardio visceral que reviste el coraz&oacute;n"},{"id":"9578","text":"La v&aacute;lvula tric&uacute;spide se encuentra entre el atrio izquierdo y el ventr&iacute;culo izquierdo"},{"id":"9579","text":"La vena porta est&aacute; formado por la confluencia de las venas mesent&eacute;rica, espl&eacute;cnica, g&aacute;stricas y renales."},{"id":"9581","text":"La v&aacute;lvula pulmonar se encuentra entre la vena cava y el atrio derecho"}]',
  '9580',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x53-0000-4000-b000-000000009157',
  'c000149-0000-4000-b000-000000009103',
  'Con respecto al ciclo cardiaco. Se&ntilde;ale la afirmaci&oacute;n correcta:',
  53,
  '[{"id":"9583","text":"El cierre de la v&aacute;lvula a&oacute;rtica se corresponde con el inicio del periodo de relajaci&oacute;n isovolum&eacute;trico"},{"id":"9582","text":"El segundo ruido cardiaco corresponde con el cierre de la v&aacute;lvula auriculoventricular"},{"id":"9584","text":"La onda R se corresponde con el periodo de eyecci&oacute;n lento"},{"id":"9585","text":"La s&iacute;stole auricular aportar m&aacute;s del 60% del volumen telediast&oacute;lico"}]',
  '9583',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x54-0000-4000-b000-000000009158',
  'c000149-0000-4000-b000-000000009103',
  'Con respecto a las fuerzas de Starling. Se&ntilde;ale la afirmaci&oacute;n correcta:',
  54,
  '[{"id":"9587","text":"Si disminuye la presi&oacute;n onc&oacute;tica del capilar se favorece la filtraci&oacute;n de agua"},{"id":"9586","text":"Si aumenta la permeabilidad vascular se favorece la absorci&oacute;n de agua"},{"id":"9588","text":"Si aumenta la presi&oacute;n hidrost&aacute;tica del capilar se favorece la absorci&oacute;n de agua"},{"id":"9589","text":"Si aumenta la presi&oacute;n onc&oacute;tica del intersticio se favorece la absorci&oacute;n de agua"}]',
  '9587',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x55-0000-4000-b000-000000009159',
  'c000149-0000-4000-b000-000000009103',
  'Con respecto a la fisiolog&iacute;a de los vasos sangu&iacute;neos. Se&ntilde;ala la afirmaci&oacute;n correcta:',
  55,
  '[{"id":"9592","text":"La distensi&oacute;n de las venas es mucho mayor que la de las arterias"},{"id":"9590","text":"Las arterias son reservorios de volumen"},{"id":"9591","text":"Las arteriolas poseen paredes el&aacute;sticas que permiten su contracci&oacute;n"},{"id":"9593","text":"La aorta es m&aacute;s adaptable que la vena cava y soporta presiones m&aacute;s altas"}]',
  '9592',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x56-0000-4000-b000-000000009160',
  'c000149-0000-4000-b000-000000009103',
  'Con respecto a las fases de despolarizaci&oacute;n de las c&eacute;lulas musculares cardiacas. Se&ntilde;ala la afirmaci&oacute;n correcta:',
  56,
  '[{"id":"9596","text":"En la fase 2 muchos de los canales de calcio se abren y la permeabilidad al calcio aumenta"},{"id":"9594","text":"En la fase 0 se produce la salida r&aacute;pida de sodio de la c&eacute;lula"},{"id":"9595","text":"En la fase 1 los canales de sodio se abren y la membrana comienza la repolarizaci&oacute;n"},{"id":"9597","text":"En la fase 3 se producen una disminuci&oacute;n de la salida del potasio de la c&eacute;lula"}]',
  '9596',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x57-0000-4000-b000-000000009161',
  'c000149-0000-4000-b000-000000009103',
  'Con respecto a la regulaci&oacute;n de la funci&oacute;n card&iacute;aca. Se&ntilde;ala la afirmaci&oacute;n incorrecta:',
  57,
  '[{"id":"9598","text":"la ley de Frank Starling establece que el gasto card&iacute;aco disminuye al aumentar el grado de estiramiento diast&oacute;lico de las fibras musculares"},{"id":"9599","text":"la llegada de sangre venosa al coraz&oacute;n desde las extremidades posteriores se debe a la existencia de la llamada bomba venosa o muscular"},{"id":"9600","text":"un aumento de la frecuencia card&iacute;aca puede aumentar el gasto card&iacute;aco"}]',
  '9598',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x58-0000-4000-b000-000000009162',
  'c000149-0000-4000-b000-000000009103',
  'Seg&uacute;n las leyes de equilibrio de Starling, la presi&oacute;n neta del agua sin tener en cuenta la permeabilidad de la pared capilar es de 1 mmHg &iquest;Qu&eacute; fen&oacute;meno genera esta peque&ntilde;a diferencia y cu&aacute;l es el resultado final respecto al movimiento del agua en los capilares?',
  58,
  '[{"id":"9601","text":"La presi&oacute;n hidrost&aacute;tica excede ligeramente la presi&oacute;n onc&oacute;tica favoreciendo la filtraci&oacute;n"},{"id":"9602","text":"La presi&oacute;n onc&oacute;tica excede ligeramente la presi&oacute;n hidrost&aacute;tica favoreciendo la reabsorci&oacute;n"},{"id":"9603","text":"La presi&oacute;n hidrost&aacute;tica excede ligeramente la presi&oacute;n onc&oacute;tica favoreciendo la reabsorci&oacute;n"},{"id":"9604","text":"La presi&oacute;n onc&oacute;tica excede ligeramente la presi&oacute;n hidrost&aacute;tica favoreciendo la filtraci&oacute;n"}]',
  '9601',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x59-0000-4000-b000-000000009163',
  'c000149-0000-4000-b000-000000009103',
  'Con respecto a la regulaci&oacute;n de la funci&oacute;n cardiaca. Se&ntilde;ala la afirmaci&oacute;n incorrecta.',
  59,
  '[{"id":"9605","text":"La ley de Frank Starling establece que el gasto cardiaco disminuye al aumentar el grado de estiramiento diast&oacute;lico de las fibras musculares"},{"id":"9606","text":"La llegada de la sangre venosa al coraz&oacute;n desde las extremidades posteriores se debe a la existencia de la llamada bomba venosa o muscular"},{"id":"9607","text":"Un aumento de la frecuencia card&iacute;aca puede aumentar el gasto cardiaco"}]',
  '9605',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x60-0000-4000-b000-000000009164',
  'c000149-0000-4000-b000-000000009103',
  'Con respecto al control local de la circulaci&oacute;n, se&ntilde;ala cu&aacute;l de las siguientes opciones favorece la vasodilataci&oacute;n (en el tejido no pulmonar):',
  60,
  '[{"id":"9611","text":"Disminuci&oacute;n de la presi&oacute;n parcial de oxigeno"},{"id":"9608","text":"Disminuci&oacute;n de la presi&oacute;n parcial de CO2"},{"id":"9609","text":"Disminuci&oacute;n de la adenosina"},{"id":"9610","text":"Disminuci&oacute;n al potasio"}]',
  '9611',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x61-0000-4000-b000-000000009165',
  'c000149-0000-4000-b000-000000009103',
  'Con respecto a la fisiolog&iacute;a de los vasos sangu&iacute;neos se&ntilde;ala la afirmaci&oacute;n correcta:',
  61,
  '[{"id":"9612","text":"Las venas son reservorios de volumen."},{"id":"9613","text":"Las arteriolas poseen paredes el&aacute;sticas provistas de un alto contenido en col&aacute;geno que permite su contracci&oacute;n."},{"id":"9614","text":"La distensibilidad de las arterias es mucho mayor que la de las venas."},{"id":"9615","text":"La aorta es m&aacute;s adaptable que la vena cava, y soporta presiones m&aacute;s altas."}]',
  '9612',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x62-0000-4000-b000-000000009166',
  'c000149-0000-4000-b000-000000009103',
  'Cuando el animal tiene calor:',
  62,
  '[{"id":"9618","text":"Disminuye el volumen tidal y aumenta la frecuencia."},{"id":"9616","text":"Aumenta el volumen tidal y disminuye la frecuencia."},{"id":"9617","text":"Aumenta el volumen tidal y la frecuencia respiratoria."}]',
  '9618',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x63-0000-4000-b000-000000009167',
  'c000149-0000-4000-b000-000000009103',
  'Cuando se incrementa el metabolismo celular y aumenta la temperatura:',
  63,
  '[{"id":"9619","text":"La presi&oacute;n de O2 debe ser mayor para facilitar la llegada de O2 a los tejidos."},{"id":"9620","text":"La presi&oacute;n de O2 debe ser menor para facilitar la llegada de O2 a los tejidos."},{"id":"9621","text":"La temperatura no modifica la llegada de O2 a los tejidos."}]',
  '9619',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x64-0000-4000-b000-000000009168',
  'c000149-0000-4000-b000-000000009103',
  'La membrana que rodea y protege al coraz&oacute;n se denomina:',
  64,
  '[{"id":"9622","text":"pericardio."},{"id":"9623","text":"pleura."},{"id":"9624","text":"miocardio."},{"id":"9625","text":"Mediastino"}]',
  '9622',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x65-0000-4000-b000-000000009169',
  'c000149-0000-4000-b000-000000009103',
  'Esto sirve para reducir la fricci&oacute;n entre las capas de membranas que rodean al coraz&oacute;n:',
  65,
  '[{"id":"9629","text":"l&iacute;quido peric&aacute;rdico"},{"id":"9626","text":"l&iacute;quido sinovial"},{"id":"9627","text":"endocardio"},{"id":"9628","text":"l&iacute;quido pleural"},{"id":"9630","text":"epitelio capilar"}]',
  '9629',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x66-0000-4000-b000-000000009170',
  'c000149-0000-4000-b000-000000009103',
  '&iquest;Por qu&eacute; estructura pasa la sangre desde la aur&iacute;cula derecha hacia el ventr&iacute;culo derecho?',
  66,
  '[{"id":"9633","text":"V&aacute;lvula tric&uacute;spide"},{"id":"9631","text":"V&aacute;lvula bic&uacute;spide"},{"id":"9632","text":"Tabique interventricular"},{"id":"9634","text":"V&aacute;lvula mitral"},{"id":"9635","text":"Aorta ascendente"}]',
  '9633',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x67-0000-4000-b000-000000009171',
  'c000149-0000-4000-b000-000000009103',
  'La sangre que sale del ventr&iacute;culo izquierdo pasa &iquest;por cu&aacute;l de las siguientes estructuras?',
  67,
  '[{"id":"9639","text":"V&aacute;lvula semilunar a&oacute;rtica"},{"id":"9636","text":"Aur&iacute;cula derecha"},{"id":"9637","text":"Tabique interventricular"},{"id":"9638","text":"V&aacute;lvula bic&uacute;spide"},{"id":"9640","text":"V&aacute;lvula semilunar pulmonar"}]',
  '9639',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x68-0000-4000-b000-000000009172',
  'c000149-0000-4000-b000-000000009103',
  '&iquest;Qu&eacute; v&aacute;lvula impide que la sangre refluya hacia el ventr&iacute;culo derecho?',
  68,
  '[{"id":"9643","text":"V&aacute;lvula semilunar pulmonar"},{"id":"9641","text":"V&aacute;lvula tric&uacute;spide"},{"id":"9642","text":"V&aacute;lvula bic&uacute;spide"},{"id":"9644","text":"V&aacute;lvula semilunar a&oacute;rtica"},{"id":"9645","text":"V&aacute;lvula mitral"}]',
  '9643',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x69-0000-4000-b000-000000009173',
  'c000149-0000-4000-b000-000000009103',
  '&iquest;Cu&aacute;l de las siguientes opciones enumera correctamente la secuencia de estructuras que un potencial de acci&oacute;n card&iacute;aco sigue para excitar la contracci&oacute;n normal del coraz&oacute;n?',
  69,
  '[{"id":"9649","text":"Nodo SA, nodo AV, haz de His, fibras de Purkinje"},{"id":"9646","text":"Haz de His, fibras de Purkinje, nodo auriculoventricular (AV)"},{"id":"9647","text":"Nodo sinoauricular (SA), fibras de Purkinje, nodo AV, haz de His"},{"id":"9648","text":"Fibras de Purkinje, nodo AV, nodo SA, haz de His"},{"id":"9650","text":"Haz de His, nodo SA, nodo AV, fibras de Purkinje"}]',
  '9649',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x70-0000-4000-b000-000000009174',
  'c000149-0000-4000-b000-000000009103',
  'En comparaci&oacute;n con las fibras musculares esquel&eacute;ticas, las fibras contr&aacute;ctiles del coraz&oacute;n se despolarizan por un per&iacute;odo ____',
  70,
  '[{"id":"9652","text":"m&aacute;s largo"},{"id":"9651","text":"m&aacute;s corto"},{"id":"9653","text":"el mismo"}]',
  '9652',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x71-0000-4000-b000-000000009175',
  'c000149-0000-4000-b000-000000009103',
  'El volumen de sangre expulsado del ventr&iacute;culo izquierdo hacia la aorta por minuto se denomina:',
  71,
  '[{"id":"9654","text":"gasto card&iacute;aco."},{"id":"9655","text":"estimulo card&iacute;aco."},{"id":"9656","text":"volumen sist&oacute;lico."},{"id":"9657","text":"frecuencia card&iacute;aca."},{"id":"9658","text":"presi&oacute;n del pulso"}]',
  '9654',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x72-0000-4000-b000-000000009176',
  'c000149-0000-4000-b000-000000009103',
  'Este t&eacute;rmino se refiere al per&iacute;odo durante un ciclo card&iacute;aco cuando se produce la contracci&oacute;n de una c&aacute;mara y la presi&oacute;n dentro de la c&aacute;mara se eleva:',
  72,
  '[{"id":"9660","text":"s&iacute;stole"},{"id":"9659","text":"llenado"},{"id":"9661","text":"repolarizaci&oacute;n"},{"id":"9662","text":"di&aacute;stole"},{"id":"9663","text":"fibrilaci&oacute;n"}]',
  '9660',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x73-0000-4000-b000-000000009177',
  'c000149-0000-4000-b000-000000009103',
  'Esta estructura del coraz&oacute;n desencadena potenciales de acci&oacute;n que estimulan la contracci&oacute;n del coraz&oacute;n a un ritmo constante de unos 90-100 latidos por minuto:',
  73,
  '[{"id":"9667","text":"Nodo sinoauricular"},{"id":"9664","text":"Nervio acelerador card&iacute;aco"},{"id":"9665","text":"Nodo auriculoventricular"},{"id":"9666","text":"Centro cardiovascular"},{"id":"9668","text":"Haz de His"}]',
  '9667',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x74-0000-4000-b000-000000009178',
  'c000149-0000-4000-b000-000000009103',
  'La estimulaci&oacute;n de este nervio reduce la frecuencia card&iacute;aca:',
  74,
  '[{"id":"9672","text":"nervio vago"},{"id":"9669","text":"nervio acelerador card&iacute;aco"},{"id":"9670","text":"nervio hipogloso"},{"id":"9671","text":"accesorio espinal"},{"id":"9673","text":"nervio fr&eacute;nico"}]',
  '9672',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x75-0000-4000-b000-000000009179',
  'c000149-0000-4000-b000-000000009103',
  'Esta parte del enc&eacute;falo contiene el centro cardiovascular que regula la frecuencia card&iacute;aca:',
  75,
  '[{"id":"9676","text":"bulbo"},{"id":"9674","text":"mesenc&eacute;falo"},{"id":"9675","text":"cerebro"},{"id":"9677","text":"cerebelo"},{"id":"9678","text":"t&aacute;lamo"}]',
  '9676',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x76-0000-4000-b000-000000009180',
  'c000149-0000-4000-b000-000000009103',
  '&iquest;Qu&eacute; onda del electrocardiograma representa la repolarizaci&oacute;n de los ventr&iacute;culos?',
  76,
  '[{"id":"9680","text":"onda T"},{"id":"9679","text":"onda R"},{"id":"9681","text":"onda S"},{"id":"9682","text":"onda P"},{"id":"9683","text":"onda Q"}]',
  '9680',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x77-0000-4000-b000-000000009181',
  'c000149-0000-4000-b000-000000009103',
  '&iquest;Cu&aacute;l de las siguientes ondas del electrocardiograma (ECG) representa la despolarizaci&oacute;n auricular?',
  77,
  '[{"id":"9687","text":"onda P"},{"id":"9684","text":"onda R"},{"id":"9685","text":"onda T"},{"id":"9686","text":"onda S"},{"id":"9688","text":"onda Q"}]',
  '9687',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x78-0000-4000-b000-000000009182',
  'c000149-0000-4000-b000-000000009103',
  'Contracci&oacute;n isovolum&eacute;trica es la fase del ciclo card&iacute;aco en el cual:',
  78,
  '[{"id":"9693","text":"aumenta la presi&oacute;n ventricular y el volumen ventricular permanece igual."},{"id":"9689","text":"se abren las v&aacute;lvulas semilunares."},{"id":"9690","text":"se produce la repolarizaci&oacute;n ventricular."},{"id":"9691","text":"se produce la despolarizaci&oacute;n auricular."},{"id":"9692","text":"la sangre oxigenada sale del coraz&oacute;n hacia la circulaci&oacute;n sist&eacute;mica."}]',
  '9693',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x79-0000-4000-b000-000000009183',
  'c000149-0000-4000-b000-000000009103',
  'Las arterias el&aacute;sticas funcionan como:',
  79,
  '[{"id":"9697","text":"reservorios de presi&oacute;n."},{"id":"9694","text":"vasodilatadores."},{"id":"9695","text":"conducen solo hacia los tejidos del tronco."},{"id":"9696","text":"barreras a la microcirculaci&oacute;n."},{"id":"9698","text":"vasoconstrictores."}]',
  '9697',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x80-0000-4000-b000-000000009184',
  'c000149-0000-4000-b000-000000009103',
  'En individuos en reposo, estos vasos sirven como un reservorio grande de sangre del cual se puede enviar sangre r&aacute;pidamente cuando hace falta:',
  80,
  '[{"id":"9702","text":"venas y v&eacute;nulas"},{"id":"9699","text":"arterias y arteriolas"},{"id":"9700","text":"arteriolas y capilares"},{"id":"9701","text":"v&eacute;nulas y capilares"},{"id":"9703","text":"aorta y venas"}]',
  '9702',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x81-0000-4000-b000-000000009185',
  'c000149-0000-4000-b000-000000009103',
  '&iquest;Cu&aacute;l de las siguientes estructuras se hallan en las venas pero NO en las arterias?',
  81,
  '[{"id":"9707","text":"v&aacute;lvula"},{"id":"9704","text":"t&uacute;nica externa"},{"id":"9705","text":"t&uacute;nica media"},{"id":"9706","text":"t&uacute;nica interna"},{"id":"9708","text":"luz"}]',
  '9707',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x82-0000-4000-b000-000000009186',
  'c000149-0000-4000-b000-000000009103',
  '&iquest;Cu&aacute;l de las siguientes es el mecanismo m&aacute;s importante de intercambio capilar?',
  82,
  '[{"id":"9709","text":"difusi&oacute;n"},{"id":"9710","text":"transcitosis"},{"id":"9711","text":"flujo volum&eacute;trico"},{"id":"9712","text":"transporte activo primario"},{"id":"9713","text":"transporte activo secundario"}]',
  '9709',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x83-0000-4000-b000-000000009187',
  'c000149-0000-4000-b000-000000009103',
  'El gasto card&iacute;aco depende de dos cosas',
  83,
  '[{"id":"9714","text":"frecuencia card&iacute;aca y volumen sist&oacute;lico."},{"id":"9715","text":"volumen sist&oacute;lico y resistencia vascular sist&eacute;mica."},{"id":"9716","text":"frecuencia card&iacute;aca y resistencia vascular sist&eacute;mica."},{"id":"9717","text":"tipo de sangre y volumen sist&oacute;lico."},{"id":"9718","text":"presi&oacute;n arterial y frecuencia card&iacute;aca."}]',
  '9714',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x84-0000-4000-b000-000000009188',
  'c000149-0000-4000-b000-000000009103',
  '&iquest;Cu&aacute;l de las siguientes opciones NO producir&iacute;a un aumento de la presi&oacute;n arterial?',
  84,
  '[{"id":"9723","text":"Aumento de la vasodilataci&oacute;n arteriolar"},{"id":"9719","text":"Aumento del volumen sangu&iacute;neo"},{"id":"9720","text":"Aumento de la estimulaci&oacute;n simp&aacute;tica"},{"id":"9721","text":"Aumento de la frecuencia card&iacute;aca"},{"id":"9722","text":"Aumento del volumen sist&oacute;lico"}]',
  '9723',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x85-0000-4000-b000-000000009189',
  'c000149-0000-4000-b000-000000009103',
  '&iquest;Cu&aacute;l de las siguientes caracter&iacute;sticas de la sangre depende en gran parte de la relaci&oacute;n de la cantidad de gl&oacute;bulos rojos con el volumen plasm&aacute;tico?',
  85,
  '[{"id":"9725","text":"viscosidad de la sangre"},{"id":"9724","text":"volumen sangu&iacute;neo total"},{"id":"9726","text":"retorno venoso"},{"id":"9727","text":"tiempo de coagulaci&oacute;n"},{"id":"9728","text":"perfil de las inmunoglobulinas"}]',
  '9725',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x86-0000-4000-b000-000000009190',
  'c000149-0000-4000-b000-000000009103',
  '&iquest;Cu&aacute;l de las siguientes opciones NO producir&iacute;a un aumento de la resistencia vascular sist&eacute;mica?',
  86,
  '[{"id":"9731","text":"Disminuci&oacute;n de la longitud de la v&iacute;a circulatoria sist&eacute;mica"},{"id":"9729","text":"Disminuci&oacute;n del di&aacute;metro de las arteriolas sist&eacute;micas"},{"id":"9730","text":"Aumento de la viscosidad de la sangre"},{"id":"9732","text":"Aumento de la vasoconstricci&oacute;n de las arteriolas sist&eacute;micas"},{"id":"9733","text":"Aumento de la cantidad de gl&oacute;bulos rojos"}]',
  '9731',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x87-0000-4000-b000-000000009191',
  'c000149-0000-4000-b000-000000009103',
  'Todas las opciones que siguen ayudan al retorno venoso de la sangre hacia el coraz&oacute;n EXCEPTO:',
  87,
  '[{"id":"9736","text":"viscosidad de la sangre."},{"id":"9734","text":"la bomba de m&uacute;sculo esquel&eacute;tico."},{"id":"9735","text":"la bomba respiratoria."},{"id":"9737","text":"venoconstricci&oacute;n"},{"id":"9738","text":"v&aacute;lvulas venosas."}]',
  '9736',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x88-0000-4000-b000-000000009192',
  'c000149-0000-4000-b000-000000009103',
  'Cuando los quimiorreceptores de los vasos sangu&iacute;neos detectan niveles elevados de di&oacute;xido de carbono en la sangre, estimulan todos los siguientes cambios EXCEPTO:',
  88,
  '[{"id":"9741","text":"disminuci&oacute;n del la frecuencia respiratoria."},{"id":"9739","text":"Aumento de vasoconstricci&oacute;n de las arteriolas."},{"id":"9740","text":"Aumento de la presi&oacute;n arterial."},{"id":"9742","text":"Aumento de la estimulaci&oacute;n simp&aacute;tica de arteriolas y venas."},{"id":"9743","text":"Aumento de la vasoconstricci&oacute;n venosa."}]',
  '9741',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x89-0000-4000-b000-000000009193',
  'c000149-0000-4000-b000-000000009103',
  '&iquest;Qu&eacute; tienen en com&uacute;n las siguientes sustancias qu&iacute;micas: potasio, iones de hidr&oacute;geno, &aacute;cido l&aacute;ctico, &oacute;xido n&iacute;trico y adenosina?',
  89,
  '[{"id":"9745","text":"Todos son vasodilatadores potentes."},{"id":"9744","text":"Todos son vasoconstrictores potentes."},{"id":"9746","text":"Sirven para estimular las contracciones pulmonares."},{"id":"9747","text":"Regulan directamente el centro card&iacute;aco del hipot&aacute;lamo."},{"id":"9748","text":"Disminuyen la presi&oacute;n sangu&iacute;nea sist&oacute;lica."}]',
  '9745',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x90-0000-4000-b000-000000009194',
  'c000149-0000-4000-b000-000000009103',
  'Todas las venas de la circulaci&oacute;n sist&eacute;mica finalmente drenan hacia:',
  90,
  '[{"id":"9753","text":"vena cava superior y inferior, y seno coronario."},{"id":"9749","text":"vena cava superior."},{"id":"9750","text":"vena cava inferior."},{"id":"9751","text":"seno coronario."},{"id":"9752","text":"vena cava superior e inferior."}]',
  '9753',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x91-0000-4000-b000-000000009195',
  'c000149-0000-4000-b000-000000009103',
  '&iquest;Cu&aacute;l de las siguientes efectores NO se activar&iacute;a como se describe abajo en respuesta al shock hipovol&eacute;mico?',
  91,
  '[{"id":"9757","text":"Las arteriolas sist&eacute;micas se vasodilatan."},{"id":"9754","text":"La corteza suprarrenal libera aldosterona."},{"id":"9755","text":"Los ri&ntilde;ones conservan sal y agua."},{"id":"9756","text":"La frecuencia card&iacute;aca aumenta."},{"id":"9758","text":"La contractilidad card&iacute;aca aumenta."}]',
  '9757',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x92-0000-4000-b000-000000009196',
  'c000149-0000-4000-b000-000000009103',
  'La v&iacute;a circulatoria pulmonar transporta sangre desde:',
  92,
  '[{"id":"9760","text":"el ventr&iacute;culo derecho hacia la aur&iacute;cula izquierda."},{"id":"9759","text":"la aur&iacute;cula derecha hacia el ventr&iacute;culo derecho."},{"id":"9761","text":"la aur&iacute;cula izquierda hacia el ventr&iacute;culo izquierdo."},{"id":"9762","text":"el ventr&iacute;culo izquierdo hacia la aur&iacute;cula derecha."},{"id":"9763","text":"el ventr&iacute;culo izquierdo hacia el seno coronario."}]',
  '9760',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x93-0000-4000-b000-000000009197',
  'c000149-0000-4000-b000-000000009103',
  '&iquest;A qu&eacute; son sensibles los cuerpos carot&iacute;deos y a&oacute;rticos?',
  93,
  '[{"id":"9765","text":"A la ca&iacute;da de la saturaci&oacute;n de O2"},{"id":"9764","text":"Para su vida de la PCO2"},{"id":"9766","text":"A la calidad de la PO2"},{"id":"9767","text":"A la subida de pH"}]',
  '9765',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x94-0000-4000-b000-000000009198',
  'c000149-0000-4000-b000-000000009103',
  'Seg&uacute;n la ley de Fick, para una presi&oacute;n onc&oacute;tica medida de 19 mmHg y una presi&oacute;n hidrost&aacute;tica neta de 20 mmHg el resultado de la diferencia de presiones ser&iacute;a:',
  94,
  '[{"id":"9771","text":"1 mmHg a favor de la presi&oacute;n hidrost&aacute;tica, favoreciendo la filtraci&oacute;n"},{"id":"9768","text":"-1 mmHg a favor de la presi&oacute;n hidrost&aacute;tica, favoreciendo la filtraci&oacute;n"},{"id":"9769","text":"-1 mmHg a favor de la presi&oacute;n hidrost&aacute;tica, favoreciendo la reabsorci&oacute;n"},{"id":"9770","text":"1 mmHg a favor de la presi&oacute;n hidrost&aacute;tica, favoreciendo la reabsorci&oacute;n"}]',
  '9771',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x95-0000-4000-b000-000000009199',
  'c000149-0000-4000-b000-000000009103',
  'Se&ntilde;ala el orden correcto de las diferentes capas del coraz&oacute;n de la m&aacute;s externa la m&aacute;s interna:',
  95,
  '[{"id":"9774","text":"Pericardio parietal, l&iacute;quido peric&aacute;rdico, epicardio, miocardio y endocardio"},{"id":"9772","text":"Epicardio, pericardio parietal, l&iacute;quido peric&aacute;rdico, miocardio y endocardio"},{"id":"9773","text":"Epicardio, l&iacute;quido peric&aacute;rdico, pericardio parietal, epicardio, miocardio y endocardio"},{"id":"9775","text":"Miocardio parietal, epicardio, l&iacute;quido peric&aacute;rdico, miocardio y endocardio"}]',
  '9774',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x96-0000-4000-b000-000000009200',
  'c000149-0000-4000-b000-000000009103',
  'Con respecto al dise&ntilde;o de la circulaci&oacute;n. Se&ntilde;ala la afirmaci&oacute;n correcta:',
  96,
  '[{"id":"9777","text":"La circulaci&oacute;n pulmonar y sist&eacute;mica funcionan de manera simult&aacute;nea"},{"id":"9776","text":"La circulaci&oacute;n sist&eacute;mica es un circuito de baja presi&oacute;n"},{"id":"9778","text":"La circulaci&oacute;n sist&eacute;mica y pulmonar est&aacute;n dispuestas en paralelo"},{"id":"9779","text":"El patr&oacute;n de ramificaci&oacute;n arterial que entrega la sangre a cada uno de los &oacute;rganos est&aacute; dispuesto en serio"}]',
  '9777',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x97-0000-4000-b000-000000009201',
  'c000149-0000-4000-b000-000000009103',
  'Ciclo cardiaco. El segundo sonido cardiaco se corresponde con:',
  97,
  '[{"id":"9783","text":"El inicio del periodo de relajaci&oacute;n isovolum&eacute;trica"},{"id":"9780","text":"El final del periodo de eyecci&oacute;n r&aacute;pido"},{"id":"9781","text":"El final de la di&aacute;stasis"},{"id":"9782","text":"El cierre de las v&aacute;lvulas atrioventriculares"}]',
  '9783',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x98-0000-4000-b000-000000009202',
  'c000149-0000-4000-b000-000000009103',
  'Con respecto a la anastomosis arteriovenosa. Se&ntilde;ala la afirmaci&oacute;n correcta:',
  98,
  '[{"id":"9787","text":"Su funci&oacute;n principal es la termorregulaci&oacute;n"},{"id":"9784","text":"Forma parte de la barrera y mat&oacute; cef&aacute;lica"},{"id":"9785","text":"No se encuentran pr&aacute;cticamente en la piel"},{"id":"9786","text":"Son importantes el intercambio de glucosa al cerebro"}]',
  '9787',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x99-0000-4000-b000-000000009203',
  'c000149-0000-4000-b000-000000009103',
  'El inotropismo hace referencia a:',
  99,
  '[{"id":"9788","text":"La fuerza de contracci&oacute;n cardiaca"},{"id":"9789","text":"La tensi&oacute;n muscular del coraz&oacute;n"},{"id":"9790","text":"Propagaci&oacute;n de la excitaci&oacute;n cardiaca"},{"id":"9791","text":"Excitabilidad del coraz&oacute;n"}]',
  '9788',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x100-0000-4000-b000-000000009204',
  'c000149-0000-4000-b000-000000009103',
  'Indica cu&aacute;l de los siguientes &oacute;rganos tienen fundamentalmente control local de la presi&oacute;n arterial:',
  100,
  '[{"id":"9795","text":"Ri&ntilde;&oacute;n"},{"id":"9792","text":"Coraz&oacute;n"},{"id":"9793","text":"Intestino"},{"id":"9794","text":"M&uacute;sculo esquel&eacute;tico"}]',
  '9795',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x101-0000-4000-b000-000000009205',
  'c000149-0000-4000-b000-000000009103',
  'La fase 4 del potencial de acci&oacute;n de una c&eacute;lula especializada en la conducci&oacute;n se caracteriza por:',
  101,
  '[{"id":"9796","text":"Es una fase de reposo con el potencial de membrana negativo"},{"id":"9797","text":"Apertura de los canales de calcio lento"},{"id":"9798","text":"Cierre de los canales de sodio r&aacute;pido"},{"id":"9799","text":"La p&eacute;rdida de los canales de sodio r&aacute;pido"}]',
  '9796',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x102-0000-4000-b000-000000009206',
  'c000149-0000-4000-b000-000000009103',
  'Entiendo que segu&iacute;a comienzo de un potencial de acci&oacute;n durante el cual otro potencial de acci&oacute;n no puede comenzar, por intenso que sean, se le denomina:',
  102,
  '[{"id":"9800","text":"Ped&iacute;a refractario absoluto"},{"id":"9801","text":"Dromotropismo"},{"id":"9802","text":"Conductividad cardiaca"},{"id":"9803","text":"Periodo refractario relativo"}]',
  '9800',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x103-0000-4000-b000-000000009207',
  'c000149-0000-4000-b000-000000009103',
  'El aumento de la resistencia arteriolar en un &oacute;rgano provoca:',
  103,
  '[{"id":"9805","text":"Disminuci&oacute;n del aporte de sangre que es aporta a ese &oacute;rgano"},{"id":"9804","text":"Ninguna de las respuestas dadas es correcta"},{"id":"9806","text":"No modifica el aporte de sangre a ese &oacute;rgano"},{"id":"9807","text":"Aumenta el aporte de sangre que se aporta a ese &oacute;rgano"}]',
  '9805',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x104-0000-4000-b000-000000009208',
  'c000149-0000-4000-b000-000000009103',
  'Una de las diferencias entre las c&eacute;lulas card&iacute;acas especializadas en la conducci&oacute;n y la contracci&oacute;n es:',
  104,
  '[{"id":"9808","text":"Las c&eacute;lulas especializadas en la conducci&oacute;n presentan un potencial de acci&oacute;n m&aacute;s r&aacute;pido que las especializadas en la contracci&oacute;n"},{"id":"9809","text":"Las c&eacute;lulas especializadas en la conducci&oacute;n no tienen canales de sodio r&aacute;pido"},{"id":"9810","text":"Las c&eacute;lulas especializadas la contracci&oacute;n no tienen canales de calcio"},{"id":"9811","text":"Las c&eacute;lulas especializadas en la conducci&oacute;n no poseen canales de potasio"}]',
  '9808',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x105-0000-4000-b000-000000009209',
  'c000149-0000-4000-b000-000000009103',
  'Los vasos pulmonares con respeto a los vasos sist&eacute;micos',
  105,
  '[{"id":"9814","text":"Son m&aacute;s adaptables"},{"id":"9812","text":"Son poco distensibles"},{"id":"9813","text":"Ofrecen una gran resistencia al paso de la sangre"},{"id":"9815","text":"Ninguna las anteriores es correcta"}]',
  '9814',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd149x106-0000-4000-b000-000000009210',
  'c000149-0000-4000-b000-000000009103',
  'Con respecto al reflejo barorreceptor. Se&ntilde;ala la afirmaci&oacute;n correcta:',
  106,
  '[{"id":"9818","text":"La regiones barorreceptoras se encuentran en la aorta descendente"},{"id":"9816","text":"Una disminuci&oacute;n de la presi&oacute;n arterial provocar&iacute;a liberaci&oacute;n de epinefrina son los receptores M1 del coraz&oacute;n, disminuyendo su inotropismo"},{"id":"9817","text":"Una disminuci&oacute;n de la presi&oacute;n arterial provocar&iacute;a liberaci&oacute;n de acetilcolina sobre los receptores M2 del coraz&oacute;n, disminuyendo la frecuencia cardiaca"},{"id":"9819","text":"Un aumento la presi&oacute;n arterial provocar&iacute;a liberaci&oacute;n de adrenalina solo receptores alfa1 y alfa2 de los vasos"}]',
  '9818',
  '2026-04-27 17:01:04'
);

-- Quiz: "TEST 2 - CARDIACO" → Course: "Fisiología Veterinaria  2ºC" (55 questions) [renamed to add "(2)"]
INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'c000150-0000-4000-b000-000000009211',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 2 - CARDIACO (2)',
  NULL,
  'quiz',
  100,
  '2026-04-27 17:01:04',
  '2026-04-27 17:01:04'
FROM Class c
WHERE c.name = 'Fisiología Veterinaria  2ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 2 - CARDIACO (2)' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x0-0000-4000-b000-000000009212',
  'c000150-0000-4000-b000-000000009211',
  'En relaci&oacute;n a la contracci&oacute;n muscular de las fibras estriadas. &iquest;cu&aacute;l es el elemento que se acorta?',
  0,
  '[{"id":"11130","text":"El sarc&oacute;mero debido al deslizamiento de los filamentos de actina sobre los de miosina"},{"id":"11127","text":"Las bandas entre los discos Z debido al deslizamiento de los filamentos gruesos sobre los finos (miosina y actina, respectivamente)"},{"id":"11128","text":"El sarc&oacute;mero debi&oacute; al acortamiento de los filamentos de actina en el golpe de fuerza"},{"id":"11129","text":"Los discos Z debido al acortamiento de los filamentos de miosina en el puente cruzado"}]',
  '11130',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x1-0000-4000-b000-000000009213',
  'c000150-0000-4000-b000-000000009211',
  'Ciclo cardiaco. El segundo sonido cardiaco corresponde con:',
  1,
  '[{"id":"11134","text":"El inicio del periodo de relajaci&oacute;n isovolum&eacute;trica"},{"id":"11131","text":"El final del periodo de eyecci&oacute;n r&aacute;pido"},{"id":"11132","text":"El final de la di&aacute;stasis"},{"id":"11133","text":"El cierre de las v&aacute;lvulas atrioventriculares"}]',
  '11134',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x2-0000-4000-b000-000000009214',
  'c000150-0000-4000-b000-000000009211',
  'Con respecto a las anastomosis arteriovenosas:',
  2,
  '[{"id":"11138","text":"Su funci&oacute;n principal es la termorregulaci&oacute;n"},{"id":"11135","text":"Forman parte de la barrera hematoencef&aacute;lica"},{"id":"11136","text":"No se encuentran pr&aacute;cticamente en la piel"},{"id":"11137","text":"Son importantes en el intercambio de glucosa en el cerebro"}]',
  '11138',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x3-0000-4000-b000-000000009215',
  'c000150-0000-4000-b000-000000009211',
  'Con respecto al dise&ntilde;o de la circulaci&oacute;n:',
  3,
  '[{"id":"11140","text":"La circulaci&oacute;n pulmonar y sist&eacute;mica funcionan de manera simult&aacute;nea"},{"id":"11139","text":"La circulaci&oacute;n sist&eacute;mica es un circuito de baja presi&oacute;n"},{"id":"11141","text":"La circulaci&oacute;n sist&eacute;mica y pulmonar est&aacute;n dispuestas en paralelo"},{"id":"11142","text":"El patr&oacute;n de ramificaci&oacute;n arterial que entrega sangre a cada uno de los &oacute;rganos est&aacute; dispuesto en serie"}]',
  '11140',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x4-0000-4000-b000-000000009216',
  'c000150-0000-4000-b000-000000009211',
  'El inotropismo hace referencia a:',
  4,
  '[{"id":"11143","text":"La fuerza de contracci&oacute;n cardiaca"},{"id":"11144","text":"Tensi&oacute;n muscular del coraz&oacute;n"},{"id":"11145","text":"Propagaci&oacute;n de la excitaci&oacute;n cardiaca"},{"id":"11146","text":"Excitabilidad del coraz&oacute;n"}]',
  '11143',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x5-0000-4000-b000-000000009217',
  'c000150-0000-4000-b000-000000009211',
  'El dromotropismo hace referencia a:',
  5,
  '[{"id":"11149","text":"Propagaci&oacute;n de la excitaci&oacute;n cardiaca"},{"id":"11147","text":"La fuerza de contracci&oacute;n cardiaca"},{"id":"11148","text":"Tensi&oacute;n muscular del coraz&oacute;n"},{"id":"11150","text":"Excitabilidad del coraz&oacute;n"}]',
  '11149',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x6-0000-4000-b000-000000009218',
  'c000150-0000-4000-b000-000000009211',
  'El tiempo que sigue al comienzo de un potencial de acci&oacute;n durante el cual otro potencial de acci&oacute;n no puede comenzar, por intenso que sea, se denomina:',
  6,
  '[{"id":"11151","text":"Periodo refractario absoluto"},{"id":"11152","text":"Periodo refractario relativo"},{"id":"11153","text":"Conductibilidad cardiaca"},{"id":"11154","text":"Dromotropismo"}]',
  '11151',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x7-0000-4000-b000-000000009219',
  'c000150-0000-4000-b000-000000009211',
  'La fase 4 del potencial de acci&oacute;n de una c&eacute;lula especializada en la conducci&oacute;n se caracteriza por:',
  7,
  '[{"id":"11155","text":"Es una fase de reposo con el potencial de membrana negativo"},{"id":"11156","text":"Apertura de canales de calcio lentos"},{"id":"11157","text":"Cierre de los canales de sodio r&aacute;pido"},{"id":"11158","text":"La apertura de los canales de sodio r&aacute;pidos"}]',
  '11155',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x8-0000-4000-b000-000000009220',
  'c000150-0000-4000-b000-000000009211',
  'En el m&uacute;sculo estriado, &iquest;de d&oacute;nde proviene la energ&iacute;a necesaria para la contracci&oacute;n muscular?',
  8,
  '[{"id":"11159","text":"El golpe de fuerza libera energ&iacute;a del ATP cuando la cabeza del puente cruzado de la miosina se une con la actina"},{"id":"11160","text":"Se libera ATP en el golpe de fuerza cuando el puente cruzado de la actina se une con la miosina"},{"id":"11161","text":"La troponina tiene alta capacidad de captaci&oacute;n de ATP cuando se une a la tropomiosina"},{"id":"11162","text":"Se libera ATP cuando la tropomiosina libera los puntos de atraque de la troponina en la h&eacute;lice de actina"}]',
  '11159',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x9-0000-4000-b000-000000009221',
  'c000150-0000-4000-b000-000000009211',
  'Se&ntilde;ala el orden correcto de las diferentes capas del coraz&oacute;n de la m&aacute;s externa a la m&aacute;s interna:',
  9,
  '[{"id":"11163","text":"Pericardio parietal, l&iacute;quido peric&aacute;rdico, epicardio, miocardio y endocardio"},{"id":"11164","text":"Epicardio, l&iacute;quido peric&aacute;rdico, pericardio parietal, epicardio, miocardio y endocardio"},{"id":"11165","text":"Epicardio, pericardio parietal, l&iacute;quido peric&aacute;rdico, miocardio y endocardio"},{"id":"11166","text":"Pericardio parietal, epicardio, l&iacute;quido peric&aacute;rdico, miocardio y endocardio"}]',
  '11163',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x10-0000-4000-b000-000000009222',
  'c000150-0000-4000-b000-000000009211',
  'Un aumento de la resistencia arteriolar en un &oacute;rgano provoca:',
  10,
  '[{"id":"11168","text":"Disminuci&oacute;n del aporte de sangre que se aporta a ese &oacute;rgano"},{"id":"11167","text":"Ninguna de las respuestas es correcta"},{"id":"11169","text":"No modifica el aporte de sangre a ese &oacute;rgano"},{"id":"11170","text":"Aumento del aporte de sangre que se aporta a ese &oacute;rgano"}]',
  '11168',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x11-0000-4000-b000-000000009223',
  'c000150-0000-4000-b000-000000009211',
  'El principal lugar de resistencia al flujo de sangre se encuentra en:',
  11,
  '[{"id":"11174","text":"Metarteriolas"},{"id":"11171","text":"Venas"},{"id":"11172","text":"Arterias el&aacute;sticas"},{"id":"11173","text":"Capilares"}]',
  '11174',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x12-0000-4000-b000-000000009224',
  'c000150-0000-4000-b000-000000009211',
  'Conociendo los siguientes par&aacute;metros medidos en la circulaci&oacute;n del m&uacute;sculo esquel&eacute;tico: presi&oacute;n hidrost&aacute;tica del capilar 34 mmHg, presi&oacute;n hidrost&aacute;tica intersticial 10 mmHg, presi&oacute;n onc&oacute;tica del capilar 24 mmHg, presi&oacute;n onc&oacute;tica intersticial 1 mmHg. Se&ntilde;ala la afirmaci&oacute;n correcta:',
  12,
  '[{"id":"11178","text":"En estas condiciones se favorece la filtraci&oacute;n"},{"id":"11175","text":"No est&aacute; claro lo que se favorecen en estas condiciones ya que no se ha especificado la concentraci&oacute;n de prote&iacute;nas plasm&aacute;ticas"},{"id":"11176","text":"En estas condiciones se favorece la reabsorci&oacute;n"},{"id":"11177","text":"En esas condiciones no se favorece ni la reabsorci&oacute;n ni la filtraci&oacute;n"}]',
  '11178',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x13-0000-4000-b000-000000009225',
  'c000150-0000-4000-b000-000000009211',
  'Una de las diferencias entre las c&eacute;lulas cardiacas especializadas en la conducci&oacute;n y la contracci&oacute;n es:',
  13,
  '[{"id":"11180","text":"Las c&eacute;lulas especializadas en la conducci&oacute;n no tienen canales de sodio r&aacute;pido"},{"id":"11179","text":"Las c&eacute;lulas especializadas en la contracci&oacute;n presentan un potencial de acci&oacute;n m&aacute;s r&aacute;pido que las especializadas en la contracci&oacute;n"},{"id":"11181","text":"Las c&eacute;lulas especializadas en la contracci&oacute;n no tienen canales de calcio"},{"id":"11182","text":"Las c&eacute;lulas especializadas en la conducci&oacute;n no poseen canales de potasio"}]',
  '11180',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x14-0000-4000-b000-000000009226',
  'c000150-0000-4000-b000-000000009211',
  'Con respecto al sistema barorreceptor, se&ntilde;ala la afirmaci&oacute;n correcta:',
  14,
  '[{"id":"11185","text":"Las regiones barorreceptoras se encuentran en la aorta descendente"},{"id":"11183","text":"Una disminuci&oacute;n de la presi&oacute;n arterial provoca liberaci&oacute;n de epinefrina sobre los receptores M1 del coraz&oacute;n, disminuyendo su inotropismo"},{"id":"11184","text":"Una disminuci&oacute;n de la presi&oacute;n arterial provoca la liberaci&oacute;n de acetilcolina sobre los receptores M2 del coraz&oacute;n, disminuyendo la frecuencia cardiaca"},{"id":"11186","text":"Un aumento de la presi&oacute;n arterial provocar&iacute;a la liberaci&oacute;n de adrenalina sobre los receptores a1 y a2 de los vasos"}]',
  '11185',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x15-0000-4000-b000-000000009227',
  'c000150-0000-4000-b000-000000009211',
  'Los vasos pulmonares, con respecto a los vasos sist&eacute;micos:',
  15,
  '[{"id":"11189","text":"Son m&aacute;s adaptables"},{"id":"11187","text":"Son poco distensibles"},{"id":"11188","text":"Ofrecen una gran resistencia al paso de la sangre"},{"id":"11190","text":"Ninguna de las respuestas es correcta"}]',
  '11189',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x16-0000-4000-b000-000000009228',
  'c000150-0000-4000-b000-000000009211',
  'Ante una hipertensi&oacute;n pulmonar:',
  16,
  '[{"id":"11225","text":"Provocar&aacute; la aparici&oacute;n de edema"},{"id":"11226","text":"Se produce un aumento del gasto cardiaco, incrementando la presi&oacute;n arterial"},{"id":"11227","text":"El ventr&iacute;culo izquierdo bombea m&aacute;s sangre a los pulmones de lo normal, aumentando el gasto cardiaco"},{"id":"11228","text":"Se produce un aumento de la resistencia perif&eacute;rica total, disminuyendo la presi&oacute;n arterial"}]',
  '11225',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x17-0000-4000-b000-000000009229',
  'c000150-0000-4000-b000-000000009211',
  'Se&ntilde;ala la respuesta correcta acerca del sistema capilar:',
  17,
  '[{"id":"11231","text":"Los capilares, a diferencia de las metarteriolas, carecen de m&uacute;sculo liso"},{"id":"11229","text":"Tambi&eacute;n denominado sistema de distribuci&oacute;n"},{"id":"11230","text":"La presi&oacute;n en ellos es m&aacute;xima para poder devolver la sangre hacia el coraz&oacute;n"},{"id":"11232","text":"Junto a las anastomosis arteriovenosas es el lugar donde se produce el intercambio de sustancias"}]',
  '11231',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x18-0000-4000-b000-000000009230',
  'c000150-0000-4000-b000-000000009211',
  '&iquest;Por qu&eacute; el sistema venoso act&uacute;a como un reservorio de presi&oacute;n?',
  18,
  '[{"id":"11235","text":"El sistema venoso no act&uacute;a como reservorio de presi&oacute;n"},{"id":"11233","text":"Al contar con muchas fibras el&aacute;sticas, las venas tienen mayor capacidad de almacenar presi&oacute;n"},{"id":"11234","text":"Porque las venas generan mucha resistencia al flujo sangu&iacute;neo"},{"id":"11236","text":"Ninguna es correcta"}]',
  '11235',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x19-0000-4000-b000-000000009231',
  'c000150-0000-4000-b000-000000009211',
  'En una hiperemia reactiva, &iquest;c&oacute;mo act&uacute;a el control metab&oacute;lico del flujo?',
  19,
  '[{"id":"11240","text":"Se produce un aumento del flujo sangu&iacute;neo temporal tras un periodo de restricci&oacute;n"},{"id":"11237","text":"Tiene lugar una disminuci&oacute;n del flujo sangu&iacute;neo temporal debido al incremento de CO2"},{"id":"11238","text":"Se produce una vasoconstricci&oacute;n por un incremento de K+, &aacute;cido l&aacute;ctico o adenosina"},{"id":"11239","text":"Se produce una vasodilataci&oacute;n por un incremento de K+, &aacute;cido l&aacute;ctico o adenosina"}]',
  '11240',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x20-0000-4000-b000-000000009232',
  'c000150-0000-4000-b000-000000009211',
  'Se&ntilde;ala la respuesta correcta:',
  20,
  '[{"id":"11241","text":"La arteria aorta presenta una presi&oacute;n diast&oacute;lica de 80 mmHg"},{"id":"11242","text":"La arteria pulmonar presenta una presi&oacute;n sist&oacute;lica de 8 mmHg"},{"id":"11243","text":"La arteria aorta presenta una presi&oacute;n sist&oacute;lica de 100 mmHg"},{"id":"11244","text":"La arteria pulmonar presenta una presi&oacute;n media de 25 mmHg"}]',
  '11241',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x21-0000-4000-b000-000000009233',
  'c000150-0000-4000-b000-000000009211',
  'En el sistema cardiovascular es incorrecto que:',
  21,
  '[{"id":"11246","text":"Para que la sangre pueda fluir la presi&oacute;n de perfusi&oacute;n debe ser menor al comienzo del vaso que al final"},{"id":"11245","text":"La difusi&oacute;n emplea la diferencia de concentraci&oacute;n como fuente de energ&iacute;a"},{"id":"11247","text":"El flujo de volumen emplea la presi&oacute;n de perfusi&oacute;n como fuente de energ&iacute;a"},{"id":"11248","text":"El sistema circulatorio es capaz de transportar calor por fricci&oacute;n"}]',
  '11246',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x22-0000-4000-b000-000000009234',
  'c000150-0000-4000-b000-000000009211',
  'Indica la respuesta correcta sobre la circulaci&oacute;n cardiovascular:',
  22,
  '[{"id":"11250","text":"La circulaci&oacute;n mayor recorre el organismo desde el ventr&iacute;culo izquierdo hasta el atrio derecho"},{"id":"11249","text":"La circulaci&oacute;n sist&eacute;mica comienza con la arteria aorta y finaliza con la vena cava, incluyendo todos los vasos entre ambas"},{"id":"11251","text":"La circulaci&oacute;n menor o sist&eacute;mica est&aacute; dispuesta en paralelo"},{"id":"11252","text":"Ninguna es correcta"}]',
  '11250',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x23-0000-4000-b000-000000009235',
  'c000150-0000-4000-b000-000000009211',
  '&iquest;Cu&aacute;l de los siguientes neurotransmisores procede del tript&oacute;fano?',
  23,
  '[{"id":"11256","text":"Serotonina"},{"id":"11253","text":"Glicina"},{"id":"11254","text":"Dopamina"},{"id":"11255","text":"Histamina"}]',
  '11256',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x24-0000-4000-b000-000000009236',
  'c000150-0000-4000-b000-000000009211',
  'Indica cu&aacute;l de las siguientes hormonas estimula la reabsorci&oacute;n a nivel renal y produce sensaci&oacute;n de sed:',
  24,
  '[{"id":"11259","text":"ADH"},{"id":"11257","text":"Aldosterona"},{"id":"11258","text":"Noradrenalina"},{"id":"11260","text":"Histamina"}]',
  '11259',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x25-0000-4000-b000-000000009237',
  'c000150-0000-4000-b000-000000009211',
  'Sobre el gasto cardiaco:',
  25,
  '[{"id":"11263","text":"Se obtiene como el volumen sist&oacute;lico del ventr&iacute;culo izquierdo multiplicado por la frecuencia cardiaca"},{"id":"11261","text":"Se obtiene como el volumen diast&oacute;lico del ventr&iacute;culo derecho multiplicado por la frecuencia cardiaca"},{"id":"11262","text":"Es el volumen de sangre que el ventr&iacute;culo izquierdo bombea hacia la arteria pulmonar en un minuto"},{"id":"11264","text":"Ninguna es correcta"}]',
  '11263',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x26-0000-4000-b000-000000009238',
  'c000150-0000-4000-b000-000000009211',
  'Sobre la presi&oacute;n de perfusi&oacute;n podemos afirmar que:',
  26,
  '[{"id":"11266","text":"Se obtiene como la diferencia entre la presi&oacute;n de la arteria aorta y la vena cava, siendo esta &uacute;ltima despreciable"},{"id":"11265","text":"Se obtiene como la diferencia entre la presi&oacute;n de la arteria aorta y la arteria pulmonar, siendo esta &uacute;ltima despreciable"},{"id":"11267","text":"Se obtiene como la diferencia entre la presi&oacute;n de la arteria pulmonar y la arteria aorta, siendo esta &uacute;ltima despreciable"},{"id":"11268","text":"Ninguna es correcta"}]',
  '11266',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x27-0000-4000-b000-000000009239',
  'c000150-0000-4000-b000-000000009211',
  '&iquest;Cu&aacute;l de las siguientes afirmaciones sobre la circulaci&oacute;n porta-espl&aacute;cnica es correcta?',
  27,
  '[{"id":"11272","text":"Sigue una estructura vena - capilares - vena"},{"id":"11269","text":"Sigue una estructura arteria - capilares - arteria"},{"id":"11270","text":"Irriga los &oacute;rganos pares de la cavidad abdominal"},{"id":"11271","text":"Irriga el sistema hipot&aacute;lamo - hipofisario"}]',
  '11272',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x28-0000-4000-b000-000000009240',
  'c000150-0000-4000-b000-000000009211',
  'Se&ntilde;ala la afirmaci&oacute;n correcta:',
  28,
  '[{"id":"11275","text":"Ante una disminuci&oacute;n de la presi&oacute;n arterial las c&eacute;lulas yuxtaglomerulares secretan renina"},{"id":"11273","text":"Las c&eacute;lulas endoteliales del pulm&oacute;n secretan angiotensin&oacute;geno, que se convierte en angiotensina I gracias a la acci&oacute;n de la renina"},{"id":"11274","text":"La enzima convertidora de angiotensina es secretada por el h&iacute;gado y permite convertir angiotensina I en angiotensina II"},{"id":"11276","text":"Todas son correctas"}]',
  '11275',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x29-0000-4000-b000-000000009241',
  'c000150-0000-4000-b000-000000009211',
  'Indica cu&aacute;l de los siguientes motivos explica un aumento en la presi&oacute;n a&oacute;rtica media:',
  29,
  '[{"id":"11279","text":"Aumento del gasto cardiaco y/o aumento de la resistencia perif&eacute;rica total"},{"id":"11277","text":"Disminuci&oacute;n del gasto cardiaco y aumento de la resistencia perif&eacute;rica total"},{"id":"11278","text":"Disminuci&oacute;n del gasto cardiaco y/o disminuci&oacute;n de la resistencia perif&eacute;rica total"},{"id":"11280","text":"Aumento del gasto cardiaco y disminuci&oacute;n de la resistencia perif&eacute;rica total"}]',
  '11279',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x30-0000-4000-b000-000000009242',
  'c000150-0000-4000-b000-000000009211',
  'Sobre el l&iacute;quido cefalorraqu&iacute;deo podemos afirmar que:',
  30,
  '[{"id":"11283","text":"En condiciones fisiol&oacute;gicas circula por los ventr&iacute;culos cerebrales"},{"id":"11281","text":"Se forma en la m&eacute;dula espinal"},{"id":"11282","text":"En condiciones fisiol&oacute;gicas, se puede encontrar entre la piamadre y duramadre"},{"id":"11284","text":"Todas son correctas"}]',
  '11283',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x31-0000-4000-b000-000000009243',
  'c000150-0000-4000-b000-000000009211',
  'Un perro con una presi&oacute;n arterial de 120/80 mmHg tiene un flujo cerebral de 100 ml/min. Cuando la presi&oacute;n arterial aumenta a 130/100 mmHg, el flujo cerebral lo hace hasta 105 ml/min. Esto es un ejemplo de:',
  31,
  '[{"id":"11286","text":"Autorregulaci&oacute;n"},{"id":"11285","text":"Hiperemia activa"},{"id":"11287","text":"Hiperemia reactiva"},{"id":"11288","text":"Barrera hematoencef&aacute;lica"}]',
  '11286',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x32-0000-4000-b000-000000009244',
  'c000150-0000-4000-b000-000000009211',
  'En relaci&oacute;n a la contracci&oacute;n de la musculatura cardiaca podemos afirmar que:',
  32,
  '[{"id":"11289","text":"La cantidad de sangre que queda en los ventr&iacute;culos tras la s&iacute;stole se denomina volumen telesist&oacute;lico"},{"id":"11290","text":"Tras la s&iacute;stole ventricular el volumen de sangre en los ventr&iacute;culos es pr&oacute;ximo a 0"},{"id":"11291","text":"En condiciones fisiol&oacute;gicas el coraz&oacute;n trabaja en su punto de funcionamiento &oacute;ptimo"},{"id":"11292","text":"Todas son correctas"}]',
  '11289',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x33-0000-4000-b000-000000009245',
  'c000150-0000-4000-b000-000000009211',
  '&iquest;Qu&eacute; permite el receptor de voltaje DHP (dihidropiridina)?',
  33,
  '[{"id":"11367","text":"Durante la contracci&oacute;n muscular permite liberar el Ca2+ almacenado en el ret&iacute;culo sarcopl&aacute;smico"},{"id":"11366","text":"Activa el complejo calmodulina-prote&iacute;na-quinasa"},{"id":"11368","text":"Permite a las ves&iacute;culas sin&aacute;pticas fundirse con la membrana de la terminal ax&oacute;nica para liberar sus neurotransmisores"},{"id":"11369","text":"Activa el desplazamiento de la tropomiosina y la exposici&oacute;n de los puntos de uni&oacute;n de la actina"}]',
  '11367',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x34-0000-4000-b000-000000009246',
  'c000150-0000-4000-b000-000000009211',
  'El control local metab&oacute;lico del flujo sangu&iacute;neo a los m&uacute;sculos esquel&eacute;ticos:',
  34,
  '[{"id":"11372","text":"Puede dominar sobre o ser un subordinado del control neurohumoral en funci&oacute;n de si el m&uacute;sculo est&aacute; realizando ejercicio o en reposo"},{"id":"11370","text":"Suele dominar el control neurohumoral"},{"id":"11371","text":"Suele subordinarse al control neurohumoral"},{"id":"11373","text":"Depende sobre todo de los cambios que se producen en la resistencia de las venas que hay dentro de los m&uacute;sculos"}]',
  '11372',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x35-0000-4000-b000-000000009247',
  'c000150-0000-4000-b000-000000009211',
  'Sobre el sistema arterial NO podemos afirmar que:',
  35,
  '[{"id":"11375","text":"Es un sistema de colecci&oacute;n"},{"id":"11374","text":"Act&uacute;a como reservorio de presi&oacute;n"},{"id":"11376","text":"Permite distribuir la sangre desde el coraz&oacute;n hasta los capilares de forma centr&iacute;fuga"},{"id":"11377","text":"Las arteriolas y metarteriolas cuentan con musculatura lisa"}]',
  '11375',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x36-0000-4000-b000-000000009248',
  'c000150-0000-4000-b000-000000009211',
  'En relaci&oacute;n a la musculatura esquel&eacute;tica, cardiaca y lisa, se&ntilde;ala la afirmaci&oacute;n correcta:',
  36,
  '[{"id":"11380","text":"En el m&uacute;sculo cardiaco los potenciales de acci&oacute;n se forman de manera espont&aacute;nea"},{"id":"11378","text":"Las fibras musculares cardiacas se encuentran asociadas el&eacute;ctricamente unas a otras, al igual que en el m&uacute;sculo esquel&eacute;tico"},{"id":"11379","text":"En la musculatura esquel&eacute;tica la uni&oacute;n actina - miosina tiene lugar gracias al complejo Ca2+ - calmodulina"},{"id":"11381","text":"En la musculatura lisa la uni&oacute;n actina - miosina tiene lugar gracias al complejo Ca2+ - troponina"}]',
  '11380',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x37-0000-4000-b000-000000009249',
  'c000150-0000-4000-b000-000000009211',
  'El camino normal que sigue un potencial de acci&oacute;n cardiaco comienza en el n&oacute;dulo sinusal y luego se propaga',
  37,
  '[{"id":"11384","text":"A trav&eacute;s de las aur&iacute;culas hacia el n&oacute;dulo atrio-ventricular"},{"id":"11382","text":"A trav&eacute;s de las aur&iacute;culas por el haz de Hiss"},{"id":"11383","text":"A trav&eacute;s de las capas de tejido conjuntivo que separan las aur&iacute;culas de los ventr&iacute;culos"},{"id":"11385","text":"De la aur&iacute;cula izquierda a la derecha"}]',
  '11384',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x38-0000-4000-b000-000000009250',
  'c000150-0000-4000-b000-000000009211',
  'Ante un potencial acci&oacute;n en c&eacute;lulas cardiacas, se&ntilde;ala la respuesta incorrecta:',
  38,
  '[{"id":"11388","text":"Los canales especializados de Ca2+ de la c&eacute;lula muscular cardiaca se denominan canales r&aacute;pidos o de tipo L"},{"id":"11386","text":"La liberaci&oacute;n de calcio inducida por calcio es exclusiva del m&uacute;sculo cardiaco"},{"id":"11387","text":"Los potenciales de acci&oacute;n duran menos en c&eacute;lulas auriculares que en ventriculares"},{"id":"11389","text":"En la fase plana de despolarizaci&oacute;n se abren canales de Ca2+ y permanecen cerrados canales de K+"}]',
  '11388',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x39-0000-4000-b000-000000009251',
  'c000150-0000-4000-b000-000000009211',
  '&iquest;Durante qu&eacute; fase del potencial de acci&oacute;n normal ventricular es m&aacute;s probable que los canales r&aacute;pidos de Na+ est&eacute;n inactivados, los canales lentos de Ca2+ est&eacute;n abiertos y la mayor&iacute;a de canales de K+ est&eacute;n cerrados?',
  39,
  '[{"id":"11392","text":"Fase 2 (meseta)"},{"id":"11390","text":"Fase 0 (despolarizaci&oacute;n r&aacute;pida)"},{"id":"11391","text":"Fase 1 (repolarizaci&oacute;n parcial)"},{"id":"11393","text":"Fase 3 (repolarizaci&oacute;n)"}]',
  '11392',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x40-0000-4000-b000-000000009252',
  'c000150-0000-4000-b000-000000009211',
  'En relaci&oacute;n al control del flujo sangu&iacute;neo:',
  40,
  '[{"id":"11395","text":"Los controles intr&iacute;nsecos predominan sobre el flujo sangu&iacute;neo de &oacute;rganos vitales"},{"id":"11394","text":"Los controles intr&iacute;nsecos act&uacute;an mediante regulaci&oacute;n nerviosa y hormonal para controlar la resistencia arteriolar"},{"id":"11396","text":"En los ri&ntilde;ones hay un predominio de controles intr&iacute;nsecos sobre extr&iacute;nsecos"},{"id":"11397","text":"Todas son correctas"}]',
  '11395',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x41-0000-4000-b000-000000009253',
  'c000150-0000-4000-b000-000000009211',
  '&iquest;Cu&aacute;l de las siguientes respuestas es correcta tanto para el m&uacute;sculo cardiaco como para el esquel&eacute;tico?',
  41,
  '[{"id":"11399","text":"El potencial de acci&oacute;n en la membrana celular del m&uacute;sculo es necesario para iniciar una contracci&oacute;n"},{"id":"11398","text":"El m&uacute;sculo forma un sincitio funcional"},{"id":"11400","text":"Las c&eacute;lulas marcapasos se despolarizan espont&aacute;neamente hasta un umbral e inician los potenciales de acci&oacute;n"},{"id":"11401","text":"Potenciales de acci&oacute;n frecuentes en una motoneurona pueden causar una contracci&oacute;n muscular sostenida"}]',
  '11399',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x42-0000-4000-b000-000000009254',
  'c000150-0000-4000-b000-000000009211',
  '&iquest;Cu&aacute;l de las siguientes afirmaciones es correcta?',
  42,
  '[{"id":"11405","text":"Las arteriolas tienen mayor resistencia al flujo sangu&iacute;neo que los capilares"},{"id":"11402","text":"La aorta y las grandes arterias son m&aacute;s distensibles que las venas"},{"id":"11403","text":"La aorta y las grandes arterias tienen mayor resistencia al flujo sangu&iacute;neo que los capilares"},{"id":"11404","text":"Las venas tienen mayor resistencia al flujo sangu&iacute;neo que los capilares"}]',
  '11405',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x43-0000-4000-b000-000000009255',
  'c000150-0000-4000-b000-000000009211',
  '&iquest;Cu&aacute;l de las siguientes situaciones puede hacer que la presi&oacute;n a&oacute;rtica media aumente?',
  43,
  '[{"id":"11409","text":"La RPT aumenta"},{"id":"11406","text":"El volumen sist&oacute;lico aumenta y la frecuencia card&iacute;aca disminuye"},{"id":"11407","text":"La capacitancia arterial disminuye"},{"id":"11408","text":"La frecuencia card&iacute;aca desciende"}]',
  '11409',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x44-0000-4000-b000-000000009256',
  'c000150-0000-4000-b000-000000009211',
  '&iquest;Cu&aacute;l de los siguientes supuestos causar&iacute;a la mayor disminuci&oacute;n en el flujo sangu&iacute;neo coronario?',
  44,
  '[{"id":"11411","text":"Las arterias coronarias desarrollan arteriosclerosis y placas de l&iacute;pidos que taponan la mitad de su &aacute;rea de secci&oacute;n normal"},{"id":"11410","text":"Las arterias se contraen a la mitad de su di&aacute;metro"},{"id":"11412","text":"La presi&oacute;n a&oacute;rtica media desciende hasta la mita de su valor normal"},{"id":"11413","text":"La resistencia al flujo coronario se dobla"}]',
  '11411',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x45-0000-4000-b000-000000009257',
  'c000150-0000-4000-b000-000000009211',
  'La despolarizaci&oacute;n del m&uacute;sculo esquel&eacute;tico es causada por una:',
  45,
  '[{"id":"11416","text":"Entrada de Na+"},{"id":"11414","text":"Entrada de Ca2+"},{"id":"11415","text":"Entrada de K+"},{"id":"11417","text":"Salida de Na+"}]',
  '11416',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x46-0000-4000-b000-000000009258',
  'c000150-0000-4000-b000-000000009211',
  'La fatiga muscular, p&eacute;rdida de la capacidad para contraerse, puede ser resultado de:',
  46,
  '[{"id":"11420","text":"Un d&eacute;ficit de sodio en el tejido despu&eacute;s de una actividad prolongada"},{"id":"11418","text":"Una acumulaci&oacute;n de potasio en el tejido despu&eacute;s de una actividad prolongada"},{"id":"11419","text":"Un d&eacute;ficit de ox&iacute;geno en los tejidos despu&eacute;s de una actividad prolongada"},{"id":"11421","text":"La acumulaci&oacute;n de ATP en el tejido despu&eacute;s de una actividad prolongada"}]',
  '11420',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x47-0000-4000-b000-000000009259',
  'c000150-0000-4000-b000-000000009211',
  'Se&ntilde;ala la afirmaci&oacute;n correcta:',
  47,
  '[{"id":"11424","text":"El voltaje al que se obtiene la primera respuesta contr&aacute;ctil perceptibles se denomina est&iacute;mulo umbral"},{"id":"11422","text":"La onda de hiperpolarizaci&oacute;n sigue a la onda de despolarizaci&oacute;n a trav&eacute;s de la membrana"},{"id":"11423","text":"La resistencia a trav&eacute;s de la membrana plasm&aacute;tica es el resultado de diferencias en la permeabilidad a los iones"},{"id":"11425","text":"Todas son correctas"}]',
  '11424',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x48-0000-4000-b000-000000009260',
  'c000150-0000-4000-b000-000000009211',
  'En relaci&oacute;n a las c&eacute;lulas del n&oacute;dulo sinusal:',
  48,
  '[{"id":"11429","text":"En la despolarizaci&oacute;n participan canales de Ca2+ de tipo T y tipo L"},{"id":"11426","text":"Su potencial de membrana en reposo es igual al del resto de c&eacute;lulas cardiacas"},{"id":"11427","text":"Durante la despolarizaci&oacute;n tiene lugar la apertura de canales If"},{"id":"11428","text":"El Na+ es el ion fundamental de la despolarizaci&oacute;n"}]',
  '11429',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x49-0000-4000-b000-000000009261',
  'c000150-0000-4000-b000-000000009211',
  'Indica cu&aacute;l de los siguientes sistemas se encargan del control de la homeostasis:',
  49,
  '[{"id":"11431","text":"Sistema nervioso y endocrino"},{"id":"11430","text":"Sistema respiratorio y endocrino"},{"id":"11432","text":"Sistema respiratorio y nervioso"},{"id":"11433","text":"Sistema nervioso y digestivo"}]',
  '11431',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x50-0000-4000-b000-000000009262',
  'c000150-0000-4000-b000-000000009211',
  '&iquest;C&oacute;mo aumenta la presi&oacute;n arterial la angiotensina II?',
  50,
  '[{"id":"11436","text":"Estimula la s&iacute;ntesis de noradrenalina"},{"id":"11434","text":"Disminuye la s&iacute;ntesis de aldosterona"},{"id":"11435","text":"Aumenta la s&iacute;ntesis de bradiquinina"},{"id":"11437","text":"Estimula la musculatura lisa para generar vasodilataci&oacute;n"}]',
  '11436',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x51-0000-4000-b000-000000009263',
  'c000150-0000-4000-b000-000000009211',
  'Indica la respuesta correcta en relaci&oacute;n al control metab&oacute;lico del flujo sangu&iacute;neo:',
  51,
  '[{"id":"11438","text":"En general, un aumento del &aacute;cido l&aacute;ctico producir&aacute; una vasodilataci&oacute;n"},{"id":"11439","text":"En los pulmones un aumento en el nivel de adenosina producir&aacute; una vasoconstricci&oacute;n"},{"id":"11440","text":"En general, un aumento en el nivel de O2 producir&aacute; una vasodilataci&oacute;n"},{"id":"11441","text":"En los pulmones un aumento en el nivel de O2 producir&aacute; una vasoconstricci&oacute;n"}]',
  '11438',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x52-0000-4000-b000-000000009264',
  'c000150-0000-4000-b000-000000009211',
  'Indica la respuesta correcta sobre el sistema cardiovascular:',
  52,
  '[{"id":"11442","text":"A medida que avanzan por el &aacute;rbol vascular, las arterias pierden elasticidad"},{"id":"11443","text":"El sistema venoso distribuye la sangre desde los capilares hasta el coraz&oacute;n de forma centr&iacute;fuga"},{"id":"11444","text":"En las anastomosis arteriovenosas tendr&aacute; lugar el intercambio de sustancias"},{"id":"11445","text":"La circulaci&oacute;n porta-renal sigue una estructura vena - capilares - vena"}]',
  '11442',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x53-0000-4000-b000-000000009265',
  'c000150-0000-4000-b000-000000009211',
  'En relaci&oacute;n a la presi&oacute;n sangu&iacute;nea, se&ntilde;ala la afirmaci&oacute;n correcta:',
  53,
  '[{"id":"11446","text":"Las venas cavas se consideran un reservorio de volumen ya que su presi&oacute;n sangu&iacute;nea es pr&aacute;cticamente nula"},{"id":"11447","text":"La sangre llega a la aur&iacute;cula derecha con 16 mmHg de presi&oacute;n y es impulsada por el ventr&iacute;culo derecho hacia las arterias pulmonares con una presi&oacute;n media de 100 mmHg"},{"id":"11448","text":"El ventr&iacute;culo derecho ejerce mucha m&aacute;s fuerza que el izquierdo ya que bombea sangre a la circulaci&oacute;n sist&eacute;mica en lugar de a la pulmonar"},{"id":"11449","text":"La presi&oacute;n en di&aacute;stole alcanza valores mayores que la presi&oacute;n en s&iacute;stole"}]',
  '11446',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd150x54-0000-4000-b000-000000009266',
  'c000150-0000-4000-b000-000000009211',
  'Ante una vasodilataci&oacute;n de las arteriolas de la arteria hep&aacute;tica, que irriga el h&iacute;gado, podemos afirmar que:',
  54,
  '[{"id":"11453","text":"El m&uacute;sculo liso de las arteriolas se relaja. Al incrementar su di&aacute;metro disminuir&aacute; la resistencia al flujo y se aumenta el riego del h&iacute;gado"},{"id":"11450","text":"El m&uacute;sculo liso de las arteriolas se relaja. Al incrementar su di&aacute;metro aumentar&aacute; la resistencia al flujo y se disminuye el riego del h&iacute;gado"},{"id":"11451","text":"El m&uacute;sculo liso de las arteriolas se contrae. Al disminuir su di&aacute;metro aumentar&aacute; la resistencia al flujo y se disminuye el riego del h&iacute;gado"},{"id":"11452","text":"El m&uacute;sculo liso de las arteriolas se contrae. Al incrementar su di&aacute;metro aumentar&aacute; la resistencia al flujo y se disminuye el riego del h&iacute;gado"}]',
  '11453',
  '2026-04-27 17:01:04'
);

-- Quiz: "TEST 1- SISTEMA NERVIOSO Y MUSCULAR" → Course: "Fisiología Veterinaria  2ºC" (140 questions) [renamed to add "(2)"]
INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'c000151-0000-4000-b000-000000009267',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 1- SISTEMA NERVIOSO Y MUSCULAR (2)',
  NULL,
  'quiz',
  100,
  '2026-04-27 17:01:04',
  '2026-04-27 17:01:04'
FROM Class c
WHERE c.name = 'Fisiología Veterinaria  2ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 1- SISTEMA NERVIOSO Y MUSCULAR (2)' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x0-0000-4000-b000-000000009268',
  'c000151-0000-4000-b000-000000009267',
  'La llegada de un impulso nervioso al terminal presin&aacute;ptico implica su despolarizaci&oacute;n &iquest;cu&aacute;l es su primer efecto para la liberaci&oacute;n del neurotransmisor?',
  0,
  '[{"id":"9823","text":"La apertura de los canales de voltaje de calcio que provocan su entrada masiva el interior de la c&eacute;lula"},{"id":"9820","text":"La alteraci&oacute;n de las prote&iacute;nas de las ves&iacute;culas sin&aacute;pticas que provocan su ataque y exocitosis"},{"id":"9821","text":"La activaci&oacute;n de la calmodulina y la fosforilaci&oacute;n de las prote&iacute;nas de las ves&iacute;culas presin&aacute;pticas"},{"id":"9822","text":"La apertura de los canales de fuga de potasio que permiten una r&aacute;pida repolarizaci&oacute;n para activar los canales de calcio"}]',
  '9823',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x1-0000-4000-b000-000000009269',
  'c000151-0000-4000-b000-000000009267',
  'Identifica la respuesta correcta. Los receptores muscar&iacute;nicos:',
  1,
  '[{"id":"9829","text":"Se activan tanto en las fibras adren&eacute;rgicas como colin&eacute;rgicas"},{"id":"9828","text":"Solo est&aacute;n presentes en las fibras colin&eacute;rgicas"},{"id":"9830","text":"Tiene s&oacute;lo capacidad de respuesta excitatoria"},{"id":"9831","text":"Puede generar potenciales postsin pticos excitatorios o inhibitorios dependiendo del neurotransmisor que los active"}]',
  '9829',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x2-0000-4000-b000-000000009270',
  'c000151-0000-4000-b000-000000009267',
  'El sistema nervioso aut&oacute;nomo:',
  2,
  '[{"id":"9835","text":"Todas las fibras preganglionares son colin&eacute;rgicas con receptores nicot&iacute;nicos"},{"id":"9832","text":"Las fibras preganglionares del parasimp&aacute;tico son colin&eacute;rgicas y las del simp&aacute;tico adren&eacute;rgicas"},{"id":"9833","text":"Las fibras postganglionares del parasimp&aacute;tico son colin&eacute;rgicas salvo las de las gl&aacute;ndulas sudor&iacute;paras que son adren&eacute;rgicas"},{"id":"9834","text":"Las fibras postganglionares del simp&aacute;tico son todas adren&eacute;rgicas"}]',
  '9835',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x3-0000-4000-b000-000000009271',
  'c000151-0000-4000-b000-000000009267',
  '&iquest;Cu&aacute;l de estas respuestas no se corresponde con la activaci&oacute;n del sistema parasimp&aacute;tico?',
  3,
  '[{"id":"9837","text":"Est&iacute;mulo de la secreci&oacute;n de las gl&aacute;ndulas sudor&iacute;paras"},{"id":"9836","text":"Disminuci&oacute;n de la frecuencia cardiaca"},{"id":"9838","text":"Est&iacute;mulo de la secreci&oacute;n de las gl&aacute;ndulas salivares"},{"id":"9839","text":"Est&iacute;mulo de la motilidad intestinal"}]',
  '9837',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x4-0000-4000-b000-000000009272',
  'c000151-0000-4000-b000-000000009267',
  'La sinapsis neuromuscular o placa motora es una sinapsis con:',
  4,
  '[{"id":"9843","text":"Un solo neurotransmisor (acetilcolina) y un solo receptor nicot&iacute;nico"},{"id":"9840","text":"Un solo neurotransmisor (acetilcolina) y sus dos receptores nicot&iacute;nicos y muscar&iacute;nicos"},{"id":"9841","text":"Un solo neurotransmisor (noradrenalina) con un solo receptor nicot&iacute;nico"},{"id":"9842","text":"La acetilcolina como &uacute;nico neurotransmisor de la fibra preganglionar y postganglionar"}]',
  '9843',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x5-0000-4000-b000-000000009273',
  'c000151-0000-4000-b000-000000009267',
  '&iquest;Los axones de que neuronas formar el componente som&aacute;tico del sistema nervioso perif&eacute;rico?',
  5,
  '[{"id":"9846","text":"Neuronas motoras inferiores"},{"id":"9844","text":"Neuronas motoras superiores"},{"id":"9845","text":"Neuronas del sistema nervioso central"},{"id":"9847","text":"Neuronas simp&aacute;ticas y parasimp&aacute;ticas"}]',
  '9846',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x6-0000-4000-b000-000000009274',
  'c000151-0000-4000-b000-000000009267',
  'Indica la respuesta correcta respecto o a los husos musculares:',
  6,
  '[{"id":"9848","text":"Son propioceptores de estiramiento"},{"id":"9849","text":"Carecen de inervaci&oacute;n motora"},{"id":"9850","text":"Sus terminaciones nerviosas sensitivas sinaptan en medula espinal con neuronas motoras superiores"},{"id":"9851","text":"A y c son correctas"}]',
  '9848',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x7-0000-4000-b000-000000009275',
  'c000151-0000-4000-b000-000000009267',
  'El l&iacute;quido cefalorraqu&iacute;deo:',
  7,
  '[{"id":"9853","text":"Circula por los ventr&iacute;culos cerebrales y el espacio subaracnoides (entre aracnoides y piamadre)"},{"id":"9852","text":"Tiene funciones relacionadas con la protecci&oacute;n impidiendo la entrada de sustancias nocivas en las neuronas de la corteza cerebral"},{"id":"9854","text":"Tienen una concentraci&oacute;n de prote&iacute;nas muy inferior a la del plasma sangu&iacute;neo para sus funciones de amortiguaci&oacute;n"}]',
  '9853',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x8-0000-4000-b000-000000009276',
  'c000151-0000-4000-b000-000000009267',
  'La despolarizaci&oacute;n en una neurona consiste en:',
  8,
  '[{"id":"9857","text":"La entrada de cargas positivas al interior de la c&eacute;lula por apertura de sus canales de difusi&oacute;n de sodio"},{"id":"9855","text":"La generaci&oacute;n de la carga negativa el interior de la c&eacute;lula gracias a la acci&oacute;n de la bomba de sodio potasio"},{"id":"9856","text":"El incremento de la carga negativa de la c&eacute;lula por debajo del potencial de membrana en reposo"},{"id":"9858","text":"La recuperaci&oacute;n del potencial de membrana negativo por la salida de potasio a trav&eacute;s de los canales de fuga"}]',
  '9857',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x9-0000-4000-b000-000000009277',
  'c000151-0000-4000-b000-000000009267',
  'Las neuronas, generan el potencial de membrana en reposo mediante:',
  9,
  '[{"id":"9862","text":"La bomba de sodio potasio, ATP-asa, que cada vez que act&uacute;a salen de la c&eacute;lula 3 iones sodio y entran 2 iones potasio"},{"id":"9859","text":"La bomba de sodio potasio, el transporte activo, que cada vez que act&uacute;an salen de la c&eacute;lula dos iones sodio y entran iones potasio"},{"id":"9860","text":"Mediante la repolarizaci&oacute;n, por la salida r&aacute;pida de gran cantidad de iones potasio a trav&eacute;s de los canales de fuga"},{"id":"9861","text":"Mediante la despolarizaci&oacute;n por la apertura de los canales de difusi&oacute;n r&aacute;pida de sodio al interior de la c&eacute;lula"}]',
  '9862',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x10-0000-4000-b000-000000009278',
  'c000151-0000-4000-b000-000000009267',
  'Identifica la respuesta correcta',
  10,
  '[{"id":"9863","text":"Los receptores muscar&iacute;nicos act&uacute;an a trav&eacute;s de las prote&iacute;nas G (se&ntilde;alizadores intracelulares) y pueden generar potenciales postsin pticos inhibitorios o excitatorios"},{"id":"9864","text":"Los receptores nicot&iacute;nicos act&uacute;an a trav&eacute;s de prote&iacute;nas G (se&ntilde;alizadores intracelulares) y pueden generar potenciales postsin pticos inhibitorios o excitatorios"},{"id":"9865","text":"Los receptores muscar&iacute;nicos son prote&iacute;nas de canal i&oacute;nico y su respuesta la acetilcolina es siempre un potencial postsin ptico excitatorios (PPSE)"},{"id":"9866","text":"Los receptores nicot&iacute;nicos son prote&iacute;nas de canal i&oacute;nico para entrada de sodio y salida del potasio y pueden generar potenciales postsin pticos excitatorios o inhibitorios"}]',
  '9863',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x11-0000-4000-b000-000000009279',
  'c000151-0000-4000-b000-000000009267',
  'Identifica la respuesta correcta. Los neurotransmisores act&uacute;an sobre los receptores de las c&eacute;lulas postsin pticas provocando:',
  11,
  '[{"id":"9867","text":"Una respuesta inhibitoria si en la c&eacute;lula se produce una hiperpolarizaci&oacute;n"},{"id":"9868","text":"Una respuesta inhibitoria si en la c&eacute;lula se producen una despolarizaci&oacute;n"},{"id":"9869","text":"Una respuesta excitatoria s&iacute; en la c&eacute;lula se produce una repolarizaci&oacute;n"},{"id":"9870","text":"Una respuesta excitatoria s&iacute; en la c&eacute;lula se produce una hiperpolarizaci&oacute;n"}]',
  '9867',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x12-0000-4000-b000-000000009280',
  'c000151-0000-4000-b000-000000009267',
  'En el sistema nervioso aut&oacute;nomo:',
  12,
  '[{"id":"9872","text":"Todas las fibras preganglionares son colin&eacute;rgicas con receptores nicot&iacute;nicos"},{"id":"9871","text":"Las fibras preganglionares del parasimp&aacute;tico son colin&eacute;rgicas y la del simp&aacute;tico adren&eacute;rgicas"},{"id":"9873","text":"Las fibras postganglionares del parasimp&aacute;tico son colin&eacute;rgicas salvo las de las gl&aacute;ndulas sudor&iacute;paras que son adren&eacute;rgicas"},{"id":"9874","text":"Las fibras postganglionares del simp&aacute;tico son todas adren&eacute;rgicas"}]',
  '9872',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x13-0000-4000-b000-000000009281',
  'c000151-0000-4000-b000-000000009267',
  'Respecto al sistema nervioso aut&oacute;nomo identifica la respuesta correcta:',
  13,
  '[{"id":"9875","text":"Los receptores a1 y a2 de las fibras adren&eacute;rgicas son siempre excitatorios"},{"id":"9876","text":"Los receptores muscar&iacute;nicos est&aacute;n presentes en todas las fibras del simp&aacute;tico tanto pre como postganglionares"},{"id":"9877","text":"Los receptores colin&eacute;rgicos act&uacute;an a trav&eacute;s de prote&iacute;nas G y siempre generan respuestas excitatoria"},{"id":"9878","text":"Todos los receptores de las fibras postganglionares del parasimp&aacute;tico son muscar&iacute;nicos"}]',
  '9875',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x14-0000-4000-b000-000000009282',
  'c000151-0000-4000-b000-000000009267',
  'Respecto de las caracter&iacute;sticas funcionales comunes en la contracci&oacute;n de las fibras musculares cardiacas y las de la musculatura lisa, identifica la respuesta correcta:',
  14,
  '[{"id":"9881","text":"Ambas se pueden contraer como un todo gracias a las conexiones entre c&eacute;lulas que les permite actuar como una unidad"},{"id":"9879","text":"Ambas carecen de troponina como prote&iacute;na de captaci&oacute;n de calcio"},{"id":"9880","text":"Ambas se pueden contraer, en todo ya que carecen de tropomiosina con prote&iacute;na de la contracci&oacute;n muscular"},{"id":"9882","text":"Ambas utilizan el ret&iacute;culo sarcoplasm&aacute;tico como fuente de calcio para la activaci&oacute;n de la contracci&oacute;n"}]',
  '9881',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x15-0000-4000-b000-000000009283',
  'c000151-0000-4000-b000-000000009267',
  'Los axones de que neuronas formar el componente som&aacute;tico del sistema nervioso perif&eacute;rico?',
  15,
  '[{"id":"9885","text":"Neuronas motoras inferiores"},{"id":"9883","text":"Neuronas motoras superiores"},{"id":"9884","text":"Neuronas del sistema nervioso central"},{"id":"9886","text":"Neurona simp&aacute;ticas y parasimp&aacute;ticas"}]',
  '9885',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x16-0000-4000-b000-000000009284',
  'c000151-0000-4000-b000-000000009267',
  'En qu&eacute; consiste un impulso nervioso?',
  16,
  '[{"id":"9889","text":"En la propagaci&oacute;n de una despolarizaci&oacute;n que se transmite a lo largo de un ax&oacute;n"},{"id":"9887","text":"En la alteraci&oacute;n del potencial de membrana a una excitaci&oacute;n"},{"id":"9888","text":"En la generaci&oacute;n de un potencial de acci&oacute;n debido a cualquier excitaci&oacute;n, aunque no supere el umbral de excitaci&oacute;n"},{"id":"9890","text":"En la transmisi&oacute;n de una repolarizaci&oacute;n una vez que ha pasado el potencial de acci&oacute;n"}]',
  '9889',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x17-0000-4000-b000-000000009285',
  'c000151-0000-4000-b000-000000009267',
  'El potencial de acci&oacute;n, la repolarizaci&oacute;n implica:',
  17,
  '[{"id":"9891","text":"Apertura de los canales de fuga de potasio y vuelta al estado negativo del potencial de membrana en reposo"},{"id":"9892","text":"Apertura de los canales de sodio y cambio de polaridad que acab&oacute; con el estado de reposo"},{"id":"9893","text":"Apertura de los canales de fuga de potasio y pas&oacute; del estado nativo en reposo a la carga positiva"},{"id":"9894","text":"Apertura de los canales de sodio por una excitaci&oacute;n y comienzo del potencial de acci&oacute;n"}]',
  '9891',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x18-0000-4000-b000-000000009286',
  'c000151-0000-4000-b000-000000009267',
  'En la generaci&oacute;n del potencial de membrana en reposo, intervienen:',
  18,
  '[{"id":"9895","text":"La bomba de sodio y potasio, sacando tres cationes sodio e introduciendo dos cationes potasio"},{"id":"9896","text":"La mayor permeabilidad a la membrana a la entrada de potasio"},{"id":"9897","text":"La mayor permeabilidad a la membrana a la entrada de sodio."}]',
  '9895',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x19-0000-4000-b000-000000009287',
  'c000151-0000-4000-b000-000000009267',
  'En el potencial de acci&oacute;n, &iquest;en qu&eacute; fase y c&oacute;mo recuperan las neuronas su carga el&eacute;ctrica negativo?',
  19,
  '[{"id":"9899","text":"En la fase de repolarizaci&oacute;n mediante la apertura de canales de fuga de potasio"},{"id":"9898","text":"En la fase de repolarizaci&oacute;n mediante la acci&oacute;n de la bomba de sodio potasio"},{"id":"9900","text":"En la fase de hiperpolarizaci&oacute;n mediante la apertura de canales de fuga de potasio"}]',
  '9899',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x20-0000-4000-b000-000000009288',
  'c000151-0000-4000-b000-000000009267',
  'Los neurotransmisores son sustancias qu&iacute;micas que:',
  20,
  '[{"id":"9903","text":"Estimula la formaci&oacute;n de potenciales de acci&oacute;n en las c&eacute;lulas postsin pticas"},{"id":"9901","text":"Estimulan la repolarizaci&oacute;n de las c&eacute;lulas postsin pticas"},{"id":"9902","text":"Estimula la formaci&oacute;n de receptores en las c&eacute;lulas postsin pticas"}]',
  '9903',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x21-0000-4000-b000-000000009289',
  'c000151-0000-4000-b000-000000009267',
  'Un potencial postsin ptico inhibitorio (PPSI) se corresponde con:',
  21,
  '[{"id":"9905","text":"Una hiperpolarizaci&oacute;n de las c&eacute;lulas postsin pticas por activaci&oacute;n de unos receptores muscar&iacute;nicos"},{"id":"9904","text":"Una despolarizaci&oacute;n de las c&eacute;lulas postsin pticas por activaci&oacute;n de los receptores nicot&iacute;nicos"},{"id":"9906","text":"Una hiperpolarizaci&oacute;n de las c&eacute;lulas postsin pticas por activaci&oacute;n de unos receptores nicot&iacute;nicos"}]',
  '9905',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x22-0000-4000-b000-000000009290',
  'c000151-0000-4000-b000-000000009267',
  'Identifica la respuesta correcta. Los receptores muscar&iacute;nicos:',
  22,
  '[{"id":"9907","text":"Se activan tanto en las fibras adren&eacute;rgicas como colin&eacute;rgicas"},{"id":"9908","text":"Tiene s&oacute;lo capacidad de respuesta excitatoria"},{"id":"9909","text":"Puede generar potenciales postsin pticos excitatorios o inhibitorias dependiendo del neurotransmisor que lo active"},{"id":"9910","text":"Solo est&aacute;n presentes en las fibras colin&eacute;rgicas"}]',
  '9907',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x23-0000-4000-b000-000000009291',
  'c000151-0000-4000-b000-000000009267',
  'Se&ntilde;ale los tres efectos que corresponden a la activaci&oacute;n del sistema simp&aacute;tico',
  23,
  '[{"id":"9911","text":"Broncodilataci&oacute;n, sudoraci&oacute;n e hiperglucemia"},{"id":"9912","text":"Sudoraci&oacute;n, broncoconstricci&oacute;n de hipoglucemia"},{"id":"9913","text":"Broncoconstricci&oacute;n, sudoraci&oacute;n y vasodilataci&oacute;n de los capilares sangu&iacute;neos del m&uacute;sculo esquel&eacute;tico"}]',
  '9911',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x24-0000-4000-b000-000000009292',
  'c000151-0000-4000-b000-000000009267',
  'Se&ntilde;ale la respuesta correcta:',
  24,
  '[{"id":"9915","text":"La m&eacute;dula adrenal funciona como un ganglio simp&aacute;tico modificado y libera adrenalina"},{"id":"9914","text":"Una fibra preganglionar del sistema parasimp&aacute;tico conecta con la m&eacute;dula adrenal y libera adrenalina"},{"id":"9916","text":"La conexi&oacute;n de la m&eacute;dula adrenal mediante una fibra postganglionar simp&aacute;tica incrementada la actividad de su neurotransmisor (noradrenalina)"}]',
  '9915',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x25-0000-4000-b000-000000009293',
  'c000151-0000-4000-b000-000000009267',
  'En la sinapsis la liberaci&oacute;n del neurotransmisor se alcanza:',
  25,
  '[{"id":"9918","text":"Una vez que activa el complejo calmodulina-prote&iacute;n quinasa el cual altera la membrana de las ves&iacute;culas sin&aacute;pticas y permite su actuaci&oacute;n"},{"id":"9917","text":"Una vez que el calcio se acopla las ves&iacute;culas sin&aacute;pticas y permite la exocitosis"},{"id":"9919","text":"Una vez que el calcio activa la calmodulina siendo esta prote&iacute;na el componente principal de las membranas de las ves&iacute;culas sin&aacute;pticas"},{"id":"9920","text":"Una vez que en el terminal presin&aacute;pticos se activa los receptores (prote&iacute;nas integrales de la membrana plasm&aacute;tica)"}]',
  '9918',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x26-0000-4000-b000-000000009294',
  'c000151-0000-4000-b000-000000009267',
  '&iquest;Cu&aacute;l de estas caracter&iacute;sticas y mecanismos no se corresponden con la funci&oacute;n de los neurotransmisores?:',
  26,
  '[{"id":"9923","text":"Sustancias qu&iacute;micas que se liberan en las ves&iacute;culas sin&aacute;pticas gracias a la fijaci&oacute;n de calcio sobre la membrana de estas ves&iacute;culas"},{"id":"9921","text":"Sustancias qu&iacute;micas que estimula la formaci&oacute;n de potenciales de acci&oacute;n en las c&eacute;lulas postsin pticas"},{"id":"9922","text":"Sustancias qu&iacute;micas que son sintetizadas en las neuronas y por flujo axonal pasan a la terminal presin&aacute;ptica en forma de ves&iacute;culas"},{"id":"9924","text":"Sustancias qu&iacute;micas que se liberan debido al ataque y exocitosis de las ves&iacute;culas sin&aacute;pticas sobre la membrana de la terminal presin&aacute;ptica"}]',
  '9923',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x27-0000-4000-b000-000000009295',
  'c000151-0000-4000-b000-000000009267',
  'Se&ntilde;ale la respuesta correcta. Los mecanismos de detecci&oacute;n de la temperatura corporal residen en:',
  27,
  '[{"id":"9926","text":"El hipot&aacute;lamo y un incremento en el umbral termorreceptores produce la fiebre"},{"id":"9925","text":"El t&aacute;lamo y est&aacute; conectado con los termorreceptores de la piel"},{"id":"9927","text":"El hipot&aacute;lamo y la eliminaci&oacute;n de los pir&oacute;genos produce la fiebre"}]',
  '9926',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x28-0000-4000-b000-000000009296',
  'c000151-0000-4000-b000-000000009267',
  'En el potencial de acci&oacute;n, &iquest;en qu&eacute; fase y c&oacute;mo recuperan las neuronas su carga el&eacute;ctrica negativa?',
  28,
  '[{"id":"9929","text":"En la fase de repolarizaci&oacute;n mediante la apertura de canales de fuga de potasio"},{"id":"9928","text":"En la fase de repolarizaci&oacute;n mediante la acci&oacute;n de la bomba de sodio y potasio"},{"id":"9930","text":"En la fase de hiperpolarizaci&oacute;n mediante la apertura de canales de fuga de potasio"}]',
  '9929',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x29-0000-4000-b000-000000009297',
  'c000151-0000-4000-b000-000000009267',
  'Identifica cu&aacute;l es la aseveraci&oacute;n correcta:',
  29,
  '[{"id":"9931","text":"Los nervios son casi todos mixtos con axones sensitivos y motores, tanto en fibras amiel&iacute;nicas como miel&iacute;nicas"},{"id":"9932","text":"Los nervios son sensitivos o motores y se corresponde respectivamente con tipos de fibras miel&iacute;nicas y amiel&iacute;nicas"},{"id":"9933","text":"Los nervios son sensitivos o motores indistintamente pueden ser fibras miel&iacute;nica y amiel&iacute;nicas"}]',
  '9931',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x30-0000-4000-b000-000000009298',
  'c000151-0000-4000-b000-000000009267',
  'Los axones, adem&aacute;s de transmitir del impulso nervioso (potencial de acci&oacute;n), transportan:',
  30,
  '[{"id":"9935","text":"P&eacute;ptidos o prote&iacute;nas (flujo axonal)"},{"id":"9934","text":"Iones, normalmente a millones (flujo axonal)"},{"id":"9936","text":"Y son enzimas como veh&iacute;culo"}]',
  '9935',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x31-0000-4000-b000-000000009299',
  'c000151-0000-4000-b000-000000009267',
  'Los neurotransmisores son sustancias qu&iacute;micas que en:',
  31,
  '[{"id":"9939","text":"Estimula la formaci&oacute;n de potenciales de acci&oacute;n en las c&eacute;lulas postsin pticas"},{"id":"9937","text":"Estimulan la repolarizaci&oacute;n de las c&eacute;lulas postsin pticas"},{"id":"9938","text":"Estimula la formaci&oacute;n de receptores en las c&eacute;lulas postsin pticas"}]',
  '9939',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x32-0000-4000-b000-000000009300',
  'c000151-0000-4000-b000-000000009267',
  'Identifica la aseveraci&oacute;n correcta:',
  32,
  '[{"id":"9942","text":"Los receptores muscar&iacute;nicos inician la se&ntilde;alizaci&oacute;n intracelular mediante prote&iacute;nas G y pueden generar PPSE y PPSI"},{"id":"9940","text":"Los receptores nicot&iacute;nicos son prote&iacute;nas de canal que inicia la respuesta intracelular mediante la activaci&oacute;n de prote&iacute;nas G"},{"id":"9941","text":"Los receptores adren&eacute;rgicos s&oacute;lo pueden provocar potenciales postsin ptico excitatorios (PPSE)"}]',
  '9942',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x33-0000-4000-b000-000000009301',
  'c000151-0000-4000-b000-000000009267',
  'La acetilcolina es el neurotransmisor:',
  33,
  '[{"id":"9943","text":"De todas las fibras del sistema parasimp&aacute;tico"},{"id":"9944","text":"De todas las hebras de sistema motor som&aacute;tico y del sistema simp&aacute;tico"},{"id":"9945","text":"De las fibras postganglionares del simp&aacute;tico y preganglionares del simp&aacute;tico"}]',
  '9943',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x34-0000-4000-b000-000000009302',
  'c000151-0000-4000-b000-000000009267',
  'Se&ntilde;ala la respuesta correcta:',
  34,
  '[{"id":"9947","text":"La m&eacute;dula adrenal funciona como un ganglio simp&aacute;tico modificado y libera adrenalina"},{"id":"9946","text":"Una fibra preganglionar del sistema parasimp&aacute;tico conecta con la m&eacute;dula adrenal y libera adrenalina"},{"id":"9948","text":"El sistema simp&aacute;tico conecta con la m&eacute;dula adrenal para incrementar la actividad de su neurotransmisor (adrenalina)"}]',
  '9947',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x35-0000-4000-b000-000000009303',
  'c000151-0000-4000-b000-000000009267',
  'La respuesta a la activaci&oacute;n del sistema simp&aacute;tico de los capilares sangu&iacute;neos del m&uacute;sculo esquel&eacute;tico es la vasodilataci&oacute;n &iquest;Por qu&eacute;?:',
  35,
  '[{"id":"9949","text":"Sus fibras postganglionares son colin&eacute;rgicas"},{"id":"9950","text":"Sus fibras postganglionares son adren&eacute;rgicas"},{"id":"9951","text":"Son fibras preganglionares son colin&eacute;rgicas y las postganglionares adren&eacute;rgicas"}]',
  '9949',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x36-0000-4000-b000-000000009304',
  'c000151-0000-4000-b000-000000009267',
  'Identifica la respuesta correcta:',
  36,
  '[{"id":"9954","text":"Las v&iacute;as sensitivas son aferentes y las neuronas primarias pueden ser o no ser el receptor"},{"id":"9952","text":"Las v&iacute;as sensitivas son aferentes y la neurona primaria siempre es el receptor"},{"id":"9953","text":"Las v&iacute;as sensitivas son eferentes y la neurona primaria no siempre es el recepto"}]',
  '9954',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x37-0000-4000-b000-000000009305',
  'c000151-0000-4000-b000-000000009267',
  'La funci&oacute;n del cerebelo de la fisiolog&iacute;a del control de movimiento es:',
  37,
  '[{"id":"9955","text":"Compara la informaci&oacute;n sobre plan de movimiento, con el movimiento que realmente se est&aacute; realizando y ajusta"},{"id":"9956","text":"Ayuda a seleccionar el patr&oacute;n de movimiento adecuado, a la vez que se suprimen los patrones opuestos"},{"id":"9957","text":"Controlar los movimientos voluntarios, conscientes y dirigidos"}]',
  '9955',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x38-0000-4000-b000-000000009306',
  'c000151-0000-4000-b000-000000009267',
  'El control de la termorregulaci&oacute;n, los receptores de calor est&aacute;n principalmente localizados en:',
  38,
  '[{"id":"9960","text":"En el &aacute;rea pr&aacute;ctica del hipot&aacute;lamo"},{"id":"9958","text":"En la piel de la corteza cerebral"},{"id":"9959","text":"De los n&uacute;cleos basales del tercer ventr&iacute;culo"}]',
  '9960',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x39-0000-4000-b000-000000009307',
  'c000151-0000-4000-b000-000000009267',
  'Los quimiorreceptores centrales son sensibles a las variaciones de:',
  39,
  '[{"id":"9961","text":"La presi&oacute;n de di&oacute;xido de carbono en la sangre arterial."},{"id":"9962","text":"La presi&oacute;n de ox&iacute;geno en la sangre arterial."},{"id":"9963","text":"Las dos respuestas anteriores son correctas."}]',
  '9961',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x40-0000-4000-b000-000000009308',
  'c000151-0000-4000-b000-000000009267',
  'Identifica la respuesta correcta. Los nocirreceptores:',
  40,
  '[{"id":"9966","text":"Son receptores del dolor distribuidos por todo el organismo en diferentes tejidos y v&iacute;sceras."},{"id":"9964","text":"Son receptores cut&aacute;neos distribuidos por todo el organismo y responden a est&iacute;mulos como presi&oacute;n, temperatura o estiramiento."},{"id":"9965","text":"Son propioceptores de cada tejido como los receptores de...muscular del &oacute;rgano tendinoso de Golgi."},{"id":"9967","text":"Son propioceptores inespec&iacute;ficos de cada tejido u &oacute;rgano que pueden detectar dolor o cualquier otro tipo de est&iacute;mulo."}]',
  '9966',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x41-0000-4000-b000-000000009309',
  'c000151-0000-4000-b000-000000009267',
  '&iquest;Cu&aacute;l de las siguientes NO es una funci&oacute;n del sistema nervioso?',
  41,
  '[{"id":"9971","text":"Todas son funciones del sistema nervioso."},{"id":"9968","text":"Funci&oacute;n sensitiva"},{"id":"9969","text":"Funci&oacute;n integrativa"},{"id":"9970","text":"Funci&oacute;n motora"}]',
  '9971',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x42-0000-4000-b000-000000009310',
  'c000151-0000-4000-b000-000000009267',
  'La porci&oacute;n motora del sistema nervioso aut&oacute;nomo puede dividirse en:',
  42,
  '[{"id":"9975","text":"divisiones simp&aacute;tica y parasimp&aacute;tica."},{"id":"9972","text":"divisiones som&aacute;tica y simp&aacute;tica."},{"id":"9973","text":"divisiones som&aacute;tica y parasimp&aacute;tica."},{"id":"9974","text":"divisiones ent&eacute;rica y som&aacute;tica."},{"id":"9976","text":"divisiones voluntaria e involuntaria."}]',
  '9975',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x43-0000-4000-b000-000000009311',
  'c000151-0000-4000-b000-000000009267',
  '&iquest;Cu&aacute;l de los siguientes tipos de c&eacute;lulas presenta la propiedad de excitabilidad el&eacute;ctrica?',
  43,
  '[{"id":"9979","text":"a y b"},{"id":"9977","text":"C&eacute;lulas musculares"},{"id":"9978","text":"Neuronas"},{"id":"9980","text":"Ninguna de las opciones"}]',
  '9979',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x44-0000-4000-b000-000000009312',
  'c000151-0000-4000-b000-000000009267',
  'Con respecto a las neuronas, el t&eacute;rmino "fibra nerviosa" se refiere a',
  44,
  '[{"id":"9984","text":"axones y dendritas."},{"id":"9981","text":"un ax&oacute;n."},{"id":"9982","text":"una dendrita."},{"id":"9983","text":"un cuerpo de Nissl."},{"id":"9985","text":"Todas las opciones"}]',
  '9984',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x45-0000-4000-b000-000000009313',
  'c000151-0000-4000-b000-000000009267',
  'Las c&eacute;lulas de Schwann comienzan a formar vainas de mielina alrededor de los axones en el sistema nervioso perif&eacute;rico:',
  45,
  '[{"id":"9987","text":"durante el desarrollo fetal."},{"id":"9986","text":"cuando las neuronas se lesionan."},{"id":"9988","text":"despu&eacute;s del nacimiento."},{"id":"9989","text":"solo en respuesta a la estimulaci&oacute;n nerviosa generada por c&eacute;lulas neurogliales."},{"id":"9990","text":"durante las etapas iniciales de la enfermedad de Alzheimer."}]',
  '9987',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x46-0000-4000-b000-000000009314',
  'c000151-0000-4000-b000-000000009267',
  'Se considera que la Na+/K+-ATPasa es una bomba electrog&eacute;nica porque:',
  46,
  '[{"id":"9991","text":"contribuye a la negatividad del potencial de membrana de reposo."},{"id":"9992","text":"los iones de sodio tienen carga negativa."},{"id":"9993","text":"presenta permeabilidad baja."},{"id":"9994","text":"ambos contribuyen a la negatividad del potencial de membrana de reposo y los iones de sodio tienen carga negativa."},{"id":"9995","text":"Todas las opciones"}]',
  '9991',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x47-0000-4000-b000-000000009315',
  'c000151-0000-4000-b000-000000009267',
  'Durante el estado de reposo de un canal de Na+ dependiente de voltaje, 1. la compuerta de inactivaci&oacute;n se abre. 2. la compuerta de activaci&oacute;n se cierra. 3. el canal es permeable al Na+.',
  47,
  '[{"id":"9999","text":"1 y 2 son v&aacute;lidos."},{"id":"9996","text":"1 solo"},{"id":"9997","text":"2 solo"},{"id":"9998","text":"3 solo"},{"id":"10000","text":"Todas las opciones son v&aacute;lidas."}]',
  '9999',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x48-0000-4000-b000-000000009316',
  'c000151-0000-4000-b000-000000009267',
  'Cuando un potencial graduado despolarizante hace despolarizar la membrana del ax&oacute;n al llegar al umbral,',
  48,
  '[{"id":"10004","text":"los canales de Na+ dependientes de voltaje se abren r&aacute;pidamente."},{"id":"10001","text":"los canales de Ca+2 dependientes de ligando se cierran r&aacute;pidamente."},{"id":"10002","text":"los canales de Ca+2 dependientes de voltaje se abren r&aacute;pidamente."},{"id":"10003","text":"los canales de Na+ dependientes del ligando se cierran r&aacute;pidamente."},{"id":"10005","text":"Ninguna de las opciones."}]',
  '10004',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x49-0000-4000-b000-000000009317',
  'c000151-0000-4000-b000-000000009267',
  'El potencial de membrana de reposo en las neuronas oscila de:',
  49,
  '[{"id":"10008","text":"-40 a -90 mV"},{"id":"10006","text":"+5 a 100 mV"},{"id":"10007","text":"-25 a -70 mV"},{"id":"10009","text":"-90 a 5 mV"},{"id":"10010","text":"Ninguna de las opciones"}]',
  '10008',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x50-0000-4000-b000-000000009318',
  'c000151-0000-4000-b000-000000009267',
  'Durante este per&iacute;odo, un segundo potencial de acci&oacute;n solo puede ser iniciado por un est&iacute;mulo superior al normal.',
  50,
  '[{"id":"10013","text":"Per&iacute;odo refractario relativo"},{"id":"10011","text":"Per&iacute;odo latente"},{"id":"10012","text":"Per&iacute;odo refractario absoluto"},{"id":"10014","text":"Todas las opciones"},{"id":"10015","text":"Ninguna de las opciones"}]',
  '10013',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x51-0000-4000-b000-000000009319',
  'c000151-0000-4000-b000-000000009267',
  'La comunicaci&oacute;n y la sincronizaci&oacute;n m&aacute;s r&aacute;pidas son las dos ventajas de:',
  51,
  '[{"id":"10017","text":"las sinapsis el&eacute;ctricas"},{"id":"10016","text":"las sinapsis qu&iacute;micas"},{"id":"10018","text":"los canales dependientes de ligandos"},{"id":"10019","text":"los canales dependientes del voltaje"},{"id":"10020","text":"los canales accionados mec&aacute;nicamente"}]',
  '10017',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x52-0000-4000-b000-000000009320',
  'c000151-0000-4000-b000-000000009267',
  'Un neurotransmisor excitatorio _________la membrana postsin&aacute;ptica.',
  52,
  '[{"id":"10021","text":"despolariza"},{"id":"10022","text":"repolariza"},{"id":"10023","text":"hiperpolariza"},{"id":"10024","text":"no afecta la polaridad de"},{"id":"10025","text":"pasa a trav&eacute;s de canales en"}]',
  '10021',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x53-0000-4000-b000-000000009321',
  'c000151-0000-4000-b000-000000009267',
  'PPSI significa:',
  53,
  '[{"id":"10028","text":"potencial postsin&aacute;ptico inhibitorio"},{"id":"10026","text":"potencial de sumaci&oacute;n presin&aacute;ptico inhibitorio"},{"id":"10027","text":"potencial de sumaci&oacute;n postsin&aacute;ptico inhibitorio"},{"id":"10029","text":"potencial presin&aacute;ptico inhibitorio."},{"id":"10030","text":"Ninguna de las opciones"}]',
  '10028',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x54-0000-4000-b000-000000009322',
  'c000151-0000-4000-b000-000000009267',
  'La difusi&oacute;n, la degradaci&oacute;n enzim&aacute;tica y la captaci&oacute;n hecha por las c&eacute;lulas son todos mecanismos para:',
  54,
  '[{"id":"10031","text":"eliminar un neurotransmisor"},{"id":"10032","text":"detener una sumaci&oacute;n espacial"},{"id":"10033","text":"continuar una sumaci&oacute;n temporal"},{"id":"10034","text":"inhibir un potencial presin&aacute;ptico"},{"id":"10035","text":"excitar un potencial presin&aacute;ptico"}]',
  '10031',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x55-0000-4000-b000-000000009323',
  'c000151-0000-4000-b000-000000009267',
  'Cuando la suma total de los potenciales postsin&aacute;pticos se elevan sobre el umbral, se crean potenciales de acci&oacute;n:',
  55,
  '[{"id":"10038","text":"en la zona gatillo."},{"id":"10036","text":"en la hendidura sin&aacute;ptica."},{"id":"10037","text":"en las dendritas."},{"id":"10039","text":"en el n&uacute;cleo de la neurona."},{"id":"10040","text":"en el neuroplasma."}]',
  '10038',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x56-0000-4000-b000-000000009324',
  'c000151-0000-4000-b000-000000009267',
  '&iquest;Cu&aacute;l de las siguientes NO se considera un neurotransmisor de mol&eacute;culas peque&ntilde;as?',
  56,
  '[{"id":"10044","text":"Endorfinas"},{"id":"10041","text":"Acetilcolina"},{"id":"10042","text":"Aminas biog&eacute;nicas"},{"id":"10043","text":"Purinas"},{"id":"10045","text":"Serotonina"}]',
  '10044',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x57-0000-4000-b000-000000009325',
  'c000151-0000-4000-b000-000000009267',
  '&iquest;Cu&aacute;l de los siguientes neurotransmisores se usan en casi todas las sinapsis inhibitorias de la m&eacute;dula espiral?',
  57,
  '[{"id":"10047","text":"&aacute;cido gammaaminobut&iacute;rico (GABA) y glicina"},{"id":"10046","text":"&aacute;cido gammaaminobut&iacute;rico (GABA) y acetilcolina"},{"id":"10048","text":"adrenalina y noradrenalina"},{"id":"10049","text":"serotonina y melatonina"},{"id":"10050","text":"glutamato y aspartato"}]',
  '10047',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x58-0000-4000-b000-000000009326',
  'c000151-0000-4000-b000-000000009267',
  'Las neuronas motoras aut&oacute;nomas regulan las actividades viscerales mediante: 1. aumento de las actividades en el tejido efector. 2. disminuci&oacute;n de las actividades del tejido efector. 3. cambio de direcci&oacute;n de la conducci&oacute;n del impulso a trav&eacute;s de la sinapsis.',
  58,
  '[{"id":"10054","text":"1 y 2"},{"id":"10051","text":"1"},{"id":"10052","text":"2"},{"id":"10053","text":"3"},{"id":"10055","text":"Ninguna de las opciones"}]',
  '10054',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x59-0000-4000-b000-000000009327',
  'c000151-0000-4000-b000-000000009267',
  'Una neurona posganglionar en el SNA:',
  59,
  '[{"id":"10056","text":"libera neurotransmisores que se unen a la celula efectora."},{"id":"10057","text":"es la primera parte de una via motora autonoma."},{"id":"10058","text":"tiene su cuerpo celular en el encefalo o en la medula espinal."},{"id":"10059","text":"tiene sus axones que salen del SNC por los nervios craneales."},{"id":"10060","text":"conducen informaci&oacute;n hacia la cadena de ganglios simp&aacute;ticos."}]',
  '10056',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x60-0000-4000-b000-000000009328',
  'c000151-0000-4000-b000-000000009267',
  'El sistema nervioso aut&oacute;nomo NO regula:',
  60,
  '[{"id":"10062","text":"musculo esquel&eacute;tico."},{"id":"10061","text":"gl&aacute;ndulas exocrinas."},{"id":"10063","text":"musculo cardiaco."},{"id":"10064","text":"musculo liso."},{"id":"10065","text":"gl&aacute;ndulas endocrinas"}]',
  '10062',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x61-0000-4000-b000-000000009329',
  'c000151-0000-4000-b000-000000009267',
  '&iquest;Cu&aacute;l de las siguientes descripciones de una neurona preganglionar NO es correcta?',
  61,
  '[{"id":"10070","text":"Forma uniones de hendidura con las neuronas posganglionares en ganglios aut&oacute;nomos."},{"id":"10066","text":"Tiene axones que salen SNC en un nervio craneal o espinal."},{"id":"10067","text":"Tiene axones mielinizados."},{"id":"10068","text":"Forma la primera parte de una v&iacute;a motora aut&oacute;noma."},{"id":"10069","text":"Tiene su cuerpo celular en el enc&eacute;falo o la medula espinal."}]',
  '10070',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x62-0000-4000-b000-000000009330',
  'c000151-0000-4000-b000-000000009267',
  '&iquest;Cu&aacute;l de los siguientes tipos de neuronas normalmente tendr&iacute;a el ax&oacute;n m&aacute;s corto?',
  62,
  '[{"id":"10074","text":"Neuronas simp&aacute;ticas preganglionares"},{"id":"10071","text":"Neuronas motoras som&aacute;ticas"},{"id":"10072","text":"Neuronas parasimp&aacute;ticas preganglionares"},{"id":"10073","text":"Neuronas simp&aacute;ticas posganglionares"},{"id":"10075","text":"Neuronas somatosensitivas."}]',
  '10074',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x63-0000-4000-b000-000000009331',
  'c000151-0000-4000-b000-000000009267',
  '&iquest;Cu&aacute;l de las siguientes opciones NO describe la divisi&oacute;n simp&aacute;tica del SNA?',
  63,
  '[{"id":"10076","text":"Ganglios que se hallan principalmente en la cabeza"},{"id":"10077","text":"Estimula las gl&aacute;ndulas sudor&iacute;paras"},{"id":"10078","text":"Hace sinapsis con el musculo liso de las paredes vasculares"},{"id":"10079","text":"Neuronas preganglionares cortas"},{"id":"10080","text":"Estimulo toracolumbar"}]',
  '10076',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x64-0000-4000-b000-000000009332',
  'c000151-0000-4000-b000-000000009267',
  '&iquest;Cu&aacute;l de las siguientes opciones NO describe la divisi&oacute;n parasimp&aacute;tica del SNA?',
  64,
  '[{"id":"10082","text":"Sinapsis con el musculo liso de las paredes vasculares"},{"id":"10081","text":"Neuronas preganglionares largas"},{"id":"10083","text":"Estimulaci&oacute;n del nervio vago"},{"id":"10084","text":"Ganglios que se hallan cerca de los efectores viscerales"},{"id":"10085","text":"Estimulaci&oacute;n de la medula espinal sacra"}]',
  '10082',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x65-0000-4000-b000-000000009333',
  'c000151-0000-4000-b000-000000009267',
  '&iquest;Cu&aacute;l de los siguientes t&eacute;rminos se usa para designar un efector que esta inervado por las divisiones parasimp&aacute;ticas y simp&aacute;ticas del SNA?',
  65,
  '[{"id":"10090","text":"Inervaci&oacute;n dual"},{"id":"10086","text":"Estimulaci&oacute;n preganglionar"},{"id":"10087","text":"Excitaci&oacute;n biganglionar"},{"id":"10088","text":"Estimulaci&oacute;n multiautonoma"},{"id":"10089","text":"Inervaci&oacute;n bipolar"}]',
  '10090',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x66-0000-4000-b000-000000009334',
  'c000151-0000-4000-b000-000000009267',
  'Los dos principales neurotransmisores del sistema nervioso aut&oacute;nomo son:',
  66,
  '[{"id":"10094","text":"noradrenalina y acetilcolina."},{"id":"10091","text":"nicotina y adrenalina."},{"id":"10092","text":"muscarina y acetilcolina."},{"id":"10093","text":"noradrenalina y muscarina."},{"id":"10095","text":"somatostatina y nicotina"}]',
  '10094',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x67-0000-4000-b000-000000009335',
  'c000151-0000-4000-b000-000000009267',
  '&iquest;Cu&aacute;l de las siguientes situaciones NO es causada por la activaci&oacute;n de la divisi&oacute;n parasimp&aacute;tica del SNA?',
  67,
  '[{"id":"10097","text":"Dilataci&oacute;n de las v&iacute;as a&eacute;reas"},{"id":"10096","text":"Disminuci&oacute;n de la frecuencia cardiaca"},{"id":"10098","text":"Disminuci&oacute;n del di&aacute;metro pupilar"},{"id":"10099","text":"Mayor secreci&oacute;n de jugos digestivos"},{"id":"10100","text":"Aumento de la motilidad g&aacute;strica"}]',
  '10097',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x68-0000-4000-b000-000000009336',
  'c000151-0000-4000-b000-000000009267',
  '&iquest;Cu&aacute;l de las siguientes opciones son tipos de receptores colin&eacute;rgicos?',
  68,
  '[{"id":"10104","text":"Receptores nicot&iacute;nicos y muscar&iacute;nicos"},{"id":"10101","text":"Nicot&iacute;nicos y receptores adren&eacute;rgicos"},{"id":"10102","text":"Muscar&iacute;nicos y receptores som&aacute;ticos"},{"id":"10103","text":"Adren&eacute;rgico y receptores som&aacute;ticos"},{"id":"10105","text":"Receptores somatostaticos y nicot&iacute;nicos"}]',
  '10104',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x69-0000-4000-b000-000000009337',
  'c000151-0000-4000-b000-000000009267',
  '&iquest;Cu&aacute;l de las siguientes respuestas NO es causada por la estimulaci&oacute;n de la divisi&oacute;n simp&aacute;tica?',
  69,
  '[{"id":"10107","text":"Constricci&oacute;n de las v&iacute;as a&eacute;reas"},{"id":"10106","text":"Mayor frecuencia cardiaca"},{"id":"10108","text":"Disminuci&oacute;n del flujo sangu&iacute;neo hacia los ri&ntilde;ones y el aparato gastrointestinal."},{"id":"10109","text":"Aumento del flujo sangu&iacute;neo hacia el musculo esquel&eacute;tico, el musculo cardiaco, el h&iacute;gado y la grasa."},{"id":"10110","text":"Elevaci&oacute;n del nivel de glucosa en sangre"}]',
  '10107',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x70-0000-4000-b000-000000009338',
  'c000151-0000-4000-b000-000000009267',
  '&iquest;Cu&aacute;l de las siguientes afirmaciones describe una respuesta com&uacute;n de un efector aut&oacute;nomo durante la reacci&oacute;n de "lucha o huida"?',
  70,
  '[{"id":"10114","text":"Dilataci&oacute;n de las pupilas."},{"id":"10111","text":"Aumento de la motilidad g&aacute;strica y secretoria."},{"id":"10112","text":"Constricci&oacute;n de vasos sangu&iacute;neos que irrigan los m&uacute;sculos esquel&eacute;ticos."},{"id":"10113","text":"Los tejidos adiposos reservan triglic&eacute;ridos para un uso ulterior."},{"id":"10115","text":"Dilataci&oacute;n de los vasos sangu&iacute;neos que irrigan los ri&ntilde;ones y los &oacute;rganos digestivos."}]',
  '10114',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x71-0000-4000-b000-000000009339',
  'c000151-0000-4000-b000-000000009267',
  'Indica la respuesta correcta. Respeto al transporte activo secundario, &iquest;cu&aacute;les ser&iacute;an los elementos necesarios para q se pudiera llevar a cabo un transporte intercambiador de sodio hidrogeno?',
  71,
  '[{"id":"10117","text":"Sodio a un lado de la membrana, hidrogeno al otro lado de la membrana, prote&iacute;nas transportadoras y bombas sodio-potasio que genere gradiente electrol&iacute;tico"},{"id":"10116","text":"Sodio e hidrogeno a un lado de la membrana, aporte energ&eacute;tico en forma de ATP y bomba transportadora de protones"},{"id":"10118","text":"Sodio e hidrogeno a un lado de la membrana, prote&iacute;nas facilitadoras y aporte de ATP"},{"id":"10119","text":"Sodio a un lado de la membrana, hidrogeno al otro lado de la membrana, bomba sodio potasio que aporte ATP y prote&iacute;nas facilitadoras"}]',
  '10117',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x72-0000-4000-b000-000000009340',
  'c000151-0000-4000-b000-000000009267',
  'Indica la respuesta correcta respecto a los &oacute;rganos tendinosos de Golgi:',
  72,
  '[{"id":"10123","text":"a y b son correctas"},{"id":"10120","text":"son propioceptores de tensi&oacute;n"},{"id":"10121","text":"carecen de inervaci&oacute;n motora"},{"id":"10122","text":"sus terminaciones nerviosas sensitivas sinaptan en medula espinal con neuronas motores superiores"}]',
  '10123',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x73-0000-4000-b000-000000009341',
  'c000151-0000-4000-b000-000000009267',
  'Usted examina un perro incapaz de mantenerse sobre las cuatro patas y apoyarse sobre la pata derecha trasera. Esta presenta un di&aacute;metro menor que la pata izquierda trasera. Al pinchar un dedo de la pata trasera izquierda el perro la retira, pero si pincha en la derecha trasera no la mueve. La respuesta propioceptiva en el lado izquierdo es normal, en el derecho no aparece. &iquest;d&oacute;nde se localiza la lesi&oacute;n del perro?',
  73,
  '[{"id":"10126","text":"Neurona motora inferior de la pata derecha trasera"},{"id":"10124","text":"Neurona motora inferior de la pata izquierda trasera"},{"id":"10125","text":"Neurona motora superior que controla la pata derecha trasera"},{"id":"10127","text":"Neurona motora superior que controla la pata izquierda trasera"}]',
  '10126',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x74-0000-4000-b000-000000009342',
  'c000151-0000-4000-b000-000000009267',
  'El mayor grado de mielinizaci&oacute;n de los axones genera una conducci&oacute;n del impulso nervioso:',
  74,
  '[{"id":"10131","text":"M&aacute;s r&aacute;pida en las neuronas del sistema nervioso motor som&aacute;tico"},{"id":"10128","text":"M&aacute;s r&aacute;pida en el sistema nervioso aut&oacute;nomo simp&aacute;tico"},{"id":"10129","text":"M&aacute;s r&aacute;pida en el sistema nervioso aut&oacute;nomo parasimp&aacute;tico"},{"id":"10130","text":"M&aacute;s lenta en el sistema nervioso motor som&aacute;tico"}]',
  '10131',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x75-0000-4000-b000-000000009343',
  'c000151-0000-4000-b000-000000009267',
  'Las neuronas, generan el potencial de membrana en reposo mediante:',
  75,
  '[{"id":"10132","text":"La bomba de sodio/potasio, ATPasa, que cada vez que act&uacute;a salen de la c&eacute;lula tres iones sodio y entran 2 iones potasio"},{"id":"10133","text":"La bomba sodio/potasio, de transporte activo, que cada vez que act&uacute;a salen de la c&eacute;lula 2 iones sodio y entran 3 iones potasio"},{"id":"10134","text":"Mediante la repolarizaci&oacute;n, por la salida r&aacute;pida de gran cantidad de iones potasio a trav&eacute;s de los canales de fuga"},{"id":"10135","text":"Mediante la despolarizaci&oacute;n por la apertura de los canales de difusi&oacute;n r&aacute;pida de sodio al interior de la c&eacute;lula"}]',
  '10132',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x76-0000-4000-b000-000000009344',
  'c000151-0000-4000-b000-000000009267',
  'La repolarizaci&oacute;n en una neurona es una fase del potencial de acci&oacute;n y consiste en:',
  76,
  '[{"id":"10136","text":"La recuperaci&oacute;n del potencial de membrana negativo por la salida de potasio a trav&eacute;s de los canales de fuga"},{"id":"10137","text":"La generaci&oacute;n de la carga negativa en el interior de la c&eacute;lula gracias a la acci&oacute;n de la bomba de sodio/potasio"},{"id":"10138","text":"El incremento de la carga negativa de la c&eacute;lula por debajo del potencial de membrana en reposo"},{"id":"10139","text":"La alta permeabilidad de la membrana a la entrada de sodio al interior de la c&eacute;lula a trav&eacute;s de sus canales de difusi&oacute;n"}]',
  '10136',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x77-0000-4000-b000-000000009345',
  'c000151-0000-4000-b000-000000009267',
  'La llegada de un impulso nervioso a la terminal presin&aacute;ptica implica su despolarizaci&oacute;n. &iquest;Cu&aacute;l es el primer efecto hasta la liberaci&oacute;n del neurotransmisor?',
  77,
  '[{"id":"10143","text":"La apertura de los canales de voltaje de calcio que permiten su entrada masiva en el interior de la c&eacute;lula"},{"id":"10140","text":"La alteraci&oacute;n de las prote&iacute;nas de las ves&iacute;culas sin&aacute;pticas que provocan su atraque y exocitosis"},{"id":"10141","text":"La activaci&oacute;n de la calmodulina y la fosforilaci&oacute;n de las prote&iacute;nas de las membranas de las vesiculas presin&aacute;pticas"},{"id":"10142","text":"La apertura de los canales de fuga de potasio que permiten una r&aacute;pida repolarizaci&oacute;n para activar los canales de calcio"}]',
  '10143',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x78-0000-4000-b000-000000009346',
  'c000151-0000-4000-b000-000000009267',
  'Identifica la respuesta correcta. Los neurotransmisores act&uacute;an sobre los receptores de membrana postsin&aacute;ptica provocando:',
  78,
  '[{"id":"10147","text":"Una respuesta inhibidora si en la c&eacute;lula se produce una hiperpolarizaci&oacute;n"},{"id":"10144","text":"Una respuesta inhibitoria si en la c&eacute;lula se produce una despolarizaci&oacute;n"},{"id":"10145","text":"Una respuesta excitatoria si en la c&eacute;lula se produce una repolarizaci&oacute;n"},{"id":"10146","text":"Una respuesta excitadora si en la c&eacute;lula se produce una hiperpolarizaci&oacute;n"}]',
  '10147',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x79-0000-4000-b000-000000009347',
  'c000151-0000-4000-b000-000000009267',
  'Identifica la respuesta correcta. Los receptores muscar&iacute;nicos:',
  79,
  '[{"id":"10148","text":"Se activan tanto en las fibras adren&eacute;rgicas como colin&eacute;rgicas"},{"id":"10149","text":"Tienen solo capacidad de respuesta excitatoria"},{"id":"10150","text":"S&oacute;lo est&aacute;n presentes en las fibras colin&eacute;rgicas"},{"id":"10151","text":"Pueden generar potenciales postsin&aacute;pticos excitatorios o inhibitorios dependiendo del neurotransmisor que los active"}]',
  '10148',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x80-0000-4000-b000-000000009348',
  'c000151-0000-4000-b000-000000009267',
  'Respecto de las fibras nerviosas del sistema nervioso aut&oacute;nomo preganglionares y postganglionares, identifica la respuesta correcta:',
  80,
  '[{"id":"10153","text":"Todas las del parasimp&aacute;tico son colin&eacute;rgicas"},{"id":"10152","text":"Todas las del simp&aacute;tico son adren&eacute;rgicas"},{"id":"10154","text":"Las postganglionares del simp&aacute;tico son todas adren&eacute;rgicas"},{"id":"10155","text":"Las postganglionares del parasimp&aacute;tico son en su mayor&iacute;a colin&eacute;rgicas salvo algunas adren&eacute;rgicas"}]',
  '10153',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x81-0000-4000-b000-000000009349',
  'c000151-0000-4000-b000-000000009267',
  'Las respuestas caracter&iacute;sticas de la estimulaci&oacute;n del nervio vago sobre el coraz&oacute;n, tracto digestivo y p&aacute;ncreas son respectivamente:',
  81,
  '[{"id":"10156","text":"Disminuci&oacute;n de la frecuencia cardiaca, incremento de la motilidad intestinal e incremento de la secreci&oacute;n exocrina del p&aacute;ncreas"},{"id":"10157","text":"Incremento de la frecuencia cardiaca, incremento de la motilidad intestinal e incremento de la secreci&oacute;n exocrina del p&aacute;ncreas"},{"id":"10158","text":"Disminuci&oacute;n de la frecuencia cardiaca, disminuci&oacute;n de la motilidad intestinal e incremento de secreci&oacute;n exocrina del p&aacute;ncreas"},{"id":"10159","text":"Incremento de la frecuencia cardiaca, disminuci&oacute;n de la motilidad intestinal y disminuci&oacute;n de la secreci&oacute;n exocrina del p&aacute;ncreas"}]',
  '10156',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x82-0000-4000-b000-000000009350',
  'c000151-0000-4000-b000-000000009267',
  'Respecto del sistema nervioso aut&oacute;nomo identifica la respuesta correcta:',
  82,
  '[{"id":"10160","text":"Los receptores a1 y a2 de las fibras adren&eacute;rgicas son siempre excitatorios"},{"id":"10161","text":"Los receptores muscar&iacute;nicos est&aacute;n presentes en todas las fibras del simp&aacute;tico tanto pre como postganglionares"},{"id":"10162","text":"Los receptores colin&eacute;rgicos act&uacute;an a trav&eacute;s de la prote&iacute;na G y siempre generan respuestas excitatorias"}]',
  '10160',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x83-0000-4000-b000-000000009351',
  'c000151-0000-4000-b000-000000009267',
  'La troponina es una prote&iacute;na que act&uacute;a en la contracci&oacute;n muscular y su funci&oacute;n depende de:',
  83,
  '[{"id":"10163","text":"La activaci&oacute;n por el calcio y su efecto sobre el desplazamiento de la tropomiosina"},{"id":"10164","text":"La despolarizaci&oacute;n de la fibra muscular y el deslizamiento de la tropomiosina"},{"id":"10165","text":"La activaci&oacute;n de la tropomiosina y la liberaci&oacute;n de los puntos de atraque de la miosina"},{"id":"10166","text":"La liberaci&oacute;n de energ&iacute;a del ATP y la generaci&oacute;n del golpe de fuerza"}]',
  '10163',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x84-0000-4000-b000-000000009352',
  'c000151-0000-4000-b000-000000009267',
  'En relaci&oacute;n con los m&uacute;sculos de fibras estriadas o lisas, identifica la respuesta correcta:',
  84,
  '[{"id":"10167","text":"Lisa: M&uacute;ltiples sinapsis en un solo ax&oacute;n y receptores colin&eacute;rgicos y adren&eacute;rgicos"},{"id":"10168","text":"Estriada: Sinapsis neuromuscular o placa motora, siempre colin&eacute;rgica de receptor nicot&iacute;nico o muscar&iacute;nico"},{"id":"10169","text":"Lisa: Una sola sinapsis neuromuscular con receptor muscar&iacute;nico o nicot&iacute;nico"},{"id":"10170","text":"Estriada: M&uacute;ltiples sinapsis en una sola fibra muscular y siempre receptor nicot&iacute;nico"}]',
  '10167',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x85-0000-4000-b000-000000009353',
  'c000151-0000-4000-b000-000000009267',
  'En la contracci&oacute;n muscular la salida de iones calcio en el sarcoplasma permite:',
  85,
  '[{"id":"10173","text":"La activaci&oacute;n de la troponina y el desbloqueo de los puntos de uni&oacute;n de la miosina sobre la actina"},{"id":"10171","text":"La activaci&oacute;n de la tropomiosina y el desbloqueo de los puntos de uni&oacute;n de la actina sobre la miosina"},{"id":"10172","text":"La uni&oacute;n de la troponina y la tropomiosina que generan el golpe de fuerza"},{"id":"10174","text":"La activaci&oacute;n del puente cruzado de la miosina que cataliza el ATP y genera el golpe de fuerza"}]',
  '10173',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x86-0000-4000-b000-000000009354',
  'c000151-0000-4000-b000-000000009267',
  'Usted examina un perro incapaz de mantenerse y apoyarse sobre la pata derecha trasera (par&aacute;lisis). &EACUTE;sta tiene un di&aacute;metro menor que le izquierda trasera (atrofia). Al pinchar un dedo de la pata trasera izquierda del perro retira la pata, pero s&iacute; pincha el de la derecha, no la mueve (propiocepci&oacute;n) &iquest;D&oacute;nde se localizada la lesi&oacute;n del perro?',
  86,
  '[{"id":"10176","text":"NMI pata trasera derecha"},{"id":"10175","text":"NMS qu&eacute; controla la pata trasera derecha"},{"id":"10177","text":"Sinapsis neuromuscular de la pata trasera derecha"}]',
  '10176',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x87-0000-4000-b000-000000009355',
  'c000151-0000-4000-b000-000000009267',
  'La funci&oacute;n del cerebelo de la fisiolog&iacute;a del control de movimiento es:',
  87,
  '[{"id":"10178","text":"Comparar la informaci&oacute;n sobre plan de movimiento, con el movimiento que realmente se est&aacute; realizando y ajusta"},{"id":"10179","text":"Ayuda a seleccionar el patr&oacute;n de movimiento adecuado, a la vez que se suprimen los patrones opuestos"},{"id":"10180","text":"Controlar los movimientos voluntarios, conscientes y dirigidos"}]',
  '10178',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x88-0000-4000-b000-000000009356',
  'c000151-0000-4000-b000-000000009267',
  'En relaci&oacute;n con los m&uacute;sculos de fibras estriadas o lisas, identifica la respuesta correcta:',
  88,
  '[{"id":"10183","text":"Estriada: m&uacute;ltiples sinapsis en una sola fibra muscular y siempre receptor nicot&iacute;nico"},{"id":"10181","text":"Estriada: sinapsis neuromuscular o placa motora, siempre colin&eacute;rgicas de receptores nicot&iacute;nicos o muscar&iacute;nicos"},{"id":"10182","text":"Lisa: sinapsis neuromuscular o placa motora, siempre colin&eacute;rgicas de receptores nicot&iacute;nicos o muscar&iacute;nicos"},{"id":"10184","text":"Lisa: m&uacute;ltiples sinapsis en un solo ax&oacute;n y receptores colin&eacute;rgicos y adren&eacute;rgicos"}]',
  '10183',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x89-0000-4000-b000-000000009357',
  'c000151-0000-4000-b000-000000009267',
  'La troponina es una prote&iacute;na que act&uacute;a la contracci&oacute;n muscular y su funci&oacute;n depende de:',
  89,
  '[{"id":"10185","text":"La activaci&oacute;n por el calcio y su efecto sobre el desplazamiento de la tropomiosina"},{"id":"10186","text":"La despolarizaci&oacute;n de la fibra muscular y el deslizamiento de la tropomiosina"},{"id":"10187","text":"La activaci&oacute;n de la tropomiosina y la liberaci&oacute;n de los puntos de ataque de la miosina"},{"id":"10188","text":"La liberaci&oacute;n de energ&iacute;a de ATP y la generaci&oacute;n del golpe de fuerza"}]',
  '10185',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x90-0000-4000-b000-000000009358',
  'c000151-0000-4000-b000-000000009267',
  '&iquest;Qu&eacute; tipo de conducci&oacute;n del impulso nervioso genera un mayor grado de mielinizaci&oacute;n de los axones?',
  90,
  '[{"id":"10189","text":"M&aacute;s r&aacute;pida en las neuronas al sistema nervioso motor som&aacute;tico"},{"id":"10190","text":"M&aacute;s r&aacute;pida al sistema nervioso aut&oacute;nomo simp&aacute;tico"},{"id":"10191","text":"M&aacute;s r&aacute;pida al sistema nervioso aut&oacute;nomo parasimp&aacute;tico"},{"id":"10192","text":"Mas lenta en el sistema nervioso motor som&aacute;tico"}]',
  '10189',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x91-0000-4000-b000-000000009359',
  'c000151-0000-4000-b000-000000009267',
  'La primera respuesta a la llegada del potencial de acci&oacute;n (despolarizaci&oacute;n) a la terminal sin&aacute;ptica es:',
  91,
  '[{"id":"10195","text":"La apertura de canales de calcio activados por voltaje"},{"id":"10193","text":"La apertura de canales de calcio activados por el complejo calmodulina"},{"id":"10194","text":"La activaci&oacute;n del sistema Calmodulina-protein-quinasa"},{"id":"10196","text":"La inmediata salida de calcio al medio extracelular"}]',
  '10195',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x92-0000-4000-b000-000000009360',
  'c000151-0000-4000-b000-000000009267',
  'En relaci&oacute;n con la contracci&oacute;n muscular de las fibras estriadas &iquest;Cu&aacute;l es el elemento que se acorta?',
  92,
  '[{"id":"10200","text":"El sarc&oacute;mero debido al desplazamiento de los filamentos de actina sobre los de miosina"},{"id":"10197","text":"Las bandas entre los discos Z debido al deslizamiento o de los filamentos gruesos sobre los finos (miosina y actina respectivamente)"},{"id":"10198","text":"El sarc&oacute;mero debido al acortamiento de los filamentos de actina en el golpe de fuerza"},{"id":"10199","text":"Los discos Z debido al acortamiento de los filamentos de miosina en el puente cruzado"}]',
  '10200',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x93-0000-4000-b000-000000009361',
  'c000151-0000-4000-b000-000000009267',
  'En el m&uacute;sculo estriado &iquest;de d&oacute;nde proviene la energ&iacute;a necesaria para la contracci&oacute;n muscular?',
  93,
  '[{"id":"10201","text":"El golpe de fuerza libera energ&iacute;a del ATP cuando la cabeza del puente cruzado de la miosina se une con la actina"},{"id":"10202","text":"Se libera ATP en el golpe de fuerza cuando el puente cruzado de la actina se une con la miosina"},{"id":"10203","text":"La troponina tiene alta capacidad de captaci&oacute;n de ATP cuando se une la tropomiosina"},{"id":"10204","text":"Se libera ATP cuando la tropomiosina libera los puntos de ataque de la troponina y la h&eacute;lice actina"}]',
  '10201',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x94-0000-4000-b000-000000009362',
  'c000151-0000-4000-b000-000000009267',
  'Los gana el sistema nervioso aut&oacute;nomo la neurona posganglionar dispone de:',
  94,
  '[{"id":"10207","text":"Receptores colin&eacute;rgicos o adren&eacute;rgicos seg&uacute;n sea de la divisi&oacute;n simp&aacute;tica o parasimp&aacute;tica"},{"id":"10205","text":"Receptor es muscar&iacute;nicos"},{"id":"10206","text":"Receptores nicot&iacute;nicos"},{"id":"10208","text":"Receptores nicot&iacute;nicos y muscar&iacute;nicos"}]',
  '10207',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x95-0000-4000-b000-000000009363',
  'c000151-0000-4000-b000-000000009267',
  'El principal lugar de resistencia al flujo de sangre se encuentra:',
  95,
  '[{"id":"10209","text":"Metaarteriolas"},{"id":"10210","text":"Venas"},{"id":"10211","text":"Arterias el&aacute;sticas"},{"id":"10212","text":"Capilares"}]',
  '10209',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x96-0000-4000-b000-000000009364',
  'c000151-0000-4000-b000-000000009267',
  '&iquest;Qu&eacute; es y c&oacute;mo consiguen las neuronas su potencial de membrana de reposo?',
  96,
  '[{"id":"10214","text":"Es la carga el&eacute;ctrica negativa de -70 mV en interna de la c&eacute;lula de antelaci&oacute;n de la bomba sodio/potasio"},{"id":"10215","text":"Es el equilibro de cargas el&eacute;ctricas entre el medio intra y extracelular y se consigue mediante la repolarizaci&oacute;n (fuga de iones de potasio)"},{"id":"10216","text":"Es la polarizaci&oacute;n de +35mV en interior de la c&eacute;lula mediante la acci&oacute;n de la bomba sodio/potasio"},{"id":"10217","text":"Es la carga el&eacute;ctrica negativa de -35 mV el interior de la c&eacute;lula, mediante los canales de fuga de potasio"}]',
  '10214',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x97-0000-4000-b000-000000009365',
  'c000151-0000-4000-b000-000000009267',
  'Identifica la respuesta correcta donde aparecen dos aspectos caracter&iacute;sticos de la activaci&oacute;n del sistema parasimp&aacute;tico:',
  97,
  '[{"id":"10219","text":"Est&iacute;mulo de la motilidad intestinal y liberaci&oacute;n de la vejiga de la orina"},{"id":"10218","text":"Dilataci&oacute;n pupilar de hipoglucemia"},{"id":"10220","text":"Incremento de la presi&oacute;n arterial y de la glucolisis"},{"id":"10221","text":"Broncodilataci&oacute;n y secreci&oacute;n de las gl&aacute;ndulas sudor&iacute;paras"}]',
  '10219',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x98-0000-4000-b000-000000009366',
  'c000151-0000-4000-b000-000000009267',
  'Identifica respuesta correcta en cuanto a localizaci&oacute;n y funciones del hipot&aacute;lamo:',
  98,
  '[{"id":"10223","text":"Forma parte del dienc&eacute;falo y tiene funciones de regulaci&oacute;n del sistema endocrino y la homeostasis"},{"id":"10222","text":"Forma parte del telenc&eacute;falo y sus funciones est&aacute;n relacionadas con la memoria y el aprendizaje motor"},{"id":"10224","text":"Forma parte del tronco encef&aacute;lico con funciones de control del sistema endocrino y el cerebelo"},{"id":"10225","text":"Forman parte del mesenc&eacute;falo y tiene capacidad de s&iacute;ntesis hormonal como la prolactina (PRL) y la hormona del crecimiento (GH)"}]',
  '10223',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x99-0000-4000-b000-000000009367',
  'c000151-0000-4000-b000-000000009267',
  'En relaci&oacute;n con las funciones del nervio vago identifica la respuesta correcta:',
  99,
  '[{"id":"10227","text":"Es un nervios sensitivos motor y su estimulaci&oacute;n puede disminuir la frecuencia cardiaca"},{"id":"10226","text":"Estimula la glucolisis hep tica e inhibe la contracciones intestinales"},{"id":"10228","text":"Inhibe secreciones de est&oacute;mago y broncodilataci&oacute;n"},{"id":"10229","text":"Y de fibras colin&eacute;rgicas y adren&eacute;rgicas que generan respuestas excitatorias o inhibitorias"}]',
  '10227',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x100-0000-4000-b000-000000009368',
  'c000151-0000-4000-b000-000000009267',
  '&iquest;Cu&aacute;l de las siguientes opciones enumera los componentes de un arco reflejo aut&oacute;nomo en la secuencia de activaci&oacute;n correcta?',
  100,
  '[{"id":"10328","text":"receptor - neurona sensitiva - centro integrador - neurona motora - efector"},{"id":"10329","text":"receptor - neurona motora - centro integrador - neurona sensitiva - efector"},{"id":"10330","text":"efector - neurona sensitiva - centro integrador - neurona motora - receptor"},{"id":"10331","text":"centro integrador - receptor - neurona sensitiva - neurona motora - efector"},{"id":"10332","text":"receptor - neurona sensitiva - neurona motora - efector - centro integrador"}]',
  '10328',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x101-0000-4000-b000-000000009369',
  'c000151-0000-4000-b000-000000009267',
  '&iquest;Cu&aacute;l de las siguientes regiones del encefalo funciona como el principal centro de control e integraci&oacute;n del SNA?',
  101,
  '[{"id":"10336","text":"hipot&aacute;lamo"},{"id":"10333","text":"cerebro"},{"id":"10334","text":"cerebelo"},{"id":"10335","text":"t&aacute;lamo"},{"id":"10337","text":"hip&oacute;fisis"}]',
  '10336',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x102-0000-4000-b000-000000009370',
  'c000151-0000-4000-b000-000000009267',
  'La troponina es una prote&iacute;na que act&uacute;a en la contracci&oacute;n muscular y su funci&oacute;n depende de:',
  102,
  '[{"id":"10339","text":"La activaci&oacute;n por el calcio y efecto sobre el deslizamiento de la tropomiosina"},{"id":"10338","text":"La despolarizaci&oacute;n de la fibra muscular y el deslizamiento de la tropomiosina"},{"id":"10340","text":"La activaci&oacute;n de la tropomiosina y la liberaci&oacute;n de los puntos de ataque de la miosina"}]',
  '10339',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x103-0000-4000-b000-000000009371',
  'c000151-0000-4000-b000-000000009267',
  'Las sinapsis neuromuscular o placa motora es una sinapsis con:',
  103,
  '[{"id":"10343","text":"Un solo neurotransmisor (acetilcolina) y un solo receptor nicot&iacute;nico"},{"id":"10341","text":"Un solo neurotransmisor (acetilcolina) y sus receptores nicot&iacute;nicos y muscar&iacute;nicos"},{"id":"10342","text":"Un solo neurotransmisor (noradrenalina) con un solo receptor nicot&iacute;nico"}]',
  '10343',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x104-0000-4000-b000-000000009372',
  'c000151-0000-4000-b000-000000009267',
  'Identifica la respuesta correcta:',
  104,
  '[{"id":"10347","text":"La despolarizaci&oacute;n de la fibra muscular estriada permite la liberaci&oacute;n del calcio del ret&iacute;culo sarcoplasm&aacute;tico"},{"id":"10344","text":"La repolarizaci&oacute;n de la fibra muscular estriadas permite la liberaci&oacute;n del calcio del ret&iacute;culo sarcoplasm&aacute;tico"},{"id":"10345","text":"La repolarizaci&oacute;n de la fibra muscular estriadas, abre los canales de calcio en el sarcolema"},{"id":"10346","text":"La despolarizaci&oacute;n de la fibra muscular estriadas permite la entrada de calcio desde el medio extracelular"}]',
  '10347',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x105-0000-4000-b000-000000009373',
  'c000151-0000-4000-b000-000000009267',
  'La contracci&oacute;n muscular del golpe de fuerza se genera:',
  105,
  '[{"id":"10348","text":"Una vez que la cabeza del puente cruzado de la miosina se une con la actina"},{"id":"10349","text":"Una vez que la troponina se une a la tropomiosina"},{"id":"10350","text":"Una vez que la cabeza del puente cruzado de la miosina se une con la tropomiosina"},{"id":"10351","text":"Una vez que el puente cruzado de la actina se une con la miosina"}]',
  '10348',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x106-0000-4000-b000-000000009374',
  'c000151-0000-4000-b000-000000009267',
  'Cu&aacute;l de estas afirmaciones es correcta, en cuanto a diferencias entre la contracci&oacute;n de las fibras musculares lisas y estriadas:',
  106,
  '[{"id":"10354","text":"Las lisas utilizan calcio extracelular para la contracci&oacute;n"},{"id":"10352","text":"Las lisas carecen de troponina y tropomiosina"},{"id":"10353","text":"Las fibras estriadas carecen siempre de conexiones el&eacute;ctricas entre ellas"}]',
  '10354',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x107-0000-4000-b000-000000009375',
  'c000151-0000-4000-b000-000000009267',
  'Se&ntilde;ale la respuesta correcta. La contracci&oacute;n del m&uacute;sculo estriado se caracteriza por:',
  107,
  '[{"id":"10356","text":"Un acortamiento de sarc&oacute;meros con el deslizamiento de los filamentos finos (actina) sobre los gruesos (miosina)"},{"id":"10355","text":"Un acortamiento de los sarc&oacute;meros con la correspondiente reducci&oacute;n de la longitud de los filamentos de actina y miosina"},{"id":"10357","text":"El filamento deslizante donde el acoplamiento de la miosina (filamento grueso) implica el deslizamiento de la actina"}]',
  '10356',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x108-0000-4000-b000-000000009376',
  'c000151-0000-4000-b000-000000009267',
  'Una de la diferencias de las fibras musculares lisas respecto a las estriadas es:',
  108,
  '[{"id":"10358","text":"La ausencia de dep&oacute;sitos de calcio en el ret&iacute;culo sarcoplasm&aacute;tico"},{"id":"10359","text":"La falta de miosina y tropomiosina"},{"id":"10360","text":"No necesitan calcio para llevar a cabo la contracci&oacute;n muscular"}]',
  '10358',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x109-0000-4000-b000-000000009377',
  'c000151-0000-4000-b000-000000009267',
  'Una de las fases de la regulaci&oacute;n de la contracci&oacute;n muscular es la:',
  109,
  '[{"id":"10361","text":"Entra de calcio en el sarcoplasma y acoplamiento con la troponina"},{"id":"10362","text":"Entrada de calcio en el ret&iacute;culo sarcopl&aacute;smico y acoplamiento con la calmodulina"},{"id":"10363","text":"Recuperaci&oacute;n del calcio por el ret&iacute;culo sarcopl&aacute;smico y acoplamiento con la tropomiosina"}]',
  '10361',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x110-0000-4000-b000-000000009378',
  'c000151-0000-4000-b000-000000009267',
  '&iquest;Cu&aacute;l de los siguientes NO es una funci&oacute;n importante del tejido muscular?',
  110,
  '[{"id":"10368","text":"producir vitaminas"},{"id":"10364","text":"mover la sangre a trav&eacute;s del cuerpo"},{"id":"10365","text":"generar calor mediante contracciones"},{"id":"10366","text":"estabilizar el movimiento de las articulaciones"},{"id":"10367","text":"promover el movimiento de las estructuras corporales"}]',
  '10368',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x111-0000-4000-b000-000000009379',
  'c000151-0000-4000-b000-000000009267',
  'Esta es la propiedad del m&uacute;sculo que posibilita el estiramiento sin lesionar:',
  111,
  '[{"id":"10371","text":"extensibilidad"},{"id":"10369","text":"excitabilidad el&eacute;ctrica"},{"id":"10370","text":"contractibilidad"},{"id":"10372","text":"elasticidad"},{"id":"10373","text":"termog&eacute;nesis"}]',
  '10371',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x112-0000-4000-b000-000000009380',
  'c000151-0000-4000-b000-000000009267',
  'Los org&aacute;nulos contr&aacute;ctiles de la fibra muscular esquel&eacute;tica son estructuras con forma de hilos denominadas:',
  112,
  '[{"id":"10374","text":"miofibrillas."},{"id":"10375","text":"mioglobina."},{"id":"10376","text":"mitocondria."},{"id":"10377","text":"discos Z."},{"id":"10378","text":"l&iacute;neas M."}]',
  '10374',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x113-0000-4000-b000-000000009381',
  'c000151-0000-4000-b000-000000009267',
  '&iquest;Cu&aacute;l de las siguientes opciones enumera correctamente la secuencia de estructuras que los potenciales de acci&oacute;n deben atravesar para excitar la contracci&oacute;n del m&uacute;sculo esquel&eacute;tico?',
  113,
  '[{"id":"10382","text":"ax&oacute;n de la neurona, sarcolema, t&uacute;bulos T"},{"id":"10379","text":"sarcolema, ax&oacute;n de la neurona, t&uacute;bulos T"},{"id":"10380","text":"t&uacute;bulos T, sarcolema, miofilamentos"},{"id":"10381","text":"fibra muscular, ax&oacute;n de la neurona, miofibrillas"},{"id":"10383","text":"miofibrillas, miofilamentos, mitocondria"}]',
  '10382',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x114-0000-4000-b000-000000009382',
  'c000151-0000-4000-b000-000000009267',
  'La liberaci&oacute;n de calcio desde estas estructuras desencadena la contracci&oacute;n muscular:',
  114,
  '[{"id":"10386","text":"cisternas terminales del ret&iacute;culo sarcopl&aacute;smico"},{"id":"10384","text":"miofibrillas"},{"id":"10385","text":"mitocondria"},{"id":"10387","text":"T&uacute;bulos T"},{"id":"10388","text":"ninguna de las opciones"}]',
  '10386',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x115-0000-4000-b000-000000009383',
  'c000151-0000-4000-b000-000000009267',
  'El ret&iacute;culo sarcopl&aacute;smico de las fibras musculares esquel&eacute;ticas se usan para almacenar:',
  115,
  '[{"id":"10393","text":"Ca2+"},{"id":"10389","text":"ox&iacute;geno."},{"id":"10390","text":"ATP."},{"id":"10391","text":"PO4-"},{"id":"10392","text":"Na+"}]',
  '10393',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x116-0000-4000-b000-000000009384',
  'c000151-0000-4000-b000-000000009267',
  '&iquest;Cu&aacute;l de las siguientes regiones de un sarc&oacute;mero contiene filamentos delgados?',
  116,
  '[{"id":"10397","text":"Banda I y banda A."},{"id":"10394","text":"Banda I"},{"id":"10395","text":"Banda A"},{"id":"10396","text":"Zona H"},{"id":"10398","text":"Todas las opciones son correctas."}]',
  '10397',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x117-0000-4000-b000-000000009385',
  'c000151-0000-4000-b000-000000009267',
  '&iquest;Cu&aacute;l de las siguientes regiones del sarc&oacute;mero contienen filamentos gruesos?',
  117,
  '[{"id":"10403","text":"Todas las opciones son correctas."},{"id":"10399","text":"zona de superposici&oacute;n"},{"id":"10400","text":"banda A"},{"id":"10401","text":"zona H"},{"id":"10402","text":"banda A y zona H"}]',
  '10403',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x118-0000-4000-b000-000000009386',
  'c000151-0000-4000-b000-000000009267',
  '&iquest;Qu&eacute; prote&iacute;nas regulatorias se encuentran en los filamentos delgados de las fibras musculares esquel&eacute;ticas?',
  118,
  '[{"id":"10405","text":"tropomiosina y troponina"},{"id":"10404","text":"troponina y titina"},{"id":"10406","text":"miosina y titina"},{"id":"10407","text":"titina y tropomiosina"},{"id":"10408","text":"tropomiosina y miosina"}]',
  '10405',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x119-0000-4000-b000-000000009387',
  'c000151-0000-4000-b000-000000009267',
  'Los iones de calcio se liberan desde el ret&iacute;culo sarcoplasm&aacute;tico hacia el citosol:',
  119,
  '[{"id":"10409","text":"al comienzo de la contracci&oacute;n."},{"id":"10410","text":"en respuesta a la uni&oacute;n de la acetilcolina con los canales de liberaci&oacute;n de Ca2+."},{"id":"10411","text":"por transporte activo mediante bombas de Ca2+ en la membrana RS."},{"id":"10412","text":"despu&eacute;s de que la contracci&oacute;n finaliza."},{"id":"10413","text":"Todas las opciones son correctas."}]',
  '10409',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x120-0000-4000-b000-000000009388',
  'c000151-0000-4000-b000-000000009267',
  '&iquest;Qu&eacute; es lo que le otorga energ&iacute;a a la cabeza de miosina?',
  120,
  '[{"id":"10417","text":"reacci&oacute;n de hidr&oacute;lisis del ATP"},{"id":"10414","text":"los filamentos de actina"},{"id":"10415","text":"iones de calcio"},{"id":"10416","text":"iones de potasio"},{"id":"10418","text":"s&iacute;ntesis de ADP"}]',
  '10417',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x121-0000-4000-b000-000000009389',
  'c000151-0000-4000-b000-000000009267',
  'Se compone de una neurona motora som&aacute;tica y todas las fibras musculares esquel&eacute;ticas que estimula:',
  121,
  '[{"id":"10420","text":"unidad motora"},{"id":"10419","text":"sarc&oacute;mero"},{"id":"10421","text":"uni&oacute;n neuromuscular"},{"id":"10422","text":"unidad muscular"},{"id":"10423","text":"m&uacute;sculo liso de unidad m&uacute;ltiple"}]',
  '10420',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x122-0000-4000-b000-000000009390',
  'c000151-0000-4000-b000-000000009267',
  '&iquest;Cu&aacute;l de las siguientes funciona como una prote&iacute;na motora en los tres tipos de tejido muscular?',
  122,
  '[{"id":"10425","text":"miosina"},{"id":"10424","text":"actina"},{"id":"10426","text":"troponina"},{"id":"10427","text":"titina"},{"id":"10428","text":"tropomiosina"}]',
  '10425',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x123-0000-4000-b000-000000009391',
  'c000151-0000-4000-b000-000000009267',
  'Durante la contracci&oacute;n muscular por el mecanismo del filamento deslizante, los filamentos delgados son llevados hacia el/la:',
  123,
  '[{"id":"10431","text":"l&iacute;nea M."},{"id":"10429","text":"disco Z."},{"id":"10430","text":"zona H."},{"id":"10432","text":"banda A."},{"id":"10433","text":"banda I."}]',
  '10431',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x124-0000-4000-b000-000000009392',
  'c000151-0000-4000-b000-000000009267',
  'La contracci&oacute;n muscular esquel&eacute;tica seguir&aacute; ocurriendo en tanto se disponga de las siguientes sustancias qu&iacute;micas en el citosol de la fibra muscular:',
  124,
  '[{"id":"10435","text":"iones de calcio y ATP"},{"id":"10434","text":"ATP y acetilcolina (ACh)"},{"id":"10436","text":"ACh e iones de potasio"},{"id":"10437","text":"iones de sodio y ATP"},{"id":"10438","text":"calcio y ACh"}]',
  '10435',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x125-0000-4000-b000-000000009393',
  'c000151-0000-4000-b000-000000009267',
  'Para estimular la contracci&oacute;n del m&uacute;sculo esquel&eacute;tico, la acetilcolina debe cruzar el/la __________ de la uni&oacute;n neuromuscular y unirse a los receptores de la placa motora terminal.',
  125,
  '[{"id":"10440","text":"hendidura sin&aacute;ptica"},{"id":"10439","text":"nodo de Ranvier"},{"id":"10441","text":"sarcolema"},{"id":"10442","text":"bulbo terminal sin&aacute;ptico"},{"id":"10443","text":"t&uacute;bulo transversal"}]',
  '10440',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x126-0000-4000-b000-000000009394',
  'c000151-0000-4000-b000-000000009267',
  'El tono muscular liso se mantiene por la presencia prolongada de ______ en el citosol de la c&eacute;lula muscular',
  126,
  '[{"id":"10445","text":"iones de calcio"},{"id":"10444","text":"ATP"},{"id":"10446","text":"iones de fosfato"},{"id":"10447","text":"mioglobina"},{"id":"10448","text":"Ninguna de las opciones."}]',
  '10445',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x127-0000-4000-b000-000000009395',
  'c000151-0000-4000-b000-000000009267',
  'En el potencial de acci&oacute;n la repolarizaci&oacute;n implica',
  127,
  '[{"id":"10449","text":"Apertura de los canales de fuga de potasio y vuelta al estado negativo del potencial de membrana de reposo"},{"id":"10450","text":"La apertura de los canales de sodio y cambio de polaridad que acaba con el estado de reposo"},{"id":"10451","text":"Apertura de los canales de fuga de potasio y paso del estado negativo en reposo a la carga positiva"},{"id":"10452","text":"Apertura de los canales de sodio por una excitaci&oacute;n y comienzo del potencial de acci&oacute;n"}]',
  '10449',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x128-0000-4000-b000-000000009396',
  'c000151-0000-4000-b000-000000009267',
  'En el potencial de acci&oacute;n, en qu&eacute; fase y como recuperan las neuronas su carga el&eacute;ctrica negativa',
  128,
  '[{"id":"10454","text":"En la fase de repolarizaci&oacute;n mediante la apertura de canales de fuga de potasio"},{"id":"10453","text":"En la fase de repolarizaci&oacute;n mediante la acci&oacute;n de la bomba sodio y potasio"},{"id":"10455","text":"En la fase de hiperpolarizaci&oacute;n mediante la apertura de canales de fuga de potasio"},{"id":"10456","text":"En la fase de despolarizaci&oacute;n mediante la entrada de aniones en la celula"}]',
  '10454',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x129-0000-4000-b000-000000009397',
  'c000151-0000-4000-b000-000000009267',
  'Un potencial de postsin pticos inhibitorios (PPSI) se corresponde con',
  129,
  '[{"id":"10458","text":"Una hiperpolarizaci&oacute;n de la celula postsin&aacute;ptica por activaci&oacute;n de los receptores muscar&iacute;nicos"},{"id":"10457","text":"Una despolarizaci&oacute;n de la celula postsin&aacute;ptica por activaci&oacute;n de los receptores nicot&iacute;nicos"},{"id":"10459","text":"Una hiperpolarizaci&oacute;n de la celula postsin&aacute;ptica por activaci&oacute;n de un receptor nicot&iacute;nico"},{"id":"10460","text":"Una repolarizaci&oacute;n de la celula por activaci&oacute;n de receptores colin&eacute;rgicos o adren&eacute;rgicos"}]',
  '10458',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x130-0000-4000-b000-000000009398',
  'c000151-0000-4000-b000-000000009267',
  'Identifica la respuesta correcta. Los receptores muscar&iacute;nicos',
  130,
  '[{"id":"10464","text":"Son colin&eacute;rgicos y act&uacute;an a trav&eacute;s de prote&iacute;nas G que a su vez activan la apertura de un determinado canal i&oacute;nico"},{"id":"10461","text":"Son adren&eacute;rgicos y generan potenciales postsin pticos inhibitorios o excitatorios dependiendo de la formaci&oacute;n de segundos mensajeros intracelulares"},{"id":"10462","text":"Son colin&eacute;rgicos y generan potenciales de acci&oacute;n siempre excitatorios por apertura de canales i&oacute;nicos de sodio"},{"id":"10463","text":"Son adren&eacute;rgicos y act&uacute;an a trav&eacute;s de prote&iacute;nas G y segundos mensajeros pudiendo generar potenciales postsin pticos inhibitorios o excitatorios"}]',
  '10464',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x131-0000-4000-b000-000000009399',
  'c000151-0000-4000-b000-000000009267',
  '&iquest;Cu&aacute;l de estos dos efectos no se corresponden con la estimulaci&oacute;n del sistema nervioso aut&oacute;nomo simp&aacute;tico?',
  131,
  '[{"id":"10465","text":"Incremento de la secreci&oacute;n de gl&aacute;ndulas salivares y broncoconstricci&oacute;n"},{"id":"10466","text":"Dilataci&oacute;n pupilar y broncodilataci&oacute;n"},{"id":"10467","text":"Inhibici&oacute;n de la motilidad intestinal e incremento de la glucolisis"},{"id":"10468","text":"Estimulo de la secreci&oacute;n de las gl&aacute;ndulas sudor&iacute;paras e inhibici&oacute;n de la secreci&oacute;n exocrina del p&aacute;ncreas"}]',
  '10465',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x132-0000-4000-b000-000000009400',
  'c000151-0000-4000-b000-000000009267',
  'Identifica la respuesta correcta',
  132,
  '[{"id":"10470","text":"La medula adrenal funciona como un ganglio simp&aacute;tico modificado y libera adrenalina"},{"id":"10469","text":"Una fibra preganglionar del sistema parasimp&aacute;tico conecta con la medula adrenal y libera adrenalina"},{"id":"10471","text":"La conexi&oacute;n de la medula adrenal mediante una fibra postganglionar simp&aacute;tica incrementa la actividad de su neurotransmisor (noradrenalina)"},{"id":"10472","text":"La medula adrenal act&uacute;a mediante la conexi&oacute;n de una fibra postganglionar simple"}]',
  '10470',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x133-0000-4000-b000-000000009401',
  'c000151-0000-4000-b000-000000009267',
  '&iquest;Todas las v&iacute;sceras tienen inervaci&oacute;n simp&aacute;tica y parasimp&aacute;tica?',
  133,
  '[{"id":"10474","text":"Si, las c&eacute;lulas pueden tener capacidad de respuesta antag&oacute;nica seg&uacute;n el receptor que se active"},{"id":"10473","text":"No, cada celula solo puede responder a un determinado tipo de neurotransmisor"},{"id":"10475","text":"S&iacute;, pero solo tienen un determinado tipo de neurotransmisor y receptor"},{"id":"10476","text":"Depende de qu&eacute; tipo de c&eacute;lulas pueden responder a uno u otro estimulo"}]',
  '10474',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x134-0000-4000-b000-000000009402',
  'c000151-0000-4000-b000-000000009267',
  'En relaci&oacute;n con los m&uacute;sculos de fibra estriada o lisas, identifica la respuesta correcta',
  134,
  '[{"id":"10480","text":"Lisa: m&uacute;ltiples sinapsis en un solo ax&oacute;n y receptores colin&eacute;rgicos y postganglionar"},{"id":"10477","text":"Estriada: sinapsis neuromuscular o placa motora, siempre colin&eacute;rgica de receptor nicot&iacute;nico o muscar&iacute;nicos"},{"id":"10478","text":"Lisa: una sola sinapsis neuromuscular con receptor muscar&iacute;nicos o nicot&iacute;nico"},{"id":"10479","text":"Estriada: m&uacute;ltiples sinapsis en una sola fibra muscular y siempre receptor nicot&iacute;nico"}]',
  '10480',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x135-0000-4000-b000-000000009403',
  'c000151-0000-4000-b000-000000009267',
  'La sinapsis neuromuscular o placa motora es una sinapsis con',
  135,
  '[{"id":"10483","text":"Un solo neurotransmisor (acetil colina) y un solo receptor nicot&iacute;nico"},{"id":"10481","text":"Un solo neurotransmisor (acetil colina) y sus receptores nicot&iacute;nicos y muscar&iacute;nicos"},{"id":"10482","text":"Un solo neurotransmisor (noradrenalina) con un solo receptor nicot&iacute;nico"}]',
  '10483',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x136-0000-4000-b000-000000009404',
  'c000151-0000-4000-b000-000000009267',
  'En la contracci&oacute;n muscular, el golpe de fuerza genera',
  136,
  '[{"id":"10484","text":"Una vez que la cabeza del puente cruzado de la miosina se une con la actina"},{"id":"10485","text":"Una vez que la troponina que se une a la tropomiosina"},{"id":"10486","text":"Una vez que la cabeza del puente cruzado de la miosina se une con la tropomiosina"},{"id":"10487","text":"Una vez q el puente cruzado de la actina se une con la miosina"}]',
  '10484',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x137-0000-4000-b000-000000009405',
  'c000151-0000-4000-b000-000000009267',
  'El proceso de contracci&oacute;n muscular (musculo estriado) se inicia con la captaci&oacute;n de calcio por la troponina y este calcio procede de',
  137,
  '[{"id":"10491","text":"Del ret&iacute;culo sarcopl&aacute;smico y su salida al sarcoplasma depende de la apertura de canales de calcio de voltaje inducida por la despolarizaci&oacute;n"},{"id":"10488","text":"El medio extracelular y la apertura de los canales de calcio de voltaje de la membrana permiten su entrada en el sarcoplasma"},{"id":"10489","text":"Del medio extracelular y la uni&oacute;n con la troponina permite la liberaci&oacute;n de la tropomiosina"},{"id":"10490","text":"Del ret&iacute;culo sarcopl&aacute;smico y su salida al sarcoplasma depende de la activaci&oacute;n del sistema calmodulina-protein-quinasa"}]',
  '10491',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x138-0000-4000-b000-000000009406',
  'c000151-0000-4000-b000-000000009267',
  'El l&iacute;quido cefalorraqu&iacute;deo se forma y circula por',
  138,
  '[{"id":"10494","text":"Se forma en el plexo coroideo del tercer y cuarto ventr&iacute;culo y circula por el espacio subaracnoideo"},{"id":"10492","text":"Se forma en la am&iacute;gdala y circula por el espacio supraaracnoideo entre la aracnoides y la duramadre"},{"id":"10493","text":"Se forma en el plexo coroideo del segundo ventr&iacute;culo y circula por el canal ependimario"}]',
  '10494',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd151x139-0000-4000-b000-000000009407',
  'c000151-0000-4000-b000-000000009267',
  'Indica la respuesta correcta. Respeto al transporte activo secundario, &iquest;cu&aacute;les ser&iacute;an los elementos necesarios para q se pudiera llevar a cabo un transporte intercambiador de sodio hidrogeno?',
  139,
  '[{"id":"10496","text":"Sodio a un lado de la membrana, hidrogeno al otro lado de la membrana, prote&iacute;nas transportadoras y bombas sodio-potasio que genere gradiente electrol&iacute;tico"},{"id":"10495","text":"Sodio e hidrogeno a un lado de la membrana, aporte energ&eacute;tico en forma de ATP y bomba transportadora de protones"},{"id":"10497","text":"Sodio e hidrogeno a un lado de la membrana, prote&iacute;nas facilitadoras y aporte de ATP"},{"id":"10498","text":"Sodio a un lado de la membrana, hidrogeno al otro lado de la membrana, bomba sodio potasio que aporte ATP y prote&iacute;nas facilitadoras"}]',
  '10496',
  '2026-04-27 17:01:04'
);

-- Quiz: "TEST 2- SISTEMA NERVIOSO Y MUSCULAR" → Course: "Fisiología Veterinaria  2ºC" (49 questions) [renamed to add "(2)"]
INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'c000152-0000-4000-b000-000000009408',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 2- SISTEMA NERVIOSO Y MUSCULAR (2)',
  NULL,
  'quiz',
  100,
  '2026-04-27 17:01:04',
  '2026-04-27 17:01:04'
FROM Class c
WHERE c.name = 'Fisiología Veterinaria  2ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 2- SISTEMA NERVIOSO Y MUSCULAR (2)' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x0-0000-4000-b000-000000009409',
  'c000152-0000-4000-b000-000000009408',
  'En los ganglios del sistema nervioso aut&oacute;nomo la neurona postganglionar dispone de:',
  0,
  '[{"id":"11192","text":"Receptores nicot&iacute;nicos"},{"id":"11191","text":"Receptores muscar&iacute;nicos"},{"id":"11193","text":"Receptores colin&eacute;rgicos o adren&eacute;rgicos seg&uacute;n sea la divisi&oacute;n simp&aacute;tica o parasimp&aacute;tica"},{"id":"11194","text":"Receptores nicot&iacute;nicos y muscar&iacute;nicos"}]',
  '11192',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x1-0000-4000-b000-000000009410',
  'c000152-0000-4000-b000-000000009408',
  '&iquest;Qu&eacute; diferencias existen entre el grado de mielinizaci&oacute;n y velocidad de conducci&oacute;n del impulso nervioso en el sistema som&aacute;tico respecto al sistema nervioso aut&oacute;nomo?',
  1,
  '[{"id":"11196","text":"Existe un mayor grado de mielinizaci&oacute;n de los axones y una mayor velocidad de conducci&oacute;n"},{"id":"11195","text":"El grado de mielinizaci&oacute;n es el mismo en ambos sistemas, pero el sistema nervioso aut&oacute;nomo tiene mayor velocidad de conducci&oacute;n"},{"id":"11197","text":"Existe un menor grado de mielinizaci&oacute;n de los axones y la velocidad de conducci&oacute;n es mayor en el sistema simp&aacute;tico"},{"id":"11198","text":"Existe un menor grado de mielinizaci&oacute;n de los axones y la velocidad de conducci&oacute;n es mayor en el sistema aut&oacute;nomo"}]',
  '11196',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x2-0000-4000-b000-000000009411',
  'c000152-0000-4000-b000-000000009408',
  'En relaci&oacute;n con los receptores colin&eacute;rgicos, identifica la respuesta correcta:',
  2,
  '[{"id":"11201","text":"Los receptores muscar&iacute;nicos act&uacute;an a trav&eacute;s de la prote&iacute;na G y pueden generar potenciales postsin&aacute;pticos inhibitorios y excitatorios"},{"id":"11202","text":"Los receptores a y act&uacute;an a trav&eacute;s de la prote&iacute;na G y pueden generar potenciales postsin&aacute;pticos inhibitorios y excitatorios"},{"id":"11203","text":"Los receptores nicot&iacute;nicos act&uacute;an a trav&eacute;s de la prote&iacute;na G y su respuesta a la acetil-colina es siempre un potencial postsin&aacute;ptico excitatorio"},{"id":"11204","text":"Los receptores nicot&iacute;nicos son canales i&oacute;nicos de sodio y potasio y pueden generar potenciales postsin&aacute;pticos excitatorios o inhibitorios"}]',
  '11201',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x3-0000-4000-b000-000000009412',
  'c000152-0000-4000-b000-000000009408',
  'Identifica la respuesta correcta donde aparecen dos aspectos caracter&iacute;sticos de la activaci&oacute;n del sistema parasimp&aacute;tico',
  3,
  '[{"id":"11206","text":"Est&iacute;mulo de la movilidad intestinal y liberaci&oacute;n de la vejiga de la orina"},{"id":"11205","text":"Dilataci&oacute;n pupilar e hipoglucemia"},{"id":"11207","text":"Incremento de la presi&oacute;n arterial y de la glucolisis"},{"id":"11208","text":"Broncodilataci&oacute;n y secreci&oacute;n de las gl&aacute;ndulas sudor&iacute;paras"}]',
  '11206',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x4-0000-4000-b000-000000009413',
  'c000152-0000-4000-b000-000000009408',
  '&iquest;Qu&eacute; es y c&oacute;mo consiguen las neuronas su potencial de membrana en reposo?',
  4,
  '[{"id":"11209","text":"Es una carga el&eacute;ctrica negativa de -70 mV en el interior de la c&eacute;lula mediante la acci&oacute;n de la bomba sodio/potasio"},{"id":"11210","text":"Es el equilibrio de cargas el&eacute;ctricas entre el medio intra y extra celular mediante la repolarizaci&oacute;n"},{"id":"11211","text":"Es la polarizaci&oacute;n de +35 mV en el interior de la c&eacute;lula mediante la acci&oacute;n de la bomba sodio/potasio"},{"id":"11212","text":"Es la carga el&eacute;ctrica negativa de -35 mV en el interior de la c&eacute;lula mediante los canales de fuga de potasio"}]',
  '11209',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x5-0000-4000-b000-000000009414',
  'c000152-0000-4000-b000-000000009408',
  'Identifica la respuesta correcta en cuanto a diferencias de la contracci&oacute;n de las fibras musculares lisas respecto de las fibras del m&uacute;sculo estriado. Las fibras musculares lisas:',
  5,
  '[{"id":"11216","text":"Carecen de troponina, son de contracci&oacute;n lenta y tienen conexiones gap entre ella"},{"id":"11213","text":"Poseen calmodulina para la captaci&oacute;n de calcio, son independientes y no se pueden contraer a la vez"},{"id":"11214","text":"Son fibras de contracci&oacute;n r&aacute;pida, captan el calcio extracelular mediante la troponina y se contraen de forma independiente"},{"id":"11215","text":"Son fibras cil&iacute;ndricas largas y multinucleadas, con una sola sinapsis neuromuscular de receptor nicot&iacute;nico"}]',
  '11216',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x6-0000-4000-b000-000000009415',
  'c000152-0000-4000-b000-000000009408',
  'En relaci&oacute;n a los receptores adren&eacute;rgicos, se&ntilde;ala la respuesta correcta:',
  6,
  '[{"id":"11219","text":"Act&uacute;an a trav&eacute;s de prote&iacute;nas G y la formaci&oacute;n de segundos mensajeros, pudiendo generar potenciales de acci&oacute;n postsin&aacute;pticos excitatorios e inhibitorios"},{"id":"11217","text":"Son metabotr&oacute;picos y act&uacute;an como receptores de canal i&oacute;nico generando potenciales de acci&oacute;n excitatorios o inhibitorios dependiendo del tipo de canal"},{"id":"11218","text":"Act&uacute;an a trav&eacute;s de prote&iacute;nas G que activan directamente la apertura de un determinado canal i&oacute;nico y son inhibitorios o excitatorios"},{"id":"11220","text":"Son ionotr&oacute;picos y generan potenciales postsin&aacute;pticos inhibitorios dependiendo exclusivamente de las prote&iacute;nas G como se&ntilde;alizadores intracelulares"}]',
  '11219',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x7-0000-4000-b000-000000009416',
  'c000152-0000-4000-b000-000000009408',
  'Indica la respuesta correcta en cuanto a la localizaci&oacute;n y funciones del hipot&aacute;lamo:',
  7,
  '[{"id":"11222","text":"Forma parte del dienc&eacute;falo y tiene funciones que regulan el sistema endocrino y la homeostasis"},{"id":"11221","text":"Forma parte del telenc&eacute;falo y sus funciones est&aacute;n relacionadas con la memoria y el aprendizaje motor"},{"id":"11223","text":"Forma parte del tronco encef&aacute;lico con funciones de control del sistema endocrino y el cerebelo"},{"id":"11224","text":"Forma parte del mesenc&eacute;falo y tiene capacidad de s&iacute;ntesis hormonal como la prolactina y la hormona del crecimiento"}]',
  '11222',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x8-0000-4000-b000-000000009417',
  'c000152-0000-4000-b000-000000009408',
  '&iquest;C&oacute;mo act&uacute;a una neurona ante un est&iacute;mulo?',
  8,
  '[{"id":"11294","text":"repolarizaci&oacute;n tiene lugar gracias al cierre de canales de Na+ y la apertura de canales de K+"},{"id":"11293","text":"Durante la despolarizaci&oacute;n se abren canales de Na+, permitiendo la salida de Na+ del interior de la c&eacute;lula"},{"id":"11295","text":"Durante la repolarizaci&oacute;n se produce la entrada de K+ hacia el interior de la c&eacute;lula"},{"id":"11296","text":"Durante la hiperpolarizaci&oacute;n la neurona alcanza un potencial el&eacute;ctrico superior al del valor en reposo"}]',
  '11294',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x9-0000-4000-b000-000000009418',
  'c000152-0000-4000-b000-000000009408',
  'Indica cu&aacute;l de las siguientes fases de la contracci&oacute;n muscular es correcta:',
  9,
  '[{"id":"11299","text":"El Ca2+ se une a la troponina por su subunidad C"},{"id":"11297","text":"El potencial de acci&oacute;n se transmite a lo largo de la fibra muscular y entra en el centro de la misma a trav&eacute;s del ret&iacute;culo sarcopl&aacute;smico"},{"id":"11298","text":"El receptor de voltaje DHP permite almacenar Ca2+ en el ret&iacute;culo sarcopl&aacute;smico"},{"id":"11300","text":"Se produce la activaci&oacute;n de receptores muscar&iacute;nicos en el sarcolema"}]',
  '11299',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x10-0000-4000-b000-000000009419',
  'c000152-0000-4000-b000-000000009408',
  'Sobre el m&uacute;sculo esquel&eacute;tico podemos afirmar que:',
  10,
  '[{"id":"11301","text":"Durante la contracci&oacute;n se produce un acortamiento de los sarc&oacute;meros"},{"id":"11302","text":"El conjunto de neurona motora y fibras musculares que inerva recibe el nombre de placa motora"},{"id":"11303","text":"La troponina bloquea el sitio de uni&oacute;n entre las cabezas de miosina y la actina"},{"id":"11304","text":"Las miofibrillas son la unidad b&aacute;sica contr&aacute;ctil de la fibra muscular"}]',
  '11301',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x11-0000-4000-b000-000000009420',
  'c000152-0000-4000-b000-000000009408',
  'Se&ntilde;ala la afirmaci&oacute;n incorrecta:',
  11,
  '[{"id":"11306","text":"La entrada de Na+ en la c&eacute;lula postsin&aacute;ptica provoca un potencial de acci&oacute;n inhibitorio"},{"id":"11305","text":"En el sistema nervioso central la mayor parte de neuronas son colin&eacute;rgicas"},{"id":"11307","text":"Los receptores colin&eacute;rgicos muscar&iacute;nicos son un tipo de receptor acoplado a prote&iacute;na G"},{"id":"11308","text":"En el sistema nervioso perif&eacute;rico la mayor parte de neuronas son colin&eacute;rgicas"}]',
  '11306',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x12-0000-4000-b000-000000009421',
  'c000152-0000-4000-b000-000000009408',
  'En relaci&oacute;n al sistema nervioso aut&oacute;nomo podemos afirmar que:',
  12,
  '[{"id":"11311","text":"Las neuronas postganglionares se ubican en los ganglios auton&oacute;micos"},{"id":"11309","text":"El efecto fight and flight es caracter&iacute;stico del sistema nervioso parasimp&aacute;tico"},{"id":"11310","text":"Las neuronas preganglionares se ubican dentro de la sustancia blanca del SNC"},{"id":"11312","text":"El sistema nervioso simp&aacute;tico recibe el nombre de sistema craneosacro"}]',
  '11311',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x13-0000-4000-b000-000000009422',
  'c000152-0000-4000-b000-000000009408',
  '&iquest;De cu&aacute;l de las siguientes estructuras forman parte la troponina y la tropomiosina?',
  13,
  '[{"id":"11316","text":"Filamento fino de actina"},{"id":"11313","text":"Filamento grueso de miosina"},{"id":"11314","text":"Sarcolema"},{"id":"11315","text":"T&uacute;bulos T"},{"id":"11317","text":"Ret&iacute;culo sarcopl&aacute;smico"}]',
  '11316',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x14-0000-4000-b000-000000009423',
  'c000152-0000-4000-b000-000000009408',
  '&iquest;Cu&aacute;l de las siguientes estructuras es propia del dienc&eacute;falo?',
  14,
  '[{"id":"11321","text":"Hip&oacute;fisis"},{"id":"11318","text":"Hipocampo"},{"id":"11319","text":"Ganglios basales"},{"id":"11320","text":"Bulbo raqu&iacute;deo"}]',
  '11321',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x15-0000-4000-b000-000000009424',
  'c000152-0000-4000-b000-000000009408',
  'Sobre la noradrenalina es correcto afirmar que:',
  15,
  '[{"id":"11325","text":"Todas son correctas"},{"id":"11322","text":"Produce un tipo de respuesta excitatoria"},{"id":"11323","text":"Aumenta la atenci&oacute;n y el estado de vigilancia"},{"id":"11324","text":"En exceso puede causar la p&eacute;rdida de l&iacute;bido"}]',
  '11325',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x16-0000-4000-b000-000000009425',
  'c000152-0000-4000-b000-000000009408',
  'Los potenciales de acci&oacute;n de las c&eacute;lulas del m&uacute;sculo esquel&eacute;tico desencadenan la liberaci&oacute;n desde el ret&iacute;culo sarcopl&aacute;smico de un ion cr&iacute;tico para la contracci&oacute;n muscular:',
  16,
  '[{"id":"11326","text":"Ca2+"},{"id":"11327","text":"Na+"},{"id":"11328","text":"K+"},{"id":"11329","text":"Cl-"},{"id":"11330","text":"HCO3-"}]',
  '11326',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x17-0000-4000-b000-000000009426',
  'c000152-0000-4000-b000-000000009408',
  '&iquest;En cu&aacute;l de las siguientes zonas del cerebro se forma el l&iacute;quido cefalorraqu&iacute;deo?',
  17,
  '[{"id":"11334","text":"Epit&aacute;lamo"},{"id":"11331","text":"Hipot&aacute;lamo"},{"id":"11332","text":"Bulbo raqu&iacute;deo"},{"id":"11333","text":"Hipocampo"}]',
  '11334',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x18-0000-4000-b000-000000009427',
  'c000152-0000-4000-b000-000000009408',
  'El SNC puede hacer que la parte central del m&uacute;sculo esquel&eacute;tico se contraiga con m&aacute;s fuerza si:',
  18,
  '[{"id":"11338","text":"a) y c) son correctas"},{"id":"11335","text":"Provoca la contracci&oacute;n simult&aacute;nea de m&aacute;s unidades motoras"},{"id":"11336","text":"Aumenta la cantidad de acetilcolina liberada durante cada transmisi&oacute;n sin&aacute;ptica neuromuscular"},{"id":"11337","text":"Aumenta la frecuencia de los potenciales de acci&oacute;n en el ax&oacute;n de la neurona motora a"}]',
  '11338',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x19-0000-4000-b000-000000009428',
  'c000152-0000-4000-b000-000000009408',
  '&iquest;Cu&aacute;l de las siguientes estructuras no se encuentra en el m&uacute;sculo liso?',
  19,
  '[{"id":"11341","text":"T&uacute;bulos T"},{"id":"11339","text":"Filamentos de actina"},{"id":"11340","text":"Filamentos de miosina"},{"id":"11342","text":"Canales de calcio dependientes de voltaje"}]',
  '11341',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x20-0000-4000-b000-000000009429',
  'c000152-0000-4000-b000-000000009408',
  'Indica la respuesta incorrecta:',
  20,
  '[{"id":"11346","text":"La membrana de la fibra muscular transmite los potenciales de acci&oacute;n por conducci&oacute;n saltatoria"},{"id":"11343","text":"Las membranas de las fibras muscular y nerviosa son parecidas porque ambas tienen potencial de reposo"},{"id":"11344","text":"Un m&uacute;sculo completo puede contraerse con m&aacute;s fuerza al aumentar el n&uacute;mero de unidades motoras que se contraen"},{"id":"11345","text":"El sistema de t&uacute;bulos T de la membrana muscular transmite el potencial de acci&oacute;n hacia el interior de la c&eacute;lula"}]',
  '11346',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x21-0000-4000-b000-000000009430',
  'c000152-0000-4000-b000-000000009408',
  'Sobre el sistema nervioso simp&aacute;tico podemos afirmar que:',
  21,
  '[{"id":"11348","text":"Todas sus fibras preganglionares son colin&eacute;rgicas"},{"id":"11347","text":"Se encuentra ubicado en el tronco encef&aacute;lico y en el sacro"},{"id":"11349","text":"Las fibras postganglionares de las gl&aacute;ndulas sudor&iacute;paras liberan noradrenalina"},{"id":"11350","text":"Los axones preganglionares son mucho m&aacute;s largos que los postganglionares"}]',
  '11348',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x22-0000-4000-b000-000000009431',
  'c000152-0000-4000-b000-000000009408',
  'En relaci&oacute;n a la estructura del SNC, se&ntilde;ala la respuesta FALSA:',
  22,
  '[{"id":"11353","text":"La corteza cerebral y el cerebelo se encuentran unidos por el bulbo raqu&iacute;deo"},{"id":"11351","text":"La corteza cerebral se encarga de generar la salida motora para provocar un cambio o mantener el entorno"},{"id":"11352","text":"El hipot&aacute;lamo se encarga de regular el SNA, el sistema endocrino y la homeostasis"},{"id":"11354","text":"La gl&aacute;ndula pineal permite al animal adaptarse a su entorno mediante la secreci&oacute;n de melatonina"}]',
  '11353',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x23-0000-4000-b000-000000009432',
  'c000152-0000-4000-b000-000000009408',
  'En una neurona en reposo, podemos afirmar que:',
  23,
  '[{"id":"11357","text":"Existen canales de fuga de K+ que hacen que la neurona se polarice"},{"id":"11355","text":"Presentan una carga el&eacute;ctrica negativa, es decir, est&aacute;n despolarizadas"},{"id":"11356","text":"Cada vez que act&uacute;a la bomba Na+/K+ la c&eacute;lula se carga positivamente"},{"id":"11358","text":"Todas son correctas"}]',
  '11357',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x24-0000-4000-b000-000000009433',
  'c000152-0000-4000-b000-000000009408',
  '&iquest;Cu&aacute;l de las siguientes estructuras es m&aacute;s probable que se asocie a los m&uacute;sculos que participan principalmente con movimientos breves y potentes?',
  24,
  '[{"id":"11361","text":"Unidad motora peque&ntilde;a"},{"id":"11359","text":"Unidad motora grande"},{"id":"11360","text":"Cuerpo de la neurona motora a grande"},{"id":"11362","text":"M&uacute;sculo blanco"},{"id":"11363","text":"Fibras de contracci&oacute;n r&aacute;pidas"}]',
  '11361',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x25-0000-4000-b000-000000009434',
  'c000152-0000-4000-b000-000000009408',
  '&iquest;Qu&eacute; parte de la neurona se considera que recibe principalmente la informaci&oacute;n?',
  25,
  '[{"id":"11462","text":"Dendritas"},{"id":"11458","text":"Ax&oacute;n"},{"id":"11459","text":"Terminal presin&aacute;ptica"},{"id":"11460","text":"Cuerpo celular"},{"id":"11461","text":"Mielina"}]',
  '11462',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x26-0000-4000-b000-000000009435',
  'c000152-0000-4000-b000-000000009408',
  'En relaci&oacute;n a los receptores de c&eacute;lulas postsin&aacute;pticas es cierto que:',
  26,
  '[{"id":"11464","text":"Los receptores nicot&iacute;nicos son canales i&oacute;nicos por s&iacute; mismos"},{"id":"11463","text":"Los receptores muscar&iacute;nicos inducen siempre potenciales postsin&aacute;pticos inhibitorios"},{"id":"11465","text":"Los receptores muscar&iacute;nicos son aceptores de noradrenalina"},{"id":"11466","text":"Los receptores nicot&iacute;nicos inducen siempre potenciales postsin&aacute;pticos excitatorios por apertura de canales de Cl-"}]',
  '11464',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x27-0000-4000-b000-000000009436',
  'c000152-0000-4000-b000-000000009408',
  'Los elementos de los nervios espinales y craneales que transmiten las &oacute;rdenes desde el SNC hasta la sinapsis en los m&uacute;sculos esquel&eacute;ticos son:',
  27,
  '[{"id":"11469","text":"Axones de las neuronas eferentes som&aacute;ticas"},{"id":"11467","text":"Axones de las neuronas eferentes viscerales"},{"id":"11468","text":"Axones de las neuronas aferentes som&aacute;ticas"},{"id":"11470","text":"Ra&iacute;ces dorsales"},{"id":"11471","text":"Axones de las neuronas aferentes viscerales"}]',
  '11469',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x28-0000-4000-b000-000000009437',
  'c000152-0000-4000-b000-000000009408',
  '&iquest;Cu&aacute;l de los siguientes neurotransmisores permiten una respuesta inhibitoria?',
  28,
  '[{"id":"11473","text":"Glicina"},{"id":"11472","text":"Serotonina"},{"id":"11474","text":"Histamina"},{"id":"11475","text":"Dopamina"}]',
  '11473',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x29-0000-4000-b000-000000009438',
  'c000152-0000-4000-b000-000000009408',
  'Se&ntilde;ala la afirmaci&oacute;n correcta:',
  29,
  '[{"id":"11476","text":"Todas las fibras preganglionares del SNA liberan acetilcolina como neurotransmisor"},{"id":"11477","text":"En el SN simp&aacute;tico todas las fibras postganglionares liberan noradrenalina como neurotransmisor"},{"id":"11478","text":"Todas las fibras postganglionares del SNA liberan acetilcolina como neurotransmisor"},{"id":"11479","text":"En el SN parasimp&aacute;tico todas las fibras preganglionares liberan noradrenalina como neurotransmisor"}]',
  '11476',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x30-0000-4000-b000-000000009439',
  'c000152-0000-4000-b000-000000009408',
  '&iquest;Cu&aacute;l de las siguientes NO es una caracter&iacute;stica de las c&eacute;lulas gliales?',
  30,
  '[{"id":"11480","text":"Producci&oacute;n de potenciales de acci&oacute;n"},{"id":"11481","text":"Producci&oacute;n de las vainas miel&iacute;nicas de los axones"},{"id":"11482","text":"Modulaci&oacute;n del crecimiento de las neuronas en desarrollo o da&ntilde;adas"},{"id":"11483","text":"Amortiguaci&oacute;n de las contracciones extracelulares de alguno iones y neurotransmisores"}]',
  '11480',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x31-0000-4000-b000-000000009440',
  'c000152-0000-4000-b000-000000009408',
  'La conexi&oacute;n entre el sistema nervioso y el sistema endocrino se lleva a cabo por:',
  31,
  '[{"id":"11486","text":"El hipot&aacute;lamo"},{"id":"11484","text":"La corteza cerebral"},{"id":"11485","text":"La hip&oacute;fisis"},{"id":"11487","text":"El bulbo raqu&iacute;deo"}]',
  '11486',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x32-0000-4000-b000-000000009441',
  'c000152-0000-4000-b000-000000009408',
  'Indica la afirmaci&oacute;n incorrecta sobre el sistema nervioso simp&aacute;tico:',
  32,
  '[{"id":"11488","text":"Presenta axones preganglionares largos"},{"id":"11489","text":"Las gl&aacute;ndulas adrenales act&uacute;an como un ganglio simp&aacute;tico modificado"},{"id":"11490","text":"Act&uacute;a como un sistema de activaci&oacute;n en masa"},{"id":"11491","text":"En el m&uacute;sculo esquel&eacute;tico las fibras postganglionares son colin&eacute;rgicas"}]',
  '11488',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x33-0000-4000-b000-000000009442',
  'c000152-0000-4000-b000-000000009408',
  '&iquest;Qu&eacute; podemos afirmar sobre las fibras nerviosas?',
  33,
  '[{"id":"11494","text":"Las fibras nerviosas amiel&iacute;nicas son caracter&iacute;sticas del sistema nervioso aut&oacute;nomo"},{"id":"11492","text":"Los n&oacute;dulos de Ranvier liberan est&aacute;n presentes &uacute;nicamente en fibras nerviosas miel&iacute;nicas"},{"id":"11493","text":"Las fibras nerviosas amiel&iacute;nicas carecen de vaina de mielina"},{"id":"11495","text":"Las fibras nerviosas miel&iacute;nicas presentan una vaina de mielina continua por toda la superficie del ax&oacute;n"}]',
  '11494',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x34-0000-4000-b000-000000009443',
  'c000152-0000-4000-b000-000000009408',
  'Se&ntilde;ala la respuesta correcta sobre las estructuras del SNC:',
  34,
  '[{"id":"11497","text":"El cerebelo se encarga de la coordinaci&oacute;n de movimientos y aprendizaje motor"},{"id":"11496","text":"El dienc&eacute;falo se encuentra formado por la hip&oacute;fisis, la gl&aacute;ndula pineal, la corteza cerebral y los ganglios basales"},{"id":"11498","text":"El hipocampo se encarga de modular las funciones motoras"},{"id":"11499","text":"El bulbo raqu&iacute;deo forma parte del dienc&eacute;falo"}]',
  '11497',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x35-0000-4000-b000-000000009444',
  'c000152-0000-4000-b000-000000009408',
  'La energ&iacute;a requerida por la bomba Na+/K+ de la membrana nerviosa proviene del ATP. En las neuronas, esta energ&iacute;a proviene casi exclusivamente del metabolismo del ox&iacute;geno y:',
  35,
  '[{"id":"11502","text":"Glucosa"},{"id":"11500","text":"Amino&aacute;cidos"},{"id":"11501","text":"&AACUTE;cidos grasos"},{"id":"11503","text":"Prote&iacute;nas"}]',
  '11502',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x36-0000-4000-b000-000000009445',
  'c000152-0000-4000-b000-000000009408',
  'Se&ntilde;ala la afirmaci&oacute;n incorrecta:',
  36,
  '[{"id":"11504","text":"La velocidad de conducci&oacute;n de los potenciales de acci&oacute;n es menor en los nervios mielinizados que en los no mielinizados"},{"id":"11505","text":"En la conducci&oacute;n saltatoria de los potenciales de acci&oacute;n, parecen que estos saltan funcionalmente de un n&oacute;dulo de Ranvier a otro"},{"id":"11506","text":"Los potenciales de acci&oacute;n son de igual magnitud en el segmento inicial y en el extremo del ax&oacute;n"},{"id":"11507","text":"La repolarizaci&oacute;n de la c&eacute;lula ocurre gracias al cierre de canales de Na+ y la apertura de canales de K+"}]',
  '11504',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x37-0000-4000-b000-000000009446',
  'c000152-0000-4000-b000-000000009408',
  'En relaci&oacute;n al sistema nervioso parasimp&aacute;tico es correcto afirmar que:',
  37,
  '[{"id":"11511","text":"Tanto las fibras preganglionares como postganglionares son colin&eacute;rgicas"},{"id":"11508","text":"Todas sus fibras preganglionares son adren&eacute;rgicas"},{"id":"11509","text":"En el m&uacute;sculo esquel&eacute;tico las fibras postganglionares liberan noradrenalina"},{"id":"11510","text":"En general, sus fibras postganglionares son adren&eacute;rgicas"}]',
  '11511',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x38-0000-4000-b000-000000009447',
  'c000152-0000-4000-b000-000000009408',
  'Al tratar pacientes cr&iacute;ticos con l&iacute;quidos intravenosos, &iquest;qu&eacute; dos iones son m&aacute;s importantes para el potencial de la membrana nerviosa?',
  38,
  '[{"id":"11513","text":"Na+ y K+"},{"id":"11512","text":"Na+ y Cl-"},{"id":"11514","text":"Ca2+ y K+"},{"id":"11515","text":"Ca2+ y Cl-"}]',
  '11513',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x39-0000-4000-b000-000000009448',
  'c000152-0000-4000-b000-000000009408',
  'Sobre las neuronas podemos afirmar que:',
  39,
  '[{"id":"11516","text":"El conjunto de ax&oacute;n y vaina de mielina forman la fibra nerviosa"},{"id":"11517","text":"Las dendritas conducen el impulso desde el cuerpo celular hasta la terminal presin&aacute;ptica"},{"id":"11518","text":"Los neurotransmisores abandonan la terminal presin&aacute;ptica por endocitosis"},{"id":"11519","text":"Las neuronas eferentes son iguales en el sistema nerviosos aut&oacute;nomo y en el sistema nervioso voluntario"}]',
  '11516',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x40-0000-4000-b000-000000009449',
  'c000152-0000-4000-b000-000000009408',
  'En relaci&oacute;n a la contracci&oacute;n del m&uacute;sculo esquel&eacute;tico podemos afirmar que:',
  40,
  '[{"id":"11523","text":"En la placa motora las neuronas motoras liberan acetilcolina"},{"id":"11520","text":"El ret&iacute;culo sarcopl&aacute;smico absorbe Ca2+ cuando el m&uacute;sculo est&aacute; contra&iacute;do"},{"id":"11521","text":"Los t&uacute;bulos T absorben Ca2+ cuando el m&uacute;sculo se encuentra relajado"},{"id":"11522","text":"Durante la contracci&oacute;n los filamentos delgados de actina no se acortan mientras que los filamentos gruesos de miosina si"}]',
  '11523',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x41-0000-4000-b000-000000009450',
  'c000152-0000-4000-b000-000000009408',
  'En una neurona podemos afirmar que:',
  41,
  '[{"id":"11525","text":"Los neurotransmisores pueden generar un potencial postsin&aacute;ptico excitatorio provocando la entrada de Na+ hacia el interior de la neurona postsin&aacute;ptica"},{"id":"11524","text":"La liberaci&oacute;n de K+ permite activar el complejo calmodulina-prote&iacute;na-quinasa"},{"id":"11526","text":"Cuando el potencial de acci&oacute;n llega a la terminal ax&oacute;nica acciona canales de Ca2+ que permiten la salida del calcio de la neurona"},{"id":"11527","text":"Los neurotransmisores pueden generar un potencial postsin&aacute;ptico inhibitorio provocando la salida de Cl- desde el interior de la neurona postsin&aacute;ptica"}]',
  '11525',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x42-0000-4000-b000-000000009451',
  'c000152-0000-4000-b000-000000009408',
  'En relaci&oacute;n al sistema nervioso, se&ntilde;ala la respuesta correcta:',
  42,
  '[{"id":"11530","text":"Las neuronas aferentes transmiten impulsos desde los receptores hacia el sistema nervioso central"},{"id":"11528","text":"Los ganglios nerviosos forman parte del sistema nervioso central"},{"id":"11529","text":"Compuesto mayoritariamente por neuronas"},{"id":"11531","text":"Las fibras amiel&iacute;nicas son propias del sistema nervioso som&aacute;tico"}]',
  '11530',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x43-0000-4000-b000-000000009452',
  'c000152-0000-4000-b000-000000009408',
  '&iquest;Cu&aacute;l de las siguientes estructuras NO es propia del telenc&eacute;falo?',
  43,
  '[{"id":"11532","text":"Hipot&aacute;lamo"},{"id":"11533","text":"Corteza cerebral"},{"id":"11534","text":"Ganglios basales"},{"id":"11535","text":"Hipocampo"}]',
  '11532',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x44-0000-4000-b000-000000009453',
  'c000152-0000-4000-b000-000000009408',
  'Indica cu&aacute;l de las siguientes afirmaciones NO es caracter&iacute;stica del sistema nervioso parasimp&aacute;tico:',
  44,
  '[{"id":"11538","text":"Act&uacute;a como un sistema de activaci&oacute;n en masa"},{"id":"11536","text":"Sus axones preganglionares son m&aacute;s largos que los postganglionares"},{"id":"11537","text":"Todas sus fibras son colin&eacute;rgicas"},{"id":"11539","text":"La mayor parte de sus fibras se encuentran en el nervio vago"}]',
  '11538',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x45-0000-4000-b000-000000009454',
  'c000152-0000-4000-b000-000000009408',
  '&iquest;C&oacute;mo afecta un exceso de los siguientes neurotransmisores en el organismo? Se&ntilde;ala la afirmaci&oacute;n correcta',
  45,
  '[{"id":"11542","text":"Un exceso de dopamina puede causar esquizofrenia"},{"id":"11540","text":"Un exceso de glutamato da lugar a problemas respiratorios, convulsiones y discapacidad intelectual"},{"id":"11541","text":"Un exceso de acetilcolina promueve el Alzheimer o la ELA"},{"id":"11543","text":"El exceso de endorfinas dar&aacute; lugar a ansiedad, depresi&oacute;n y comportamientos obsesivos"},{"id":"11544","text":"- compulsivos"}]',
  '11542',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x46-0000-4000-b000-000000009455',
  'c000152-0000-4000-b000-000000009408',
  '&iquest;Los axones de que neurona forman el componente somatico del Sistema Nervioso Periferico?',
  46,
  '[{"id":"11545","text":"a. Neuronas motoras inferiores"},{"id":"11546","text":"b. Neuronas motoras superiores"},{"id":"11547","text":"c. Neuronas simpaticas y parasimpaticas"},{"id":"11548","text":"d. Neuronas sensitivas"}]',
  '11545',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x47-0000-4000-b000-000000009456',
  'c000152-0000-4000-b000-000000009408',
  '&iquest;C&oacute;mo se inicia el potencial de accion de una neurona',
  47,
  '[{"id":"11549","text":"a. Un estimulo que supera el umbral excitario provoca una despolarizaci&oacute;n por la entrada de Na al interior de la celula."},{"id":"11550","text":"b. Un estimulo que alcanzar el centro gatillo del axon repolarizaci&oacute;n la celula por la salida de potasio."},{"id":"11551","text":"c. Un estimulo que supera el umbral de excitaci&oacute;n genera la entrada de K+ al interior de la celula y por tanto su despolarizacion."},{"id":"11552","text":"d. Un estimulo mecanico, fisico o quimico genera la excitaci&oacute;n y a continuacion la salida del Na de la celula produce una despolarizaci&oacute;n"}]',
  '11549',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd152x48-0000-4000-b000-000000009457',
  'c000152-0000-4000-b000-000000009408',
  'Identifica la respuesta que se&ntilde;ala caracter&iacute;sticas de la activaci&oacute;n del sistema nervisoso autonomo:',
  48,
  '[{"id":"11554","text":"b. Estimulo de la secrecion de las glandulas sudoriparas y broncodilatacion"},{"id":"11553","text":"a. Disminuye la frecuencia cardiaca y broncoconstriccion"},{"id":"11555","text":"c. Estimulo de la motilidad intestinal y de la secrecion de las glandulas salivares"},{"id":"11556","text":"d. Vasodilatacion periferica y glucogenesis"}]',
  '11554',
  '2026-04-27 17:01:04'
);

-- Quiz: "TEST 1- CARDIACO" → Course: "Fisiología Vet 1ºC" (107 questions) [renamed to add "(2)"]
INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'c000155-0000-4000-b000-000000009458',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 1- CARDIACO (2)',
  NULL,
  'quiz',
  100,
  '2026-04-27 17:01:04',
  '2026-04-27 17:01:04'
FROM Class c
WHERE c.name = 'Fisiología Vet 1ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 1- CARDIACO (2)' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x0-0000-4000-b000-000000009459',
  'c000155-0000-4000-b000-000000009458',
  'Con respecto al dise&ntilde;o de la circulaci&oacute;n general. El sistema porta hipofisiario es un sistema porta del tipo.',
  0,
  '[{"id":"19557","text":"Vena-capilar-vena"},{"id":"19555","text":"Arteria-capilar-vena"},{"id":"19556","text":"Arteria-capilar-arteria"},{"id":"19558","text":"Ninguna de las anteriores es correcta"}]',
  '19557',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x1-0000-4000-b000-000000009460',
  'c000155-0000-4000-b000-000000009458',
  'Con respecto al ciclo cardiaco. Se&ntilde;ale la afirmaci&oacute;n correcta:',
  1,
  '[{"id":"19560","text":"La apertura de las v&aacute;lvulas atrioventriculares coincide con el final de la relajaci&oacute;n isovolum&eacute;trica"},{"id":"19559","text":"La onda R del ECG coincide con la di&aacute;stasis"},{"id":"19561","text":"La s&iacute;stole auricular aporta m&aacute;s del 70% del volumen telediast&oacute;lico"},{"id":"19562","text":"El cierre de las v&aacute;lvulas semilunares coincide con el periodo de eyecci&oacute;n lenta."}]',
  '19560',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x2-0000-4000-b000-000000009461',
  'c000155-0000-4000-b000-000000009458',
  'Con respecto a las fuerzas de Starling. Se&ntilde;ala la afirmaci&oacute;n correcta:',
  2,
  '[{"id":"19565","text":"Si aumenta la presi&oacute;n hidrost&aacute;tica del capilar se favorece la filtraci&oacute;n de agua"},{"id":"19563","text":"Si aumenta la presi&oacute;n hidrost&aacute;tica del capilar se favorece la absorci&oacute;n de agua"},{"id":"19564","text":"Si disminuye la presi&oacute;n onc&oacute;tica del capilar se favorece la absorci&oacute;n de agua"},{"id":"19566","text":"Si aumenta la presi&oacute;n onc&oacute;tica del intersticio se favorece la absorci&oacute;n de agua"}]',
  '19565',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x3-0000-4000-b000-000000009462',
  'c000155-0000-4000-b000-000000009458',
  'Con respecto al control local de la circulaci&oacute;n, se&ntilde;ala cu&aacute;l de las siguientes opciones favorece la vasodilataci&oacute;n (en tejido no pulmonar):',
  3,
  '[{"id":"19567","text":"Aumento de potasio"},{"id":"19568","text":"Aumento de la presi&oacute;n parcia de ox&iacute;geno"},{"id":"19569","text":"Disminuci&oacute;n de la presi&oacute;n parcial de CO2"},{"id":"19570","text":"Disminuci&oacute;n de la adenosina"}]',
  '19567',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x4-0000-4000-b000-000000009463',
  'c000155-0000-4000-b000-000000009458',
  'Se&ntilde;ale cu&aacute;l de las siguientes hormonas tiene acci&oacute;n vasoconstrictora:',
  4,
  '[{"id":"19572","text":"ADH"},{"id":"19571","text":"Bradicinina"},{"id":"19573","text":"Histamina"},{"id":"19574","text":"&OACUTE;xido n&iacute;trico"}]',
  '19572',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x5-0000-4000-b000-000000009464',
  'c000155-0000-4000-b000-000000009458',
  'Con respecto al reflejo baroreceptor. Se&ntilde;ala la afirmaci&oacute;n correcta:',
  5,
  '[{"id":"19576","text":"Un aumento de la presi&oacute;n arterial provocar&iacute;a liberaci&oacute;n de acetilcolina sobre los receptores del coraz&oacute;n"},{"id":"19575","text":"Las regiones barorreceptoras se encuentran en las arterias pulmonares y sus ramificaciones derecha fundamentalmente"},{"id":"19577","text":"Una disminuci&oacute;n de la presi&oacute;n arterial provocar&iacute;a liberaci&oacute;n de acetilcolina sobre los receptores del coraz&oacute;n"},{"id":"19578","text":"Un aumento de la presi&oacute;n arterial provocar&iacute;a la liberaci&oacute;n de adrenalina sobre los receptores alfa2 de los vasos"}]',
  '19576',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x6-0000-4000-b000-000000009465',
  'c000155-0000-4000-b000-000000009458',
  'Con respecto a las funciones de la angiotensina II. Se&ntilde;ala la afirmaci&oacute;n correcta:',
  6,
  '[{"id":"19580","text":"Aumenta el crecimiento del m&uacute;sculo vascular liso"},{"id":"19579","text":"Disminuci&oacute;n de la s&iacute;ntesis de hormona antidiur&eacute;tica"},{"id":"19581","text":"Disminuye la s&iacute;ntesis de aldosterona"},{"id":"19582","text":"Aumenta la s&iacute;ntesis de bradicinina"}]',
  '19580',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x7-0000-4000-b000-000000009466',
  'c000155-0000-4000-b000-000000009458',
  'Entre las respuestas a corto plazo del organismo frente a una situaci&oacute;n de hipoxia se encuentra: se&ntilde;ale la respuesta correcta.',
  7,
  '[{"id":"19586","text":"Ninguna respuesta es correcta"},{"id":"19583","text":"Aparece bradicardia para evitar mandar la sangre con poco ox&iacute;geno a los &oacute;rganos"},{"id":"19584","text":"Aumenta el volumen plasm&aacute;tico para compensar la falta de ox&iacute;geno en sangre"},{"id":"19585","text":"Hay una hemoconcentraci&oacute;n para aumentar el porcentaje de ox&iacute;geno transportado por unidad de volumen sangre"}]',
  '19586',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x8-0000-4000-b000-000000009467',
  'c000155-0000-4000-b000-000000009458',
  'Con respecto a la anatom&iacute;a cardiaca y circulatoria. Entre la vena craneal y el atrio derecho se encuentra:',
  8,
  '[{"id":"19590","text":"Ninguna de las anteriores es correcta"},{"id":"19587","text":"La v&aacute;lvula tric&uacute;spide"},{"id":"19588","text":"La v&aacute;lvula mitral"},{"id":"19589","text":"La v&aacute;lvula pulmonar"}]',
  '19590',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x9-0000-4000-b000-000000009468',
  'c000155-0000-4000-b000-000000009458',
  'Con respecto al ciclo cardiaco. Se&ntilde;ala la afirmaci&oacute;n correcta:',
  9,
  '[{"id":"19594","text":"El cierre de las v&aacute;lvulas semilunares coincide con el inicio de la relajaci&oacute;n isovolum&eacute;trica"},{"id":"19591","text":"La onda R del ECG coincide con el inicio de la relajaci&oacute;n isovolum&eacute;trica"},{"id":"19592","text":"La apertura de las v&aacute;lvulas atrioventriculares coincide con el inicio del periodo de contracci&oacute;n isovolum&eacute;trica"},{"id":"19593","text":"La s&iacute;stole auricular aporta m&aacute;s del 60% del volumen telediast&oacute;lico"}]',
  '19594',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x10-0000-4000-b000-000000009469',
  'c000155-0000-4000-b000-000000009458',
  'Con respecto a las fibras musculares cardiacas. Se&ntilde;ala la afirmaci&oacute;n correcta:',
  10,
  '[{"id":"19595","text":"Las fibras musculares espec&iacute;ficas con capaces de generar espont&aacute;neamente potenciales de acci&oacute;n"},{"id":"19596","text":"Las fibras musculares espec&iacute;ficas presentan una curva de potencial de acci&oacute;n igual al de las fibras musculares no espec&iacute;ficas"},{"id":"19597","text":"Las c&eacute;lulas nerviosas que conforman el marcapasos del coraz&oacute;n son las c&eacute;lulas del n&oacute;dulo sinusal"},{"id":"19598","text":"Las fibras musculares espec&iacute;ficas est&aacute;n especializadas en la contracci&oacute;n porque su potencial de acci&oacute;n es m&aacute;s lento."}]',
  '19595',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x11-0000-4000-b000-000000009470',
  'c000155-0000-4000-b000-000000009458',
  'Con respecto a la precarga y la ley de Frank-Starling. Se&ntilde;ala la afirmaci&oacute;n correcta:',
  11,
  '[{"id":"19600","text":"La precarga ventricular es la presi&oacute;n que ejerce la sangre dentro del ventr&iacute;culo en la Teledi&aacute;stole"},{"id":"19599","text":"La precarga ventricular es el volumen de sangre que existe en el ventr&iacute;culo en la teles&iacute;stole"},{"id":"19601","text":"La ley de Starling propone que una disminuci&oacute;n de la precarga conduce a un aumento de la fuerza de contracci&oacute;n"},{"id":"19602","text":"La ley de Starling es un tipo de regulaci&oacute;n homeom&eacute;trica"}]',
  '19600',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x12-0000-4000-b000-000000009471',
  'c000155-0000-4000-b000-000000009458',
  'Con respecto a la fase de despolarizaci&oacute;n de las c&eacute;lulas musculares cardiacas. Se&ntilde;ala la afirmaci&oacute;n correcta.',
  12,
  '[{"id":"19603","text":"En la fase 0 los canales de sodio se abren con rapidez"},{"id":"19604","text":"En la fase 2 (meseta) se produce el cierre de los canales de calcio y disminuye la permeabilidad al calcio"},{"id":"19605","text":"En la fase 3 se produce el cierre de los canales de potasio y el potencial de membrana se vuelve m&aacute;s negativo"},{"id":"19606","text":"En la fase 2 (meseta) muchos canales de potasio se abren y por tanto la permeabilidad el potasio disminuye"}]',
  '19603',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x13-0000-4000-b000-000000009472',
  'c000155-0000-4000-b000-000000009458',
  'Con respecto a la fisiolog&iacute;a de los vasos sangu&iacute;neos. Se&ntilde;ala la afirmaci&oacute;n correcta:',
  13,
  '[{"id":"19609","text":"La distensibilidad de las venas es mucho mayor que la de las arterias"},{"id":"19607","text":"Las arterias son reservorios de volumen"},{"id":"19608","text":"Las arteriolas poseen paredes el&aacute;sticas, que permiten su contracci&oacute;n"},{"id":"19610","text":"La aorta es m&aacute;s adaptable que la vena cava y soporta presiones m&aacute;s altas."}]',
  '19609',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x14-0000-4000-b000-000000009473',
  'c000155-0000-4000-b000-000000009458',
  'La circulaci&oacute;n portal espl&aacute;cnica es del tipo:',
  14,
  '[{"id":"19613","text":"Vena capilar vena"},{"id":"19611","text":"Arteria capilar arteria"},{"id":"19612","text":"Arteria capilar vena"},{"id":"19614","text":"Vena capilar arteria"}]',
  '19613',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x15-0000-4000-b000-000000009474',
  'c000155-0000-4000-b000-000000009458',
  'El n&oacute;dulo sinusal se sit&uacute;a:',
  15,
  '[{"id":"19615","text":"Entre la uni&oacute;n de la vena cava superior con la aur&iacute;cula derecha"},{"id":"19616","text":"En el tabique interventricular"},{"id":"19617","text":"En el atrio izquierdo"},{"id":"19618","text":"Ventr&iacute;culo izquierdo"}]',
  '19615',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x16-0000-4000-b000-000000009475',
  'c000155-0000-4000-b000-000000009458',
  'La fase 2 del potencial de acci&oacute;n de una c&eacute;lula especializada en la contracci&oacute;n se caracteriza por:',
  16,
  '[{"id":"19620","text":"Apertura de los canales de calcio lentos"},{"id":"19619","text":"Apertura de los canales sodio r&aacute;pidos"},{"id":"19621","text":"Cierre de los canales de sodio r&aacute;pidos"},{"id":"19622","text":"Apertura de los canales de potasio"}]',
  '19620',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x17-0000-4000-b000-000000009476',
  'c000155-0000-4000-b000-000000009458',
  'Indica cu&aacute;l de las siguientes c&eacute;lulas especializadas en la conducci&oacute;n presenta un potencial m&aacute;s corto:',
  17,
  '[{"id":"19623","text":"N&oacute;dulo sinusal"},{"id":"19624","text":"N&oacute;dulo aur&iacute;culo ventricular"},{"id":"19625","text":"Haces internodales"},{"id":"19626","text":"Rama izquierda del haz de Hiss"}]',
  '19623',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x18-0000-4000-b000-000000009477',
  'c000155-0000-4000-b000-000000009458',
  'La precarga es:',
  18,
  '[{"id":"19630","text":"La presi&oacute;n que ejerce la sangre en el ventr&iacute;culo en la Teledi&aacute;stole"},{"id":"19627","text":"El volumen de sangre en el ventr&iacute;culo en la teledi&aacute;stole"},{"id":"19628","text":"El volumen de sangre en el ventr&iacute;culo en la teles&iacute;stole"},{"id":"19629","text":"La presi&oacute;n que ejerce la sangre en el ventr&iacute;culo en la teles&iacute;stole"}]',
  '19630',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x19-0000-4000-b000-000000009478',
  'c000155-0000-4000-b000-000000009458',
  'Ciclo cardiaco. El periodo en el que existe mayor p&eacute;rdida de volumen ventricular',
  19,
  '[{"id":"19633","text":"Periodo de eyecci&oacute;n r&aacute;pido"},{"id":"19631","text":"Periodo de contracci&oacute;n isovolum&eacute;trico"},{"id":"19632","text":"Diastasis"},{"id":"19634","text":"Contracci&oacute;n atrial"}]',
  '19633',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x20-0000-4000-b000-000000009479',
  'c000155-0000-4000-b000-000000009458',
  'Cu&aacute;l de los siguientes tipos de capilares predominan en el cerebro:',
  20,
  '[{"id":"19635","text":"Continuos"},{"id":"19636","text":"Discontinuos"},{"id":"19637","text":"Fenestrados"},{"id":"19638","text":"Ninguna de las respuestas es correcta"}]',
  '19635',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x21-0000-4000-b000-000000009480',
  'c000155-0000-4000-b000-000000009458',
  'Los vasos pulmonares, con respecto a los vasos sist&eacute;micos:',
  21,
  '[{"id":"19641","text":"Son m&aacute;s adaptables"},{"id":"19639","text":"Ofrecen una gran resistencia al paso de la sangre"},{"id":"19640","text":"Son poco distensibles"},{"id":"19642","text":"Ninguna de las respuestas es correcta"}]',
  '19641',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x22-0000-4000-b000-000000009481',
  'c000155-0000-4000-b000-000000009458',
  'La difusi&oacute;n de una sustancia en una capilar a una c&eacute;lula ser&aacute; mayor:',
  22,
  '[{"id":"19644","text":"Si disminuye la distancia entre el capilar y la c&eacute;lula"},{"id":"19643","text":"Si el diferencial de concentraci&oacute;n entre el capilar y la c&eacute;lula es bajo"},{"id":"19645","text":"Si disminuye la temperatura"},{"id":"19646","text":"Si disminuye el coeficiente de difusi&oacute;n"}]',
  '19644',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x23-0000-4000-b000-000000009482',
  'c000155-0000-4000-b000-000000009458',
  'Con respecto al reflejo barorreceptor. Si disminuye la presi&oacute;n arterial:',
  23,
  '[{"id":"19649","text":"Aumentar&aacute; la liberaci&oacute;n de norepinefrina sobre los receptores beta1 del coraz&oacute;n"},{"id":"19647","text":"Disminuir&aacute; la liberaci&oacute;n de adrenalina sobre los receptores alfa1 y alfa2 de los vasos"},{"id":"19648","text":"Aumenta la liberaci&oacute;n de acetilcolina sobre los receptores beta2 del coraz&oacute;n"},{"id":"19650","text":"Aumenta la liberaci&oacute;n de acetilcolina sobre los receptores M3 de los vasos"}]',
  '19649',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x24-0000-4000-b000-000000009483',
  'c000155-0000-4000-b000-000000009458',
  'La circulaci&oacute;n portal renal es del tipo:',
  24,
  '[{"id":"19651","text":"Arteria capilar arteria"},{"id":"19652","text":"Vena capilar vena"},{"id":"19653","text":"Arteria capilar vena"},{"id":"19654","text":"Vena capilar arteria"}]',
  '19651',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x25-0000-4000-b000-000000009484',
  'c000155-0000-4000-b000-000000009458',
  '&iquest;De cu&aacute;l de estos &oacute;rganos No recoge sangre la vena porta?',
  25,
  '[{"id":"19658","text":"Ri&ntilde;ones"},{"id":"19655","text":"Est&oacute;mago"},{"id":"19656","text":"P&aacute;ncreas"},{"id":"19657","text":"Bazo"}]',
  '19658',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x26-0000-4000-b000-000000009485',
  'c000155-0000-4000-b000-000000009458',
  'La fase 0 del potencial de acci&oacute;n de una c&eacute;lula especializada en la contracci&oacute;n se caracteriza:',
  26,
  '[{"id":"19659","text":"Apertura de los canales de sodio r&aacute;pido"},{"id":"19660","text":"Cierre de los canales de sodio r&aacute;pido"},{"id":"19661","text":"Apertura de los canales de calcio"},{"id":"19662","text":"Apertura de los canales de potasio"}]',
  '19659',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x27-0000-4000-b000-000000009486',
  'c000155-0000-4000-b000-000000009458',
  'Indica cu&aacute;l de las siguientes c&eacute;lulas especializadas en la conducci&oacute;n presenta un potencial de acci&oacute;n m&aacute;s corto:',
  27,
  '[{"id":"19665","text":"N&oacute;dulo sinusal"},{"id":"19663","text":"N&oacute;dulo aur&iacute;culo ventricular"},{"id":"19664","text":"Haces internodales"},{"id":"19666","text":"Rama izquierda del haz de Hiss"}]',
  '19665',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x28-0000-4000-b000-000000009487',
  'c000155-0000-4000-b000-000000009458',
  'La precarga es:',
  28,
  '[{"id":"19667","text":"La presi&oacute;n que ejerce la sangre en el ventr&iacute;culo en la Teledi&aacute;stole"},{"id":"19668","text":"El volumen de sangre en el ventr&iacute;culo en la Teledi&aacute;stole"},{"id":"19669","text":"El volumen de sangre en el ventr&iacute;culo en al teles&iacute;stole"},{"id":"19670","text":"La presi&oacute;n que ejerce la sangre en el ventr&iacute;culo en al teles&iacute;stole"}]',
  '19667',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x29-0000-4000-b000-000000009488',
  'c000155-0000-4000-b000-000000009458',
  'Ciclo cardiaco. La onda R coincide con:',
  29,
  '[{"id":"19674","text":"El comienzo de la s&iacute;stole ventricular"},{"id":"19671","text":"El cierre de las v&aacute;lvulas semilunares"},{"id":"19672","text":"El inicio del periodo de relajaci&oacute;n isovolum&eacute;trica"},{"id":"19673","text":"El final del periodo de llenado lento"}]',
  '19674',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x30-0000-4000-b000-000000009489',
  'c000155-0000-4000-b000-000000009458',
  'El principal lugar de resistencia al flujo de sangre se encuentra en:',
  30,
  '[{"id":"19675","text":"Metaarteriolas"},{"id":"19676","text":"Capilares"},{"id":"19677","text":"Venas"},{"id":"19678","text":"Arterias el&aacute;sticas"}]',
  '19675',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x31-0000-4000-b000-000000009490',
  'c000155-0000-4000-b000-000000009458',
  'Ley de Poiseulle. La resistencia al paso de un fluido por un tubo:',
  31,
  '[{"id":"19679","text":"Aumenta a mayor longitud del tubo"},{"id":"19680","text":"Disminuye cuando disminuye el radio"},{"id":"19681","text":"Disminuye a mayor viscosidad del fluido"},{"id":"19682","text":"Ninguna de las respuestas dadas es correcta"}]',
  '19679',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x32-0000-4000-b000-000000009491',
  'c000155-0000-4000-b000-000000009458',
  'Conociendo los siguientes par&aacute;metros medidos en la microcirculaci&oacute;n del m&uacute;sculo esquel&eacute;tico: presi&oacute;n hidrost&aacute;tica del capilar, 34 mmHg; presi&oacute;n hidrost&aacute;tica intersticial, 10 mmHg; presi&oacute;n onc&oacute;tica del capilar, 24 mmHg; presi&oacute;n onc&oacute;tica intersticial, 1 mmHg. &iquest;Cu&aacute;l de las siguientes afirmaciones es correcta?',
  32,
  '[{"id":"19685","text":"En estas condiciones se favorece la filtraci&oacute;n"},{"id":"19683","text":"En esas condiciones se favorece la reabsorci&oacute;n"},{"id":"19684","text":"En esas condiciones no se favorece ni la reabsorci&oacute;n ni la filtraci&oacute;n"},{"id":"19686","text":"No est&aacute; claro lo que se favorece en estas condiciones, ya que no se ha especificado la concentraci&oacute;n de prote&iacute;nas plasm&aacute;ticas"}]',
  '19685',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x33-0000-4000-b000-000000009492',
  'c000155-0000-4000-b000-000000009458',
  'Con respecto a las fuerzas de Starling. Se&ntilde;ala la afirmaci&oacute;n correcta:',
  33,
  '[{"id":"19690","text":"Si aumenta la presi&oacute;n onc&oacute;tica del capilar se favorece la absorci&oacute;n de agua"},{"id":"19687","text":"Si disminuye la presi&oacute;n hidrost&aacute;tica del capilar se favorece la filtraci&oacute;n de agua"},{"id":"19688","text":"Se favorece la absorci&oacute;n si aumenta el coeficiente de filtraci&oacute;n"},{"id":"19689","text":"Si aumenta la presi&oacute;n onc&oacute;tica del intersticio se favorece la absorci&oacute;n de agua"}]',
  '19690',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x34-0000-4000-b000-000000009493',
  'c000155-0000-4000-b000-000000009458',
  'Con respecto al control local de la circulaci&oacute;n, se&ntilde;ala cu&aacute;l de las siguientes opciones favorece la vasodilataci&oacute;n (en tejido no pulmonar):',
  34,
  '[{"id":"19692","text":"Aumento del potasio"},{"id":"19691","text":"Disminuci&oacute;n del &aacute;cido l&aacute;ctico"},{"id":"19693","text":"Aumento de la presi&oacute;n parcial de ox&iacute;geno"},{"id":"19694","text":"Disminuci&oacute;n de la adenosina"}]',
  '19692',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x35-0000-4000-b000-000000009494',
  'c000155-0000-4000-b000-000000009458',
  'Con respecto al reflejo barorreceptor. Si aumenta la presi&oacute;n arterial:',
  35,
  '[{"id":"19695","text":"Aumenta la liberaci&oacute;n de acetilcolina sobre los receptores M2 del coraz&oacute;n"},{"id":"19696","text":"Aumenta la liberaci&oacute;n de norepinefrina sobre los receptores alfa1 y alfa 2 de los .."},{"id":"19697","text":"Disminuir&aacute; la liberaci&oacute;n de acetilcolina sobre los receptores M3 de las arterias"},{"id":"19698","text":"Aumentar&aacute; la liberaci&oacute;n de adrenalina"}]',
  '19695',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x36-0000-4000-b000-000000009495',
  'c000155-0000-4000-b000-000000009458',
  'Se&ntilde;ala la afirmaci&oacute;n correcta:',
  36,
  '[{"id":"19700","text":"Las fibras musculares auriculares y ventriculares est&aacute;n separadas por un anillo fibroso"},{"id":"19699","text":"Los circuitos sist&eacute;mico y pulmonar funcional simult&aacute;neamente y paralelamente"},{"id":"19701","text":"La aorta tiene una pared poco el&aacute;stica"}]',
  '19700',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x37-0000-4000-b000-000000009496',
  'c000155-0000-4000-b000-000000009458',
  'Con respecto a las fibras musculares cardiacas. Se&ntilde;ala la afirmaci&oacute;n incorrecta',
  37,
  '[{"id":"19704","text":"Las c&eacute;lulas nerviosas que forman el marcapasos del coraz&oacute;n son c&eacute;lulas de n&oacute;dulo sinusal."},{"id":"19702","text":"Las fibras musculares espec&iacute;ficas son capaces de generar espont&aacute;neamente potenciales de acci&oacute;n"},{"id":"19703","text":"Las fibras musculares espec&iacute;ficas presentan una curva de potencial de acci&oacute;n diferente a la de las fibras musculares no espec&iacute;ficas"}]',
  '19704',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x38-0000-4000-b000-000000009497',
  'c000155-0000-4000-b000-000000009458',
  'Con respecto a las fases de despolarizaci&oacute;n de las c&eacute;lulas musculares ventriculares cardiacas (c&eacute;lulas no espec&iacute;ficas). Se&ntilde;ala la afirmaci&oacute;n incorrecta:',
  38,
  '[{"id":"19707","text":"En la fase 3 se produce el cierre de los canales de potasio de manera que el potencial de membrana se vuelve m&aacute;s negativo"},{"id":"19705","text":"En la fase 2 (meseta) se produce la apertura de los canales de calcio y aumenta la permeabilidad al calcio"},{"id":"19706","text":"De la fase 2 (meseta) muchos canales de potasio se cierran y por tanto la permeabilidad al potasio disminuye"}]',
  '19707',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x39-0000-4000-b000-000000009498',
  'c000155-0000-4000-b000-000000009458',
  'Con respecto a la fisiolog&iacute;a de los vasos sangu&iacute;neos se&ntilde;ala la afirmaci&oacute;n correcta:',
  39,
  '[{"id":"19708","text":"Las venas son reservorios de volumen."},{"id":"19709","text":"Las arteriolas poseen paredes el&aacute;sticas provistas de un alto contenido en col&aacute;geno que permite su contracci&oacute;n."},{"id":"19710","text":"La distensibilidad de las arterias es mucho mayor que la de las venas."},{"id":"19711","text":"La aorta es m&aacute;s adaptable que la vena cava, y soporta presiones m&aacute;s altas."}]',
  '19708',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x40-0000-4000-b000-000000009499',
  'c000155-0000-4000-b000-000000009458',
  'Con respecto a las Fuerzas de Starling, se&ntilde;ala la afirmaci&oacute;n correcta:',
  40,
  '[{"id":"19714","text":"Si aumenta la presi&oacute;n hidrost&aacute;tica del capilar se favorece la filtraci&oacute;n de agua."},{"id":"19712","text":"Si disminuye la presi&oacute;n hidrost&aacute;tica del capilar se favorece la filtraci&oacute;n de agua."},{"id":"19713","text":"Si aumenta la presi&oacute;n onc&oacute;tica del intersticio se favorece la absorci&oacute;n de agua."},{"id":"19715","text":"Si disminuye la presi&oacute;n onc&oacute;tica del capilar se favorece la absorci&oacute;n de agua."}]',
  '19714',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x41-0000-4000-b000-000000009500',
  'c000155-0000-4000-b000-000000009458',
  'Con respecto al ciclo cardiaco &iquest;Qu&eacute; fase se inicia en la s&iacute;stole ventricular y termina cuando se inicia el periodo de eyecci&oacute;n ventricular?',
  41,
  '[{"id":"19718","text":"Contracci&oacute;n isovolum&eacute;trica ventricular"},{"id":"19716","text":"Teledi&aacute;stole"},{"id":"19717","text":"Relajaci&oacute;n isovolum&eacute;trica"}]',
  '19718',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x42-0000-4000-b000-000000009501',
  'c000155-0000-4000-b000-000000009458',
  'Se&ntilde;ala la afirmaci&oacute;n correcta:',
  42,
  '[{"id":"19720","text":"Las circulaciones portales que existen en el organismo son: la espl&aacute;cnica, la de los ri&ntilde;ones y la de la gl&aacute;ndula pituitaria"},{"id":"19719","text":"Las circulaciones espl&aacute;cnica se refiere a la sangre que abandona los capilares espl&eacute;cnicos, g&aacute;stricos o mesent&eacute;ricos y entran directamente en la vena cava"},{"id":"19721","text":"La circulaci&oacute;n sist&eacute;mica y pulmonar son circuitos conectados en paralelo"}]',
  '19720',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x43-0000-4000-b000-000000009502',
  'c000155-0000-4000-b000-000000009458',
  'Con respecto a la precarga ventricular, se&ntilde;ala la afirmaci&oacute;n incorrecta.',
  43,
  '[{"id":"19723","text":"La precarga se define como el volumen de sangre que hay dentro de un ventr&iacute;culo durante el llenado diast&oacute;lico"},{"id":"19722","text":"Al final de la di&aacute;stole la presi&oacute;n auricular derecha y la de la vena cava son medidas esencialmente equivalentes a las de la precarga ventricular derecha"},{"id":"19724","text":"La ley de Starling proponen que un aumento de la precarga conduce a un aumento de la fuerza de contracci&oacute;n"}]',
  '19723',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x44-0000-4000-b000-000000009503',
  'c000155-0000-4000-b000-000000009458',
  'Se&ntilde;ala la afirmaci&oacute;n incorrecta',
  44,
  '[{"id":"19726","text":"La aorta es m&aacute;s adaptable que la vena cava puesto que soporta presiones m&aacute;s altas"},{"id":"19725","text":"Las arteriolas poseen c&eacute;lulas musculares en su pared que permiten su contracci&oacute;n"},{"id":"19727","text":"Las anastomosis arteriovenosas son abundantes en la piel y tienen un papel importante en la termorregulaci&oacute;n"}]',
  '19726',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x45-0000-4000-b000-000000009504',
  'c000155-0000-4000-b000-000000009458',
  'Con respecto a los capilares. Se&ntilde;ala la opci&oacute;n incorrecta',
  45,
  '[{"id":"19728","text":"El &iacute;ndice de difusi&oacute;n de una sustancia es inversamente proporcional a la diferencia de concentraci&oacute;n entre el capilar y el l&iacute;quido intersticial"},{"id":"19729","text":"La barrera hematoencef&aacute;lica constituye una red de capilares donde la glucosa no puede atravesarlos si no es a trav&eacute;s de un transportador especifico"},{"id":"19730","text":"Durante la fase el ejercicio la difusi&oacute;n del ox&iacute;geno aumenta debido a que la distancia entre cada fibra musculoesquel&eacute;tica y el capilar m&aacute;s pr&oacute;ximo disminuye, entre otros factores"}]',
  '19728',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x46-0000-4000-b000-000000009505',
  'c000155-0000-4000-b000-000000009458',
  'Se&ntilde;alar la afirmaci&oacute;n incorrecta.',
  46,
  '[{"id":"19732","text":"Si disminuye la presi&oacute;n onc&oacute;tica en un capilar aumenta la tasa de absorci&oacute;n"},{"id":"19731","text":"Si aumenta la presi&oacute;n hidrost&aacute;tica de un capilar se favorece de una mayor filtraci&oacute;n de agua"},{"id":"19733","text":"Si el drenaje por parte de los vasos linf&aacute;ticos es deficiente aumenta la presi&oacute;n del l&iacute;quido intersticial"}]',
  '19732',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x47-0000-4000-b000-000000009506',
  'c000155-0000-4000-b000-000000009458',
  'Con respecto a la precarga ventricular, la afirmaci&oacute;n incorrecta:',
  47,
  '[{"id":"19735","text":"La precarga se define como el volumen de sangre que hay dentro de un ventr&iacute;culo durante el llenado diast&oacute;lico"},{"id":"19734","text":"Al final de la di&aacute;stole la presi&oacute;n auricular derecha y la de la vena cava son medidas esencialmente equivalentes a las de la precarga ventricular derecha"},{"id":"19736","text":"La ley de Starling propone que un aumento de la precarga conduce a un aumento de la fuerza de contracci&oacute;n"}]',
  '19735',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x48-0000-4000-b000-000000009507',
  'c000155-0000-4000-b000-000000009458',
  'Se&ntilde;ala la afirmaci&oacute;n incorrecta',
  48,
  '[{"id":"19738","text":"Si disminuye la presi&oacute;n oncotica de un capilar aumenta la tasa de absorci&oacute;n"},{"id":"19737","text":"Si aumenta la presi&oacute;n hidrost&aacute;tica de un capilar se favorece una mayor filtraci&oacute;n de agua"},{"id":"19739","text":"Si el drenaje por parte de los vasos linf&aacute;ticos es deficiente aumenta la presi&oacute;n del liquido intersticial"}]',
  '19738',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x49-0000-4000-b000-000000009508',
  'c000155-0000-4000-b000-000000009458',
  'Con respecto a las c&eacute;lulas musculares cardiacas y esquel&eacute;ticas. Se&ntilde;ala la afirmaci&oacute;n correcta:',
  49,
  '[{"id":"19742","text":"El fen&oacute;meno de sumaci&oacute;n temporal puede darse en las fibras musculares esquel&eacute;ticas pero no en las cardiacas."},{"id":"19740","text":"Las c&eacute;lulas musculares esquel&eacute;ticas tienen un periodo refractario m&aacute;s prolongado que las c&eacute;lulas musculares cardiacas"},{"id":"19741","text":"Las c&eacute;lulas musculares esquel&eacute;ticas est&aacute;n el&eacute;ctricamente conectadas por disco intercalares o uniones GAP"}]',
  '19742',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x50-0000-4000-b000-000000009509',
  'c000155-0000-4000-b000-000000009458',
  'Se&ntilde;ala la afirmaci&oacute;n correcta:',
  50,
  '[{"id":"19744","text":"Las fibras musculares auriculares y ventriculares est&aacute;n separadas por un anillo fibroso"},{"id":"19743","text":"El circuito sist&eacute;mico y pulmonar funciona simult&aacute;nea y paralelamente"},{"id":"19745","text":"La aorta tiene una pared poco el&aacute;stica"}]',
  '19744',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x51-0000-4000-b000-000000009510',
  'c000155-0000-4000-b000-000000009458',
  'Con respecto a las fibras musculares cardiacas. Se&ntilde;ala la afirmaci&oacute;n incorrecta:',
  51,
  '[{"id":"19748","text":"Las c&eacute;lulas nerviosas que conforman el marcapasos del coraz&oacute;n son las c&eacute;lulas del n&oacute;dulo sinusal"},{"id":"19746","text":"Las fibras musculares espec&iacute;ficas son capaces de generar espont&aacute;neamente potenciales de acci&oacute;n"},{"id":"19747","text":"Las fibras musculares espec&iacute;ficas presentan una curva de potencial de acci&oacute;n diferente a la de las fibras musculares no espec&iacute;ficas"}]',
  '19748',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x52-0000-4000-b000-000000009511',
  'c000155-0000-4000-b000-000000009458',
  'Con respecto al tema cardiaco y circulatorio. Se&ntilde;ala la afirmaci&oacute;n correcta:',
  52,
  '[{"id":"19751","text":"El epicardio es la capa del pericardio visceral que reviste el coraz&oacute;n"},{"id":"19749","text":"La v&aacute;lvula tric&uacute;spide se encuentra entre el atrio izquierdo y el ventr&iacute;culo izquierdo"},{"id":"19750","text":"La vena porta est&aacute; formado por la confluencia de las venas mesent&eacute;rica, espl&eacute;cnica, g&aacute;stricas y renales."},{"id":"19752","text":"La v&aacute;lvula pulmonar se encuentra entre la vena cava y el atrio derecho"}]',
  '19751',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x53-0000-4000-b000-000000009512',
  'c000155-0000-4000-b000-000000009458',
  'Con respecto al ciclo cardiaco. Se&ntilde;ale la afirmaci&oacute;n correcta:',
  53,
  '[{"id":"19754","text":"El cierre de la v&aacute;lvula a&oacute;rtica se corresponde con el inicio del periodo de relajaci&oacute;n isovolum&eacute;trico"},{"id":"19753","text":"El segundo ruido cardiaco corresponde con el cierre de la v&aacute;lvula auriculoventricular"},{"id":"19755","text":"La onda R se corresponde con el periodo de eyecci&oacute;n lento"},{"id":"19756","text":"La s&iacute;stole auricular aportar m&aacute;s del 60% del volumen telediast&oacute;lico"}]',
  '19754',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x54-0000-4000-b000-000000009513',
  'c000155-0000-4000-b000-000000009458',
  'Con respecto a las fuerzas de Starling. Se&ntilde;ale la afirmaci&oacute;n correcta:',
  54,
  '[{"id":"19758","text":"Si disminuye la presi&oacute;n onc&oacute;tica del capilar se favorece la filtraci&oacute;n de agua"},{"id":"19757","text":"Si aumenta la permeabilidad vascular se favorece la absorci&oacute;n de agua"},{"id":"19759","text":"Si aumenta la presi&oacute;n hidrost&aacute;tica del capilar se favorece la absorci&oacute;n de agua"},{"id":"19760","text":"Si aumenta la presi&oacute;n onc&oacute;tica del intersticio se favorece la absorci&oacute;n de agua"}]',
  '19758',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x55-0000-4000-b000-000000009514',
  'c000155-0000-4000-b000-000000009458',
  'Con respecto a la fisiolog&iacute;a de los vasos sangu&iacute;neos. Se&ntilde;ala la afirmaci&oacute;n correcta:',
  55,
  '[{"id":"19763","text":"La distensi&oacute;n de las venas es mucho mayor que la de las arterias"},{"id":"19761","text":"Las arterias son reservorios de volumen"},{"id":"19762","text":"Las arteriolas poseen paredes el&aacute;sticas que permiten su contracci&oacute;n"},{"id":"19764","text":"La aorta es m&aacute;s adaptable que la vena cava y soporta presiones m&aacute;s altas"}]',
  '19763',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x56-0000-4000-b000-000000009515',
  'c000155-0000-4000-b000-000000009458',
  'Con respecto a las fases de despolarizaci&oacute;n de las c&eacute;lulas musculares cardiacas. Se&ntilde;ala la afirmaci&oacute;n correcta:',
  56,
  '[{"id":"19767","text":"En la fase 2 muchos de los canales de calcio se abren y la permeabilidad al calcio aumenta"},{"id":"19765","text":"En la fase 0 se produce la salida r&aacute;pida de sodio de la c&eacute;lula"},{"id":"19766","text":"En la fase 1 los canales de sodio se abren y la membrana comienza la repolarizaci&oacute;n"},{"id":"19768","text":"En la fase 3 se producen una disminuci&oacute;n de la salida del potasio de la c&eacute;lula"}]',
  '19767',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x57-0000-4000-b000-000000009516',
  'c000155-0000-4000-b000-000000009458',
  'Con respecto a la regulaci&oacute;n de la funci&oacute;n card&iacute;aca. Se&ntilde;ala la afirmaci&oacute;n incorrecta:',
  57,
  '[{"id":"19769","text":"la ley de Frank Starling establece que el gasto card&iacute;aco disminuye al aumentar el grado de estiramiento diast&oacute;lico de las fibras musculares"},{"id":"19770","text":"la llegada de sangre venosa al coraz&oacute;n desde las extremidades posteriores se debe a la existencia de la llamada bomba venosa o muscular"},{"id":"19771","text":"un aumento de la frecuencia card&iacute;aca puede aumentar el gasto card&iacute;aco"}]',
  '19769',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x58-0000-4000-b000-000000009517',
  'c000155-0000-4000-b000-000000009458',
  'Seg&uacute;n las leyes de equilibrio de Starling, la presi&oacute;n neta del agua sin tener en cuenta la permeabilidad de la pared capilar es de 1 mmHg &iquest;Qu&eacute; fen&oacute;meno genera esta peque&ntilde;a diferencia y cu&aacute;l es el resultado final respecto al movimiento del agua en los capilares?',
  58,
  '[{"id":"19772","text":"La presi&oacute;n hidrost&aacute;tica excede ligeramente la presi&oacute;n onc&oacute;tica favoreciendo la filtraci&oacute;n"},{"id":"19773","text":"La presi&oacute;n onc&oacute;tica excede ligeramente la presi&oacute;n hidrost&aacute;tica favoreciendo la reabsorci&oacute;n"},{"id":"19774","text":"La presi&oacute;n hidrost&aacute;tica excede ligeramente la presi&oacute;n onc&oacute;tica favoreciendo la reabsorci&oacute;n"},{"id":"19775","text":"La presi&oacute;n onc&oacute;tica excede ligeramente la presi&oacute;n hidrost&aacute;tica favoreciendo la filtraci&oacute;n"}]',
  '19772',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x59-0000-4000-b000-000000009518',
  'c000155-0000-4000-b000-000000009458',
  'Con respecto a la regulaci&oacute;n de la funci&oacute;n cardiaca. Se&ntilde;ala la afirmaci&oacute;n incorrecta.',
  59,
  '[{"id":"19776","text":"La ley de Frank Starling establece que el gasto cardiaco disminuye al aumentar el grado de estiramiento diast&oacute;lico de las fibras musculares"},{"id":"19777","text":"La llegada de la sangre venosa al coraz&oacute;n desde las extremidades posteriores se debe a la existencia de la llamada bomba venosa o muscular"},{"id":"19778","text":"Un aumento de la frecuencia card&iacute;aca puede aumentar el gasto cardiaco"}]',
  '19776',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x60-0000-4000-b000-000000009519',
  'c000155-0000-4000-b000-000000009458',
  'Con respecto al control local de la circulaci&oacute;n, se&ntilde;ala cu&aacute;l de las siguientes opciones favorece la vasodilataci&oacute;n (en el tejido no pulmonar):',
  60,
  '[{"id":"19782","text":"Disminuci&oacute;n de la presi&oacute;n parcial de oxigeno"},{"id":"19779","text":"Disminuci&oacute;n de la presi&oacute;n parcial de CO2"},{"id":"19780","text":"Disminuci&oacute;n de la adenosina"},{"id":"19781","text":"Disminuci&oacute;n al potasio"}]',
  '19782',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x61-0000-4000-b000-000000009520',
  'c000155-0000-4000-b000-000000009458',
  'Con respecto a la fisiolog&iacute;a de los vasos sangu&iacute;neos se&ntilde;ala la afirmaci&oacute;n correcta:',
  61,
  '[{"id":"19783","text":"Las venas son reservorios de volumen."},{"id":"19784","text":"Las arteriolas poseen paredes el&aacute;sticas provistas de un alto contenido en col&aacute;geno que permite su contracci&oacute;n."},{"id":"19785","text":"La distensibilidad de las arterias es mucho mayor que la de las venas."},{"id":"19786","text":"La aorta es m&aacute;s adaptable que la vena cava, y soporta presiones m&aacute;s altas."}]',
  '19783',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x62-0000-4000-b000-000000009521',
  'c000155-0000-4000-b000-000000009458',
  'Cuando el animal tiene calor:',
  62,
  '[{"id":"19789","text":"Disminuye el volumen tidal y aumenta la frecuencia."},{"id":"19787","text":"Aumenta el volumen tidal y disminuye la frecuencia."},{"id":"19788","text":"Aumenta el volumen tidal y la frecuencia respiratoria."}]',
  '19789',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x63-0000-4000-b000-000000009522',
  'c000155-0000-4000-b000-000000009458',
  'Cuando se incrementa el metabolismo celular y aumenta la temperatura:',
  63,
  '[{"id":"19790","text":"La presi&oacute;n de O2 debe ser mayor para facilitar la llegada de O2 a los tejidos."},{"id":"19791","text":"La presi&oacute;n de O2 debe ser menor para facilitar la llegada de O2 a los tejidos."},{"id":"19792","text":"La temperatura no modifica la llegada de O2 a los tejidos."}]',
  '19790',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x64-0000-4000-b000-000000009523',
  'c000155-0000-4000-b000-000000009458',
  'La membrana que rodea y protege al coraz&oacute;n se denomina:',
  64,
  '[{"id":"19793","text":"pericardio."},{"id":"19794","text":"pleura."},{"id":"19795","text":"miocardio."},{"id":"19796","text":"Mediastino"}]',
  '19793',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x65-0000-4000-b000-000000009524',
  'c000155-0000-4000-b000-000000009458',
  'Esto sirve para reducir la fricci&oacute;n entre las capas de membranas que rodean al coraz&oacute;n:',
  65,
  '[{"id":"19800","text":"l&iacute;quido peric&aacute;rdico"},{"id":"19797","text":"l&iacute;quido sinovial"},{"id":"19798","text":"endocardio"},{"id":"19799","text":"l&iacute;quido pleural"},{"id":"19801","text":"epitelio capilar"}]',
  '19800',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x66-0000-4000-b000-000000009525',
  'c000155-0000-4000-b000-000000009458',
  '&iquest;Por qu&eacute; estructura pasa la sangre desde la aur&iacute;cula derecha hacia el ventr&iacute;culo derecho?',
  66,
  '[{"id":"19804","text":"V&aacute;lvula tric&uacute;spide"},{"id":"19802","text":"V&aacute;lvula bic&uacute;spide"},{"id":"19803","text":"Tabique interventricular"},{"id":"19805","text":"V&aacute;lvula mitral"},{"id":"19806","text":"Aorta ascendente"}]',
  '19804',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x67-0000-4000-b000-000000009526',
  'c000155-0000-4000-b000-000000009458',
  'La sangre que sale del ventr&iacute;culo izquierdo pasa &iquest;por cu&aacute;l de las siguientes estructuras?',
  67,
  '[{"id":"19810","text":"V&aacute;lvula semilunar a&oacute;rtica"},{"id":"19807","text":"Aur&iacute;cula derecha"},{"id":"19808","text":"Tabique interventricular"},{"id":"19809","text":"V&aacute;lvula bic&uacute;spide"},{"id":"19811","text":"V&aacute;lvula semilunar pulmonar"}]',
  '19810',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x68-0000-4000-b000-000000009527',
  'c000155-0000-4000-b000-000000009458',
  '&iquest;Qu&eacute; v&aacute;lvula impide que la sangre refluya hacia el ventr&iacute;culo derecho?',
  68,
  '[{"id":"19814","text":"V&aacute;lvula semilunar pulmonar"},{"id":"19812","text":"V&aacute;lvula tric&uacute;spide"},{"id":"19813","text":"V&aacute;lvula bic&uacute;spide"},{"id":"19815","text":"V&aacute;lvula semilunar a&oacute;rtica"},{"id":"19816","text":"V&aacute;lvula mitral"}]',
  '19814',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x69-0000-4000-b000-000000009528',
  'c000155-0000-4000-b000-000000009458',
  '&iquest;Cu&aacute;l de las siguientes opciones enumera correctamente la secuencia de estructuras que un potencial de acci&oacute;n card&iacute;aco sigue para excitar la contracci&oacute;n normal del coraz&oacute;n?',
  69,
  '[{"id":"19820","text":"Nodo SA, nodo AV, haz de His, fibras de Purkinje"},{"id":"19817","text":"Haz de His, fibras de Purkinje, nodo auriculoventricular (AV)"},{"id":"19818","text":"Nodo sinoauricular (SA), fibras de Purkinje, nodo AV, haz de His"},{"id":"19819","text":"Fibras de Purkinje, nodo AV, nodo SA, haz de His"},{"id":"19821","text":"Haz de His, nodo SA, nodo AV, fibras de Purkinje"}]',
  '19820',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x70-0000-4000-b000-000000009529',
  'c000155-0000-4000-b000-000000009458',
  'En comparaci&oacute;n con las fibras musculares esquel&eacute;ticas, las fibras contr&aacute;ctiles del coraz&oacute;n se despolarizan por un per&iacute;odo ____',
  70,
  '[{"id":"19823","text":"m&aacute;s largo"},{"id":"19822","text":"m&aacute;s corto"},{"id":"19824","text":"el mismo"}]',
  '19823',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x71-0000-4000-b000-000000009530',
  'c000155-0000-4000-b000-000000009458',
  'El volumen de sangre expulsado del ventr&iacute;culo izquierdo hacia la aorta por minuto se denomina:',
  71,
  '[{"id":"19825","text":"gasto card&iacute;aco."},{"id":"19826","text":"estimulo card&iacute;aco."},{"id":"19827","text":"volumen sist&oacute;lico."},{"id":"19828","text":"frecuencia card&iacute;aca."},{"id":"19829","text":"presi&oacute;n del pulso"}]',
  '19825',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x72-0000-4000-b000-000000009531',
  'c000155-0000-4000-b000-000000009458',
  'Este t&eacute;rmino se refiere al per&iacute;odo durante un ciclo card&iacute;aco cuando se produce la contracci&oacute;n de una c&aacute;mara y la presi&oacute;n dentro de la c&aacute;mara se eleva:',
  72,
  '[{"id":"19831","text":"s&iacute;stole"},{"id":"19830","text":"llenado"},{"id":"19832","text":"repolarizaci&oacute;n"},{"id":"19833","text":"di&aacute;stole"},{"id":"19834","text":"fibrilaci&oacute;n"}]',
  '19831',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x73-0000-4000-b000-000000009532',
  'c000155-0000-4000-b000-000000009458',
  'Esta estructura del coraz&oacute;n desencadena potenciales de acci&oacute;n que estimulan la contracci&oacute;n del coraz&oacute;n a un ritmo constante de unos 90-100 latidos por minuto:',
  73,
  '[{"id":"19838","text":"Nodo sinoauricular"},{"id":"19835","text":"Nervio acelerador card&iacute;aco"},{"id":"19836","text":"Nodo auriculoventricular"},{"id":"19837","text":"Centro cardiovascular"},{"id":"19839","text":"Haz de His"}]',
  '19838',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x74-0000-4000-b000-000000009533',
  'c000155-0000-4000-b000-000000009458',
  'La estimulaci&oacute;n de este nervio reduce la frecuencia card&iacute;aca:',
  74,
  '[{"id":"19843","text":"nervio vago"},{"id":"19840","text":"nervio acelerador card&iacute;aco"},{"id":"19841","text":"nervio hipogloso"},{"id":"19842","text":"accesorio espinal"},{"id":"19844","text":"nervio fr&eacute;nico"}]',
  '19843',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x75-0000-4000-b000-000000009534',
  'c000155-0000-4000-b000-000000009458',
  'Esta parte del enc&eacute;falo contiene el centro cardiovascular que regula la frecuencia card&iacute;aca:',
  75,
  '[{"id":"19847","text":"bulbo"},{"id":"19845","text":"mesenc&eacute;falo"},{"id":"19846","text":"cerebro"},{"id":"19848","text":"cerebelo"},{"id":"19849","text":"t&aacute;lamo"}]',
  '19847',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x76-0000-4000-b000-000000009535',
  'c000155-0000-4000-b000-000000009458',
  '&iquest;Qu&eacute; onda del electrocardiograma representa la repolarizaci&oacute;n de los ventr&iacute;culos?',
  76,
  '[{"id":"19851","text":"onda T"},{"id":"19850","text":"onda R"},{"id":"19852","text":"onda S"},{"id":"19853","text":"onda P"},{"id":"19854","text":"onda Q"}]',
  '19851',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x77-0000-4000-b000-000000009536',
  'c000155-0000-4000-b000-000000009458',
  '&iquest;Cu&aacute;l de las siguientes ondas del electrocardiograma (ECG) representa la despolarizaci&oacute;n auricular?',
  77,
  '[{"id":"19858","text":"onda P"},{"id":"19855","text":"onda R"},{"id":"19856","text":"onda T"},{"id":"19857","text":"onda S"},{"id":"19859","text":"onda Q"}]',
  '19858',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x78-0000-4000-b000-000000009537',
  'c000155-0000-4000-b000-000000009458',
  'Contracci&oacute;n isovolum&eacute;trica es la fase del ciclo card&iacute;aco en el cual:',
  78,
  '[{"id":"19864","text":"aumenta la presi&oacute;n ventricular y el volumen ventricular permanece igual."},{"id":"19860","text":"se abren las v&aacute;lvulas semilunares."},{"id":"19861","text":"se produce la repolarizaci&oacute;n ventricular."},{"id":"19862","text":"se produce la despolarizaci&oacute;n auricular."},{"id":"19863","text":"la sangre oxigenada sale del coraz&oacute;n hacia la circulaci&oacute;n sist&eacute;mica."}]',
  '19864',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x79-0000-4000-b000-000000009538',
  'c000155-0000-4000-b000-000000009458',
  'Las arterias el&aacute;sticas funcionan como:',
  79,
  '[{"id":"19868","text":"reservorios de presi&oacute;n."},{"id":"19865","text":"vasodilatadores."},{"id":"19866","text":"conducen solo hacia los tejidos del tronco."},{"id":"19867","text":"barreras a la microcirculaci&oacute;n."},{"id":"19869","text":"vasoconstrictores."}]',
  '19868',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x80-0000-4000-b000-000000009539',
  'c000155-0000-4000-b000-000000009458',
  'En individuos en reposo, estos vasos sirven como un reservorio grande de sangre del cual se puede enviar sangre r&aacute;pidamente cuando hace falta:',
  80,
  '[{"id":"19873","text":"venas y v&eacute;nulas"},{"id":"19870","text":"arterias y arteriolas"},{"id":"19871","text":"arteriolas y capilares"},{"id":"19872","text":"v&eacute;nulas y capilares"},{"id":"19874","text":"aorta y venas"}]',
  '19873',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x81-0000-4000-b000-000000009540',
  'c000155-0000-4000-b000-000000009458',
  '&iquest;Cu&aacute;l de las siguientes estructuras se hallan en las venas pero NO en las arterias?',
  81,
  '[{"id":"19878","text":"v&aacute;lvula"},{"id":"19875","text":"t&uacute;nica externa"},{"id":"19876","text":"t&uacute;nica media"},{"id":"19877","text":"t&uacute;nica interna"},{"id":"19879","text":"luz"}]',
  '19878',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x82-0000-4000-b000-000000009541',
  'c000155-0000-4000-b000-000000009458',
  '&iquest;Cu&aacute;l de las siguientes es el mecanismo m&aacute;s importante de intercambio capilar?',
  82,
  '[{"id":"19880","text":"difusi&oacute;n"},{"id":"19881","text":"transcitosis"},{"id":"19882","text":"flujo volum&eacute;trico"},{"id":"19883","text":"transporte activo primario"},{"id":"19884","text":"transporte activo secundario"}]',
  '19880',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x83-0000-4000-b000-000000009542',
  'c000155-0000-4000-b000-000000009458',
  'El gasto card&iacute;aco depende de dos cosas',
  83,
  '[{"id":"19885","text":"frecuencia card&iacute;aca y volumen sist&oacute;lico."},{"id":"19886","text":"volumen sist&oacute;lico y resistencia vascular sist&eacute;mica."},{"id":"19887","text":"frecuencia card&iacute;aca y resistencia vascular sist&eacute;mica."},{"id":"19888","text":"tipo de sangre y volumen sist&oacute;lico."},{"id":"19889","text":"presi&oacute;n arterial y frecuencia card&iacute;aca."}]',
  '19885',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x84-0000-4000-b000-000000009543',
  'c000155-0000-4000-b000-000000009458',
  '&iquest;Cu&aacute;l de las siguientes opciones NO producir&iacute;a un aumento de la presi&oacute;n arterial?',
  84,
  '[{"id":"19894","text":"Aumento de la vasodilataci&oacute;n arteriolar"},{"id":"19890","text":"Aumento del volumen sangu&iacute;neo"},{"id":"19891","text":"Aumento de la estimulaci&oacute;n simp&aacute;tica"},{"id":"19892","text":"Aumento de la frecuencia card&iacute;aca"},{"id":"19893","text":"Aumento del volumen sist&oacute;lico"}]',
  '19894',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x85-0000-4000-b000-000000009544',
  'c000155-0000-4000-b000-000000009458',
  '&iquest;Cu&aacute;l de las siguientes caracter&iacute;sticas de la sangre depende en gran parte de la relaci&oacute;n de la cantidad de gl&oacute;bulos rojos con el volumen plasm&aacute;tico?',
  85,
  '[{"id":"19896","text":"viscosidad de la sangre"},{"id":"19895","text":"volumen sangu&iacute;neo total"},{"id":"19897","text":"retorno venoso"},{"id":"19898","text":"tiempo de coagulaci&oacute;n"},{"id":"19899","text":"perfil de las inmunoglobulinas"}]',
  '19896',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x86-0000-4000-b000-000000009545',
  'c000155-0000-4000-b000-000000009458',
  '&iquest;Cu&aacute;l de las siguientes opciones NO producir&iacute;a un aumento de la resistencia vascular sist&eacute;mica?',
  86,
  '[{"id":"19902","text":"Disminuci&oacute;n de la longitud de la v&iacute;a circulatoria sist&eacute;mica"},{"id":"19900","text":"Disminuci&oacute;n del di&aacute;metro de las arteriolas sist&eacute;micas"},{"id":"19901","text":"Aumento de la viscosidad de la sangre"},{"id":"19903","text":"Aumento de la vasoconstricci&oacute;n de las arteriolas sist&eacute;micas"},{"id":"19904","text":"Aumento de la cantidad de gl&oacute;bulos rojos"}]',
  '19902',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x87-0000-4000-b000-000000009546',
  'c000155-0000-4000-b000-000000009458',
  'Todas las opciones que siguen ayudan al retorno venoso de la sangre hacia el coraz&oacute;n EXCEPTO:',
  87,
  '[{"id":"19907","text":"viscosidad de la sangre."},{"id":"19905","text":"la bomba de m&uacute;sculo esquel&eacute;tico."},{"id":"19906","text":"la bomba respiratoria."},{"id":"19908","text":"venoconstricci&oacute;n"},{"id":"19909","text":"v&aacute;lvulas venosas."}]',
  '19907',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x88-0000-4000-b000-000000009547',
  'c000155-0000-4000-b000-000000009458',
  'Cuando los quimiorreceptores de los vasos sangu&iacute;neos detectan niveles elevados de di&oacute;xido de carbono en la sangre, estimulan todos los siguientes cambios EXCEPTO:',
  88,
  '[{"id":"19912","text":"disminuci&oacute;n del la frecuencia respiratoria."},{"id":"19910","text":"Aumento de vasoconstricci&oacute;n de las arteriolas."},{"id":"19911","text":"Aumento de la presi&oacute;n arterial."},{"id":"19913","text":"Aumento de la estimulaci&oacute;n simp&aacute;tica de arteriolas y venas."},{"id":"19914","text":"Aumento de la vasoconstricci&oacute;n venosa."}]',
  '19912',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x89-0000-4000-b000-000000009548',
  'c000155-0000-4000-b000-000000009458',
  '&iquest;Qu&eacute; tienen en com&uacute;n las siguientes sustancias qu&iacute;micas: potasio, iones de hidr&oacute;geno, &aacute;cido l&aacute;ctico, &oacute;xido n&iacute;trico y adenosina?',
  89,
  '[{"id":"19916","text":"Todos son vasodilatadores potentes."},{"id":"19915","text":"Todos son vasoconstrictores potentes."},{"id":"19917","text":"Sirven para estimular las contracciones pulmonares."},{"id":"19918","text":"Regulan directamente el centro card&iacute;aco del hipot&aacute;lamo."},{"id":"19919","text":"Disminuyen la presi&oacute;n sangu&iacute;nea sist&oacute;lica."}]',
  '19916',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x90-0000-4000-b000-000000009549',
  'c000155-0000-4000-b000-000000009458',
  'Todas las venas de la circulaci&oacute;n sist&eacute;mica finalmente drenan hacia:',
  90,
  '[{"id":"19924","text":"vena cava superior y inferior, y seno coronario."},{"id":"19920","text":"vena cava superior."},{"id":"19921","text":"vena cava inferior."},{"id":"19922","text":"seno coronario."},{"id":"19923","text":"vena cava superior e inferior."}]',
  '19924',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x91-0000-4000-b000-000000009550',
  'c000155-0000-4000-b000-000000009458',
  '&iquest;Cu&aacute;l de las siguientes efectores NO se activar&iacute;a como se describe abajo en respuesta al shock hipovol&eacute;mico?',
  91,
  '[{"id":"19928","text":"Las arteriolas sist&eacute;micas se vasodilatan."},{"id":"19925","text":"La corteza suprarrenal libera aldosterona."},{"id":"19926","text":"Los ri&ntilde;ones conservan sal y agua."},{"id":"19927","text":"La frecuencia card&iacute;aca aumenta."},{"id":"19929","text":"La contractilidad card&iacute;aca aumenta."}]',
  '19928',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x92-0000-4000-b000-000000009551',
  'c000155-0000-4000-b000-000000009458',
  'La v&iacute;a circulatoria pulmonar transporta sangre desde:',
  92,
  '[{"id":"19931","text":"el ventr&iacute;culo derecho hacia la aur&iacute;cula izquierda."},{"id":"19930","text":"la aur&iacute;cula derecha hacia el ventr&iacute;culo derecho."},{"id":"19932","text":"la aur&iacute;cula izquierda hacia el ventr&iacute;culo izquierdo."},{"id":"19933","text":"el ventr&iacute;culo izquierdo hacia la aur&iacute;cula derecha."},{"id":"19934","text":"el ventr&iacute;culo izquierdo hacia el seno coronario."}]',
  '19931',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x93-0000-4000-b000-000000009552',
  'c000155-0000-4000-b000-000000009458',
  '&iquest;A qu&eacute; son sensibles los cuerpos carot&iacute;deos y a&oacute;rticos?',
  93,
  '[{"id":"19936","text":"A la ca&iacute;da de la saturaci&oacute;n de O2"},{"id":"19935","text":"Por la subida de la PCO2"},{"id":"19937","text":"A la calidad de la PO2"},{"id":"19938","text":"A la subida de pH"}]',
  '19936',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x94-0000-4000-b000-000000009553',
  'c000155-0000-4000-b000-000000009458',
  'Seg&uacute;n la ley de Fick, para una presi&oacute;n onc&oacute;tica medida de 19 mmHg y una presi&oacute;n hidrost&aacute;tica neta de 20 mmHg el resultado de la diferencia de presiones ser&iacute;a:',
  94,
  '[{"id":"19942","text":"1 mmHg a favor de la presi&oacute;n hidrost&aacute;tica, favoreciendo la filtraci&oacute;n"},{"id":"19939","text":"-1 mmHg a favor de la presi&oacute;n hidrost&aacute;tica, favoreciendo la filtraci&oacute;n"},{"id":"19940","text":"-1 mmHg a favor de la presi&oacute;n hidrost&aacute;tica, favoreciendo la reabsorci&oacute;n"},{"id":"19941","text":"1 mmHg a favor de la presi&oacute;n hidrost&aacute;tica, favoreciendo la reabsorci&oacute;n"}]',
  '19942',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x95-0000-4000-b000-000000009554',
  'c000155-0000-4000-b000-000000009458',
  'Se&ntilde;ala el orden correcto de las diferentes capas del coraz&oacute;n de la m&aacute;s externa la m&aacute;s interna:',
  95,
  '[{"id":"19945","text":"Pericardio parietal, l&iacute;quido peric&aacute;rdico, epicardio, miocardio y endocardio"},{"id":"19943","text":"Epicardio, pericardio parietal, l&iacute;quido peric&aacute;rdico, miocardio y endocardio"},{"id":"19944","text":"Epicardio, l&iacute;quido peric&aacute;rdico, pericardio parietal, epicardio, miocardio y endocardio"},{"id":"19946","text":"Miocardio parietal, epicardio, l&iacute;quido peric&aacute;rdico, miocardio y endocardio"}]',
  '19945',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x96-0000-4000-b000-000000009555',
  'c000155-0000-4000-b000-000000009458',
  'Con respecto al dise&ntilde;o de la circulaci&oacute;n. Se&ntilde;ala la afirmaci&oacute;n correcta:',
  96,
  '[{"id":"19948","text":"La circulaci&oacute;n pulmonar y sist&eacute;mica funcionan de manera simult&aacute;nea"},{"id":"19947","text":"La circulaci&oacute;n sist&eacute;mica es un circuito de baja presi&oacute;n"},{"id":"19949","text":"La circulaci&oacute;n sist&eacute;mica y pulmonar est&aacute;n dispuestas en paralelo"},{"id":"19950","text":"El patr&oacute;n de ramificaci&oacute;n arterial que entrega la sangre a cada uno de los &oacute;rganos est&aacute; dispuesto en serio"}]',
  '19948',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x97-0000-4000-b000-000000009556',
  'c000155-0000-4000-b000-000000009458',
  'Ciclo cardiaco. El segundo sonido cardiaco se corresponde con:',
  97,
  '[{"id":"19954","text":"El inicio del periodo de relajaci&oacute;n isovolum&eacute;trica"},{"id":"19951","text":"El final del periodo de eyecci&oacute;n r&aacute;pido"},{"id":"19952","text":"El final de la di&aacute;stasis"},{"id":"19953","text":"El cierre de las v&aacute;lvulas atrioventriculares"}]',
  '19954',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x98-0000-4000-b000-000000009557',
  'c000155-0000-4000-b000-000000009458',
  'Con respecto a la anastomosis arteriovenosa. Se&ntilde;ala la afirmaci&oacute;n correcta:',
  98,
  '[{"id":"19958","text":"Su funci&oacute;n principal es la termorregulaci&oacute;n"},{"id":"19955","text":"Forma parte de la barrera hematocefálica"},{"id":"19956","text":"No se encuentran pr&aacute;cticamente en la piel"},{"id":"19957","text":"Son importantes el intercambio de glucosa al cerebro"}]',
  '19958',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x99-0000-4000-b000-000000009558',
  'c000155-0000-4000-b000-000000009458',
  'El inotropismo hace referencia a:',
  99,
  '[{"id":"19959","text":"La fuerza de contracci&oacute;n cardiaca"},{"id":"19960","text":"La tensi&oacute;n muscular del coraz&oacute;n"},{"id":"19961","text":"Propagaci&oacute;n de la excitaci&oacute;n cardiaca"},{"id":"19962","text":"Excitabilidad del coraz&oacute;n"}]',
  '19959',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x100-0000-4000-b000-000000009559',
  'c000155-0000-4000-b000-000000009458',
  'Indica cu&aacute;l de los siguientes &oacute;rganos tienen fundamentalmente control local de la presi&oacute;n arterial:',
  100,
  '[{"id":"19966","text":"Ri&ntilde;&oacute;n"},{"id":"19963","text":"Coraz&oacute;n"},{"id":"19964","text":"Intestino"},{"id":"19965","text":"M&uacute;sculo esquel&eacute;tico"}]',
  '19966',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x101-0000-4000-b000-000000009560',
  'c000155-0000-4000-b000-000000009458',
  'La fase 4 del potencial de acci&oacute;n de una c&eacute;lula especializada en la conducci&oacute;n se caracteriza por:',
  101,
  '[{"id":"19967","text":"Es una fase de reposo con el potencial de membrana negativo"},{"id":"19968","text":"Apertura de los canales de calcio lento"},{"id":"19969","text":"Cierre de los canales de sodio r&aacute;pido"},{"id":"19970","text":"La p&eacute;rdida de los canales de sodio r&aacute;pido"}]',
  '19967',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x102-0000-4000-b000-000000009561',
  'c000155-0000-4000-b000-000000009458',
  'Entiendo que segu&iacute;a comienzo de un potencial de acci&oacute;n durante el cual otro potencial de acci&oacute;n no puede comenzar, por intenso que sean, se le denomina:',
  102,
  '[{"id":"19971","text":"Ped&iacute;a refractario absoluto"},{"id":"19972","text":"Dromotropismo"},{"id":"19973","text":"Conductividad cardiaca"},{"id":"19974","text":"Periodo refractario relativo"}]',
  '19971',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x103-0000-4000-b000-000000009562',
  'c000155-0000-4000-b000-000000009458',
  'El aumento de la resistencia arteriolar en un &oacute;rgano provoca:',
  103,
  '[{"id":"19976","text":"Disminuci&oacute;n del aporte de sangre que es aporta a ese &oacute;rgano"},{"id":"19975","text":"Ninguna de las respuestas dadas es correcta"},{"id":"19977","text":"No modifica el aporte de sangre a ese &oacute;rgano"},{"id":"19978","text":"Aumenta el aporte de sangre que se aporta a ese &oacute;rgano"}]',
  '19976',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x104-0000-4000-b000-000000009563',
  'c000155-0000-4000-b000-000000009458',
  'Una de las diferencias entre las c&eacute;lulas card&iacute;acas especializadas en la conducci&oacute;n y la contracci&oacute;n es:',
  104,
  '[{"id":"19979","text":"Las c&eacute;lulas especializadas en la conducci&oacute;n presentan un potencial de acci&oacute;n m&aacute;s r&aacute;pido que las especializadas en la contracci&oacute;n"},{"id":"19980","text":"Las c&eacute;lulas especializadas en la conducci&oacute;n no tienen canales de sodio r&aacute;pido"},{"id":"19981","text":"Las c&eacute;lulas especializadas la contracci&oacute;n no tienen canales de calcio"},{"id":"19982","text":"Las c&eacute;lulas especializadas en la conducci&oacute;n no poseen canales de potasio"}]',
  '19979',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x105-0000-4000-b000-000000009564',
  'c000155-0000-4000-b000-000000009458',
  'Los vasos pulmonares con respeto a los vasos sist&eacute;micos',
  105,
  '[{"id":"19985","text":"Son m&aacute;s adaptables"},{"id":"19983","text":"Son poco distensibles"},{"id":"19984","text":"Ofrecen una gran resistencia al paso de la sangre"},{"id":"19986","text":"Ninguna las anteriores es correcta"}]',
  '19985',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd155x106-0000-4000-b000-000000009565',
  'c000155-0000-4000-b000-000000009458',
  'Con respecto al reflejo barorreceptor. Se&ntilde;ala la afirmaci&oacute;n correcta:',
  106,
  '[{"id":"19989","text":"La regiones barorreceptoras se encuentran en la aorta descendente"},{"id":"19987","text":"Una disminuci&oacute;n de la presi&oacute;n arterial provocar&iacute;a liberaci&oacute;n de epinefrina sobre los receptores M1 del coraz&oacute;n, disminuyendo su inotropismo"},{"id":"19988","text":"Una disminuci&oacute;n de la presi&oacute;n arterial provocar&iacute;a liberaci&oacute;n de acetilcolina sobre los receptores M2 del coraz&oacute;n, disminuyendo la frecuencia cardiaca"},{"id":"19990","text":"Un aumento la presi&oacute;n arterial provocar&iacute;a liberaci&oacute;n de adrenalina sobre receptores alfa1 y alfa2 de los vasos"}]',
  '19989',
  '2026-04-27 17:01:04'
);

-- Quiz: "TEST 2 - CARDIACO" → Course: "Fisiología Vet 1ºC" (55 questions) [renamed to add "(2)"]
INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'c000156-0000-4000-b000-000000009566',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 2 - CARDIACO (2)',
  NULL,
  'quiz',
  100,
  '2026-04-27 17:01:04',
  '2026-04-27 17:01:04'
FROM Class c
WHERE c.name = 'Fisiología Vet 1ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 2 - CARDIACO (2)' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x0-0000-4000-b000-000000009567',
  'c000156-0000-4000-b000-000000009566',
  'En relaci&oacute;n a la contracci&oacute;n muscular de las fibras estriadas. &iquest;cu&aacute;l es el elemento que se acorta?',
  0,
  '[{"id":"20570","text":"El sarc&oacute;mero debido al deslizamiento de los filamentos de actina sobre los de miosina"},{"id":"20567","text":"Las bandas entre los discos Z debido al deslizamiento de los filamentos gruesos sobre los finos (miosina y actina, respectivamente)"},{"id":"20568","text":"El sarc&oacute;mero debi&oacute; al acortamiento de los filamentos de actina en el golpe de fuerza"},{"id":"20569","text":"Los discos Z debido al acortamiento de los filamentos de miosina en el puente cruzado"}]',
  '20570',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x1-0000-4000-b000-000000009568',
  'c000156-0000-4000-b000-000000009566',
  'Ciclo cardiaco. El segundo sonido cardiaco corresponde con:',
  1,
  '[{"id":"20574","text":"El inicio del periodo de relajaci&oacute;n isovolum&eacute;trica"},{"id":"20571","text":"El final del periodo de eyecci&oacute;n r&aacute;pido"},{"id":"20572","text":"El final de la di&aacute;stasis"},{"id":"20573","text":"El cierre de las v&aacute;lvulas atrioventriculares"}]',
  '20574',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x2-0000-4000-b000-000000009569',
  'c000156-0000-4000-b000-000000009566',
  'Con respecto a las anastomosis arteriovenosas:',
  2,
  '[{"id":"20578","text":"Su funci&oacute;n principal es la termorregulaci&oacute;n"},{"id":"20575","text":"Forman parte de la barrera hematoencef&aacute;lica"},{"id":"20576","text":"No se encuentran pr&aacute;cticamente en la piel"},{"id":"20577","text":"Son importantes en el intercambio de glucosa en el cerebro"}]',
  '20578',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x3-0000-4000-b000-000000009570',
  'c000156-0000-4000-b000-000000009566',
  'Con respecto al dise&ntilde;o de la circulaci&oacute;n:',
  3,
  '[{"id":"20580","text":"La circulaci&oacute;n pulmonar y sist&eacute;mica funcionan de manera simult&aacute;nea"},{"id":"20579","text":"La circulaci&oacute;n sist&eacute;mica es un circuito de baja presi&oacute;n"},{"id":"20581","text":"La circulaci&oacute;n sist&eacute;mica y pulmonar est&aacute;n dispuestas en paralelo"},{"id":"20582","text":"El patr&oacute;n de ramificaci&oacute;n arterial que entrega sangre a cada uno de los &oacute;rganos est&aacute; dispuesto en serie"}]',
  '20580',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x4-0000-4000-b000-000000009571',
  'c000156-0000-4000-b000-000000009566',
  'El inotropismo hace referencia a:',
  4,
  '[{"id":"20583","text":"La fuerza de contracci&oacute;n cardiaca"},{"id":"20584","text":"Tensi&oacute;n muscular del coraz&oacute;n"},{"id":"20585","text":"Propagaci&oacute;n de la excitaci&oacute;n cardiaca"},{"id":"20586","text":"Excitabilidad del coraz&oacute;n"}]',
  '20583',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x5-0000-4000-b000-000000009572',
  'c000156-0000-4000-b000-000000009566',
  'El dromotropismo hace referencia a:',
  5,
  '[{"id":"20589","text":"Propagaci&oacute;n de la excitaci&oacute;n cardiaca"},{"id":"20587","text":"La fuerza de contracci&oacute;n cardiaca"},{"id":"20588","text":"Tensi&oacute;n muscular del coraz&oacute;n"},{"id":"20590","text":"Excitabilidad del coraz&oacute;n"}]',
  '20589',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x6-0000-4000-b000-000000009573',
  'c000156-0000-4000-b000-000000009566',
  'El tiempo que sigue al comienzo de un potencial de acci&oacute;n durante el cual otro potencial de acci&oacute;n no puede comenzar, por intenso que sea, se denomina:',
  6,
  '[{"id":"20591","text":"Periodo refractario absoluto"},{"id":"20592","text":"Periodo refractario relativo"},{"id":"20593","text":"Conductibilidad cardiaca"},{"id":"20594","text":"Dromotropismo"}]',
  '20591',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x7-0000-4000-b000-000000009574',
  'c000156-0000-4000-b000-000000009566',
  'La fase 4 del potencial de acci&oacute;n de una c&eacute;lula especializada en la conducci&oacute;n se caracteriza por:',
  7,
  '[{"id":"20595","text":"Es una fase de reposo con el potencial de membrana negativo"},{"id":"20596","text":"Apertura de canales de calcio lentos"},{"id":"20597","text":"Cierre de los canales de sodio r&aacute;pido"},{"id":"20598","text":"La apertura de los canales de sodio r&aacute;pidos"}]',
  '20595',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x8-0000-4000-b000-000000009575',
  'c000156-0000-4000-b000-000000009566',
  'En el m&uacute;sculo estriado, &iquest;de d&oacute;nde proviene la energ&iacute;a necesaria para la contracci&oacute;n muscular?',
  8,
  '[{"id":"20599","text":"El golpe de fuerza libera energ&iacute;a del ATP cuando la cabeza del puente cruzado de la miosina se une con la actina"},{"id":"20600","text":"Se libera ATP en el golpe de fuerza cuando el puente cruzado de la actina se une con la miosina"},{"id":"20601","text":"La troponina tiene alta capacidad de captaci&oacute;n de ATP cuando se une a la tropomiosina"},{"id":"20602","text":"Se libera ATP cuando la tropomiosina libera los puntos de atraque de la troponina en la h&eacute;lice de actina"}]',
  '20599',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x9-0000-4000-b000-000000009576',
  'c000156-0000-4000-b000-000000009566',
  'Se&ntilde;ala el orden correcto de las diferentes capas del coraz&oacute;n de la m&aacute;s externa a la m&aacute;s interna:',
  9,
  '[{"id":"20603","text":"Pericardio parietal, l&iacute;quido peric&aacute;rdico, epicardio, miocardio y endocardio"},{"id":"20604","text":"Epicardio, l&iacute;quido peric&aacute;rdico, pericardio parietal, epicardio, miocardio y endocardio"},{"id":"20605","text":"Epicardio, pericardio parietal, l&iacute;quido peric&aacute;rdico, miocardio y endocardio"},{"id":"20606","text":"Pericardio parietal, epicardio, l&iacute;quido peric&aacute;rdico, miocardio y endocardio"}]',
  '20603',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x10-0000-4000-b000-000000009577',
  'c000156-0000-4000-b000-000000009566',
  'Un aumento de la resistencia arteriolar en un &oacute;rgano provoca:',
  10,
  '[{"id":"20608","text":"Disminuci&oacute;n del aporte de sangre que se aporta a ese &oacute;rgano"},{"id":"20607","text":"Ninguna de las respuestas es correcta"},{"id":"20609","text":"No modifica el aporte de sangre a ese &oacute;rgano"},{"id":"20610","text":"Aumento del aporte de sangre que se aporta a ese &oacute;rgano"}]',
  '20608',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x11-0000-4000-b000-000000009578',
  'c000156-0000-4000-b000-000000009566',
  'El principal lugar de resistencia al flujo de sangre se encuentra en:',
  11,
  '[{"id":"20614","text":"Metarteriolas"},{"id":"20611","text":"Venas"},{"id":"20612","text":"Arterias el&aacute;sticas"},{"id":"20613","text":"Capilares"}]',
  '20614',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x12-0000-4000-b000-000000009579',
  'c000156-0000-4000-b000-000000009566',
  'Conociendo los siguientes par&aacute;metros medidos en la circulaci&oacute;n del m&uacute;sculo esquel&eacute;tico: presi&oacute;n hidrost&aacute;tica del capilar 34 mmHg, presi&oacute;n hidrost&aacute;tica intersticial 10 mmHg, presi&oacute;n onc&oacute;tica del capilar 24 mmHg, presi&oacute;n onc&oacute;tica intersticial 1 mmHg. Se&ntilde;ala la afirmaci&oacute;n correcta:',
  12,
  '[{"id":"20618","text":"En estas condiciones se favorece la filtraci&oacute;n"},{"id":"20615","text":"No est&aacute; claro lo que se favorecen en estas condiciones ya que no se ha especificado la concentraci&oacute;n de prote&iacute;nas plasm&aacute;ticas"},{"id":"20616","text":"En estas condiciones se favorece la reabsorci&oacute;n"},{"id":"20617","text":"En esas condiciones no se favorece ni la reabsorci&oacute;n ni la filtraci&oacute;n"}]',
  '20618',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x13-0000-4000-b000-000000009580',
  'c000156-0000-4000-b000-000000009566',
  'Una de las diferencias entre las c&eacute;lulas cardiacas especializadas en la conducci&oacute;n y la contracci&oacute;n es:',
  13,
  '[{"id":"20620","text":"Las c&eacute;lulas especializadas en la conducci&oacute;n no tienen canales de sodio r&aacute;pido"},{"id":"20619","text":"Las c&eacute;lulas especializadas en la contracci&oacute;n presentan un potencial de acci&oacute;n m&aacute;s r&aacute;pido que las especializadas en la contracci&oacute;n"},{"id":"20621","text":"Las c&eacute;lulas especializadas en la contracci&oacute;n no tienen canales de calcio"},{"id":"20622","text":"Las c&eacute;lulas especializadas en la conducci&oacute;n no poseen canales de potasio"}]',
  '20620',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x14-0000-4000-b000-000000009581',
  'c000156-0000-4000-b000-000000009566',
  'Con respecto al sistema barorreceptor, se&ntilde;ala la afirmaci&oacute;n correcta:',
  14,
  '[{"id":"20625","text":"Las regiones barorreceptoras se encuentran en la aorta descendente"},{"id":"20623","text":"Una disminuci&oacute;n de la presi&oacute;n arterial provoca liberaci&oacute;n de epinefrina sobre los receptores M1 del coraz&oacute;n, disminuyendo su inotropismo"},{"id":"20624","text":"Una disminuci&oacute;n de la presi&oacute;n arterial provoca la liberaci&oacute;n de acetilcolina sobre los receptores M2 del coraz&oacute;n, disminuyendo la frecuencia cardiaca"},{"id":"20626","text":"Un aumento de la presi&oacute;n arterial provocar&iacute;a la liberaci&oacute;n de adrenalina sobre los receptores a1 y a2 de los vasos"}]',
  '20625',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x15-0000-4000-b000-000000009582',
  'c000156-0000-4000-b000-000000009566',
  'Los vasos pulmonares, con respecto a los vasos sist&eacute;micos:',
  15,
  '[{"id":"20629","text":"Son m&aacute;s adaptables"},{"id":"20627","text":"Son poco distensibles"},{"id":"20628","text":"Ofrecen una gran resistencia al paso de la sangre"},{"id":"20630","text":"Ninguna de las respuestas es correcta"}]',
  '20629',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x16-0000-4000-b000-000000009583',
  'c000156-0000-4000-b000-000000009566',
  'Ante una hipertensi&oacute;n pulmonar:',
  16,
  '[{"id":"20663","text":"Provocar&aacute; la aparici&oacute;n de edema"},{"id":"20664","text":"Se produce un aumento del gasto cardiaco, incrementando la presi&oacute;n arterial"},{"id":"20665","text":"El ventr&iacute;culo izquierdo bombea m&aacute;s sangre a los pulmones de lo normal, aumentando el gasto cardiaco"},{"id":"20666","text":"Se produce un aumento de la resistencia perif&eacute;rica total, disminuyendo la presi&oacute;n arterial"}]',
  '20663',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x17-0000-4000-b000-000000009584',
  'c000156-0000-4000-b000-000000009566',
  'Se&ntilde;ala la respuesta correcta acerca del sistema capilar:',
  17,
  '[{"id":"20669","text":"Los capilares, a diferencia de las metarteriolas, carecen de m&uacute;sculo liso"},{"id":"20667","text":"Tambi&eacute;n denominado sistema de distribuci&oacute;n"},{"id":"20668","text":"La presi&oacute;n en ellos es m&aacute;xima para poder devolver la sangre hacia el coraz&oacute;n"},{"id":"20670","text":"Junto a las anastomosis arteriovenosas es el lugar donde se produce el intercambio de sustancias"}]',
  '20669',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x18-0000-4000-b000-000000009585',
  'c000156-0000-4000-b000-000000009566',
  '&iquest;Por qu&eacute; el sistema venoso act&uacute;a como un reservorio de presi&oacute;n?',
  18,
  '[{"id":"20673","text":"El sistema venoso no act&uacute;a como reservorio de presi&oacute;n"},{"id":"20671","text":"Al contar con muchas fibras el&aacute;sticas, las venas tienen mayor capacidad de almacenar presi&oacute;n"},{"id":"20672","text":"Porque las venas generan mucha resistencia al flujo sangu&iacute;neo"},{"id":"20674","text":"Ninguna es correcta"}]',
  '20673',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x19-0000-4000-b000-000000009586',
  'c000156-0000-4000-b000-000000009566',
  'En una hiperemia reactiva, &iquest;c&oacute;mo act&uacute;a el control metab&oacute;lico del flujo?',
  19,
  '[{"id":"20678","text":"Se produce un aumento del flujo sangu&iacute;neo temporal tras un periodo de restricci&oacute;n"},{"id":"20675","text":"Tiene lugar una disminuci&oacute;n del flujo sangu&iacute;neo temporal debido al incremento de CO2"},{"id":"20676","text":"Se produce una vasoconstricci&oacute;n por un incremento de K+, &aacute;cido l&aacute;ctico o adenosina"},{"id":"20677","text":"Se produce una vasodilataci&oacute;n por un incremento de K+, &aacute;cido l&aacute;ctico o adenosina"}]',
  '20678',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x20-0000-4000-b000-000000009587',
  'c000156-0000-4000-b000-000000009566',
  'Se&ntilde;ala la respuesta correcta:',
  20,
  '[{"id":"20679","text":"La arteria aorta presenta una presi&oacute;n diast&oacute;lica de 80 mmHg"},{"id":"20680","text":"La arteria pulmonar presenta una presi&oacute;n sist&oacute;lica de 8 mmHg"},{"id":"20681","text":"La arteria aorta presenta una presi&oacute;n sist&oacute;lica de 100 mmHg"},{"id":"20682","text":"La arteria pulmonar presenta una presi&oacute;n media de 25 mmHg"}]',
  '20679',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x21-0000-4000-b000-000000009588',
  'c000156-0000-4000-b000-000000009566',
  'En el sistema cardiovascular es incorrecto que:',
  21,
  '[{"id":"20684","text":"Para que la sangre pueda fluir la presi&oacute;n de perfusi&oacute;n debe ser menor al comienzo del vaso que al final"},{"id":"20683","text":"La difusi&oacute;n emplea la diferencia de concentraci&oacute;n como fuente de energ&iacute;a"},{"id":"20685","text":"El flujo de volumen emplea la presi&oacute;n de perfusi&oacute;n como fuente de energ&iacute;a"},{"id":"20686","text":"El sistema circulatorio es capaz de transportar calor por fricci&oacute;n"}]',
  '20684',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x22-0000-4000-b000-000000009589',
  'c000156-0000-4000-b000-000000009566',
  'Indica la respuesta correcta sobre la circulaci&oacute;n cardiovascular:',
  22,
  '[{"id":"20688","text":"La circulaci&oacute;n mayor recorre el organismo desde el ventr&iacute;culo izquierdo hasta el atrio derecho"},{"id":"20687","text":"La circulaci&oacute;n sist&eacute;mica comienza con la arteria aorta y finaliza con la vena cava, incluyendo todos los vasos entre ambas"},{"id":"20689","text":"La circulaci&oacute;n menor o sist&eacute;mica est&aacute; dispuesta en paralelo"},{"id":"20690","text":"Ninguna es correcta"}]',
  '20688',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x23-0000-4000-b000-000000009590',
  'c000156-0000-4000-b000-000000009566',
  '&iquest;Cu&aacute;l de los siguientes neurotransmisores procede del tript&oacute;fano?',
  23,
  '[{"id":"20694","text":"Serotonina"},{"id":"20691","text":"Glicina"},{"id":"20692","text":"Dopamina"},{"id":"20693","text":"Histamina"}]',
  '20694',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x24-0000-4000-b000-000000009591',
  'c000156-0000-4000-b000-000000009566',
  'Indica cu&aacute;l de las siguientes hormonas estimula la reabsorci&oacute;n a nivel renal y produce sensaci&oacute;n de sed:',
  24,
  '[{"id":"20697","text":"ADH"},{"id":"20695","text":"Aldosterona"},{"id":"20696","text":"Noradrenalina"},{"id":"20698","text":"Histamina"}]',
  '20697',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x25-0000-4000-b000-000000009592',
  'c000156-0000-4000-b000-000000009566',
  'Sobre el gasto cardiaco:',
  25,
  '[{"id":"20701","text":"Se obtiene como el volumen sist&oacute;lico del ventr&iacute;culo izquierdo multiplicado por la frecuencia cardiaca"},{"id":"20699","text":"Se obtiene como el volumen diast&oacute;lico del ventr&iacute;culo derecho multiplicado por la frecuencia cardiaca"},{"id":"20700","text":"Es el volumen de sangre que el ventr&iacute;culo izquierdo bombea hacia la arteria pulmonar en un minuto"},{"id":"20702","text":"Ninguna es correcta"}]',
  '20701',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x26-0000-4000-b000-000000009593',
  'c000156-0000-4000-b000-000000009566',
  'Sobre la presi&oacute;n de perfusi&oacute;n podemos afirmar que:',
  26,
  '[{"id":"20704","text":"Se obtiene como la diferencia entre la presi&oacute;n de la arteria aorta y la vena cava, siendo esta &uacute;ltima despreciable"},{"id":"20703","text":"Se obtiene como la diferencia entre la presi&oacute;n de la arteria aorta y la arteria pulmonar, siendo esta &uacute;ltima despreciable"},{"id":"20705","text":"Se obtiene como la diferencia entre la presi&oacute;n de la arteria pulmonar y la arteria aorta, siendo esta &uacute;ltima despreciable"},{"id":"20706","text":"Ninguna es correcta"}]',
  '20704',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x27-0000-4000-b000-000000009594',
  'c000156-0000-4000-b000-000000009566',
  '&iquest;Cu&aacute;l de las siguientes afirmaciones sobre la circulaci&oacute;n porta-espl&aacute;cnica es correcta?',
  27,
  '[{"id":"20710","text":"Sigue una estructura vena - capilares - vena"},{"id":"20707","text":"Sigue una estructura arteria - capilares - arteria"},{"id":"20708","text":"Irriga los &oacute;rganos pares de la cavidad abdominal"},{"id":"20709","text":"Irriga el sistema hipot&aacute;lamo - hipofisario"}]',
  '20710',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x28-0000-4000-b000-000000009595',
  'c000156-0000-4000-b000-000000009566',
  'Se&ntilde;ala la afirmaci&oacute;n correcta:',
  28,
  '[{"id":"20713","text":"Ante una disminuci&oacute;n de la presi&oacute;n arterial las c&eacute;lulas yuxtaglomerulares secretan renina"},{"id":"20711","text":"Las c&eacute;lulas endoteliales del pulm&oacute;n secretan angiotensin&oacute;geno, que se convierte en angiotensina I gracias a la acci&oacute;n de la renina"},{"id":"20712","text":"La enzima convertidora de angiotensina es secretada por el h&iacute;gado y permite convertir angiotensina I en angiotensina II"},{"id":"20714","text":"Todas son correctas"}]',
  '20713',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x29-0000-4000-b000-000000009596',
  'c000156-0000-4000-b000-000000009566',
  'Indica cu&aacute;l de los siguientes motivos explica un aumento en la presi&oacute;n a&oacute;rtica media:',
  29,
  '[{"id":"20717","text":"Aumento del gasto cardiaco y/o aumento de la resistencia perif&eacute;rica total"},{"id":"20715","text":"Disminuci&oacute;n del gasto cardiaco y aumento de la resistencia perif&eacute;rica total"},{"id":"20716","text":"Disminuci&oacute;n del gasto cardiaco y/o disminuci&oacute;n de la resistencia perif&eacute;rica total"},{"id":"20718","text":"Aumento del gasto cardiaco y disminuci&oacute;n de la resistencia perif&eacute;rica total"}]',
  '20717',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x30-0000-4000-b000-000000009597',
  'c000156-0000-4000-b000-000000009566',
  'Sobre el l&iacute;quido cefalorraqu&iacute;deo podemos afirmar que:',
  30,
  '[{"id":"20721","text":"En condiciones fisiol&oacute;gicas circula por los ventr&iacute;culos cerebrales"},{"id":"20719","text":"Se forma en la m&eacute;dula espinal"},{"id":"20720","text":"En condiciones fisiol&oacute;gicas, se puede encontrar entre la piamadre y duramadre"},{"id":"20722","text":"Todas son correctas"}]',
  '20721',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x31-0000-4000-b000-000000009598',
  'c000156-0000-4000-b000-000000009566',
  'Un perro con una presi&oacute;n arterial de 120/80 mmHg tiene un flujo cerebral de 100 ml/min. Cuando la presi&oacute;n arterial aumenta a 130/100 mmHg, el flujo cerebral lo hace hasta 105 ml/min. Esto es un ejemplo de:',
  31,
  '[{"id":"20724","text":"Autorregulaci&oacute;n"},{"id":"20723","text":"Hiperemia activa"},{"id":"20725","text":"Hiperemia reactiva"},{"id":"20726","text":"Barrera hematoencef&aacute;lica"}]',
  '20724',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x32-0000-4000-b000-000000009599',
  'c000156-0000-4000-b000-000000009566',
  'En relaci&oacute;n a la contracci&oacute;n de la musculatura cardiaca podemos afirmar que:',
  32,
  '[{"id":"20727","text":"La cantidad de sangre que queda en los ventr&iacute;culos tras la s&iacute;stole se denomina volumen telesist&oacute;lico"},{"id":"20728","text":"Tras la s&iacute;stole ventricular el volumen de sangre en los ventr&iacute;culos es pr&oacute;ximo a 0"},{"id":"20729","text":"En condiciones fisiol&oacute;gicas el coraz&oacute;n trabaja en su punto de funcionamiento &oacute;ptimo"},{"id":"20730","text":"Todas son correctas"}]',
  '20727',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x33-0000-4000-b000-000000009600',
  'c000156-0000-4000-b000-000000009566',
  '&iquest;Qu&eacute; permite el receptor de voltaje DHP (dihidropiridina)?',
  33,
  '[{"id":"20803","text":"Durante la contracci&oacute;n muscular permite liberar el Ca2+ almacenado en el ret&iacute;culo sarcopl&aacute;smico"},{"id":"20802","text":"Activa el complejo calmodulina-prote&iacute;na-quinasa"},{"id":"20804","text":"Permite a las ves&iacute;culas sin&aacute;pticas fundirse con la membrana de la terminal ax&oacute;nica para liberar sus neurotransmisores"},{"id":"20805","text":"Activa el desplazamiento de la tropomiosina y la exposici&oacute;n de los puntos de uni&oacute;n de la actina"}]',
  '20803',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x34-0000-4000-b000-000000009601',
  'c000156-0000-4000-b000-000000009566',
  'El control local metab&oacute;lico del flujo sangu&iacute;neo a los m&uacute;sculos esquel&eacute;ticos:',
  34,
  '[{"id":"20808","text":"Puede dominar sobre o ser un subordinado del control neurohumoral en funci&oacute;n de si el m&uacute;sculo est&aacute; realizando ejercicio o en reposo"},{"id":"20806","text":"Suele dominar el control neurohumoral"},{"id":"20807","text":"Suele subordinarse al control neurohumoral"},{"id":"20809","text":"Depende sobre todo de los cambios que se producen en la resistencia de las venas que hay dentro de los m&uacute;sculos"}]',
  '20808',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x35-0000-4000-b000-000000009602',
  'c000156-0000-4000-b000-000000009566',
  'Sobre el sistema arterial NO podemos afirmar que:',
  35,
  '[{"id":"20811","text":"Es un sistema de colecci&oacute;n"},{"id":"20810","text":"Act&uacute;a como reservorio de presi&oacute;n"},{"id":"20812","text":"Permite distribuir la sangre desde el coraz&oacute;n hasta los capilares de forma centr&iacute;fuga"},{"id":"20813","text":"Las arteriolas y metarteriolas cuentan con musculatura lisa"}]',
  '20811',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x36-0000-4000-b000-000000009603',
  'c000156-0000-4000-b000-000000009566',
  'En relaci&oacute;n a la musculatura esquel&eacute;tica, cardiaca y lisa, se&ntilde;ala la afirmaci&oacute;n correcta:',
  36,
  '[{"id":"20816","text":"En el m&uacute;sculo cardiaco los potenciales de acci&oacute;n se forman de manera espont&aacute;nea"},{"id":"20814","text":"Las fibras musculares cardiacas se encuentran asociadas el&eacute;ctricamente unas a otras, al igual que en el m&uacute;sculo esquel&eacute;tico"},{"id":"20815","text":"En la musculatura esquel&eacute;tica la uni&oacute;n actina - miosina tiene lugar gracias al complejo Ca2+ - calmodulina"},{"id":"20817","text":"En la musculatura lisa la uni&oacute;n actina - miosina tiene lugar gracias al complejo Ca2+ - troponina"}]',
  '20816',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x37-0000-4000-b000-000000009604',
  'c000156-0000-4000-b000-000000009566',
  'El camino normal que sigue un potencial de acci&oacute;n cardiaco comienza en el n&oacute;dulo sinusal y luego se propaga',
  37,
  '[{"id":"20820","text":"A trav&eacute;s de las aur&iacute;culas hacia el n&oacute;dulo atrio-ventricular"},{"id":"20818","text":"A trav&eacute;s de las aur&iacute;culas por el haz de Hiss"},{"id":"20819","text":"A trav&eacute;s de las capas de tejido conjuntivo que separan las aur&iacute;culas de los ventr&iacute;culos"},{"id":"20821","text":"De la aur&iacute;cula izquierda a la derecha"}]',
  '20820',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x38-0000-4000-b000-000000009605',
  'c000156-0000-4000-b000-000000009566',
  'Ante un potencial acci&oacute;n en c&eacute;lulas cardiacas, se&ntilde;ala la respuesta incorrecta:',
  38,
  '[{"id":"20824","text":"Los canales especializados de Ca2+ de la c&eacute;lula muscular cardiaca se denominan canales r&aacute;pidos o de tipo L"},{"id":"20822","text":"La liberaci&oacute;n de calcio inducida por calcio es exclusiva del m&uacute;sculo cardiaco"},{"id":"20823","text":"Los potenciales de acci&oacute;n duran menos en c&eacute;lulas auriculares que en ventriculares"},{"id":"20825","text":"En la fase plana de despolarizaci&oacute;n se abren canales de Ca2+ y permanecen cerrados canales de K+"}]',
  '20824',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x39-0000-4000-b000-000000009606',
  'c000156-0000-4000-b000-000000009566',
  '&iquest;Durante qu&eacute; fase del potencial de acci&oacute;n normal ventricular es m&aacute;s probable que los canales r&aacute;pidos de Na+ est&eacute;n inactivados, los canales lentos de Ca2+ est&eacute;n abiertos y la mayor&iacute;a de canales de K+ est&eacute;n cerrados?',
  39,
  '[{"id":"20828","text":"Fase 2 (meseta)"},{"id":"20826","text":"Fase 0 (despolarizaci&oacute;n r&aacute;pida)"},{"id":"20827","text":"Fase 1 (repolarizaci&oacute;n parcial)"},{"id":"20829","text":"Fase 3 (repolarizaci&oacute;n)"}]',
  '20828',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x40-0000-4000-b000-000000009607',
  'c000156-0000-4000-b000-000000009566',
  'En relaci&oacute;n al control del flujo sangu&iacute;neo:',
  40,
  '[{"id":"20831","text":"Los controles intr&iacute;nsecos predominan sobre el flujo sangu&iacute;neo de &oacute;rganos vitales"},{"id":"20830","text":"Los controles intr&iacute;nsecos act&uacute;an mediante regulaci&oacute;n nerviosa y hormonal para controlar la resistencia arteriolar"},{"id":"20832","text":"En los ri&ntilde;ones hay un predominio de controles intr&iacute;nsecos sobre extr&iacute;nsecos"},{"id":"20833","text":"Todas son correctas"}]',
  '20831',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x41-0000-4000-b000-000000009608',
  'c000156-0000-4000-b000-000000009566',
  '&iquest;Cu&aacute;l de las siguientes respuestas es correcta tanto para el m&uacute;sculo cardiaco como para el esquel&eacute;tico?',
  41,
  '[{"id":"20835","text":"El potencial de acci&oacute;n en la membrana celular del m&uacute;sculo es necesario para iniciar una contracci&oacute;n"},{"id":"20834","text":"El m&uacute;sculo forma un sincitio funcional"},{"id":"20836","text":"Las c&eacute;lulas marcapasos se despolarizan espont&aacute;neamente hasta un umbral e inician los potenciales de acci&oacute;n"},{"id":"20837","text":"Potenciales de acci&oacute;n frecuentes en una motoneurona pueden causar una contracci&oacute;n muscular sostenida"}]',
  '20835',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x42-0000-4000-b000-000000009609',
  'c000156-0000-4000-b000-000000009566',
  '&iquest;Cu&aacute;l de las siguientes afirmaciones es correcta?',
  42,
  '[{"id":"20841","text":"Las arteriolas tienen mayor resistencia al flujo sangu&iacute;neo que los capilares"},{"id":"20838","text":"La aorta y las grandes arterias son m&aacute;s distensibles que las venas"},{"id":"20839","text":"La aorta y las grandes arterias tienen mayor resistencia al flujo sangu&iacute;neo que los capilares"},{"id":"20840","text":"Las venas tienen mayor resistencia al flujo sangu&iacute;neo que los capilares"}]',
  '20841',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x43-0000-4000-b000-000000009610',
  'c000156-0000-4000-b000-000000009566',
  '&iquest;Cu&aacute;l de las siguientes situaciones puede hacer que la presi&oacute;n a&oacute;rtica media aumente?',
  43,
  '[{"id":"20845","text":"La RPT aumenta"},{"id":"20842","text":"El volumen sist&oacute;lico aumenta y la frecuencia card&iacute;aca disminuye"},{"id":"20843","text":"La capacitancia arterial disminuye"},{"id":"20844","text":"La frecuencia card&iacute;aca desciende"}]',
  '20845',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x44-0000-4000-b000-000000009611',
  'c000156-0000-4000-b000-000000009566',
  '&iquest;Cu&aacute;l de los siguientes supuestos causar&iacute;a la mayor disminuci&oacute;n en el flujo sangu&iacute;neo coronario?',
  44,
  '[{"id":"20847","text":"Las arterias coronarias desarrollan arteriosclerosis y placas de l&iacute;pidos que taponan la mitad de su &aacute;rea de secci&oacute;n normal"},{"id":"20846","text":"Las arterias se contraen a la mitad de su di&aacute;metro"},{"id":"20848","text":"La presi&oacute;n a&oacute;rtica media desciende hasta la mita de su valor normal"},{"id":"20849","text":"La resistencia al flujo coronario se dobla"}]',
  '20847',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x45-0000-4000-b000-000000009612',
  'c000156-0000-4000-b000-000000009566',
  'La despolarizaci&oacute;n del m&uacute;sculo esquel&eacute;tico es causada por una:',
  45,
  '[{"id":"20852","text":"Entrada de Na+"},{"id":"20850","text":"Entrada de Ca2+"},{"id":"20851","text":"Entrada de K+"},{"id":"20853","text":"Salida de Na+"}]',
  '20852',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x46-0000-4000-b000-000000009613',
  'c000156-0000-4000-b000-000000009566',
  'La fatiga muscular, p&eacute;rdida de la capacidad para contraerse, puede ser resultado de:',
  46,
  '[{"id":"20856","text":"Un d&eacute;ficit de sodio en el tejido despu&eacute;s de una actividad prolongada"},{"id":"20854","text":"Una acumulaci&oacute;n de potasio en el tejido despu&eacute;s de una actividad prolongada"},{"id":"20855","text":"Un d&eacute;ficit de ox&iacute;geno en los tejidos despu&eacute;s de una actividad prolongada"},{"id":"20857","text":"La acumulaci&oacute;n de ATP en el tejido despu&eacute;s de una actividad prolongada"}]',
  '20856',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x47-0000-4000-b000-000000009614',
  'c000156-0000-4000-b000-000000009566',
  'Se&ntilde;ala la afirmaci&oacute;n correcta:',
  47,
  '[{"id":"20860","text":"El voltaje al que se obtiene la primera respuesta contr&aacute;ctil perceptibles se denomina est&iacute;mulo umbral"},{"id":"20858","text":"La onda de hiperpolarizaci&oacute;n sigue a la onda de despolarizaci&oacute;n a trav&eacute;s de la membrana"},{"id":"20859","text":"La resistencia a trav&eacute;s de la membrana plasm&aacute;tica es el resultado de diferencias en la permeabilidad a los iones"},{"id":"20861","text":"Todas son correctas"}]',
  '20860',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x48-0000-4000-b000-000000009615',
  'c000156-0000-4000-b000-000000009566',
  'En relaci&oacute;n a las c&eacute;lulas del n&oacute;dulo sinusal:',
  48,
  '[{"id":"20865","text":"En la despolarizaci&oacute;n participan canales de Ca2+ de tipo T y tipo L"},{"id":"20862","text":"Su potencial de membrana en reposo es igual al del resto de c&eacute;lulas cardiacas"},{"id":"20863","text":"Durante la despolarizaci&oacute;n tiene lugar la apertura de canales If"},{"id":"20864","text":"El Na+ es el ion fundamental de la despolarizaci&oacute;n"}]',
  '20865',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x49-0000-4000-b000-000000009616',
  'c000156-0000-4000-b000-000000009566',
  'Indica cu&aacute;l de los siguientes sistemas se encargan del control de la homeostasis:',
  49,
  '[{"id":"20867","text":"Sistema nervioso y endocrino"},{"id":"20866","text":"Sistema respiratorio y endocrino"},{"id":"20868","text":"Sistema respiratorio y nervioso"},{"id":"20869","text":"Sistema nervioso y digestivo"}]',
  '20867',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x50-0000-4000-b000-000000009617',
  'c000156-0000-4000-b000-000000009566',
  '&iquest;C&oacute;mo aumenta la presi&oacute;n arterial la angiotensina II?',
  50,
  '[{"id":"20872","text":"Estimula la s&iacute;ntesis de noradrenalina"},{"id":"20870","text":"Disminuye la s&iacute;ntesis de aldosterona"},{"id":"20871","text":"Aumenta la s&iacute;ntesis de bradiquinina"},{"id":"20873","text":"Estimula la musculatura lisa para generar vasodilataci&oacute;n"}]',
  '20872',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x51-0000-4000-b000-000000009618',
  'c000156-0000-4000-b000-000000009566',
  'Indica la respuesta correcta en relaci&oacute;n al control metab&oacute;lico del flujo sangu&iacute;neo:',
  51,
  '[{"id":"20874","text":"En general, un aumento del &aacute;cido l&aacute;ctico producir&aacute; una vasodilataci&oacute;n"},{"id":"20875","text":"En los pulmones un aumento en el nivel de adenosina producir&aacute; una vasoconstricci&oacute;n"},{"id":"20876","text":"En general, un aumento en el nivel de O2 producir&aacute; una vasodilataci&oacute;n"},{"id":"20877","text":"En los pulmones un aumento en el nivel de O2 producir&aacute; una vasoconstricci&oacute;n"}]',
  '20874',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x52-0000-4000-b000-000000009619',
  'c000156-0000-4000-b000-000000009566',
  'Indica la respuesta correcta sobre el sistema cardiovascular:',
  52,
  '[{"id":"20878","text":"A medida que avanzan por el &aacute;rbol vascular, las arterias pierden elasticidad"},{"id":"20879","text":"El sistema venoso distribuye la sangre desde los capilares hasta el coraz&oacute;n de forma centr&iacute;fuga"},{"id":"20880","text":"En las anastomosis arteriovenosas tendr&aacute; lugar el intercambio de sustancias"},{"id":"20881","text":"La circulaci&oacute;n porta-renal sigue una estructura vena - capilares - vena"}]',
  '20878',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x53-0000-4000-b000-000000009620',
  'c000156-0000-4000-b000-000000009566',
  'En relaci&oacute;n a la presi&oacute;n sangu&iacute;nea, se&ntilde;ala la afirmaci&oacute;n correcta:',
  53,
  '[{"id":"20882","text":"Las venas cavas se consideran un reservorio de volumen ya que su presi&oacute;n sangu&iacute;nea es pr&aacute;cticamente nula"},{"id":"20883","text":"La sangre llega a la aur&iacute;cula derecha con 16 mmHg de presi&oacute;n y es impulsada por el ventr&iacute;culo derecho hacia las arterias pulmonares con una presi&oacute;n media de 100 mmHg"},{"id":"20884","text":"El ventr&iacute;culo derecho ejerce mucha m&aacute;s fuerza que el izquierdo ya que bombea sangre a la circulaci&oacute;n sist&eacute;mica en lugar de a la pulmonar"},{"id":"20885","text":"La presi&oacute;n en di&aacute;stole alcanza valores mayores que la presi&oacute;n en s&iacute;stole"}]',
  '20882',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd156x54-0000-4000-b000-000000009621',
  'c000156-0000-4000-b000-000000009566',
  'Ante una vasodilataci&oacute;n de las arteriolas de la arteria hep&aacute;tica, que irriga el h&iacute;gado, podemos afirmar que:',
  54,
  '[{"id":"20889","text":"El m&uacute;sculo liso de las arteriolas se relaja. Al incrementar su di&aacute;metro disminuir&aacute; la resistencia al flujo y se aumenta el riego del h&iacute;gado"},{"id":"20886","text":"El m&uacute;sculo liso de las arteriolas se relaja. Al incrementar su di&aacute;metro aumentar&aacute; la resistencia al flujo y se disminuye el riego del h&iacute;gado"},{"id":"20887","text":"El m&uacute;sculo liso de las arteriolas se contrae. Al disminuir su di&aacute;metro aumentar&aacute; la resistencia al flujo y se disminuye el riego del h&iacute;gado"},{"id":"20888","text":"El m&uacute;sculo liso de las arteriolas se contrae. Al incrementar su di&aacute;metro aumentar&aacute; la resistencia al flujo y se disminuye el riego del h&iacute;gado"}]',
  '20889',
  '2026-04-27 17:01:04'
);

-- Quiz: "TEST 1- SISTEMA NERVIOSO Y MUSCULAR" → Course: "Fisiología Vet 1ºC" (140 questions) [renamed to add "(2)"]
INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'c000159-0000-4000-b000-000000009622',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 1- SISTEMA NERVIOSO Y MUSCULAR (2)',
  NULL,
  'quiz',
  100,
  '2026-04-27 17:01:04',
  '2026-04-27 17:01:04'
FROM Class c
WHERE c.name = 'Fisiología Vet 1ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 1- SISTEMA NERVIOSO Y MUSCULAR (2)' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x0-0000-4000-b000-000000009623',
  'c000159-0000-4000-b000-000000009622',
  'La llegada de un impulso nervioso al terminal presin&aacute;ptico implica su despolarizaci&oacute;n &iquest;cu&aacute;l es su primer efecto para la liberaci&oacute;n del neurotransmisor?',
  0,
  '[{"id":"19994","text":"La apertura de los canales de voltaje de calcio que provocan su entrada masiva el interior de la c&eacute;lula"},{"id":"19991","text":"La alteraci&oacute;n de las prote&iacute;nas de las ves&iacute;culas sin&aacute;pticas que provocan su ataque y exocitosis"},{"id":"19992","text":"La activaci&oacute;n de la calmodulina y la fosforilaci&oacute;n de las prote&iacute;nas de las ves&iacute;culas presin&aacute;pticas"},{"id":"19993","text":"La apertura de los canales de fuga de potasio que permiten una r&aacute;pida repolarizaci&oacute;n para activar los canales de calcio"}]',
  '19994',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x1-0000-4000-b000-000000009624',
  'c000159-0000-4000-b000-000000009622',
  'Identifica la respuesta correcta. Los receptores muscar&iacute;nicos:',
  1,
  '[{"id":"19996","text":"Se activan tanto en las fibras adren&eacute;rgicas como colin&eacute;rgicas"},{"id":"19995","text":"Solo est&aacute;n presentes en las fibras colin&eacute;rgicas"},{"id":"19997","text":"Tiene s&oacute;lo capacidad de respuesta excitatoria"},{"id":"19998","text":"Puede generar potenciales postsin pticos excitatorios o inhibitorios dependiendo del neurotransmisor que los active"}]',
  '19996',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x2-0000-4000-b000-000000009625',
  'c000159-0000-4000-b000-000000009622',
  'El sistema nervioso aut&oacute;nomo:',
  2,
  '[{"id":"20002","text":"Todas las fibras preganglionares son colin&eacute;rgicas con receptores nicot&iacute;nicos"},{"id":"19999","text":"Las fibras preganglionares del parasimp&aacute;tico son colin&eacute;rgicas y las del simp&aacute;tico adren&eacute;rgicas"},{"id":"20000","text":"Las fibras postganglionares del parasimp&aacute;tico son colin&eacute;rgicas salvo las de las gl&aacute;ndulas sudor&iacute;paras que son adren&eacute;rgicas"},{"id":"20001","text":"Las fibras postganglionares del simp&aacute;tico son todas adren&eacute;rgicas"}]',
  '20002',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x3-0000-4000-b000-000000009626',
  'c000159-0000-4000-b000-000000009622',
  '&iquest;Cu&aacute;l de estas respuestas no se corresponde con la activaci&oacute;n del sistema parasimp&aacute;tico?',
  3,
  '[{"id":"20004","text":"Est&iacute;mulo de la secreci&oacute;n de las gl&aacute;ndulas sudor&iacute;paras"},{"id":"20003","text":"Disminuci&oacute;n de la frecuencia cardiaca"},{"id":"20005","text":"Est&iacute;mulo de la secreci&oacute;n de las gl&aacute;ndulas salivares"},{"id":"20006","text":"Est&iacute;mulo de la motilidad intestinal"}]',
  '20004',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x4-0000-4000-b000-000000009627',
  'c000159-0000-4000-b000-000000009622',
  'La sinapsis neuromuscular o placa motora es una sinapsis con:',
  4,
  '[{"id":"20010","text":"Un solo neurotransmisor (acetilcolina) y un solo receptor nicot&iacute;nico"},{"id":"20007","text":"Un solo neurotransmisor (acetilcolina) y sus dos receptores nicot&iacute;nicos y muscar&iacute;nicos"},{"id":"20008","text":"Un solo neurotransmisor (noradrenalina) con un solo receptor nicot&iacute;nico"},{"id":"20009","text":"La acetilcolina como &uacute;nico neurotransmisor de la fibra preganglionar y postganglionar"}]',
  '20010',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x5-0000-4000-b000-000000009628',
  'c000159-0000-4000-b000-000000009622',
  '&iquest;Los axones de que neuronas formar el componente som&aacute;tico del sistema nervioso perif&eacute;rico?',
  5,
  '[{"id":"20013","text":"Neuronas motoras inferiores"},{"id":"20011","text":"Neuronas motoras superiores"},{"id":"20012","text":"Neuronas del sistema nervioso central"},{"id":"20014","text":"Neuronas simp&aacute;ticas y parasimp&aacute;ticas"}]',
  '20013',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x6-0000-4000-b000-000000009629',
  'c000159-0000-4000-b000-000000009622',
  'Indica la respuesta correcta respecto o a los husos musculares:',
  6,
  '[{"id":"20015","text":"Son propioceptores de estiramiento"},{"id":"20016","text":"Carecen de inervaci&oacute;n motora"},{"id":"20017","text":"Sus terminaciones nerviosas sensitivas sinaptan en medula espinal con neuronas motoras superiores"},{"id":"20018","text":"A y c son correctas"}]',
  '20015',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x7-0000-4000-b000-000000009630',
  'c000159-0000-4000-b000-000000009622',
  'El l&iacute;quido cefalorraqu&iacute;deo:',
  7,
  '[{"id":"20020","text":"Circula por los ventr&iacute;culos cerebrales y el espacio subaracnoides (entre aracnoides y piamadre)"},{"id":"20019","text":"Tiene funciones relacionadas con la protecci&oacute;n impidiendo la entrada de sustancias nocivas en las neuronas de la corteza cerebral"},{"id":"20021","text":"Tienen una concentraci&oacute;n de prote&iacute;nas muy inferior a la del plasma sangu&iacute;neo para sus funciones de amortiguaci&oacute;n"}]',
  '20020',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x8-0000-4000-b000-000000009631',
  'c000159-0000-4000-b000-000000009622',
  'La despolarizaci&oacute;n en una neurona consiste en:',
  8,
  '[{"id":"20024","text":"La entrada de cargas positivas al interior de la c&eacute;lula por apertura de sus canales de difusi&oacute;n de sodio"},{"id":"20022","text":"La generaci&oacute;n de la carga negativa el interior de la c&eacute;lula gracias a la acci&oacute;n de la bomba de sodio potasio"},{"id":"20023","text":"El incremento de la carga negativa de la c&eacute;lula por debajo del potencial de membrana en reposo"},{"id":"20025","text":"La recuperaci&oacute;n del potencial de membrana negativo por la salida de potasio a trav&eacute;s de los canales de fuga"}]',
  '20024',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x9-0000-4000-b000-000000009632',
  'c000159-0000-4000-b000-000000009622',
  'Las neuronas, generan el potencial de membrana en reposo mediante:',
  9,
  '[{"id":"20029","text":"La bomba de sodio potasio, ATP-asa, que cada vez que act&uacute;a salen de la c&eacute;lula 3 iones sodio y entran 2 iones potasio"},{"id":"20026","text":"La bomba de sodio potasio, el transporte activo, que cada vez que act&uacute;an salen de la c&eacute;lula dos iones sodio y entran iones potasio"},{"id":"20027","text":"Mediante la repolarizaci&oacute;n, por la salida r&aacute;pida de gran cantidad de iones potasio a trav&eacute;s de los canales de fuga"},{"id":"20028","text":"Mediante la despolarizaci&oacute;n por la apertura de los canales de difusi&oacute;n r&aacute;pida de sodio al interior de la c&eacute;lula"}]',
  '20029',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x10-0000-4000-b000-000000009633',
  'c000159-0000-4000-b000-000000009622',
  'Identifica la respuesta correcta',
  10,
  '[{"id":"20030","text":"Los receptores muscar&iacute;nicos act&uacute;an a trav&eacute;s de las prote&iacute;nas G (se&ntilde;alizadores intracelulares) y pueden generar potenciales postsin pticos inhibitorios o excitatorios"},{"id":"20031","text":"Los receptores nicot&iacute;nicos act&uacute;an a trav&eacute;s de prote&iacute;nas G (se&ntilde;alizadores intracelulares) y pueden generar potenciales postsin pticos inhibitorios o excitatorios"},{"id":"20032","text":"Los receptores muscar&iacute;nicos son prote&iacute;nas de canal i&oacute;nico y su respuesta la acetilcolina es siempre un potencial postsin ptico excitatorios (PPSE)"},{"id":"20033","text":"Los receptores nicot&iacute;nicos son prote&iacute;nas de canal i&oacute;nico para entrada de sodio y salida del potasio y pueden generar potenciales postsin pticos excitatorios o inhibitorios"}]',
  '20030',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x11-0000-4000-b000-000000009634',
  'c000159-0000-4000-b000-000000009622',
  'Identifica la respuesta correcta. Los neurotransmisores act&uacute;an sobre los receptores de las c&eacute;lulas postsin pticas provocando:',
  11,
  '[{"id":"20034","text":"Una respuesta inhibitoria si en la c&eacute;lula se produce una hiperpolarizaci&oacute;n"},{"id":"20035","text":"Una respuesta inhibitoria si en la c&eacute;lula se producen una despolarizaci&oacute;n"},{"id":"20036","text":"Una respuesta excitatoria s&iacute; en la c&eacute;lula se produce una repolarizaci&oacute;n"},{"id":"20037","text":"Una respuesta excitatoria s&iacute; en la c&eacute;lula se produce una hiperpolarizaci&oacute;n"}]',
  '20034',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x12-0000-4000-b000-000000009635',
  'c000159-0000-4000-b000-000000009622',
  'En el sistema nervioso aut&oacute;nomo:',
  12,
  '[{"id":"20039","text":"Todas las fibras preganglionares son colin&eacute;rgicas con receptores nicot&iacute;nicos"},{"id":"20038","text":"Las fibras preganglionares del parasimp&aacute;tico son colin&eacute;rgicas y la del simp&aacute;tico adren&eacute;rgicas"},{"id":"20040","text":"Las fibras postganglionares del parasimp&aacute;tico son colin&eacute;rgicas salvo las de las gl&aacute;ndulas sudor&iacute;paras que son adren&eacute;rgicas"},{"id":"20041","text":"Las fibras postganglionares del simp&aacute;tico son todas adren&eacute;rgicas"}]',
  '20039',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x13-0000-4000-b000-000000009636',
  'c000159-0000-4000-b000-000000009622',
  'Respecto al sistema nervioso aut&oacute;nomo identifica la respuesta correcta:',
  13,
  '[{"id":"20042","text":"Los receptores a1 y a2 de las fibras adren&eacute;rgicas son siempre excitatorios"},{"id":"20043","text":"Los receptores muscar&iacute;nicos est&aacute;n presentes en todas las fibras del simp&aacute;tico tanto pre como postganglionares"},{"id":"20044","text":"Los receptores colin&eacute;rgicos act&uacute;an a trav&eacute;s de prote&iacute;nas G y siempre generan respuestas excitatoria"},{"id":"20045","text":"Todos los receptores de las fibras postganglionares del parasimp&aacute;tico son muscar&iacute;nicos"}]',
  '20042',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x14-0000-4000-b000-000000009637',
  'c000159-0000-4000-b000-000000009622',
  'Respecto de las caracter&iacute;sticas funcionales comunes en la contracci&oacute;n de las fibras musculares cardiacas y las de la musculatura lisa, identifica la respuesta correcta:',
  14,
  '[{"id":"20048","text":"Ambas se pueden contraer como un todo gracias a las conexiones entre c&eacute;lulas que les permite actuar como una unidad"},{"id":"20046","text":"Ambas carecen de troponina como prote&iacute;na de captaci&oacute;n de calcio"},{"id":"20047","text":"Ambas se pueden contraer, en todo ya que carecen de tropomiosina con prote&iacute;na de la contracci&oacute;n muscular"},{"id":"20049","text":"Ambas utilizan el ret&iacute;culo sarcoplasm&aacute;tico como fuente de calcio para la activaci&oacute;n de la contracci&oacute;n"}]',
  '20048',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x15-0000-4000-b000-000000009638',
  'c000159-0000-4000-b000-000000009622',
  'Los axones de que neuronas formar el componente som&aacute;tico del sistema nervioso perif&eacute;rico?',
  15,
  '[{"id":"20052","text":"Neuronas motoras inferiores"},{"id":"20050","text":"Neuronas motoras superiores"},{"id":"20051","text":"Neuronas del sistema nervioso central"},{"id":"20053","text":"Neurona simp&aacute;ticas y parasimp&aacute;ticas"}]',
  '20052',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x16-0000-4000-b000-000000009639',
  'c000159-0000-4000-b000-000000009622',
  'En qu&eacute; consiste un impulso nervioso?',
  16,
  '[{"id":"20056","text":"En la propagaci&oacute;n de una despolarizaci&oacute;n que se transmite a lo largo de un ax&oacute;n"},{"id":"20054","text":"En la alteraci&oacute;n del potencial de membrana a una excitaci&oacute;n"},{"id":"20055","text":"En la generaci&oacute;n de un potencial de acci&oacute;n debido a cualquier excitaci&oacute;n, aunque no supere el umbral de excitaci&oacute;n"},{"id":"20057","text":"En la transmisi&oacute;n de una repolarizaci&oacute;n una vez que ha pasado el potencial de acci&oacute;n"}]',
  '20056',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x17-0000-4000-b000-000000009640',
  'c000159-0000-4000-b000-000000009622',
  'El potencial de acci&oacute;n, la repolarizaci&oacute;n implica:',
  17,
  '[{"id":"20058","text":"Apertura de los canales de fuga de potasio y vuelta al estado negativo del potencial de membrana en reposo"},{"id":"20059","text":"Apertura de los canales de sodio y cambio de polaridad que acab&oacute; con el estado de reposo"},{"id":"20060","text":"Apertura de los canales de fuga de potasio y pas&oacute; del estado nativo en reposo a la carga positiva"},{"id":"20061","text":"Apertura de los canales de sodio por una excitaci&oacute;n y comienzo del potencial de acci&oacute;n"}]',
  '20058',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x18-0000-4000-b000-000000009641',
  'c000159-0000-4000-b000-000000009622',
  'En la generaci&oacute;n del potencial de membrana en reposo, intervienen:',
  18,
  '[{"id":"20062","text":"La bomba de sodio y potasio, sacando tres cationes sodio e introduciendo dos cationes potasio"},{"id":"20063","text":"La mayor permeabilidad a la membrana a la entrada de potasio"},{"id":"20064","text":"La mayor permeabilidad a la membrana a la entrada de sodio."}]',
  '20062',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x19-0000-4000-b000-000000009642',
  'c000159-0000-4000-b000-000000009622',
  'En el potencial de acci&oacute;n, &iquest;en qu&eacute; fase y c&oacute;mo recuperan las neuronas su carga el&eacute;ctrica negativo?',
  19,
  '[{"id":"20066","text":"En la fase de repolarizaci&oacute;n mediante la apertura de canales de fuga de potasio"},{"id":"20065","text":"En la fase de repolarizaci&oacute;n mediante la acci&oacute;n de la bomba de sodio potasio"},{"id":"20067","text":"En la fase de hiperpolarizaci&oacute;n mediante la apertura de canales de fuga de potasio"}]',
  '20066',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x20-0000-4000-b000-000000009643',
  'c000159-0000-4000-b000-000000009622',
  'Los neurotransmisores son sustancias qu&iacute;micas que:',
  20,
  '[{"id":"20070","text":"Estimula la formaci&oacute;n de potenciales de acci&oacute;n en las c&eacute;lulas postsin pticas"},{"id":"20068","text":"Estimulan la repolarizaci&oacute;n de las c&eacute;lulas postsin pticas"},{"id":"20069","text":"Estimula la formaci&oacute;n de receptores en las c&eacute;lulas postsin pticas"}]',
  '20070',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x21-0000-4000-b000-000000009644',
  'c000159-0000-4000-b000-000000009622',
  'Un potencial postsin ptico inhibitorio (PPSI) se corresponde con:',
  21,
  '[{"id":"20072","text":"Una hiperpolarizaci&oacute;n de las c&eacute;lulas postsin pticas por activaci&oacute;n de unos receptores muscar&iacute;nicos"},{"id":"20071","text":"Una despolarizaci&oacute;n de las c&eacute;lulas postsin pticas por activaci&oacute;n de los receptores nicot&iacute;nicos"},{"id":"20073","text":"Una hiperpolarizaci&oacute;n de las c&eacute;lulas postsin pticas por activaci&oacute;n de unos receptores nicot&iacute;nicos"}]',
  '20072',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x22-0000-4000-b000-000000009645',
  'c000159-0000-4000-b000-000000009622',
  'Identifica la respuesta correcta. Los receptores muscar&iacute;nicos:',
  22,
  '[{"id":"20074","text":"Se activan tanto en las fibras adren&eacute;rgicas como colin&eacute;rgicas"},{"id":"20075","text":"Tiene s&oacute;lo capacidad de respuesta excitatoria"},{"id":"20076","text":"Puede generar potenciales postsin pticos excitatorios o inhibitorias dependiendo del neurotransmisor que lo active"},{"id":"20077","text":"Solo est&aacute;n presentes en las fibras colin&eacute;rgicas"}]',
  '20074',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x23-0000-4000-b000-000000009646',
  'c000159-0000-4000-b000-000000009622',
  'Se&ntilde;ale los tres efectos que corresponden a la activaci&oacute;n del sistema simp&aacute;tico',
  23,
  '[{"id":"20078","text":"Broncodilataci&oacute;n, sudoraci&oacute;n e hiperglucemia"},{"id":"20079","text":"Sudoraci&oacute;n, broncoconstricci&oacute;n de hipoglucemia"},{"id":"20080","text":"Broncoconstricci&oacute;n, sudoraci&oacute;n y vasodilataci&oacute;n de los capilares sangu&iacute;neos del m&uacute;sculo esquel&eacute;tico"}]',
  '20078',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x24-0000-4000-b000-000000009647',
  'c000159-0000-4000-b000-000000009622',
  'Se&ntilde;ale la respuesta correcta:',
  24,
  '[{"id":"20082","text":"La m&eacute;dula adrenal funciona como un ganglio simp&aacute;tico modificado y libera adrenalina"},{"id":"20081","text":"Una fibra preganglionar del sistema parasimp&aacute;tico conecta con la m&eacute;dula adrenal y libera adrenalina"},{"id":"20083","text":"La conexi&oacute;n de la m&eacute;dula adrenal mediante una fibra postganglionar simp&aacute;tica incrementada la actividad de su neurotransmisor (noradrenalina)"}]',
  '20082',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x25-0000-4000-b000-000000009648',
  'c000159-0000-4000-b000-000000009622',
  'En la sinapsis la liberaci&oacute;n del neurotransmisor se alcanza:',
  25,
  '[{"id":"20085","text":"Una vez que activa el complejo calmodulina-prote&iacute;n quinasa el cual altera la membrana de las ves&iacute;culas sin&aacute;pticas y permite su actuaci&oacute;n"},{"id":"20084","text":"Una vez que el calcio se acopla las ves&iacute;culas sin&aacute;pticas y permite la exocitosis"},{"id":"20086","text":"Una vez que el calcio activa la calmodulina siendo esta prote&iacute;na el componente principal de las membranas de las ves&iacute;culas sin&aacute;pticas"},{"id":"20087","text":"Una vez que en el terminal presin&aacute;pticos se activa los receptores (prote&iacute;nas integrales de la membrana plasm&aacute;tica)"}]',
  '20085',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x26-0000-4000-b000-000000009649',
  'c000159-0000-4000-b000-000000009622',
  '&iquest;Cu&aacute;l de estas caracter&iacute;sticas y mecanismos no se corresponden con la funci&oacute;n de los neurotransmisores?:',
  26,
  '[{"id":"20090","text":"Sustancias qu&iacute;micas que se liberan en las ves&iacute;culas sin&aacute;pticas gracias a la fijaci&oacute;n de calcio sobre la membrana de estas ves&iacute;culas"},{"id":"20088","text":"Sustancias qu&iacute;micas que estimula la formaci&oacute;n de potenciales de acci&oacute;n en las c&eacute;lulas postsin pticas"},{"id":"20089","text":"Sustancias qu&iacute;micas que son sintetizadas en las neuronas y por flujo axonal pasan a la terminal presin&aacute;ptica en forma de ves&iacute;culas"},{"id":"20091","text":"Sustancias qu&iacute;micas que se liberan debido al ataque y exocitosis de las ves&iacute;culas sin&aacute;pticas sobre la membrana de la terminal presin&aacute;ptica"}]',
  '20090',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x27-0000-4000-b000-000000009650',
  'c000159-0000-4000-b000-000000009622',
  'Se&ntilde;ale la respuesta correcta. Los mecanismos de detecci&oacute;n de la temperatura corporal residen en:',
  27,
  '[{"id":"20093","text":"El hipot&aacute;lamo y un incremento en el umbral termorreceptores produce la fiebre"},{"id":"20092","text":"El t&aacute;lamo y est&aacute; conectado con los termorreceptores de la piel"},{"id":"20094","text":"El hipot&aacute;lamo y la eliminaci&oacute;n de los pir&oacute;genos produce la fiebre"}]',
  '20093',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x28-0000-4000-b000-000000009651',
  'c000159-0000-4000-b000-000000009622',
  'En el potencial de acci&oacute;n, &iquest;en qu&eacute; fase y c&oacute;mo recuperan las neuronas su carga el&eacute;ctrica negativa?',
  28,
  '[{"id":"20096","text":"En la fase de repolarizaci&oacute;n mediante la apertura de canales de fuga de potasio"},{"id":"20095","text":"En la fase de repolarizaci&oacute;n mediante la acci&oacute;n de la bomba de sodio y potasio"},{"id":"20097","text":"En la fase de hiperpolarizaci&oacute;n mediante la apertura de canales de fuga de potasio"}]',
  '20096',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x29-0000-4000-b000-000000009652',
  'c000159-0000-4000-b000-000000009622',
  'Identifica cu&aacute;l es la aseveraci&oacute;n correcta:',
  29,
  '[{"id":"20098","text":"Los nervios son casi todos mixtos con axones sensitivos y motores, tanto en fibras amiel&iacute;nicas como miel&iacute;nicas"},{"id":"20099","text":"Los nervios son sensitivos o motores y se corresponde respectivamente con tipos de fibras miel&iacute;nicas y amiel&iacute;nicas"},{"id":"20100","text":"Los nervios son sensitivos o motores indistintamente pueden ser fibras miel&iacute;nica y amiel&iacute;nicas"}]',
  '20098',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x30-0000-4000-b000-000000009653',
  'c000159-0000-4000-b000-000000009622',
  'Los axones, adem&aacute;s de transmitir del impulso nervioso (potencial de acci&oacute;n), transportan:',
  30,
  '[{"id":"20102","text":"P&eacute;ptidos o prote&iacute;nas (flujo axonal)"},{"id":"20101","text":"Iones, normalmente a millones (flujo axonal)"},{"id":"20103","text":"Y son enzimas como veh&iacute;culo"}]',
  '20102',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x31-0000-4000-b000-000000009654',
  'c000159-0000-4000-b000-000000009622',
  'Los neurotransmisores son sustancias qu&iacute;micas que en:',
  31,
  '[{"id":"20106","text":"Estimula la formaci&oacute;n de potenciales de acci&oacute;n en las c&eacute;lulas postsin pticas"},{"id":"20104","text":"Estimulan la repolarizaci&oacute;n de las c&eacute;lulas postsin pticas"},{"id":"20105","text":"Estimula la formaci&oacute;n de receptores en las c&eacute;lulas postsin pticas"}]',
  '20106',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x32-0000-4000-b000-000000009655',
  'c000159-0000-4000-b000-000000009622',
  'Identifica la aseveraci&oacute;n correcta:',
  32,
  '[{"id":"20109","text":"Los receptores muscar&iacute;nicos inician la se&ntilde;alizaci&oacute;n intracelular mediante prote&iacute;nas G y pueden generar PPSE y PPSI"},{"id":"20107","text":"Los receptores nicot&iacute;nicos son prote&iacute;nas de canal que inicia la respuesta intracelular mediante la activaci&oacute;n de prote&iacute;nas G"},{"id":"20108","text":"Los receptores adren&eacute;rgicos s&oacute;lo pueden provocar potenciales postsin ptico excitatorios (PPSE)"}]',
  '20109',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x33-0000-4000-b000-000000009656',
  'c000159-0000-4000-b000-000000009622',
  'La acetilcolina es el neurotransmisor:',
  33,
  '[{"id":"20110","text":"De todas las fibras del sistema parasimp&aacute;tico"},{"id":"20111","text":"De todas las hebras de sistema motor som&aacute;tico y del sistema simp&aacute;tico"},{"id":"20112","text":"De las fibras postganglionares del simp&aacute;tico y preganglionares del simp&aacute;tico"}]',
  '20110',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x34-0000-4000-b000-000000009657',
  'c000159-0000-4000-b000-000000009622',
  'Se&ntilde;ala la respuesta correcta:',
  34,
  '[{"id":"20114","text":"La m&eacute;dula adrenal funciona como un ganglio simp&aacute;tico modificado y libera adrenalina"},{"id":"20113","text":"Una fibra preganglionar del sistema parasimp&aacute;tico conecta con la m&eacute;dula adrenal y libera adrenalina"},{"id":"20115","text":"El sistema simp&aacute;tico conecta con la m&eacute;dula adrenal para incrementar la actividad de su neurotransmisor (adrenalina)"}]',
  '20114',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x35-0000-4000-b000-000000009658',
  'c000159-0000-4000-b000-000000009622',
  'La respuesta a la activaci&oacute;n del sistema simp&aacute;tico de los capilares sangu&iacute;neos del m&uacute;sculo esquel&eacute;tico es la vasodilataci&oacute;n &iquest;Por qu&eacute;?:',
  35,
  '[{"id":"20116","text":"Sus fibras postganglionares son colin&eacute;rgicas"},{"id":"20117","text":"Sus fibras postganglionares son adren&eacute;rgicas"},{"id":"20118","text":"Son fibras preganglionares son colin&eacute;rgicas y las postganglionares adren&eacute;rgicas"}]',
  '20116',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x36-0000-4000-b000-000000009659',
  'c000159-0000-4000-b000-000000009622',
  'Identifica la respuesta correcta:',
  36,
  '[{"id":"20121","text":"Las v&iacute;as sensitivas son aferentes y las neuronas primarias pueden ser o no ser el receptor"},{"id":"20119","text":"Las v&iacute;as sensitivas son aferentes y la neurona primaria siempre es el receptor"},{"id":"20120","text":"Las v&iacute;as sensitivas son eferentes y la neurona primaria no siempre es el recepto"}]',
  '20121',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x37-0000-4000-b000-000000009660',
  'c000159-0000-4000-b000-000000009622',
  'La funci&oacute;n del cerebelo de la fisiolog&iacute;a del control de movimiento es:',
  37,
  '[{"id":"20122","text":"Compara la informaci&oacute;n sobre plan de movimiento, con el movimiento que realmente se est&aacute; realizando y ajusta"},{"id":"20123","text":"Ayuda a seleccionar el patr&oacute;n de movimiento adecuado, a la vez que se suprimen los patrones opuestos"},{"id":"20124","text":"Controlar los movimientos voluntarios, conscientes y dirigidos"}]',
  '20122',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x38-0000-4000-b000-000000009661',
  'c000159-0000-4000-b000-000000009622',
  'El control de la termorregulaci&oacute;n, los receptores de calor est&aacute;n principalmente localizados en:',
  38,
  '[{"id":"20127","text":"En el &aacute;rea pr&aacute;ctica del hipot&aacute;lamo"},{"id":"20125","text":"En la piel de la corteza cerebral"},{"id":"20126","text":"De los n&uacute;cleos basales del tercer ventr&iacute;culo"}]',
  '20127',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x39-0000-4000-b000-000000009662',
  'c000159-0000-4000-b000-000000009622',
  'Los quimiorreceptores centrales son sensibles a las variaciones de:',
  39,
  '[{"id":"20128","text":"La presi&oacute;n de di&oacute;xido de carbono en la sangre arterial."},{"id":"20129","text":"La presi&oacute;n de ox&iacute;geno en la sangre arterial."},{"id":"20130","text":"Las dos respuestas anteriores son correctas."}]',
  '20128',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x40-0000-4000-b000-000000009663',
  'c000159-0000-4000-b000-000000009622',
  'Identifica la respuesta correcta. Los nocirreceptores:',
  40,
  '[{"id":"20133","text":"Son receptores del dolor distribuidos por todo el organismo en diferentes tejidos y v&iacute;sceras."},{"id":"20131","text":"Son receptores cut&aacute;neos distribuidos por todo el organismo y responden a est&iacute;mulos como presi&oacute;n, temperatura o estiramiento."},{"id":"20132","text":"Son propioceptores de cada tejido como los receptores de...muscular del &oacute;rgano tendinoso de Golgi."},{"id":"20134","text":"Son propioceptores inespec&iacute;ficos de cada tejido u &oacute;rgano que pueden detectar dolor o cualquier otro tipo de est&iacute;mulo."}]',
  '20133',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x41-0000-4000-b000-000000009664',
  'c000159-0000-4000-b000-000000009622',
  '&iquest;Cu&aacute;l de las siguientes NO es una funci&oacute;n del sistema nervioso?',
  41,
  '[{"id":"20138","text":"Todas son funciones del sistema nervioso."},{"id":"20135","text":"Funci&oacute;n sensitiva"},{"id":"20136","text":"Funci&oacute;n integrativa"},{"id":"20137","text":"Funci&oacute;n motora"}]',
  '20138',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x42-0000-4000-b000-000000009665',
  'c000159-0000-4000-b000-000000009622',
  'La porci&oacute;n motora del sistema nervioso aut&oacute;nomo puede dividirse en:',
  42,
  '[{"id":"20142","text":"divisiones simp&aacute;tica y parasimp&aacute;tica."},{"id":"20139","text":"divisiones som&aacute;tica y simp&aacute;tica."},{"id":"20140","text":"divisiones som&aacute;tica y parasimp&aacute;tica."},{"id":"20141","text":"divisiones ent&eacute;rica y som&aacute;tica."},{"id":"20143","text":"divisiones voluntaria e involuntaria."}]',
  '20142',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x43-0000-4000-b000-000000009666',
  'c000159-0000-4000-b000-000000009622',
  '&iquest;Cu&aacute;l de los siguientes tipos de c&eacute;lulas presenta la propiedad de excitabilidad el&eacute;ctrica?',
  43,
  '[{"id":"20146","text":"a y b"},{"id":"20144","text":"C&eacute;lulas musculares"},{"id":"20145","text":"Neuronas"},{"id":"20147","text":"Ninguna de las opciones"}]',
  '20146',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x44-0000-4000-b000-000000009667',
  'c000159-0000-4000-b000-000000009622',
  'Con respecto a las neuronas, el t&eacute;rmino "fibra nerviosa" se refiere a',
  44,
  '[{"id":"20151","text":"axones y dendritas."},{"id":"20148","text":"un ax&oacute;n."},{"id":"20149","text":"una dendrita."},{"id":"20150","text":"un cuerpo de Nissl."},{"id":"20152","text":"Todas las opciones"}]',
  '20151',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x45-0000-4000-b000-000000009668',
  'c000159-0000-4000-b000-000000009622',
  'Las c&eacute;lulas de Schwann comienzan a formar vainas de mielina alrededor de los axones en el sistema nervioso perif&eacute;rico:',
  45,
  '[{"id":"20154","text":"durante el desarrollo fetal."},{"id":"20153","text":"cuando las neuronas se lesionan."},{"id":"20155","text":"despu&eacute;s del nacimiento."},{"id":"20156","text":"solo en respuesta a la estimulaci&oacute;n nerviosa generada por c&eacute;lulas neurogliales."},{"id":"20157","text":"durante las etapas iniciales de la enfermedad de Alzheimer."}]',
  '20154',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x46-0000-4000-b000-000000009669',
  'c000159-0000-4000-b000-000000009622',
  'Se considera que la Na+/K+-ATPasa es una bomba electrog&eacute;nica porque:',
  46,
  '[{"id":"20158","text":"contribuye a la negatividad del potencial de membrana de reposo."},{"id":"20159","text":"los iones de sodio tienen carga negativa."},{"id":"20160","text":"presenta permeabilidad baja."},{"id":"20161","text":"ambos contribuyen a la negatividad del potencial de membrana de reposo y los iones de sodio tienen carga negativa."},{"id":"20162","text":"Todas las opciones"}]',
  '20158',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x47-0000-4000-b000-000000009670',
  'c000159-0000-4000-b000-000000009622',
  'Durante el estado de reposo de un canal de Na+ dependiente de voltaje, 1. la compuerta de inactivaci&oacute;n se abre. 2. la compuerta de activaci&oacute;n se cierra. 3. el canal es permeable al Na+.',
  47,
  '[{"id":"20166","text":"1 y 2 son v&aacute;lidos."},{"id":"20163","text":"1 solo"},{"id":"20164","text":"2 solo"},{"id":"20165","text":"3 solo"},{"id":"20167","text":"Todas las opciones son v&aacute;lidas."}]',
  '20166',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x48-0000-4000-b000-000000009671',
  'c000159-0000-4000-b000-000000009622',
  'Cuando un potencial graduado despolarizante hace despolarizar la membrana del ax&oacute;n al llegar al umbral,',
  48,
  '[{"id":"20171","text":"los canales de Na+ dependientes de voltaje se abren r&aacute;pidamente."},{"id":"20168","text":"los canales de Ca+2 dependientes de ligando se cierran r&aacute;pidamente."},{"id":"20169","text":"los canales de Ca+2 dependientes de voltaje se abren r&aacute;pidamente."},{"id":"20170","text":"los canales de Na+ dependientes del ligando se cierran r&aacute;pidamente."},{"id":"20172","text":"Ninguna de las opciones."}]',
  '20171',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x49-0000-4000-b000-000000009672',
  'c000159-0000-4000-b000-000000009622',
  'El potencial de membrana de reposo en las neuronas oscila de:',
  49,
  '[{"id":"20175","text":"-40 a -90 mV"},{"id":"20173","text":"+5 a 100 mV"},{"id":"20174","text":"-25 a -70 mV"},{"id":"20176","text":"-90 a 5 mV"},{"id":"20177","text":"Ninguna de las opciones"}]',
  '20175',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x50-0000-4000-b000-000000009673',
  'c000159-0000-4000-b000-000000009622',
  'Durante este per&iacute;odo, un segundo potencial de acci&oacute;n solo puede ser iniciado por un est&iacute;mulo superior al normal.',
  50,
  '[{"id":"20180","text":"Per&iacute;odo refractario relativo"},{"id":"20178","text":"Per&iacute;odo latente"},{"id":"20179","text":"Per&iacute;odo refractario absoluto"},{"id":"20181","text":"Todas las opciones"},{"id":"20182","text":"Ninguna de las opciones"}]',
  '20180',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x51-0000-4000-b000-000000009674',
  'c000159-0000-4000-b000-000000009622',
  'La comunicaci&oacute;n y la sincronizaci&oacute;n m&aacute;s r&aacute;pidas son las dos ventajas de:',
  51,
  '[{"id":"20184","text":"las sinapsis el&eacute;ctricas"},{"id":"20183","text":"las sinapsis qu&iacute;micas"},{"id":"20185","text":"los canales dependientes de ligandos"},{"id":"20186","text":"los canales dependientes del voltaje"},{"id":"20187","text":"los canales accionados mec&aacute;nicamente"}]',
  '20184',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x52-0000-4000-b000-000000009675',
  'c000159-0000-4000-b000-000000009622',
  'Un neurotransmisor excitatorio _________la membrana postsin&aacute;ptica.',
  52,
  '[{"id":"20188","text":"despolariza"},{"id":"20189","text":"repolariza"},{"id":"20190","text":"hiperpolariza"},{"id":"20191","text":"no afecta la polaridad de"},{"id":"20192","text":"pasa a trav&eacute;s de canales en"}]',
  '20188',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x53-0000-4000-b000-000000009676',
  'c000159-0000-4000-b000-000000009622',
  'PPSI significa:',
  53,
  '[{"id":"20195","text":"potencial postsin&aacute;ptico inhibitorio"},{"id":"20193","text":"potencial de sumaci&oacute;n presin&aacute;ptico inhibitorio"},{"id":"20194","text":"potencial de sumaci&oacute;n postsin&aacute;ptico inhibitorio"},{"id":"20196","text":"potencial presin&aacute;ptico inhibitorio."},{"id":"20197","text":"Ninguna de las opciones"}]',
  '20195',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x54-0000-4000-b000-000000009677',
  'c000159-0000-4000-b000-000000009622',
  'La difusi&oacute;n, la degradaci&oacute;n enzim&aacute;tica y la captaci&oacute;n hecha por las c&eacute;lulas son todos mecanismos para:',
  54,
  '[{"id":"20198","text":"eliminar un neurotransmisor"},{"id":"20199","text":"detener una sumaci&oacute;n espacial"},{"id":"20200","text":"continuar una sumaci&oacute;n temporal"},{"id":"20201","text":"inhibir un potencial presin&aacute;ptico"},{"id":"20202","text":"excitar un potencial presin&aacute;ptico"}]',
  '20198',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x55-0000-4000-b000-000000009678',
  'c000159-0000-4000-b000-000000009622',
  'Cuando la suma total de los potenciales postsin&aacute;pticos se elevan sobre el umbral, se crean potenciales de acci&oacute;n:',
  55,
  '[{"id":"20205","text":"en la zona gatillo."},{"id":"20203","text":"en la hendidura sin&aacute;ptica."},{"id":"20204","text":"en las dendritas."},{"id":"20206","text":"en el n&uacute;cleo de la neurona."},{"id":"20207","text":"en el neuroplasma."}]',
  '20205',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x56-0000-4000-b000-000000009679',
  'c000159-0000-4000-b000-000000009622',
  '&iquest;Cu&aacute;l de las siguientes NO se considera un neurotransmisor de mol&eacute;culas peque&ntilde;as?',
  56,
  '[{"id":"20211","text":"Endorfinas"},{"id":"20208","text":"Acetilcolina"},{"id":"20209","text":"Aminas biog&eacute;nicas"},{"id":"20210","text":"Purinas"},{"id":"20212","text":"Serotonina"}]',
  '20211',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x57-0000-4000-b000-000000009680',
  'c000159-0000-4000-b000-000000009622',
  '&iquest;Cu&aacute;l de los siguientes neurotransmisores se usan en casi todas las sinapsis inhibitorias de la m&eacute;dula espiral?',
  57,
  '[{"id":"20214","text":"&aacute;cido gammaaminobut&iacute;rico (GABA) y glicina"},{"id":"20213","text":"&aacute;cido gammaaminobut&iacute;rico (GABA) y acetilcolina"},{"id":"20215","text":"adrenalina y noradrenalina"},{"id":"20216","text":"serotonina y melatonina"},{"id":"20217","text":"glutamato y aspartato"}]',
  '20214',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x58-0000-4000-b000-000000009681',
  'c000159-0000-4000-b000-000000009622',
  'Las neuronas motoras aut&oacute;nomas regulan las actividades viscerales mediante: 1. aumento de las actividades en el tejido efector. 2. disminuci&oacute;n de las actividades del tejido efector. 3. cambio de direcci&oacute;n de la conducci&oacute;n del impulso a trav&eacute;s de la sinapsis.',
  58,
  '[{"id":"20221","text":"1 y 2"},{"id":"20218","text":"1"},{"id":"20219","text":"2"},{"id":"20220","text":"3"},{"id":"20222","text":"Ninguna de las opciones"}]',
  '20221',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x59-0000-4000-b000-000000009682',
  'c000159-0000-4000-b000-000000009622',
  'Una neurona posganglionar en el SNA:',
  59,
  '[{"id":"20223","text":"libera neurotransmisores que se unen a la celula efectora."},{"id":"20224","text":"es la primera parte de una via motora autonoma."},{"id":"20225","text":"tiene su cuerpo celular en el encefalo o en la medula espinal."},{"id":"20226","text":"tiene sus axones que salen del SNC por los nervios craneales."},{"id":"20227","text":"conducen informaci&oacute;n hacia la cadena de ganglios simp&aacute;ticos."}]',
  '20223',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x60-0000-4000-b000-000000009683',
  'c000159-0000-4000-b000-000000009622',
  'El sistema nervioso aut&oacute;nomo NO regula:',
  60,
  '[{"id":"20229","text":"musculo esquel&eacute;tico."},{"id":"20228","text":"gl&aacute;ndulas exocrinas."},{"id":"20230","text":"musculo cardiaco."},{"id":"20231","text":"musculo liso."},{"id":"20232","text":"gl&aacute;ndulas endocrinas"}]',
  '20229',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x61-0000-4000-b000-000000009684',
  'c000159-0000-4000-b000-000000009622',
  '&iquest;Cu&aacute;l de las siguientes descripciones de una neurona preganglionar NO es correcta?',
  61,
  '[{"id":"20237","text":"Forma uniones de hendidura con las neuronas posganglionares en ganglios aut&oacute;nomos."},{"id":"20233","text":"Tiene axones que salen SNC en un nervio craneal o espinal."},{"id":"20234","text":"Tiene axones mielinizados."},{"id":"20235","text":"Forma la primera parte de una v&iacute;a motora aut&oacute;noma."},{"id":"20236","text":"Tiene su cuerpo celular en el enc&eacute;falo o la medula espinal."}]',
  '20237',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x62-0000-4000-b000-000000009685',
  'c000159-0000-4000-b000-000000009622',
  '&iquest;Cu&aacute;l de los siguientes tipos de neuronas normalmente tendr&iacute;a el ax&oacute;n m&aacute;s corto?',
  62,
  '[{"id":"20241","text":"Neuronas simp&aacute;ticas preganglionares"},{"id":"20238","text":"Neuronas motoras som&aacute;ticas"},{"id":"20239","text":"Neuronas parasimp&aacute;ticas preganglionares"},{"id":"20240","text":"Neuronas simp&aacute;ticas posganglionares"},{"id":"20242","text":"Neuronas somatosensitivas."}]',
  '20241',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x63-0000-4000-b000-000000009686',
  'c000159-0000-4000-b000-000000009622',
  '&iquest;Cu&aacute;l de las siguientes opciones NO describe la divisi&oacute;n simp&aacute;tica del SNA?',
  63,
  '[{"id":"20243","text":"Ganglios que se hallan principalmente en la cabeza"},{"id":"20244","text":"Estimula las gl&aacute;ndulas sudor&iacute;paras"},{"id":"20245","text":"Hace sinapsis con el musculo liso de las paredes vasculares"},{"id":"20246","text":"Neuronas preganglionares cortas"},{"id":"20247","text":"Estimulo toracolumbar"}]',
  '20243',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x64-0000-4000-b000-000000009687',
  'c000159-0000-4000-b000-000000009622',
  '&iquest;Cu&aacute;l de las siguientes opciones NO describe la divisi&oacute;n parasimp&aacute;tica del SNA?',
  64,
  '[{"id":"20249","text":"Sinapsis con el musculo liso de las paredes vasculares"},{"id":"20248","text":"Neuronas preganglionares largas"},{"id":"20250","text":"Estimulaci&oacute;n del nervio vago"},{"id":"20251","text":"Ganglios que se hallan cerca de los efectores viscerales"},{"id":"20252","text":"Estimulaci&oacute;n de la medula espinal sacra"}]',
  '20249',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x65-0000-4000-b000-000000009688',
  'c000159-0000-4000-b000-000000009622',
  '&iquest;Cu&aacute;l de los siguientes t&eacute;rminos se usa para designar un efector que esta inervado por las divisiones parasimp&aacute;ticas y simp&aacute;ticas del SNA?',
  65,
  '[{"id":"20257","text":"Inervaci&oacute;n dual"},{"id":"20253","text":"Estimulaci&oacute;n preganglionar"},{"id":"20254","text":"Excitaci&oacute;n biganglionar"},{"id":"20255","text":"Estimulaci&oacute;n multiautonoma"},{"id":"20256","text":"Inervaci&oacute;n bipolar"}]',
  '20257',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x66-0000-4000-b000-000000009689',
  'c000159-0000-4000-b000-000000009622',
  'Los dos principales neurotransmisores del sistema nervioso aut&oacute;nomo son:',
  66,
  '[{"id":"20261","text":"noradrenalina y acetilcolina."},{"id":"20258","text":"nicotina y adrenalina."},{"id":"20259","text":"muscarina y acetilcolina."},{"id":"20260","text":"noradrenalina y muscarina."},{"id":"20262","text":"somatostatina y nicotina"}]',
  '20261',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x67-0000-4000-b000-000000009690',
  'c000159-0000-4000-b000-000000009622',
  '&iquest;Cu&aacute;l de las siguientes situaciones NO es causada por la activaci&oacute;n de la divisi&oacute;n parasimp&aacute;tica del SNA?',
  67,
  '[{"id":"20264","text":"Dilataci&oacute;n de las v&iacute;as a&eacute;reas"},{"id":"20263","text":"Disminuci&oacute;n de la frecuencia cardiaca"},{"id":"20265","text":"Disminuci&oacute;n del di&aacute;metro pupilar"},{"id":"20266","text":"Mayor secreci&oacute;n de jugos digestivos"},{"id":"20267","text":"Aumento de la motilidad g&aacute;strica"}]',
  '20264',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x68-0000-4000-b000-000000009691',
  'c000159-0000-4000-b000-000000009622',
  '&iquest;Cu&aacute;l de las siguientes opciones son tipos de receptores colin&eacute;rgicos?',
  68,
  '[{"id":"20271","text":"Receptores nicot&iacute;nicos y muscar&iacute;nicos"},{"id":"20268","text":"Nicot&iacute;nicos y receptores adren&eacute;rgicos"},{"id":"20269","text":"Muscar&iacute;nicos y receptores som&aacute;ticos"},{"id":"20270","text":"Adren&eacute;rgico y receptores som&aacute;ticos"},{"id":"20272","text":"Receptores somatostaticos y nicot&iacute;nicos"}]',
  '20271',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x69-0000-4000-b000-000000009692',
  'c000159-0000-4000-b000-000000009622',
  '&iquest;Cu&aacute;l de las siguientes respuestas NO es causada por la estimulaci&oacute;n de la divisi&oacute;n simp&aacute;tica?',
  69,
  '[{"id":"20274","text":"Constricci&oacute;n de las v&iacute;as a&eacute;reas"},{"id":"20273","text":"Mayor frecuencia cardiaca"},{"id":"20275","text":"Disminuci&oacute;n del flujo sangu&iacute;neo hacia los ri&ntilde;ones y el aparato gastrointestinal."},{"id":"20276","text":"Aumento del flujo sangu&iacute;neo hacia el musculo esquel&eacute;tico, el musculo cardiaco, el h&iacute;gado y la grasa."},{"id":"20277","text":"Elevaci&oacute;n del nivel de glucosa en sangre"}]',
  '20274',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x70-0000-4000-b000-000000009693',
  'c000159-0000-4000-b000-000000009622',
  '&iquest;Cu&aacute;l de las siguientes afirmaciones describe una respuesta com&uacute;n de un efector aut&oacute;nomo durante la reacci&oacute;n de "lucha o huida"?',
  70,
  '[{"id":"20281","text":"Dilataci&oacute;n de las pupilas."},{"id":"20278","text":"Aumento de la motilidad g&aacute;strica y secretoria."},{"id":"20279","text":"Constricci&oacute;n de vasos sangu&iacute;neos que irrigan los m&uacute;sculos esquel&eacute;ticos."},{"id":"20280","text":"Los tejidos adiposos reservan triglic&eacute;ridos para un uso ulterior."},{"id":"20282","text":"Dilataci&oacute;n de los vasos sangu&iacute;neos que irrigan los ri&ntilde;ones y los &oacute;rganos digestivos."}]',
  '20281',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x71-0000-4000-b000-000000009694',
  'c000159-0000-4000-b000-000000009622',
  'Indica la respuesta correcta. Respeto al transporte activo secundario, &iquest;cu&aacute;les ser&iacute;an los elementos necesarios para q se pudiera llevar a cabo un transporte intercambiador de sodio hidrogeno?',
  71,
  '[{"id":"20284","text":"Sodio a un lado de la membrana, hidrogeno al otro lado de la membrana, prote&iacute;nas transportadoras y bombas sodio-potasio que genere gradiente electrol&iacute;tico"},{"id":"20283","text":"Sodio e hidrogeno a un lado de la membrana, aporte energ&eacute;tico en forma de ATP y bomba transportadora de protones"},{"id":"20285","text":"Sodio e hidrogeno a un lado de la membrana, prote&iacute;nas facilitadoras y aporte de ATP"},{"id":"20286","text":"Sodio a un lado de la membrana, hidrogeno al otro lado de la membrana, bomba sodio potasio que aporte ATP y prote&iacute;nas facilitadoras"}]',
  '20284',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x72-0000-4000-b000-000000009695',
  'c000159-0000-4000-b000-000000009622',
  'Indica la respuesta correcta respecto a los &oacute;rganos tendinosos de Golgi:',
  72,
  '[{"id":"20290","text":"a y b son correctas"},{"id":"20287","text":"son propioceptores de tensi&oacute;n"},{"id":"20288","text":"carecen de inervaci&oacute;n motora"},{"id":"20289","text":"sus terminaciones nerviosas sensitivas sinaptan en medula espinal con neuronas motores superiores"}]',
  '20290',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x73-0000-4000-b000-000000009696',
  'c000159-0000-4000-b000-000000009622',
  'Usted examina un perro incapaz de mantenerse sobre las cuatro patas y apoyarse sobre la pata derecha trasera. Esta presenta un di&aacute;metro menor que la pata izquierda trasera. Al pinchar un dedo de la pata trasera izquierda el perro la retira, pero si pincha en la derecha trasera no la mueve. La respuesta propioceptiva en el lado izquierdo es normal, en el derecho no aparece. &iquest;d&oacute;nde se localiza la lesi&oacute;n del perro?',
  73,
  '[{"id":"20293","text":"Neurona motora inferior de la pata derecha trasera"},{"id":"20291","text":"Neurona motora inferior de la pata izquierda trasera"},{"id":"20292","text":"Neurona motora superior que controla la pata derecha trasera"},{"id":"20294","text":"Neurona motora superior que controla la pata izquierda trasera"}]',
  '20293',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x74-0000-4000-b000-000000009697',
  'c000159-0000-4000-b000-000000009622',
  'El mayor grado de mielinizaci&oacute;n de los axones genera una conducci&oacute;n del impulso nervioso:',
  74,
  '[{"id":"20298","text":"M&aacute;s r&aacute;pida en las neuronas del sistema nervioso motor som&aacute;tico"},{"id":"20295","text":"M&aacute;s r&aacute;pida en el sistema nervioso aut&oacute;nomo simp&aacute;tico"},{"id":"20296","text":"M&aacute;s r&aacute;pida en el sistema nervioso aut&oacute;nomo parasimp&aacute;tico"},{"id":"20297","text":"M&aacute;s lenta en el sistema nervioso motor som&aacute;tico"}]',
  '20298',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x75-0000-4000-b000-000000009698',
  'c000159-0000-4000-b000-000000009622',
  'Las neuronas, generan el potencial de membrana en reposo mediante:',
  75,
  '[{"id":"20299","text":"La bomba de sodio/potasio, ATPasa, que cada vez que act&uacute;a salen de la c&eacute;lula tres iones sodio y entran 2 iones potasio"},{"id":"20300","text":"La bomba sodio/potasio, de transporte activo, que cada vez que act&uacute;a salen de la c&eacute;lula 2 iones sodio y entran 3 iones potasio"},{"id":"20301","text":"Mediante la repolarizaci&oacute;n, por la salida r&aacute;pida de gran cantidad de iones potasio a trav&eacute;s de los canales de fuga"},{"id":"20302","text":"Mediante la despolarizaci&oacute;n por la apertura de los canales de difusi&oacute;n r&aacute;pida de sodio al interior de la c&eacute;lula"}]',
  '20299',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x76-0000-4000-b000-000000009699',
  'c000159-0000-4000-b000-000000009622',
  'La repolarizaci&oacute;n en una neurona es una fase del potencial de acci&oacute;n y consiste en:',
  76,
  '[{"id":"20303","text":"La recuperaci&oacute;n del potencial de membrana negativo por la salida de potasio a trav&eacute;s de los canales de fuga"},{"id":"20304","text":"La generaci&oacute;n de la carga negativa en el interior de la c&eacute;lula gracias a la acci&oacute;n de la bomba de sodio/potasio"},{"id":"20305","text":"El incremento de la carga negativa de la c&eacute;lula por debajo del potencial de membrana en reposo"},{"id":"20306","text":"La alta permeabilidad de la membrana a la entrada de sodio al interior de la c&eacute;lula a trav&eacute;s de sus canales de difusi&oacute;n"}]',
  '20303',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x77-0000-4000-b000-000000009700',
  'c000159-0000-4000-b000-000000009622',
  'La llegada de un impulso nervioso a la terminal presin&aacute;ptica implica su despolarizaci&oacute;n. &iquest;Cu&aacute;l es el primer efecto hasta la liberaci&oacute;n del neurotransmisor?',
  77,
  '[{"id":"20310","text":"La apertura de los canales de voltaje de calcio que permiten su entrada masiva en el interior de la c&eacute;lula"},{"id":"20307","text":"La alteraci&oacute;n de las prote&iacute;nas de las ves&iacute;culas sin&aacute;pticas que provocan su atraque y exocitosis"},{"id":"20308","text":"La activaci&oacute;n de la calmodulina y la fosforilaci&oacute;n de las prote&iacute;nas de las membranas de las vesiculas presin&aacute;pticas"},{"id":"20309","text":"La apertura de los canales de fuga de potasio que permiten una r&aacute;pida repolarizaci&oacute;n para activar los canales de calcio"}]',
  '20310',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x78-0000-4000-b000-000000009701',
  'c000159-0000-4000-b000-000000009622',
  'Identifica la respuesta correcta. Los neurotransmisores act&uacute;an sobre los receptores de membrana postsin&aacute;ptica provocando:',
  78,
  '[{"id":"20314","text":"Una respuesta inhibidora si en la c&eacute;lula se produce una hiperpolarizaci&oacute;n"},{"id":"20311","text":"Una respuesta inhibitoria si en la c&eacute;lula se produce una despolarizaci&oacute;n"},{"id":"20312","text":"Una respuesta excitatoria si en la c&eacute;lula se produce una repolarizaci&oacute;n"},{"id":"20313","text":"Una respuesta excitadora si en la c&eacute;lula se produce una hiperpolarizaci&oacute;n"}]',
  '20314',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x79-0000-4000-b000-000000009702',
  'c000159-0000-4000-b000-000000009622',
  'Identifica la respuesta correcta. Los receptores muscar&iacute;nicos:',
  79,
  '[{"id":"20315","text":"Se activan tanto en las fibras adren&eacute;rgicas como colin&eacute;rgicas"},{"id":"20316","text":"Tienen solo capacidad de respuesta excitatoria"},{"id":"20317","text":"S&oacute;lo est&aacute;n presentes en las fibras colin&eacute;rgicas"},{"id":"20318","text":"Pueden generar potenciales postsin&aacute;pticos excitatorios o inhibitorios dependiendo del neurotransmisor que los active"}]',
  '20315',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x80-0000-4000-b000-000000009703',
  'c000159-0000-4000-b000-000000009622',
  'Respecto de las fibras nerviosas del sistema nervioso aut&oacute;nomo preganglionares y postganglionares, identifica la respuesta correcta:',
  80,
  '[{"id":"20320","text":"Todas las del parasimp&aacute;tico son colin&eacute;rgicas"},{"id":"20319","text":"Todas las del simp&aacute;tico son adren&eacute;rgicas"},{"id":"20321","text":"Las postganglionares del simp&aacute;tico son todas adren&eacute;rgicas"},{"id":"20322","text":"Las postganglionares del parasimp&aacute;tico son en su mayor&iacute;a colin&eacute;rgicas salvo algunas adren&eacute;rgicas"}]',
  '20320',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x81-0000-4000-b000-000000009704',
  'c000159-0000-4000-b000-000000009622',
  'Las respuestas caracter&iacute;sticas de la estimulaci&oacute;n del nervio vago sobre el coraz&oacute;n, tracto digestivo y p&aacute;ncreas son respectivamente:',
  81,
  '[{"id":"20323","text":"Disminuci&oacute;n de la frecuencia cardiaca, incremento de la motilidad intestinal e incremento de la secreci&oacute;n exocrina del p&aacute;ncreas"},{"id":"20324","text":"Incremento de la frecuencia cardiaca, incremento de la motilidad intestinal e incremento de la secreci&oacute;n exocrina del p&aacute;ncreas"},{"id":"20325","text":"Disminuci&oacute;n de la frecuencia cardiaca, disminuci&oacute;n de la motilidad intestinal e incremento de secreci&oacute;n exocrina del p&aacute;ncreas"},{"id":"20326","text":"Incremento de la frecuencia cardiaca, disminuci&oacute;n de la motilidad intestinal y disminuci&oacute;n de la secreci&oacute;n exocrina del p&aacute;ncreas"}]',
  '20323',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x82-0000-4000-b000-000000009705',
  'c000159-0000-4000-b000-000000009622',
  'Respecto del sistema nervioso aut&oacute;nomo identifica la respuesta correcta:',
  82,
  '[{"id":"20327","text":"Los receptores a1 y a2 de las fibras adren&eacute;rgicas son siempre excitatorios"},{"id":"20328","text":"Los receptores muscar&iacute;nicos est&aacute;n presentes en todas las fibras del simp&aacute;tico tanto pre como postganglionares"},{"id":"20329","text":"Los receptores colin&eacute;rgicos act&uacute;an a trav&eacute;s de la prote&iacute;na G y siempre generan respuestas excitatorias"}]',
  '20327',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x83-0000-4000-b000-000000009706',
  'c000159-0000-4000-b000-000000009622',
  'La troponina es una prote&iacute;na que act&uacute;a en la contracci&oacute;n muscular y su funci&oacute;n depende de:',
  83,
  '[{"id":"20330","text":"La activaci&oacute;n por el calcio y su efecto sobre el desplazamiento de la tropomiosina"},{"id":"20331","text":"La despolarizaci&oacute;n de la fibra muscular y el deslizamiento de la tropomiosina"},{"id":"20332","text":"La activaci&oacute;n de la tropomiosina y la liberaci&oacute;n de los puntos de atraque de la miosina"},{"id":"20333","text":"La liberaci&oacute;n de energ&iacute;a del ATP y la generaci&oacute;n del golpe de fuerza"}]',
  '20330',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x84-0000-4000-b000-000000009707',
  'c000159-0000-4000-b000-000000009622',
  'En relaci&oacute;n con los m&uacute;sculos de fibras estriadas o lisas, identifica la respuesta correcta:',
  84,
  '[{"id":"20334","text":"Lisa: M&uacute;ltiples sinapsis en un solo ax&oacute;n y receptores colin&eacute;rgicos y adren&eacute;rgicos"},{"id":"20335","text":"Estriada: Sinapsis neuromuscular o placa motora, siempre colin&eacute;rgica de receptor nicot&iacute;nico o muscar&iacute;nico"},{"id":"20336","text":"Lisa: Una sola sinapsis neuromuscular con receptor muscar&iacute;nico o nicot&iacute;nico"},{"id":"20337","text":"Estriada: M&uacute;ltiples sinapsis en una sola fibra muscular y siempre receptor nicot&iacute;nico"}]',
  '20334',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x85-0000-4000-b000-000000009708',
  'c000159-0000-4000-b000-000000009622',
  'En la contracci&oacute;n muscular la salida de iones calcio en el sarcoplasma permite:',
  85,
  '[{"id":"20340","text":"La activaci&oacute;n de la troponina y el desbloqueo de los puntos de uni&oacute;n de la miosina sobre la actina"},{"id":"20338","text":"La activaci&oacute;n de la tropomiosina y el desbloqueo de los puntos de uni&oacute;n de la actina sobre la miosina"},{"id":"20339","text":"La uni&oacute;n de la troponina y la tropomiosina que generan el golpe de fuerza"},{"id":"20341","text":"La activaci&oacute;n del puente cruzado de la miosina que cataliza el ATP y genera el golpe de fuerza"}]',
  '20340',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x86-0000-4000-b000-000000009709',
  'c000159-0000-4000-b000-000000009622',
  'Usted examina un perro incapaz de mantenerse y apoyarse sobre la pata derecha trasera (par&aacute;lisis). &EACUTE;sta tiene un di&aacute;metro menor que le izquierda trasera (atrofia). Al pinchar un dedo de la pata trasera izquierda del perro retira la pata, pero s&iacute; pincha el de la derecha, no la mueve (propiocepci&oacute;n) &iquest;D&oacute;nde se localizada la lesi&oacute;n del perro?',
  86,
  '[{"id":"20343","text":"NMI pata trasera derecha"},{"id":"20342","text":"NMS qu&eacute; controla la pata trasera derecha"},{"id":"20344","text":"Sinapsis neuromuscular de la pata trasera derecha"}]',
  '20343',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x87-0000-4000-b000-000000009710',
  'c000159-0000-4000-b000-000000009622',
  'La funci&oacute;n del cerebelo de la fisiolog&iacute;a del control de movimiento es:',
  87,
  '[{"id":"20345","text":"Comparar la informaci&oacute;n sobre plan de movimiento, con el movimiento que realmente se est&aacute; realizando y ajusta"},{"id":"20346","text":"Ayuda a seleccionar el patr&oacute;n de movimiento adecuado, a la vez que se suprimen los patrones opuestos"},{"id":"20347","text":"Controlar los movimientos voluntarios, conscientes y dirigidos"}]',
  '20345',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x88-0000-4000-b000-000000009711',
  'c000159-0000-4000-b000-000000009622',
  'En relaci&oacute;n con los m&uacute;sculos de fibras estriadas o lisas, identifica la respuesta correcta:',
  88,
  '[{"id":"20351","text":"Lisa: m&uacute;ltiples sinapsis en un solo ax&oacute;n y receptores colin&eacute;rgicos y adren&eacute;rgicos"},{"id":"20348","text":"Estriada: sinapsis neuromuscular o placa motora, siempre colin&eacute;rgicas de receptores nicot&iacute;nicos o muscar&iacute;nicos"},{"id":"20349","text":"Lisa: sinapsis neuromuscular o placa motora, siempre colin&eacute;rgicas de receptores nicot&iacute;nicos o muscar&iacute;nicos"},{"id":"20350","text":"Estriada: m&uacute;ltiples sinapsis en una sola fibra muscular y siempre receptor nicot&iacute;nico"}]',
  '20351',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x89-0000-4000-b000-000000009712',
  'c000159-0000-4000-b000-000000009622',
  'La troponina es una prote&iacute;na que act&uacute;a la contracci&oacute;n muscular y su funci&oacute;n depende de:',
  89,
  '[{"id":"20352","text":"La activaci&oacute;n por el calcio y su efecto sobre el desplazamiento de la tropomiosina"},{"id":"20353","text":"La despolarizaci&oacute;n de la fibra muscular y el deslizamiento de la tropomiosina"},{"id":"20354","text":"La activaci&oacute;n de la tropomiosina y la liberaci&oacute;n de los puntos de ataque de la miosina"},{"id":"20355","text":"La liberaci&oacute;n de energ&iacute;a de ATP y la generaci&oacute;n del golpe de fuerza"}]',
  '20352',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x90-0000-4000-b000-000000009713',
  'c000159-0000-4000-b000-000000009622',
  '&iquest;Qu&eacute; tipo de conducci&oacute;n del impulso nervioso genera un mayor grado de mielinizaci&oacute;n de los axones?',
  90,
  '[{"id":"20356","text":"M&aacute;s r&aacute;pida en las neuronas al sistema nervioso motor som&aacute;tico"},{"id":"20357","text":"M&aacute;s r&aacute;pida al sistema nervioso aut&oacute;nomo simp&aacute;tico"},{"id":"20358","text":"M&aacute;s r&aacute;pida al sistema nervioso aut&oacute;nomo parasimp&aacute;tico"},{"id":"20359","text":"Mas lenta en el sistema nervioso motor som&aacute;tico"}]',
  '20356',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x91-0000-4000-b000-000000009714',
  'c000159-0000-4000-b000-000000009622',
  'La primera respuesta a la llegada del potencial de acci&oacute;n (despolarizaci&oacute;n) a la terminal sin&aacute;ptica es:',
  91,
  '[{"id":"20362","text":"La apertura de canales de calcio activados por voltaje"},{"id":"20360","text":"La apertura de canales de calcio activados por el complejo calmodulina"},{"id":"20361","text":"La activaci&oacute;n del sistema Calmodulina-protein-quinasa"},{"id":"20363","text":"La inmediata salida de calcio al medio extracelular"}]',
  '20362',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x92-0000-4000-b000-000000009715',
  'c000159-0000-4000-b000-000000009622',
  'En relaci&oacute;n con la contracci&oacute;n muscular de las fibras estriadas &iquest;Cu&aacute;l es el elemento que se acorta?',
  92,
  '[{"id":"20367","text":"El sarc&oacute;mero debido al desplazamiento de los filamentos de actina sobre los de miosina"},{"id":"20364","text":"Las bandas entre los discos Z debido al deslizamiento o de los filamentos gruesos sobre los finos (miosina y actina respectivamente)"},{"id":"20365","text":"El sarc&oacute;mero debido al acortamiento de los filamentos de actina en el golpe de fuerza"},{"id":"20366","text":"Los discos Z debido al acortamiento de los filamentos de miosina en el puente cruzado"}]',
  '20367',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x93-0000-4000-b000-000000009716',
  'c000159-0000-4000-b000-000000009622',
  'En el m&uacute;sculo estriado &iquest;de d&oacute;nde proviene la energ&iacute;a necesaria para la contracci&oacute;n muscular?',
  93,
  '[{"id":"20368","text":"El golpe de fuerza libera energ&iacute;a del ATP cuando la cabeza del puente cruzado de la miosina se une con la actina"},{"id":"20369","text":"Se libera ATP en el golpe de fuerza cuando el puente cruzado de la actina se une con la miosina"},{"id":"20370","text":"La troponina tiene alta capacidad de captaci&oacute;n de ATP cuando se une la tropomiosina"},{"id":"20371","text":"Se libera ATP cuando la tropomiosina libera los puntos de ataque de la troponina y la h&eacute;lice actina"}]',
  '20368',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x94-0000-4000-b000-000000009717',
  'c000159-0000-4000-b000-000000009622',
  'Los gana el sistema nervioso aut&oacute;nomo la neurona posganglionar dispone de:',
  94,
  '[{"id":"20374","text":"Receptores colin&eacute;rgicos o adren&eacute;rgicos seg&uacute;n sea de la divisi&oacute;n simp&aacute;tica o parasimp&aacute;tica"},{"id":"20372","text":"Receptor es muscar&iacute;nicos"},{"id":"20373","text":"Receptores nicot&iacute;nicos"},{"id":"20375","text":"Receptores nicot&iacute;nicos y muscar&iacute;nicos"}]',
  '20374',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x95-0000-4000-b000-000000009718',
  'c000159-0000-4000-b000-000000009622',
  'El principal lugar de resistencia al flujo de sangre se encuentra:',
  95,
  '[{"id":"20376","text":"Metaarteriolas"},{"id":"20377","text":"Venas"},{"id":"20378","text":"Arterias el&aacute;sticas"},{"id":"20379","text":"Capilares"}]',
  '20376',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x96-0000-4000-b000-000000009719',
  'c000159-0000-4000-b000-000000009622',
  '&iquest;Qu&eacute; es y c&oacute;mo consiguen las neuronas su potencial de membrana de reposo?',
  96,
  '[{"id":"20380","text":"Es la carga el&eacute;ctrica negativa de -70 mV en interna de la c&eacute;lula de antelaci&oacute;n de la bomba sodio/potasio"},{"id":"20381","text":"Es el equilibro de cargas el&eacute;ctricas entre el medio intra y extracelular y se consigue mediante la repolarizaci&oacute;n (fuga de iones de potasio)"},{"id":"20382","text":"Es la polarizaci&oacute;n de +35mV en interior de la c&eacute;lula mediante la acci&oacute;n de la bomba sodio/potasio"},{"id":"20383","text":"Es la carga el&eacute;ctrica negativa de -35 mV el interior de la c&eacute;lula, mediante los canales de fuga de potasio"}]',
  '20380',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x97-0000-4000-b000-000000009720',
  'c000159-0000-4000-b000-000000009622',
  'Identifica la respuesta correcta donde aparecen dos aspectos caracter&iacute;sticos de la activaci&oacute;n del sistema parasimp&aacute;tico:',
  97,
  '[{"id":"20385","text":"Est&iacute;mulo de la motilidad intestinal y liberaci&oacute;n de la vejiga de la orina"},{"id":"20384","text":"Dilataci&oacute;n pupilar de hipoglucemia"},{"id":"20386","text":"Incremento de la presi&oacute;n arterial y de la glucolisis"},{"id":"20387","text":"Broncodilataci&oacute;n y secreci&oacute;n de las gl&aacute;ndulas sudor&iacute;paras"}]',
  '20385',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x98-0000-4000-b000-000000009721',
  'c000159-0000-4000-b000-000000009622',
  'Identifica respuesta correcta en cuanto a localizaci&oacute;n y funciones del hipot&aacute;lamo:',
  98,
  '[{"id":"20389","text":"Forma parte del dienc&eacute;falo y tiene funciones de regulaci&oacute;n del sistema endocrino y la homeostasis"},{"id":"20388","text":"Forma parte del telenc&eacute;falo y sus funciones est&aacute;n relacionadas con la memoria y el aprendizaje motor"},{"id":"20390","text":"Forma parte del tronco encef&aacute;lico con funciones de control del sistema endocrino y el cerebelo"},{"id":"20391","text":"Forman parte del mesenc&eacute;falo y tiene capacidad de s&iacute;ntesis hormonal como la prolactina (PRL) y la hormona del crecimiento (GH)"}]',
  '20389',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x99-0000-4000-b000-000000009722',
  'c000159-0000-4000-b000-000000009622',
  'En relaci&oacute;n con las funciones del nervio vago identifica la respuesta correcta:',
  99,
  '[{"id":"20393","text":"Es un nervios sensitivos motor y su estimulaci&oacute;n puede disminuir la frecuencia cardiaca"},{"id":"20392","text":"Estimula la glucolisis hep tica e inhibe la contracciones intestinales"},{"id":"20394","text":"Inhibe secreciones de est&oacute;mago y broncodilataci&oacute;n"},{"id":"20395","text":"Y de fibras colin&eacute;rgicas y adren&eacute;rgicas que generan respuestas excitatorias o inhibitorias"}]',
  '20393',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x100-0000-4000-b000-000000009723',
  'c000159-0000-4000-b000-000000009622',
  '&iquest;Cu&aacute;l de las siguientes opciones enumera los componentes de un arco reflejo aut&oacute;nomo en la secuencia de activaci&oacute;n correcta?',
  100,
  '[{"id":"20396","text":"receptor - neurona sensitiva - centro integrador - neurona motora - efector"},{"id":"20397","text":"receptor - neurona motora - centro integrador - neurona sensitiva - efector"},{"id":"20398","text":"efector - neurona sensitiva - centro integrador - neurona motora - receptor"},{"id":"20399","text":"centro integrador - receptor - neurona sensitiva - neurona motora - efector"},{"id":"20400","text":"receptor - neurona sensitiva - neurona motora - efector - centro integrador"}]',
  '20396',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x101-0000-4000-b000-000000009724',
  'c000159-0000-4000-b000-000000009622',
  '&iquest;Cu&aacute;l de las siguientes regiones del encefalo funciona como el principal centro de control e integraci&oacute;n del SNA?',
  101,
  '[{"id":"20404","text":"hipot&aacute;lamo"},{"id":"20401","text":"cerebro"},{"id":"20402","text":"cerebelo"},{"id":"20403","text":"t&aacute;lamo"},{"id":"20405","text":"hip&oacute;fisis"}]',
  '20404',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x102-0000-4000-b000-000000009725',
  'c000159-0000-4000-b000-000000009622',
  'La troponina es una prote&iacute;na que act&uacute;a en la contracci&oacute;n muscular y su funci&oacute;n depende de:',
  102,
  '[{"id":"20407","text":"La activaci&oacute;n por el calcio y efecto sobre el deslizamiento de la tropomiosina"},{"id":"20406","text":"La despolarizaci&oacute;n de la fibra muscular y el deslizamiento de la tropomiosina"},{"id":"20408","text":"La activaci&oacute;n de la tropomiosina y la liberaci&oacute;n de los puntos de ataque de la miosina"}]',
  '20407',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x103-0000-4000-b000-000000009726',
  'c000159-0000-4000-b000-000000009622',
  'Las sinapsis neuromuscular o placa motora es una sinapsis con:',
  103,
  '[{"id":"20411","text":"Un solo neurotransmisor (acetilcolina) y un solo receptor nicot&iacute;nico"},{"id":"20409","text":"Un solo neurotransmisor (acetilcolina) y sus receptores nicot&iacute;nicos y muscar&iacute;nicos"},{"id":"20410","text":"Un solo neurotransmisor (noradrenalina) con un solo receptor nicot&iacute;nico"}]',
  '20411',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x104-0000-4000-b000-000000009727',
  'c000159-0000-4000-b000-000000009622',
  'Identifica la respuesta correcta:',
  104,
  '[{"id":"20415","text":"La despolarizaci&oacute;n de la fibra muscular estriada permite la liberaci&oacute;n del calcio del ret&iacute;culo sarcoplasm&aacute;tico"},{"id":"20412","text":"La repolarizaci&oacute;n de la fibra muscular estriadas permite la liberaci&oacute;n del calcio del ret&iacute;culo sarcoplasm&aacute;tico"},{"id":"20413","text":"La repolarizaci&oacute;n de la fibra muscular estriadas, abre los canales de calcio en el sarcolema"},{"id":"20414","text":"La despolarizaci&oacute;n de la fibra muscular estriadas permite la entrada de calcio desde el medio extracelular"}]',
  '20415',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x105-0000-4000-b000-000000009728',
  'c000159-0000-4000-b000-000000009622',
  'La contracci&oacute;n muscular del golpe de fuerza se genera:',
  105,
  '[{"id":"20416","text":"Una vez que la cabeza del puente cruzado de la miosina se une con la actina"},{"id":"20417","text":"Una vez que la troponina se une a la tropomiosina"},{"id":"20418","text":"Una vez que la cabeza del puente cruzado de la miosina se une con la tropomiosina"},{"id":"20419","text":"Una vez que el puente cruzado de la actina se une con la miosina"}]',
  '20416',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x106-0000-4000-b000-000000009729',
  'c000159-0000-4000-b000-000000009622',
  'Cu&aacute;l de estas afirmaciones es correcta, en cuanto a diferencias entre la contracci&oacute;n de las fibras musculares lisas y estriadas:',
  106,
  '[{"id":"20422","text":"Las lisas utilizan calcio extracelular para la contracci&oacute;n"},{"id":"20420","text":"Las lisas carecen de troponina y tropomiosina"},{"id":"20421","text":"Las fibras estriadas carecen siempre de conexiones el&eacute;ctricas entre ellas"}]',
  '20422',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x107-0000-4000-b000-000000009730',
  'c000159-0000-4000-b000-000000009622',
  'Se&ntilde;ale la respuesta correcta. La contracci&oacute;n del m&uacute;sculo estriado se caracteriza por:',
  107,
  '[{"id":"20424","text":"Un acortamiento de sarc&oacute;meros con el deslizamiento de los filamentos finos (actina) sobre los gruesos (miosina)"},{"id":"20423","text":"Un acortamiento de los sarc&oacute;meros con la correspondiente reducci&oacute;n de la longitud de los filamentos de actina y miosina"},{"id":"20425","text":"El filamento deslizante donde el acoplamiento de la miosina (filamento grueso) implica el deslizamiento de la actina"}]',
  '20424',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x108-0000-4000-b000-000000009731',
  'c000159-0000-4000-b000-000000009622',
  'Una de la diferencias de las fibras musculares lisas respecto a las estriadas es:',
  108,
  '[{"id":"20426","text":"La ausencia de dep&oacute;sitos de calcio en el ret&iacute;culo sarcoplasm&aacute;tico"},{"id":"20427","text":"La falta de miosina y tropomiosina"},{"id":"20428","text":"No necesitan calcio para llevar a cabo la contracci&oacute;n muscular"}]',
  '20426',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x109-0000-4000-b000-000000009732',
  'c000159-0000-4000-b000-000000009622',
  'Una de las fases de la regulaci&oacute;n de la contracci&oacute;n muscular es la:',
  109,
  '[{"id":"20429","text":"Entra de calcio en el sarcoplasma y acoplamiento con la troponina"},{"id":"20430","text":"Entrada de calcio en el ret&iacute;culo sarcopl&aacute;smico y acoplamiento con la calmodulina"},{"id":"20431","text":"Recuperaci&oacute;n del calcio por el ret&iacute;culo sarcopl&aacute;smico y acoplamiento con la tropomiosina"}]',
  '20429',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x110-0000-4000-b000-000000009733',
  'c000159-0000-4000-b000-000000009622',
  '&iquest;Cu&aacute;l de los siguientes NO es una funci&oacute;n importante del tejido muscular?',
  110,
  '[{"id":"20436","text":"producir vitaminas"},{"id":"20432","text":"mover la sangre a trav&eacute;s del cuerpo"},{"id":"20433","text":"generar calor mediante contracciones"},{"id":"20434","text":"estabilizar el movimiento de las articulaciones"},{"id":"20435","text":"promover el movimiento de las estructuras corporales"}]',
  '20436',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x111-0000-4000-b000-000000009734',
  'c000159-0000-4000-b000-000000009622',
  'Esta es la propiedad del m&uacute;sculo que posibilita el estiramiento sin lesionar:',
  111,
  '[{"id":"20439","text":"extensibilidad"},{"id":"20437","text":"excitabilidad el&eacute;ctrica"},{"id":"20438","text":"contractibilidad"},{"id":"20440","text":"elasticidad"},{"id":"20441","text":"termog&eacute;nesis"}]',
  '20439',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x112-0000-4000-b000-000000009735',
  'c000159-0000-4000-b000-000000009622',
  'Los org&aacute;nulos contr&aacute;ctiles de la fibra muscular esquel&eacute;tica son estructuras con forma de hilos denominadas:',
  112,
  '[{"id":"20442","text":"miofibrillas."},{"id":"20443","text":"mioglobina."},{"id":"20444","text":"mitocondria."},{"id":"20445","text":"discos Z."},{"id":"20446","text":"l&iacute;neas M."}]',
  '20442',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x113-0000-4000-b000-000000009736',
  'c000159-0000-4000-b000-000000009622',
  '&iquest;Cu&aacute;l de las siguientes opciones enumera correctamente la secuencia de estructuras que los potenciales de acci&oacute;n deben atravesar para excitar la contracci&oacute;n del m&uacute;sculo esquel&eacute;tico?',
  113,
  '[{"id":"20450","text":"ax&oacute;n de la neurona, sarcolema, t&uacute;bulos T"},{"id":"20447","text":"sarcolema, ax&oacute;n de la neurona, t&uacute;bulos T"},{"id":"20448","text":"t&uacute;bulos T, sarcolema, miofilamentos"},{"id":"20449","text":"fibra muscular, ax&oacute;n de la neurona, miofibrillas"},{"id":"20451","text":"miofibrillas, miofilamentos, mitocondria"}]',
  '20450',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x114-0000-4000-b000-000000009737',
  'c000159-0000-4000-b000-000000009622',
  'La liberaci&oacute;n de calcio desde estas estructuras desencadena la contracci&oacute;n muscular:',
  114,
  '[{"id":"20454","text":"cisternas terminales del ret&iacute;culo sarcopl&aacute;smico"},{"id":"20452","text":"miofibrillas"},{"id":"20453","text":"mitocondria"},{"id":"20455","text":"T&uacute;bulos T"},{"id":"20456","text":"ninguna de las opciones"}]',
  '20454',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x115-0000-4000-b000-000000009738',
  'c000159-0000-4000-b000-000000009622',
  'El ret&iacute;culo sarcopl&aacute;smico de las fibras musculares esquel&eacute;ticas se usan para almacenar:',
  115,
  '[{"id":"20461","text":"Ca2+"},{"id":"20457","text":"ox&iacute;geno."},{"id":"20458","text":"ATP."},{"id":"20459","text":"PO4-"},{"id":"20460","text":"Na+"}]',
  '20461',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x116-0000-4000-b000-000000009739',
  'c000159-0000-4000-b000-000000009622',
  '&iquest;Cu&aacute;l de las siguientes regiones de un sarc&oacute;mero contiene filamentos delgados?',
  116,
  '[{"id":"20465","text":"Banda I y banda A."},{"id":"20462","text":"Banda I"},{"id":"20463","text":"Banda A"},{"id":"20464","text":"Zona H"},{"id":"20466","text":"Todas las opciones son correctas."}]',
  '20465',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x117-0000-4000-b000-000000009740',
  'c000159-0000-4000-b000-000000009622',
  '&iquest;Cu&aacute;l de las siguientes regiones del sarc&oacute;mero contienen filamentos gruesos?',
  117,
  '[{"id":"20471","text":"Todas las opciones son correctas."},{"id":"20467","text":"zona de superposici&oacute;n"},{"id":"20468","text":"banda A"},{"id":"20469","text":"zona H"},{"id":"20470","text":"banda A y zona H"}]',
  '20471',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x118-0000-4000-b000-000000009741',
  'c000159-0000-4000-b000-000000009622',
  '&iquest;Qu&eacute; prote&iacute;nas regulatorias se encuentran en los filamentos delgados de las fibras musculares esquel&eacute;ticas?',
  118,
  '[{"id":"20473","text":"tropomiosina y troponina"},{"id":"20472","text":"troponina y titina"},{"id":"20474","text":"miosina y titina"},{"id":"20475","text":"titina y tropomiosina"},{"id":"20476","text":"tropomiosina y miosina"}]',
  '20473',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x119-0000-4000-b000-000000009742',
  'c000159-0000-4000-b000-000000009622',
  'Los iones de calcio se liberan desde el ret&iacute;culo sarcoplasm&aacute;tico hacia el citosol:',
  119,
  '[{"id":"20477","text":"al comienzo de la contracci&oacute;n."},{"id":"20478","text":"en respuesta a la uni&oacute;n de la acetilcolina con los canales de liberaci&oacute;n de Ca2+."},{"id":"20479","text":"por transporte activo mediante bombas de Ca2+ en la membrana RS."},{"id":"20480","text":"despu&eacute;s de que la contracci&oacute;n finaliza."},{"id":"20481","text":"Todas las opciones son correctas."}]',
  '20477',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x120-0000-4000-b000-000000009743',
  'c000159-0000-4000-b000-000000009622',
  '&iquest;Qu&eacute; es lo que le otorga energ&iacute;a a la cabeza de miosina?',
  120,
  '[{"id":"20485","text":"reacci&oacute;n de hidr&oacute;lisis del ATP"},{"id":"20482","text":"los filamentos de actina"},{"id":"20483","text":"iones de calcio"},{"id":"20484","text":"iones de potasio"},{"id":"20486","text":"s&iacute;ntesis de ADP"}]',
  '20485',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x121-0000-4000-b000-000000009744',
  'c000159-0000-4000-b000-000000009622',
  'Se compone de una neurona motora som&aacute;tica y todas las fibras musculares esquel&eacute;ticas que estimula:',
  121,
  '[{"id":"20488","text":"unidad motora"},{"id":"20487","text":"sarc&oacute;mero"},{"id":"20489","text":"uni&oacute;n neuromuscular"},{"id":"20490","text":"unidad muscular"},{"id":"20491","text":"m&uacute;sculo liso de unidad m&uacute;ltiple"}]',
  '20488',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x122-0000-4000-b000-000000009745',
  'c000159-0000-4000-b000-000000009622',
  '&iquest;Cu&aacute;l de las siguientes funciona como una prote&iacute;na motora en los tres tipos de tejido muscular?',
  122,
  '[{"id":"20493","text":"miosina"},{"id":"20492","text":"actina"},{"id":"20494","text":"troponina"},{"id":"20495","text":"titina"},{"id":"20496","text":"tropomiosina"}]',
  '20493',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x123-0000-4000-b000-000000009746',
  'c000159-0000-4000-b000-000000009622',
  'Durante la contracci&oacute;n muscular por el mecanismo del filamento deslizante, los filamentos delgados son llevados hacia el/la:',
  123,
  '[{"id":"20499","text":"l&iacute;nea M."},{"id":"20497","text":"disco Z."},{"id":"20498","text":"zona H."},{"id":"20500","text":"banda A."},{"id":"20501","text":"banda I."}]',
  '20499',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x124-0000-4000-b000-000000009747',
  'c000159-0000-4000-b000-000000009622',
  'La contracci&oacute;n muscular esquel&eacute;tica seguir&aacute; ocurriendo en tanto se disponga de las siguientes sustancias qu&iacute;micas en el citosol de la fibra muscular:',
  124,
  '[{"id":"20503","text":"iones de calcio y ATP"},{"id":"20502","text":"ATP y acetilcolina (ACh)"},{"id":"20504","text":"ACh e iones de potasio"},{"id":"20505","text":"iones de sodio y ATP"},{"id":"20506","text":"calcio y ACh"}]',
  '20503',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x125-0000-4000-b000-000000009748',
  'c000159-0000-4000-b000-000000009622',
  'Para estimular la contracci&oacute;n del m&uacute;sculo esquel&eacute;tico, la acetilcolina debe cruzar el/la __________ de la uni&oacute;n neuromuscular y unirse a los receptores de la placa motora terminal.',
  125,
  '[{"id":"20508","text":"hendidura sin&aacute;ptica"},{"id":"20507","text":"nodo de Ranvier"},{"id":"20509","text":"sarcolema"},{"id":"20510","text":"bulbo terminal sin&aacute;ptico"},{"id":"20511","text":"t&uacute;bulo transversal"}]',
  '20508',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x126-0000-4000-b000-000000009749',
  'c000159-0000-4000-b000-000000009622',
  'El tono muscular liso se mantiene por la presencia prolongada de ______ en el citosol de la c&eacute;lula muscular',
  126,
  '[{"id":"20513","text":"iones de calcio"},{"id":"20512","text":"ATP"},{"id":"20514","text":"iones de fosfato"},{"id":"20515","text":"mioglobina"},{"id":"20516","text":"Ninguna de las opciones."}]',
  '20513',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x127-0000-4000-b000-000000009750',
  'c000159-0000-4000-b000-000000009622',
  'En el potencial de acci&oacute;n la repolarizaci&oacute;n implica',
  127,
  '[{"id":"20517","text":"Apertura de los canales de fuga de potasio y vuelta al estado negativo del potencial de membrana de reposo"},{"id":"20518","text":"La apertura de los canales de sodio y cambio de polaridad que acaba con el estado de reposo"},{"id":"20519","text":"Apertura de los canales de fuga de potasio y paso del estado negativo en reposo a la carga positiva"},{"id":"20520","text":"Apertura de los canales de sodio por una excitaci&oacute;n y comienzo del potencial de acci&oacute;n"}]',
  '20517',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x128-0000-4000-b000-000000009751',
  'c000159-0000-4000-b000-000000009622',
  'En el potencial de acci&oacute;n, en qu&eacute; fase y como recuperan las neuronas su carga el&eacute;ctrica negativa',
  128,
  '[{"id":"20522","text":"En la fase de repolarizaci&oacute;n mediante la apertura de canales de fuga de potasio"},{"id":"20521","text":"En la fase de repolarizaci&oacute;n mediante la acci&oacute;n de la bomba sodio y potasio"},{"id":"20523","text":"En la fase de hiperpolarizaci&oacute;n mediante la apertura de canales de fuga de potasio"},{"id":"20524","text":"En la fase de despolarizaci&oacute;n mediante la entrada de aniones en la celula"}]',
  '20522',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x129-0000-4000-b000-000000009752',
  'c000159-0000-4000-b000-000000009622',
  'Un potencial de postsin pticos inhibitorios (PPSI) se corresponde con',
  129,
  '[{"id":"20526","text":"Una hiperpolarizaci&oacute;n de la celula postsin&aacute;ptica por activaci&oacute;n de los receptores muscar&iacute;nicos"},{"id":"20525","text":"Una despolarizaci&oacute;n de la celula postsin&aacute;ptica por activaci&oacute;n de los receptores nicot&iacute;nicos"},{"id":"20527","text":"Una hiperpolarizaci&oacute;n de la celula postsin&aacute;ptica por activaci&oacute;n de un receptor nicot&iacute;nico"},{"id":"20528","text":"Una repolarizaci&oacute;n de la celula por activaci&oacute;n de receptores colin&eacute;rgicos o adren&eacute;rgicos"}]',
  '20526',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x130-0000-4000-b000-000000009753',
  'c000159-0000-4000-b000-000000009622',
  'Identifica la respuesta correcta. Los receptores muscar&iacute;nicos',
  130,
  '[{"id":"20532","text":"Son colin&eacute;rgicos y act&uacute;an a trav&eacute;s de prote&iacute;nas G que a su vez activan la apertura de un determinado canal i&oacute;nico"},{"id":"20529","text":"Son adren&eacute;rgicos y generan potenciales postsin pticos inhibitorios o excitatorios dependiendo de la formaci&oacute;n de segundos mensajeros intracelulares"},{"id":"20530","text":"Son colin&eacute;rgicos y generan potenciales de acci&oacute;n siempre excitatorios por apertura de canales i&oacute;nicos de sodio"},{"id":"20531","text":"Son adren&eacute;rgicos y act&uacute;an a trav&eacute;s de prote&iacute;nas G y segundos mensajeros pudiendo generar potenciales postsin pticos inhibitorios o excitatorios"}]',
  '20532',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x131-0000-4000-b000-000000009754',
  'c000159-0000-4000-b000-000000009622',
  '&iquest;Cu&aacute;l de estos dos efectos no se corresponden con la estimulaci&oacute;n del sistema nervioso aut&oacute;nomo simp&aacute;tico?',
  131,
  '[{"id":"20533","text":"Incremento de la secreci&oacute;n de gl&aacute;ndulas salivares y broncoconstricci&oacute;n"},{"id":"20534","text":"Dilataci&oacute;n pupilar y broncodilataci&oacute;n"},{"id":"20535","text":"Inhibici&oacute;n de la motilidad intestinal e incremento de la glucolisis"},{"id":"20536","text":"Estimulo de la secreci&oacute;n de las gl&aacute;ndulas sudor&iacute;paras e inhibici&oacute;n de la secreci&oacute;n exocrina del p&aacute;ncreas"}]',
  '20533',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x132-0000-4000-b000-000000009755',
  'c000159-0000-4000-b000-000000009622',
  'Identifica la respuesta correcta',
  132,
  '[{"id":"20538","text":"La medula adrenal funciona como un ganglio simp&aacute;tico modificado y libera adrenalina"},{"id":"20537","text":"Una fibra preganglionar del sistema parasimp&aacute;tico conecta con la medula adrenal y libera adrenalina"},{"id":"20539","text":"La conexi&oacute;n de la medula adrenal mediante una fibra postganglionar simp&aacute;tica incrementa la actividad de su neurotransmisor (noradrenalina)"},{"id":"20540","text":"La medula adrenal act&uacute;a mediante la conexi&oacute;n de una fibra postganglionar simple"}]',
  '20538',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x133-0000-4000-b000-000000009756',
  'c000159-0000-4000-b000-000000009622',
  '&iquest;Todas las v&iacute;sceras tienen inervaci&oacute;n simp&aacute;tica y parasimp&aacute;tica?',
  133,
  '[{"id":"20542","text":"Si, las c&eacute;lulas pueden tener capacidad de respuesta antag&oacute;nica seg&uacute;n el receptor que se active"},{"id":"20541","text":"No, cada celula solo puede responder a un determinado tipo de neurotransmisor"},{"id":"20543","text":"S&iacute;, pero solo tienen un determinado tipo de neurotransmisor y receptor"},{"id":"20544","text":"Depende de qu&eacute; tipo de c&eacute;lulas pueden responder a uno u otro estimulo"}]',
  '20542',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x134-0000-4000-b000-000000009757',
  'c000159-0000-4000-b000-000000009622',
  'En relaci&oacute;n con los m&uacute;sculos de fibra estriada o lisas, identifica la respuesta correcta',
  134,
  '[{"id":"20548","text":"Lisa: m&uacute;ltiples sinapsis en un solo ax&oacute;n y receptores colin&eacute;rgicos y postganglionar"},{"id":"20545","text":"Estriada: sinapsis neuromuscular o placa motora, siempre colin&eacute;rgica de receptor nicot&iacute;nico o muscar&iacute;nicos"},{"id":"20546","text":"Lisa: una sola sinapsis neuromuscular con receptor muscar&iacute;nicos o nicot&iacute;nico"},{"id":"20547","text":"Estriada: m&uacute;ltiples sinapsis en una sola fibra muscular y siempre receptor nicot&iacute;nico"}]',
  '20548',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x135-0000-4000-b000-000000009758',
  'c000159-0000-4000-b000-000000009622',
  'La sinapsis neuromuscular o placa motora es una sinapsis con',
  135,
  '[{"id":"20551","text":"Un solo neurotransmisor (acetil colina) y un solo receptor nicot&iacute;nico"},{"id":"20549","text":"Un solo neurotransmisor (acetil colina) y sus receptores nicot&iacute;nicos y muscar&iacute;nicos"},{"id":"20550","text":"Un solo neurotransmisor (noradrenalina) con un solo receptor nicot&iacute;nico"}]',
  '20551',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x136-0000-4000-b000-000000009759',
  'c000159-0000-4000-b000-000000009622',
  'En la contracci&oacute;n muscular, el golpe de fuerza genera',
  136,
  '[{"id":"20552","text":"Una vez que la cabeza del puente cruzado de la miosina se une con la actina"},{"id":"20553","text":"Una vez que la troponina que se une a la tropomiosina"},{"id":"20554","text":"Una vez que la cabeza del puente cruzado de la miosina se une con la tropomiosina"},{"id":"20555","text":"Una vez q el puente cruzado de la actina se une con la miosina"}]',
  '20552',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x137-0000-4000-b000-000000009760',
  'c000159-0000-4000-b000-000000009622',
  'El proceso de contracci&oacute;n muscular (musculo estriado) se inicia con la captaci&oacute;n de calcio por la troponina y este calcio procede de',
  137,
  '[{"id":"20559","text":"Del ret&iacute;culo sarcopl&aacute;smico y su salida al sarcoplasma depende de la apertura de canales de calcio de voltaje inducida por la despolarizaci&oacute;n"},{"id":"20556","text":"El medio extracelular y la apertura de los canales de calcio de voltaje de la membrana permiten su entrada en el sarcoplasma"},{"id":"20557","text":"Del medio extracelular y la uni&oacute;n con la troponina permite la liberaci&oacute;n de la tropomiosina"},{"id":"20558","text":"Del ret&iacute;culo sarcopl&aacute;smico y su salida al sarcoplasma depende de la activaci&oacute;n del sistema calmodulina-protein-quinasa"}]',
  '20559',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x138-0000-4000-b000-000000009761',
  'c000159-0000-4000-b000-000000009622',
  'El l&iacute;quido cefalorraqu&iacute;deo se forma y circula por',
  138,
  '[{"id":"20562","text":"Se forma en el plexo coroideo del tercer y cuarto ventr&iacute;culo y circula por el espacio subaracnoideo"},{"id":"20560","text":"Se forma en la am&iacute;gdala y circula por el espacio supraaracnoideo entre la aracnoides y la duramadre"},{"id":"20561","text":"Se forma en el plexo coroideo del segundo ventr&iacute;culo y circula por el canal ependimario"}]',
  '20562',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd159x139-0000-4000-b000-000000009762',
  'c000159-0000-4000-b000-000000009622',
  'Indica la respuesta correcta. Respeto al transporte activo secundario, &iquest;cu&aacute;les ser&iacute;an los elementos necesarios para q se pudiera llevar a cabo un transporte intercambiador de sodio hidrogeno?',
  139,
  '[{"id":"20564","text":"Sodio a un lado de la membrana, hidrogeno al otro lado de la membrana, prote&iacute;nas transportadoras y bombas sodio-potasio que genere gradiente electrol&iacute;tico"},{"id":"20563","text":"Sodio e hidrogeno a un lado de la membrana, aporte energ&eacute;tico en forma de ATP y bomba transportadora de protones"},{"id":"20565","text":"Sodio e hidrogeno a un lado de la membrana, prote&iacute;nas facilitadoras y aporte de ATP"},{"id":"20566","text":"Sodio a un lado de la membrana, hidrogeno al otro lado de la membrana, bomba sodio potasio que aporte ATP y prote&iacute;nas facilitadoras"}]',
  '20564',
  '2026-04-27 17:01:04'
);

-- Quiz: "TEST 2- SISTEMA NERVIOSO Y MUSCULAR" → Course: "Fisiología Vet 1ºC" (49 questions) [renamed to add "(2)"]
INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)
SELECT
  'c000160-0000-4000-b000-000000009763',
  c.id,
  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),
  'TEST 2- SISTEMA NERVIOSO Y MUSCULAR (2)',
  NULL,
  'quiz',
  100,
  '2026-04-27 17:01:04',
  '2026-04-27 17:01:04'
FROM Class c
WHERE c.name = 'Fisiología Vet 1ºC'
  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = 'TEST 2- SISTEMA NERVIOSO Y MUSCULAR (2)' AND a.type = 'quiz')
LIMIT 1;

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x0-0000-4000-b000-000000009764',
  'c000160-0000-4000-b000-000000009763',
  'En los ganglios del sistema nervioso aut&oacute;nomo la neurona postganglionar dispone de:',
  0,
  '[{"id":"20632","text":"Receptores nicot&iacute;nicos"},{"id":"20631","text":"Receptores muscar&iacute;nicos"},{"id":"20633","text":"Receptores colin&eacute;rgicos o adren&eacute;rgicos seg&uacute;n sea la divisi&oacute;n simp&aacute;tica o parasimp&aacute;tica"},{"id":"20634","text":"Receptores nicot&iacute;nicos y muscar&iacute;nicos"}]',
  '20632',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x1-0000-4000-b000-000000009765',
  'c000160-0000-4000-b000-000000009763',
  '&iquest;Qu&eacute; diferencias existen entre el grado de mielinizaci&oacute;n y velocidad de conducci&oacute;n del impulso nervioso en el sistema som&aacute;tico respecto al sistema nervioso aut&oacute;nomo?',
  1,
  '[{"id":"20636","text":"Existe un mayor grado de mielinizaci&oacute;n de los axones y una mayor velocidad de conducci&oacute;n"},{"id":"20635","text":"El grado de mielinizaci&oacute;n es el mismo en ambos sistemas, pero el sistema nervioso aut&oacute;nomo tiene mayor velocidad de conducci&oacute;n"},{"id":"20637","text":"Existe un menor grado de mielinizaci&oacute;n de los axones y la velocidad de conducci&oacute;n es mayor en el sistema simp&aacute;tico"},{"id":"20638","text":"Existe un menor grado de mielinizaci&oacute;n de los axones y la velocidad de conducci&oacute;n es mayor en el sistema aut&oacute;nomo"}]',
  '20636',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x2-0000-4000-b000-000000009766',
  'c000160-0000-4000-b000-000000009763',
  'En relaci&oacute;n con los receptores colin&eacute;rgicos, identifica la respuesta correcta:',
  2,
  '[{"id":"20639","text":"Los receptores muscar&iacute;nicos act&uacute;an a trav&eacute;s de la prote&iacute;na G y pueden generar potenciales postsin&aacute;pticos inhibitorios y excitatorios"},{"id":"20640","text":"Los receptores a y act&uacute;an a trav&eacute;s de la prote&iacute;na G y pueden generar potenciales postsin&aacute;pticos inhibitorios y excitatorios"},{"id":"20641","text":"Los receptores nicot&iacute;nicos act&uacute;an a trav&eacute;s de la prote&iacute;na G y su respuesta a la acetil-colina es siempre un potencial postsin&aacute;ptico excitatorio"},{"id":"20642","text":"Los receptores nicot&iacute;nicos son canales i&oacute;nicos de sodio y potasio y pueden generar potenciales postsin&aacute;pticos excitatorios o inhibitorios"}]',
  '20639',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x3-0000-4000-b000-000000009767',
  'c000160-0000-4000-b000-000000009763',
  'Identifica la respuesta correcta donde aparecen dos aspectos caracter&iacute;sticos de la activaci&oacute;n del sistema parasimp&aacute;tico',
  3,
  '[{"id":"20644","text":"Est&iacute;mulo de la movilidad intestinal y liberaci&oacute;n de la vejiga de la orina"},{"id":"20643","text":"Dilataci&oacute;n pupilar e hipoglucemia"},{"id":"20645","text":"Incremento de la presi&oacute;n arterial y de la glucolisis"},{"id":"20646","text":"Broncodilataci&oacute;n y secreci&oacute;n de las gl&aacute;ndulas sudor&iacute;paras"}]',
  '20644',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x4-0000-4000-b000-000000009768',
  'c000160-0000-4000-b000-000000009763',
  '&iquest;Qu&eacute; es y c&oacute;mo consiguen las neuronas su potencial de membrana en reposo?',
  4,
  '[{"id":"20647","text":"Es una carga el&eacute;ctrica negativa de -70 mV en el interior de la c&eacute;lula mediante la acci&oacute;n de la bomba sodio/potasio"},{"id":"20648","text":"Es el equilibrio de cargas el&eacute;ctricas entre el medio intra y extra celular mediante la repolarizaci&oacute;n"},{"id":"20649","text":"Es la polarizaci&oacute;n de +35 mV en el interior de la c&eacute;lula mediante la acci&oacute;n de la bomba sodio/potasio"},{"id":"20650","text":"Es la carga el&eacute;ctrica negativa de -35 mV en el interior de la c&eacute;lula mediante los canales de fuga de potasio"}]',
  '20647',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x5-0000-4000-b000-000000009769',
  'c000160-0000-4000-b000-000000009763',
  'Identifica la respuesta correcta en cuanto a diferencias de la contracci&oacute;n de las fibras musculares lisas respecto de las fibras del m&uacute;sculo estriado. Las fibras musculares lisas:',
  5,
  '[{"id":"20654","text":"Carecen de troponina, son de contracci&oacute;n lenta y tienen conexiones gap entre ella"},{"id":"20651","text":"Poseen calmodulina para la captaci&oacute;n de calcio, son independientes y no se pueden contraer a la vez"},{"id":"20652","text":"Son fibras de contracci&oacute;n r&aacute;pida, captan el calcio extracelular mediante la troponina y se contraen de forma independiente"},{"id":"20653","text":"Son fibras cil&iacute;ndricas largas y multinucleadas, con una sola sinapsis neuromuscular de receptor nicot&iacute;nico"}]',
  '20654',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x6-0000-4000-b000-000000009770',
  'c000160-0000-4000-b000-000000009763',
  'En relaci&oacute;n a los receptores adren&eacute;rgicos, se&ntilde;ala la respuesta correcta:',
  6,
  '[{"id":"20657","text":"Act&uacute;an a trav&eacute;s de prote&iacute;nas G y la formaci&oacute;n de segundos mensajeros, pudiendo generar potenciales de acci&oacute;n postsin&aacute;pticos excitatorios e inhibitorios"},{"id":"20655","text":"Son metabotr&oacute;picos y act&uacute;an como receptores de canal i&oacute;nico generando potenciales de acci&oacute;n excitatorios o inhibitorios dependiendo del tipo de canal"},{"id":"20656","text":"Act&uacute;an a trav&eacute;s de prote&iacute;nas G que activan directamente la apertura de un determinado canal i&oacute;nico y son inhibitorios o excitatorios"},{"id":"20658","text":"Son ionotr&oacute;picos y generan potenciales postsin&aacute;pticos inhibitorios dependiendo exclusivamente de las prote&iacute;nas G como se&ntilde;alizadores intracelulares"}]',
  '20657',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x7-0000-4000-b000-000000009771',
  'c000160-0000-4000-b000-000000009763',
  'Indica la respuesta correcta en cuanto a la localizaci&oacute;n y funciones del hipot&aacute;lamo:',
  7,
  '[{"id":"20660","text":"Forma parte del dienc&eacute;falo y tiene funciones que regulan el sistema endocrino y la homeostasis"},{"id":"20659","text":"Forma parte del telenc&eacute;falo y sus funciones est&aacute;n relacionadas con la memoria y el aprendizaje motor"},{"id":"20661","text":"Forma parte del tronco encef&aacute;lico con funciones de control del sistema endocrino y el cerebelo"},{"id":"20662","text":"Forma parte del mesenc&eacute;falo y tiene capacidad de s&iacute;ntesis hormonal como la prolactina y la hormona del crecimiento"}]',
  '20660',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x8-0000-4000-b000-000000009772',
  'c000160-0000-4000-b000-000000009763',
  '&iquest;C&oacute;mo act&uacute;a una neurona ante un est&iacute;mulo?',
  8,
  '[{"id":"20732","text":"repolarizaci&oacute;n tiene lugar gracias al cierre de canales de Na+ y la apertura de canales de K+"},{"id":"20731","text":"Durante la despolarizaci&oacute;n se abren canales de Na+, permitiendo la salida de Na+ del interior de la c&eacute;lula"},{"id":"20733","text":"Durante la repolarizaci&oacute;n se produce la entrada de K+ hacia el interior de la c&eacute;lula"},{"id":"20734","text":"Durante la hiperpolarizaci&oacute;n la neurona alcanza un potencial el&eacute;ctrico superior al del valor en reposo"}]',
  '20732',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x9-0000-4000-b000-000000009773',
  'c000160-0000-4000-b000-000000009763',
  'Indica cu&aacute;l de las siguientes fases de la contracci&oacute;n muscular es correcta:',
  9,
  '[{"id":"20737","text":"El Ca2+ se une a la troponina por su subunidad C"},{"id":"20735","text":"El potencial de acci&oacute;n se transmite a lo largo de la fibra muscular y entra en el centro de la misma a trav&eacute;s del ret&iacute;culo sarcopl&aacute;smico"},{"id":"20736","text":"El receptor de voltaje DHP permite almacenar Ca2+ en el ret&iacute;culo sarcopl&aacute;smico"},{"id":"20738","text":"Se produce la activaci&oacute;n de receptores muscar&iacute;nicos en el sarcolema"}]',
  '20737',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x10-0000-4000-b000-000000009774',
  'c000160-0000-4000-b000-000000009763',
  'Sobre el m&uacute;sculo esquel&eacute;tico podemos afirmar que:',
  10,
  '[{"id":"20739","text":"Durante la contracci&oacute;n se produce un acortamiento de los sarc&oacute;meros"},{"id":"20740","text":"El conjunto de neurona motora y fibras musculares que inerva recibe el nombre de placa motora"},{"id":"20741","text":"La troponina bloquea el sitio de uni&oacute;n entre las cabezas de miosina y la actina"},{"id":"20742","text":"Las miofibrillas son la unidad b&aacute;sica contr&aacute;ctil de la fibra muscular"}]',
  '20739',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x11-0000-4000-b000-000000009775',
  'c000160-0000-4000-b000-000000009763',
  'Se&ntilde;ala la afirmaci&oacute;n incorrecta:',
  11,
  '[{"id":"20744","text":"La entrada de Na+ en la c&eacute;lula postsin&aacute;ptica provoca un potencial de acci&oacute;n inhibitorio"},{"id":"20743","text":"En el sistema nervioso central la mayor parte de neuronas son colin&eacute;rgicas"},{"id":"20745","text":"Los receptores colin&eacute;rgicos muscar&iacute;nicos son un tipo de receptor acoplado a prote&iacute;na G"},{"id":"20746","text":"En el sistema nervioso perif&eacute;rico la mayor parte de neuronas son colin&eacute;rgicas"}]',
  '20744',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x12-0000-4000-b000-000000009776',
  'c000160-0000-4000-b000-000000009763',
  'En relaci&oacute;n al sistema nervioso aut&oacute;nomo podemos afirmar que:',
  12,
  '[{"id":"20749","text":"Las neuronas postganglionares se ubican en los ganglios autonomos"},{"id":"20747","text":"El efecto fight and flight es caracter&iacute;stico del sistema nervioso parasimp&aacute;tico"},{"id":"20748","text":"Las neuronas preganglionares se ubican dentro de la sustancia blanca del SNC"},{"id":"20750","text":"El sistema nervioso simp&aacute;tico recibe el nombre de sistema craneosacro"}]',
  '20749',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x13-0000-4000-b000-000000009777',
  'c000160-0000-4000-b000-000000009763',
  '&iquest;De cu&aacute;l de las siguientes estructuras forman parte la troponina y la tropomiosina?',
  13,
  '[{"id":"20754","text":"Filamento fino de actina"},{"id":"20751","text":"Filamento grueso de miosina"},{"id":"20752","text":"Sarcolema"},{"id":"20753","text":"T&uacute;bulos T"},{"id":"20755","text":"Ret&iacute;culo sarcopl&aacute;smico"}]',
  '20754',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x14-0000-4000-b000-000000009778',
  'c000160-0000-4000-b000-000000009763',
  '&iquest;Cu&aacute;l de las siguientes estructuras es propia del dienc&eacute;falo?',
  14,
  '[{"id":"20759","text":"Hip&oacute;fisis"},{"id":"20756","text":"Hipocampo"},{"id":"20757","text":"Ganglios basales"},{"id":"20758","text":"Bulbo raqu&iacute;deo"}]',
  '20759',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x15-0000-4000-b000-000000009779',
  'c000160-0000-4000-b000-000000009763',
  'Sobre la noradrenalina es correcto afirmar que:',
  15,
  '[{"id":"20763","text":"Todas son correctas"},{"id":"20760","text":"Produce un tipo de respuesta excitatoria"},{"id":"20761","text":"Aumenta la atenci&oacute;n y el estado de vigilancia"},{"id":"20762","text":"En exceso puede causar la p&eacute;rdida de l&iacute;bido"}]',
  '20763',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x16-0000-4000-b000-000000009780',
  'c000160-0000-4000-b000-000000009763',
  'Los potenciales de acci&oacute;n de las c&eacute;lulas del m&uacute;sculo esquel&eacute;tico desencadenan la liberaci&oacute;n desde el ret&iacute;culo sarcopl&aacute;smico de un ion cr&iacute;tico para la contracci&oacute;n muscular:',
  16,
  '[{"id":"20764","text":"Ca2+"},{"id":"20765","text":"Na+"},{"id":"20766","text":"K+"},{"id":"20767","text":"Cl-"},{"id":"20768","text":"HCO3-"}]',
  '20764',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x17-0000-4000-b000-000000009781',
  'c000160-0000-4000-b000-000000009763',
  '&iquest;En cu&aacute;l de las siguientes zonas del cerebro se forma el l&iacute;quido cefalorraqu&iacute;deo?',
  17,
  '[{"id":"20772","text":"Epit&aacute;lamo"},{"id":"20769","text":"Hipot&aacute;lamo"},{"id":"20770","text":"Bulbo raqu&iacute;deo"},{"id":"20771","text":"Hipocampo"}]',
  '20772',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x18-0000-4000-b000-000000009782',
  'c000160-0000-4000-b000-000000009763',
  'El SNC puede hacer que la parte central del m&uacute;sculo esquel&eacute;tico se contraiga con m&aacute;s fuerza si:',
  18,
  '[{"id":"20776","text":"a) y c) son correctas"},{"id":"20773","text":"Provoca la contracci&oacute;n simult&aacute;nea de m&aacute;s unidades motoras"},{"id":"20774","text":"Aumenta la cantidad de acetilcolina liberada durante cada transmisi&oacute;n sin&aacute;ptica neuromuscular"},{"id":"20775","text":"Aumenta la frecuencia de los potenciales de acci&oacute;n en el ax&oacute;n de la neurona motora a"}]',
  '20776',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x19-0000-4000-b000-000000009783',
  'c000160-0000-4000-b000-000000009763',
  '&iquest;Cu&aacute;l de las siguientes estructuras no se encuentra en el m&uacute;sculo liso?',
  19,
  '[{"id":"20779","text":"T&uacute;bulos T"},{"id":"20777","text":"Filamentos de actina"},{"id":"20778","text":"Filamentos de miosina"},{"id":"20780","text":"Canales de calcio dependientes de voltaje"}]',
  '20779',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x20-0000-4000-b000-000000009784',
  'c000160-0000-4000-b000-000000009763',
  'Indica la respuesta incorrecta:',
  20,
  '[{"id":"20784","text":"La membrana de la fibra muscular transmite los potenciales de acci&oacute;n por conducci&oacute;n saltatoria"},{"id":"20781","text":"Las membranas de las fibras muscular y nerviosa son parecidas porque ambas tienen potencial de reposo"},{"id":"20782","text":"Un m&uacute;sculo completo puede contraerse con m&aacute;s fuerza al aumentar el n&uacute;mero de unidades motoras que se contraen"},{"id":"20783","text":"El sistema de t&uacute;bulos T de la membrana muscular transmite el potencial de acci&oacute;n hacia el interior de la c&eacute;lula"}]',
  '20784',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x21-0000-4000-b000-000000009785',
  'c000160-0000-4000-b000-000000009763',
  'Sobre el sistema nervioso simp&aacute;tico podemos afirmar que:',
  21,
  '[{"id":"20786","text":"Todas sus fibras preganglionares son colin&eacute;rgicas"},{"id":"20785","text":"Se encuentra ubicado en el tronco encef&aacute;lico y en el sacro"},{"id":"20787","text":"Las fibras postganglionares de las gl&aacute;ndulas sudor&iacute;paras liberan noradrenalina"},{"id":"20788","text":"Los axones preganglionares son mucho m&aacute;s largos que los postganglionares"}]',
  '20786',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x22-0000-4000-b000-000000009786',
  'c000160-0000-4000-b000-000000009763',
  'En relaci&oacute;n a la estructura del SNC, se&ntilde;ala la respuesta FALSA:',
  22,
  '[{"id":"20791","text":"La corteza cerebral y el cerebelo se encuentran unidos por el bulbo raqu&iacute;deo"},{"id":"20789","text":"La corteza cerebral se encarga de generar la salida motora para provocar un cambio o mantener el entorno"},{"id":"20790","text":"El hipot&aacute;lamo se encarga de regular el SNA, el sistema endocrino y la homeostasis"},{"id":"20792","text":"La gl&aacute;ndula pineal permite al animal adaptarse a su entorno mediante la secreci&oacute;n de melatonina"}]',
  '20791',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x23-0000-4000-b000-000000009787',
  'c000160-0000-4000-b000-000000009763',
  'En una neurona en reposo, podemos afirmar que:',
  23,
  '[{"id":"20795","text":"Existen canales de fuga de K+ que hacen que la neurona se polarice"},{"id":"20793","text":"Presentan una carga el&eacute;ctrica negativa, es decir, est&aacute;n despolarizadas"},{"id":"20794","text":"Cada vez que act&uacute;a la bomba Na+/K+ la c&eacute;lula se carga positivamente"},{"id":"20796","text":"Todas son correctas"}]',
  '20795',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x24-0000-4000-b000-000000009788',
  'c000160-0000-4000-b000-000000009763',
  '&iquest;Cu&aacute;l de las siguientes estructuras es m&aacute;s probable que se asocie a los m&uacute;sculos que participan principalmente con movimientos breves y potentes?',
  24,
  '[{"id":"20799","text":"Unidad motora peque&ntilde;a"},{"id":"20797","text":"Unidad motora grande"},{"id":"20798","text":"Cuerpo de la neurona motora a grande"},{"id":"20800","text":"M&uacute;sculo blanco"},{"id":"20801","text":"Fibras de contracci&oacute;n r&aacute;pidas"}]',
  '20799',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x25-0000-4000-b000-000000009789',
  'c000160-0000-4000-b000-000000009763',
  '&iquest;Qu&eacute; parte de la neurona se considera que recibe principalmente la informaci&oacute;n?',
  25,
  '[{"id":"20894","text":"Dendritas"},{"id":"20890","text":"Ax&oacute;n"},{"id":"20891","text":"Terminal presin&aacute;ptica"},{"id":"20892","text":"Cuerpo celular"},{"id":"20893","text":"Mielina"}]',
  '20894',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x26-0000-4000-b000-000000009790',
  'c000160-0000-4000-b000-000000009763',
  'En relaci&oacute;n a los receptores de c&eacute;lulas postsin&aacute;pticas es cierto que:',
  26,
  '[{"id":"20896","text":"Los receptores nicot&iacute;nicos son canales i&oacute;nicos por s&iacute; mismos"},{"id":"20895","text":"Los receptores muscar&iacute;nicos inducen siempre potenciales postsin&aacute;pticos inhibitorios"},{"id":"20897","text":"Los receptores muscar&iacute;nicos son aceptores de noradrenalina"},{"id":"20898","text":"Los receptores nicot&iacute;nicos inducen siempre potenciales postsin&aacute;pticos excitatorios por apertura de canales de Cl-"}]',
  '20896',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x27-0000-4000-b000-000000009791',
  'c000160-0000-4000-b000-000000009763',
  'Los elementos de los nervios espinales y craneales que transmiten las &oacute;rdenes desde el SNC hasta la sinapsis en los m&uacute;sculos esquel&eacute;ticos son:',
  27,
  '[{"id":"20901","text":"Axones de las neuronas eferentes som&aacute;ticas"},{"id":"20899","text":"Axones de las neuronas eferentes viscerales"},{"id":"20900","text":"Axones de las neuronas aferentes som&aacute;ticas"},{"id":"20902","text":"Ra&iacute;ces dorsales"},{"id":"20903","text":"Axones de las neuronas aferentes viscerales"}]',
  '20901',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x28-0000-4000-b000-000000009792',
  'c000160-0000-4000-b000-000000009763',
  '&iquest;Cu&aacute;l de los siguientes neurotransmisores permiten una respuesta inhibitoria?',
  28,
  '[{"id":"20905","text":"Glicina"},{"id":"20904","text":"Serotonina"},{"id":"20906","text":"Histamina"},{"id":"20907","text":"Dopamina"}]',
  '20905',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x29-0000-4000-b000-000000009793',
  'c000160-0000-4000-b000-000000009763',
  'Se&ntilde;ala la afirmaci&oacute;n correcta:',
  29,
  '[{"id":"20908","text":"Todas las fibras preganglionares del SNA liberan acetilcolina como neurotransmisor"},{"id":"20909","text":"En el SN simp&aacute;tico todas las fibras postganglionares liberan noradrenalina como neurotransmisor"},{"id":"20910","text":"Todas las fibras postganglionares del SNA liberan acetilcolina como neurotransmisor"},{"id":"20911","text":"En el SN parasimp&aacute;tico todas las fibras preganglionares liberan noradrenalina como neurotransmisor"}]',
  '20908',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x30-0000-4000-b000-000000009794',
  'c000160-0000-4000-b000-000000009763',
  '&iquest;Cu&aacute;l de las siguientes NO es una caracter&iacute;stica de las c&eacute;lulas gliales?',
  30,
  '[{"id":"20912","text":"Producci&oacute;n de potenciales de acci&oacute;n"},{"id":"20913","text":"Producci&oacute;n de las vainas miel&iacute;nicas de los axones"},{"id":"20914","text":"Modulaci&oacute;n del crecimiento de las neuronas en desarrollo o da&ntilde;adas"},{"id":"20915","text":"Amortiguaci&oacute;n de las concentraciones extracelulares de alguno iones y neurotransmisores"}]',
  '20912',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x31-0000-4000-b000-000000009795',
  'c000160-0000-4000-b000-000000009763',
  'La conexi&oacute;n entre el sistema nervioso y el sistema endocrino se lleva a cabo por:',
  31,
  '[{"id":"20918","text":"El hipot&aacute;lamo"},{"id":"20916","text":"La corteza cerebral"},{"id":"20917","text":"La hip&oacute;fisis"},{"id":"20919","text":"El bulbo raqu&iacute;deo"}]',
  '20918',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x32-0000-4000-b000-000000009796',
  'c000160-0000-4000-b000-000000009763',
  'Indica la afirmaci&oacute;n incorrecta sobre el sistema nervioso simp&aacute;tico:',
  32,
  '[{"id":"20920","text":"Presenta axones preganglionares largos"},{"id":"20921","text":"Las gl&aacute;ndulas adrenales act&uacute;an como un ganglio simp&aacute;tico modificado"},{"id":"20922","text":"Act&uacute;a como un sistema de activaci&oacute;n en masa"},{"id":"20923","text":"En el m&uacute;sculo liso las fibras postganglionares son colin&eacute;rgicas"}]',
  '20920',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x33-0000-4000-b000-000000009797',
  'c000160-0000-4000-b000-000000009763',
  '¿Qué no podemos afirmar sobre las fibras nerviosas?',
  33,
  '[{"id":"20927","text":"Las fibras nerviosas miel&iacute;nicas presentan una vaina de mielina continua por toda la superficie del ax&oacute;n"},{"id":"20924","text":"Los n&oacute;dulos de Ranvier est&aacute;n presentes &uacute;nicamente en fibras nerviosas miel&iacute;nicas"},{"id":"20925","text":"Las fibras nerviosas amiel&iacute;nicas carecen de vaina de mielina"},{"id":"20926","text":"Las fibras nerviosas amiel&iacute;nicas son caracter&iacute;sticas del sistema nervioso aut&oacute;nomo"}]',
  '20927',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x34-0000-4000-b000-000000009798',
  'c000160-0000-4000-b000-000000009763',
  'Se&ntilde;ala la respuesta correcta sobre las estructuras del SNC:',
  34,
  '[{"id":"20929","text":"El cerebelo se encarga de la coordinaci&oacute;n de movimientos y aprendizaje motor"},{"id":"20928","text":"El dienc&eacute;falo se encuentra formado por la hip&oacute;fisis, la gl&aacute;ndula pineal, la corteza cerebral y los ganglios basales"},{"id":"20930","text":"El hipocampo se encarga de modular las funciones motoras"},{"id":"20931","text":"El bulbo raqu&iacute;deo forma parte del dienc&eacute;falo"}]',
  '20929',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x35-0000-4000-b000-000000009799',
  'c000160-0000-4000-b000-000000009763',
  'La energ&iacute;a requerida por la bomba Na+/K+ de la membrana nerviosa proviene del ATP. En las neuronas, esta energ&iacute;a proviene casi exclusivamente del metabolismo del ox&iacute;geno y:',
  35,
  '[{"id":"20934","text":"Glucosa"},{"id":"20932","text":"Amino&aacute;cidos"},{"id":"20933","text":"Acidos grasos"},{"id":"20935","text":"Prote&iacute;nas"}]',
  '20934',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x36-0000-4000-b000-000000009800',
  'c000160-0000-4000-b000-000000009763',
  'Se&ntilde;ala la afirmaci&oacute;n incorrecta:',
  36,
  '[{"id":"20936","text":"La velocidad de conducci&oacute;n de los potenciales de acci&oacute;n es menor en los nervios mielinizados que en los no mielinizados"},{"id":"20937","text":"En la conducci&oacute;n saltatoria de los potenciales de acci&oacute;n, parecen que estos saltan funcionalmente de un n&oacute;dulo de Ranvier a otro"},{"id":"20938","text":"Los potenciales de acci&oacute;n son de igual magnitud en el segmento inicial y en el extremo del ax&oacute;n"},{"id":"20939","text":"La repolarizaci&oacute;n de la c&eacute;lula ocurre gracias al cierre de canales de Na+ y la apertura de canales de K+"}]',
  '20936',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x37-0000-4000-b000-000000009801',
  'c000160-0000-4000-b000-000000009763',
  'En relaci&oacute;n al sistema nervioso parasimp&aacute;tico es correcto afirmar que:',
  37,
  '[{"id":"20943","text":"Tanto las fibras preganglionares como postganglionares son colin&eacute;rgicas"},{"id":"20940","text":"Todas sus fibras preganglionares son adren&eacute;rgicas"},{"id":"20941","text":"En el m&uacute;sculo esquel&eacute;tico las fibras postganglionares liberan noradrenalina"},{"id":"20942","text":"En general, sus fibras postganglionares son adren&eacute;rgicas"}]',
  '20943',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x38-0000-4000-b000-000000009802',
  'c000160-0000-4000-b000-000000009763',
  'Al tratar pacientes cr&iacute;ticos con l&iacute;quidos intravenosos, &iquest;qu&eacute; dos iones son m&aacute;s importantes para el potencial de la membrana nerviosa?',
  38,
  '[{"id":"20945","text":"Na+ y K+"},{"id":"20944","text":"Na+ y Cl-"},{"id":"20946","text":"Ca2+ y K+"},{"id":"20947","text":"Ca2+ y Cl-"}]',
  '20945',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x39-0000-4000-b000-000000009803',
  'c000160-0000-4000-b000-000000009763',
  'Sobre las neuronas podemos afirmar que:',
  39,
  '[{"id":"20948","text":"El conjunto de ax&oacute;n y vaina de mielina forman la fibra nerviosa"},{"id":"20949","text":"Las dendritas conducen el impulso desde el cuerpo celular hasta la terminal presin&aacute;ptica"},{"id":"20950","text":"Los neurotransmisores abandonan la terminal presin&aacute;ptica por endocitosis"},{"id":"20951","text":"Las neuronas eferentes son iguales en el sistema nerviosos aut&oacute;nomo y en el sistema nervioso voluntario"}]',
  '20948',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x40-0000-4000-b000-000000009804',
  'c000160-0000-4000-b000-000000009763',
  'En relaci&oacute;n a la contracci&oacute;n del m&uacute;sculo esquel&eacute;tico podemos afirmar que:',
  40,
  '[{"id":"20955","text":"En la placa motora las neuronas motoras liberan acetilcolina"},{"id":"20952","text":"El ret&iacute;culo sarcopl&aacute;smico absorbe Ca2+ cuando el m&uacute;sculo est&aacute; contra&iacute;do"},{"id":"20953","text":"Los t&uacute;bulos T absorben Ca2+ cuando el m&uacute;sculo se encuentra relajado"},{"id":"20954","text":"Durante la contracci&oacute;n los filamentos delgados de actina no se acortan mientras que los filamentos gruesos de miosina si"}]',
  '20955',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x41-0000-4000-b000-000000009805',
  'c000160-0000-4000-b000-000000009763',
  'En una neurona podemos afirmar que:',
  41,
  '[{"id":"20957","text":"Los neurotransmisores pueden generar un potencial postsin&aacute;ptico excitatorio provocando la entrada de Na+ hacia el interior de la neurona postsin&aacute;ptica"},{"id":"20956","text":"La liberaci&oacute;n de K+ permite activar el complejo calmodulina-prote&iacute;na-quinasa"},{"id":"20958","text":"Cuando el potencial de acci&oacute;n llega a la terminal ax&oacute;nica acciona canales de Ca2+ que permiten la salida del calcio de la neurona"},{"id":"20959","text":"Los neurotransmisores pueden generar un potencial postsin&aacute;ptico inhibitorio provocando la salida de Cl- desde el interior de la neurona postsin&aacute;ptica"}]',
  '20957',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x42-0000-4000-b000-000000009806',
  'c000160-0000-4000-b000-000000009763',
  'En relaci&oacute;n al sistema nervioso, se&ntilde;ala la respuesta correcta:',
  42,
  '[{"id":"20962","text":"Las neuronas aferentes transmiten impulsos desde los receptores hacia el sistema nervioso central"},{"id":"20960","text":"Los ganglios nerviosos forman parte del sistema nervioso central"},{"id":"20961","text":"Compuesto mayoritariamente por neuronas"},{"id":"20963","text":"Las fibras amiel&iacute;nicas son propias del sistema nervioso som&aacute;tico"}]',
  '20962',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x43-0000-4000-b000-000000009807',
  'c000160-0000-4000-b000-000000009763',
  '&iquest;Cu&aacute;l de las siguientes estructuras NO es propia del telenc&eacute;falo?',
  43,
  '[{"id":"20964","text":"Hipot&aacute;lamo"},{"id":"20965","text":"Corteza cerebral"},{"id":"20966","text":"Ganglios basales"},{"id":"20967","text":"Hipocampo"}]',
  '20964',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x44-0000-4000-b000-000000009808',
  'c000160-0000-4000-b000-000000009763',
  'Indica cu&aacute;l de las siguientes afirmaciones NO es caracter&iacute;stica del sistema nervioso parasimp&aacute;tico:',
  44,
  '[{"id":"20970","text":"Act&uacute;a como un sistema de activaci&oacute;n en masa"},{"id":"20968","text":"Sus axones preganglionares son m&aacute;s largos que los postganglionares"},{"id":"20969","text":"Todas sus fibras son colin&eacute;rgicas"},{"id":"20971","text":"La mayor parte de sus fibras se encuentran en el nervio vago"}]',
  '20970',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x45-0000-4000-b000-000000009809',
  'c000160-0000-4000-b000-000000009763',
  '¿Cómo afecta un exceso de los siguientes neurotransmisores en el organismo? Señala la afirmación correcta',
  45,
  '[{"id":"20974","text":"Un exceso de dopamina puede causar esquizofrenia"},{"id":"20972","text":"Un exceso de glutamato da lugar a problemas respiratorios, convulsiones y discapacidad intelectual"},{"id":"20973","text":"Un exceso de acetilcolina promueve el Alzheimer o la ELA"},{"id":"20975","text":"El exceso de endorfinas dar&aacute; lugar a ansiedad, depresi&oacute;n y comportamientos obsesivos - compulsivos"},{"id":"20976","text":"."}]',
  '20974',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x46-0000-4000-b000-000000009810',
  'c000160-0000-4000-b000-000000009763',
  '&iquest;Los axones de que neurona forman el componente somatico del Sistema Nervioso Periferico?',
  46,
  '[{"id":"20977","text":"a. Neuronas motoras inferiores"},{"id":"20978","text":"b. Neuronas motoras superiores"},{"id":"20979","text":"c. Neuronas simpaticas y parasimpaticas"},{"id":"20980","text":"d. Neuronas sensitivas"}]',
  '20977',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x47-0000-4000-b000-000000009811',
  'c000160-0000-4000-b000-000000009763',
  '&iquest;C&oacute;mo se inicia el potencial de accion de una neurona',
  47,
  '[{"id":"20981","text":"a. Un estimulo que supera el umbral excitario provoca una despolarizaci&oacute;n por la entrada de Na al interior de la celula."},{"id":"20982","text":"b. Un estimulo que alcanzar el centro gatillo del axon repolarizaci&oacute;n la celula por la salida de potasio."},{"id":"20983","text":"c. Un estimulo que supera el umbral de excitaci&oacute;n genera la entrada de K+ al interior de la celula y por tanto su despolarizacion."},{"id":"20984","text":"d. Un estimulo mecanico, fisico o quimico genera la excitaci&oacute;n y a continuacion la salida del Na de la celula produce una despolarizaci&oacute;n"}]',
  '20981',
  '2026-04-27 17:01:04'
);

INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)
VALUES (
  'd160x48-0000-4000-b000-000000009812',
  'c000160-0000-4000-b000-000000009763',
  'Identifica la respuesta que señala características de la activación del sistema nervioso autónomo simpático:',
  48,
  '[{"id":"20986","text":"b. Estimulo de la secrecion de las glandulas sudoriparas y broncodilatacion"},{"id":"20985","text":"a. Disminuye la frecuencia cardiaca y broncoconstriccion"},{"id":"20987","text":"c. Estimulo de la motilidad intestinal y de la secrecion de las glandulas salivares"},{"id":"20988","text":"d. Vasodilatacion periferica y glucogenesis"}]',
  '20986',
  '2026-04-27 17:01:04'
);
