# Migration Data Format Reference

> Internal reference for developers working on the migration pipeline.  
> For the client-facing template, see [migration-message-academy.md](./migration-message-academy.md).

---

## Excel File Structure

The importer reads a `.xlsx` file with two sheets:

### Sheet 1: `Usuarios`

| Column | Required | Values / Notes |
|---|---|---|
| `email` | ✅ | Must be unique and valid email |
| `nombre` | ✅ | First name |
| `apellido` | ✅ | Last name |
| `rol` | ✅ | `STUDENT`, `TEACHER`, or `ACADEMY` |
| `clases` | ❌ | Comma-separated class names. Use quotes if multiple: `"Math,English"` |

### Sheet 2: `Clases`

| Column | Required | Values / Notes |
|---|---|---|
| `nombre` | ✅ | Unique class name |
| `fechaInicio` | ❌ | `DD/MM/YYYY` format |
| `precio` | ❌ | Numeric, e.g. `50` or `200` |
| `tipoPrecio` | ❌ | `MENSUAL` or `UNICO` |
| `profesorEmail` | ❌ | Must match a `TEACHER` email in Usuarios sheet |
| `descripcion` | ❌ | Free text |
| `universidad` | ❌ | Free text |
| `carrera` | ❌ | Free text |
| `maxEstudiantes` | ❌ | Integer |
| `whatsapp` | ❌ | Full URL to WhatsApp group |

---

## Processing Logic

### User creation
1. `normalizeUserRows()` in [migration-utils.ts](../../src/components/admin/migration-utils.ts) trims and validates each row
2. Users are created with `role = row.rol` and a random temporary password
3. ClassEnrollments are created by matching `clases` column values against class names

### Class creation
1. `normalizeClassRows()` in [migration-utils.ts](../../src/components/admin/migration-utils.ts) reads the Clases sheet (if present)
2. Classes are upserted by `name` — if a class with that name already exists in the academy it is updated, otherwise created
3. `tipoPrecio` maps to the DB enum: `MENSUAL` → `monthly`, `UNICO` → `one_time`

---

## Code Entrypoints

| File | Purpose |
|---|---|
| [src/components/admin/migration-utils.ts](../../src/components/admin/migration-utils.ts) | Row normalization, type definitions |
| [workers/akademo-api/src/routes/admin.ts](../../workers/akademo-api/src/routes/admin.ts) | `/admin/migrate` POST handler |
| [src/components/admin/MigrationSteps.tsx](../../src/components/admin/MigrationSteps.tsx) | UI showing expected column names |

---

## Common Issues

| Issue | Cause | Fix |
|---|---|---|
| "Class not found" error | Class name in `clases` column doesn't match any class name in Clases sheet or DB | Ensure exact string match (case-sensitive) |
| Teacher not assigned | `profesorEmail` doesn't match a TEACHER row in Usuarios sheet | Add teacher row or fix typo |
| Invalid date | `fechaInicio` not in `DD/MM/YYYY` format | Normalize to `DD/MM/YYYY` before upload |
| Duplicate key error | Same `email` appears twice | Deduplicate rows before upload |
