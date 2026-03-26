# Mensaje de Migración para la Academia

> **Cómo usar**: Copia y pega este mensaje en un email o WhatsApp. Si necesitas PDF, abre este archivo en VS Code y usa una extensión de Markdown→PDF, o pégalo en Google Docs.

---

Hola **[nombre]**,

Para migrar vuestros datos a **AKADEMO**, el proceso es muy sencillo. Solo necesitáis enviarnos **un archivo Excel** y nosotros importamos profesores, estudiantes y clases automáticamente.

---

## Lo que necesitamos de vosotros:

### Un archivo Excel (.xlsx) con dos pestañas

Podéis descargar la **plantilla de ejemplo** directamente desde AKADEMO (panel de administración → Importar usuarios → Descargar plantilla).

---

#### Pestaña 1: **Usuarios** (obligatoria)

| email | nombre | apellido | rol | clases |
|---|---|---|---|---|
| maria.lopez@gmail.com | María | López | TEACHER | "Matemáticas 1,Inglés B2" |
| pedro.ruiz@gmail.com | Pedro | Ruiz | TEACHER | "Física 2" |
| juan.garcia@gmail.com | Juan | García | STUDENT | "Matemáticas 1,Inglés B2" |
| ana.martinez@gmail.com | Ana | Martínez | STUDENT | "Matemáticas 1" |

- **rol**: `STUDENT` o `TEACHER`
- **clases**: nombres separados por comas. Si está en varias clases, usar comillas: `"Matemáticas 1,Inglés B2"`

---

#### Pestaña 2: **Clases** (opcional — si queréis que las creemos automáticamente)

| nombre | fechaInicio | precio | tipoPrecio | profesorEmail | descripcion | universidad | carrera | maxEstudiantes | whatsapp |
|---|---|---|---|---|---|---|---|---|---|
| Matemáticas 1 | 01/09/2026 | 50 | MENSUAL | maria.lopez@gmail.com | Álgebra y cálculo | UCM | Ingeniería | 30 | |
| Inglés B2 | 15/09/2026 | 200 | UNICO | pedro.ruiz@gmail.com | Inglés B2 | | | 20 | https://chat.whatsapp.com/EVwr6bNsKng5Rk965ZuM4U |
| Física 2 | 01/09/2026 | 40 | MENSUAL | pedro.ruiz@gmail.com | | UAM | Física | | |

**Solo `nombre` es obligatorio.** El resto de columnas son opcionales — podéis incluir o dejar vacías las que no apliquen:
- `tipoPrecio`: `MENSUAL` (cobro mensual) o `UNICO` (pago único)
- `profesorEmail`: debe coincidir con un email de la pestaña Usuarios (rol TEACHER)
- `maxEstudiantes`: número máximo de alumnos permitidos
- `whatsapp`: enlace al grupo de WhatsApp de la clase
- Si dejáis esta pestaña **vacía o no la incluís**, las clases deben existir ya en AKADEMO antes de importar.
- Si la incluís, **las clases se crean automáticamente** durante la importación.

---

## ⚠️ MUY IMPORTANTE:

- Los nombres de las clases en la columna **clases** (pestaña Usuarios) deben coincidir **exactamente** con los nombres de la columna **nombre** (pestaña Clases), o con los nombres ya creados en AKADEMO.
- El email debe ser el **email real** del alumno/profesor, ya que les enviaremos las credenciales.
- **No incluyáis contraseñas** — nosotros generamos contraseñas temporales automáticamente.

---

## Qué pasa después:

1. Nos enviáis el archivo Excel
2. Nosotros lo importamos desde el panel de administración
3. Os devolvemos un archivo con las **contraseñas temporales** de cada usuario
4. Vosotros envíais a cada alumno/profesor su email y contraseña temporal
5. Ellos entran, cambian su contraseña (recomendado), y ya tienen acceso a sus clases

---

## Preguntas que necesitamos responder:

1. ¿Cuántos alumnos y profesores tenéis aproximadamente?
2. ¿Cobráis actualmente a los alumnos? ¿Cuánto por clase/mes o pago único?
3. ¿Queréis mantener vuestra web de WordPress o preferís usar las páginas públicas de AKADEMO?
4. ¿Utilizáis cuestionarios/quizzes en Moodle? ¿Es importante para vosotros?

---

Un saludo,
**[Tu nombre]**
