# AKADEMO — Migration Data Format

You handle the import. Ask the client to send their data in two Excel files (.xlsx) using the format below.

Before sending anything, ask them separately (not in the spreadsheet):

> **"¿Desde qué fecha queréis empezar a cobrar las cuotas a través de la plataforma?"**

This single date goes into `nextPaymentDue` for every student with a monthly plan. All existing students are considered already paid up to this date.

---

## File 1 — Classes.xlsx

One row per class.

| Column | Required | Notes |
|---|---|---|
| `name` | YES | Unique. Students and teachers reference this exactly. |
| `description` | | |
| `monthlyPrice` | | Monthly fee in EUR. Leave blank if the class is one-time payment only. |
| `totalInstallments` | | How many monthly payments the class has in total (e.g. 9 for an academic year). Only relevant if `monthlyPrice` is set. Leave blank if open-ended. |
| `oneTimePrice` | | One-time fee in EUR. Leave blank if monthly only. |
| `maxStudents` | | Leave blank for unlimited. |
| `whatsappGroupLink` | | Optional. |

**Do not ask for `startDate`** — replaced by the single billing start date question below.

Example:

```
name,description,monthlyPrice,totalInstallments,oneTimePrice,maxStudents,whatsappGroupLink
Matemáticas Selectividad,Preparación PAU,89,9,,20,https://chat.whatsapp.com/xxx
Física Selectividad,,75,9,,,
Inglés B2,Cambridge preparation,,,250,,
Química + Biología,,65,10,,15,
```

---

## File 2 — Users.xlsx

One row per person. Teachers and students go in the same file — the `role` column separates them.

| Column | Required | Notes |
|---|---|---|
| `firstName` | YES | |
| `lastName` | YES | |
| `email` | YES | Unique. Becomes their login. |
| `role` | YES | `STUDENT` or `TEACHER` |
| `classNames` | YES | Comma-separated. Must match names in File 1 exactly. |
| `paymentFrequency` | Students only | `MONTHLY` or `ONE_TIME`. Leave blank if not tracking payments yet. |

Example:

```
firstName,lastName,email,role,classNames,paymentFrequency
Ana,García,ana.garcia@gmail.com,TEACHER,Matemáticas Selectividad,
Pedro,Ruiz,pedro.ruiz@gmail.com,TEACHER,"Física Selectividad,Inglés B2",
Carlos,López,carlos@gmail.com,STUDENT,Matemáticas Selectividad,MONTHLY
María,Fernández,maria.f@gmail.com,STUDENT,"Matemáticas Selectividad,Física Selectividad",MONTHLY
Juan,Martínez,juan.m@gmail.com,STUDENT,Inglés B2,ONE_TIME
```

---

## What to do on your end once you have the files

1. **Create classes first** from File 1 via the admin panel (or API). Note each class name exactly as entered.
2. **Run bulk import** with File 2. The importer matches `classNames` against existing class names (case-insensitive, trims spaces).
3. **Set `nextPaymentDue`** on all MONTHLY enrollments to the billing start date the client gave you.
4. **Mark ONE_TIME students as paid** (`paymentStatus = PAID`) — they paid before migrating so they arrive with a clean slate.
5. Check the import response for `skipped` entries (duplicate emails or unmatched class names) and handle manually.

---

## Email to Send the Client

---

Asunto: Migración a AKADEMO — datos que necesitamos

Hola [nombre],

Para completar la migración de vuestra academia a AKADEMO necesitamos que nos enviéis dos archivos Excel:

**Archivo 1 — Clases.xlsx**
Una fila por clase con estas columnas:
- Nombre de la clase
- Descripción (opcional)
- Precio mensual (si la clase tiene cuota mensual)
- Número de cuotas totales (ej. 9 si es un curso de septiembre a mayo; dejad en blanco si no tiene fin)
- Precio único (si la clase tiene pago único)
- Máximo de alumnos (opcional, dejad en blanco si no hay límite)
- Enlace al grupo de WhatsApp (opcional)

**Archivo 2 — Usuarios.xlsx**
Una fila por persona (profesores y alumnos juntos) con estas columnas:
- Nombre
- Apellidos
- Email (será su usuario de acceso)
- Rol: STUDENT o TEACHER
- Clases en las que está (separadas por coma si son varias), con el mismo nombre exacto que en el Archivo 1
- Tipo de pago (solo alumnos): MONTHLY si paga cuota mensual, ONE_TIME si hizo pago único

Además, decidnos: **¿desde qué fecha queréis que la plataforma empiece a generar los cobros mensuales?** Aplicaremos esa fecha a todos los alumnos con cuota mensual.

Los alumnos recibirán un email automático con sus credenciales de acceso en cuanto hagamos la importación.

Cualquier duda, estamos aquí.

Un saludo,
[tu nombre]

---
