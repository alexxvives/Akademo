# Auditoría UX Móvil — AKADEMO (390x844)

## Problemas detectados

### Estudiante / Mis Asignaturas (`/dashboard/student/subjects`) — `src/app/dashboard/student/subjects/ClassCard.tsx`
- **CRÍTICO**: Header de cada tarjeta es `flex items-center justify-between` siempre en fila → el botón "Abandonar Clase" pisa el título y tags. Título se rompe en líneas (ej. "Clase (pago mensual)").
- **CRÍTICO**: Badges de universidad/carrera se renderizan en línea con el título, generando colisión y wrapping feo.
- **MEDIO**: Tooltips (`group-hover/payment`, `group-hover/shield`) usan `-bottom-8` con `z-10` y `whitespace-nowrap` → en móvil se quedan visibles al tocar el icono y desbordan tapando la siguiente tarjeta.
- **MEDIO**: Botón "+ Unirse a Más Clases" ocupa medio ancho y se ve desproporcionado.

### Otras páginas (pendiente capturar)
