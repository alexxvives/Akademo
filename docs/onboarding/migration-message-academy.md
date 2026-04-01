# Mensaje de Migración para la Academia

> **Cómo usar**: Copia y pega el mensaje de abajo en un email. Adjunta `Users_template.xlsx` o `Users_example.xlsx` de esta misma carpeta.

---

**Asunto**: Migración de datos a AKADEMO — plantilla Excel

---

Hola **[nombre]**,

Para migrar vuestros datos a AKADEMO el proceso es muy sencillo. Solo necesitáis enviarnos **un archivo Excel** y nosotros importamos profesores, estudiantes y clases automáticamente.

Os adjunto una plantilla vacía y un archivo de ejemplo para que veáis el formato esperado.

---

**El Excel tiene dos pestañas:**

**Pestaña 1 — Usuarios** (obligatoria)

| email | nombre | apellido | rol | clases |
|---|---|---|---|---|
| maria.lopez@gmail.com | María | López | TEACHER | "Matemáticas 1,Inglés B2" |
| juan.garcia@gmail.com | Juan | García | STUDENT | "Matemáticas 1,Inglés B2" |
| ana.martinez@gmail.com | Ana | Martínez | STUDENT | "Matemáticas 1" |

- **rol**: `STUDENT` o `TEACHER`
- **clases**: nombres separados por comas. Si está en varias, usar comillas: `"Matemáticas 1,Inglés B2"`

**Pestaña 2 — Clases** (obligatoria)

| nombre | fechaInicio | precio | cuotas (opcional) | profesorEmail | descripcion | universidad | carrera | maxEstudiantes | whatsapp |
|---|---|---|---|---|---|---|---|---|---|
| Matemáticas 1 | 01/09/2026 | 500 | 10 | maria.lopez@gmail.com | Álgebra y cálculo | UCM | Ingeniería | 30 | |
| Inglés B2 | 15/09/2026 | 200 | | pedro.ruiz@gmail.com | | | | 20 | https://chat.whatsapp.com/EVwr6bNsKng5Rk965ZuM4U |

Solo `nombre` es obligatorio en cada fila. El resto de columnas podéis dejarlo vacío.
- `precio`: precio **total** del curso (ej: 500 = 500€ en total)
- `cuotas`: número de cuotas mensuales. Si vacío o ausente → pago único. Si 10 → el alumno paga 500/10 = 50€/mes
- `profesorEmail`: debe coincidir con un email de la pestaña Usuarios

---

**Importante:**
- Los nombres de las clases en la columna **clases** deben coincidir exactamente con los de la columna **nombre** de la pestaña Clases (o con los ya creados en AKADEMO).
- Usad el email real de cada alumno/profesor — les enviaremos las credenciales a ese correo.
- No incluyáis contraseñas, las generamos automáticamente.

**Qué pasa después:**
1. Nos enviáis el Excel relleno
2. Nosotros lo importamos
3. Os devolvemos las contraseñas temporales de cada usuario
4. Vosotros las enviáis a cada alumno/profesor
5. Entran, cambian la contraseña y ya tienen acceso a sus clases

---

Un saludo,
**[Tu nombre]**

---
---

## Referencia técnica (desarrolladores)

### Columnas reconocidas

**Usuarios** — el parser acepta los nombres en minúsculas sin espacios:

| Columna en Excel | Obligatoria | Alias aceptados |
|---|---|---|
| `email` | ✅ | — |
| `nombre` | ✅ | `firstname` |
| `apellido` | ✅ | `apellidos`, `lastname` |
| `rol` | ✅ | `role` |
| `clases` | ✅ | `classes`, `classnames` |
| `pagado` | ❌ | `paid`, `pago recibido`, `ya pagado` |

> `pagado = true/sí/1/x`: indica que el alumno ya pagó fuera del sistema (efectivo, transferencia). Se crea automáticamente un pago COMPLETADO por el importe adeudado, por lo que no aparecerá como pendiente de cobro.

**Clases:**

| Columna | Obligatoria | Alias aceptados |
|---|---|---|
| `nombre` | ✅ | `name`, `clase`, `asignatura` |
| `precio` | ✅ | `price` |
| `fechaInicio` | ✅ | `startdate`, `inicio`, `fecha` |
| `cuotas` | ❌ | `numcuotas`, `installments`, `numpagos`, `pagos` |
| `profesorEmail` | ❌ | `teacheremail`, `profesor` |
| `descripcion` | ❌ | `description` |
| `universidad` | ❌ | `university` |
| `carrera` | ❌ | `degree`, `programa` |
| `maxEstudiantes` | ❌ | `maxstudents`, `capacidad` |
| `whatsapp` | ❌ | `whatsapplink` |

> `precio` y `fechaInicio` son obligatorios para crear una clase nueva. `cuotas` es opcional: si vacío → pago único; si número → `monthlyPrice = precio/cuotas`, `oneTimePrice = precio`.

El parser strip `(opcional)` de los encabezados antes de hacer matching, por lo que los archivos con ese sufijo también funcionan.

### Lógica de precios al importar una clase

| `precio` | `cuotas` | `monthlyPrice` | `oneTimePrice` | Resultado |
|---|---|---|---|---|
| 500 | 10 | 50€ | 500€ | Puede pagar mensual (50€/mes × 10) o único (500€) |
| 200 | vacío / 0 | null | 200€ | Solo pago único |

Los alumnos son enrolados con `paymentFrequency = 'MONTHLY'` si la clase tiene `monthlyPrice`, sino `ONE_TIME`.

### Entrypoints

| Archivo | Propósito |
|---|---|
| [src/components/admin/migration-utils.ts](../../src/components/admin/migration-utils.ts) | `normalizeRows`, `normalizeClassRows`, `parseCSV` |
| [workers/akademo-api/src/routes/admin.ts](../../workers/akademo-api/src/routes/admin.ts) | `POST /admin/migrate` |
| [src/components/admin/MigrationSteps.tsx](../../src/components/admin/MigrationSteps.tsx) | UI del wizard de importación |

### Errores comunes

| Error | Causa | Solución |
|---|---|---|
| "Class not found" | Nombre de clase no coincide exactamente | Comprobar mayúsculas/espacios |
| Profesor no asignado | `profesorEmail` no coincide con ningún TEACHER en el Excel | Corregir email o añadir fila del profesor |
| Fecha inválida | `fechaInicio` no está en formato `DD/MM/YYYY` | Cambiar formato |
| Duplicate key | El mismo `email` aparece dos veces | Deduplicar filas |
