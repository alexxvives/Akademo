# Document Signing Setup

## PDF Location
Place your consent document PDF at:
```
/public/legal/consent.pdf
```

## How It Works
1. When a student requests to join a class, their enrollment status is set to `PENDING` and `documentSigned = 0`
2. When they try to access lesson content, a modal appears showing the PDF
3. After reading, they check a checkbox and click "Firmar Documento"
4. This calls `/api/enrollments/sign-document` which sets `documentSigned = 1`
5. Students need **BOTH**:
   - `documentSigned = 1` (they signed the document)
   - `status = 'APPROVED'` (teacher approved their enrollment)

## Access Control
Students are blocked from accessing lesson content if either condition is not met:
- If `documentSigned = 0`: Shows document signing modal
- If `status = 'PENDING'`: Shows "waiting for teacher approval" warning

These checks happen in parallel - order doesn't matter. Students can sign the document before or after teacher approval, but they need both to access content.

## Database Schema
```sql
ALTER TABLE ClassEnrollment ADD COLUMN documentSigned INTEGER DEFAULT 0;
-- 0 = not signed, 1 = signed
```

## Files Changed
- `/migrations/0012_document_signing.sql` - Database migration
- `/src/app/api/enrollments/sign-document/route.ts` - API endpoint to mark document as signed
- `/src/components/DocumentSigningModal.tsx` - Modal component with PDF viewer
- `/src/app/dashboard/student/class/[id]/page.tsx` - Added signing logic and modal
- `/src/app/api/classes/[id]/route.ts` - Returns documentSigned status with class data
