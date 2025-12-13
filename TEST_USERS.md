# ACADEMO - Test Users & Approval System

## Deployment
- URL: https://academy-hive.alexxvives.workers.dev

## Recent Updates
- ✅ Navbar now maintains glass background at all times, only text color changes when crossing hero section
- ✅ Academy role option added to registration form (3 buttons: Student, Teacher, Academy)
- ✅ Password authentication includes bypass for seed users with bcrypt hashes (development mode)

## Test Users
All users have the password: `password`

### Admin
- **Email**: admin@academo.com
- **Role**: ADMIN
- **Can**: Manage everything

### Academy Users
1. **Email**: academy1@gmail.com
   - **Name**: Academy One
   - **Role**: ACADEMY
   - **Academy**: Academy One Institution
   
2. **Email**: academy2@gmail.com
   - **Name**: Academy Two
   - **Role**: ACADEMY
   - **Academy**: Academy Two Institution

### Teachers
1. **Email**: teacher1@gmail.com
   - **Name**: Teacher One
   - **Role**: TEACHER
   
2. **Email**: teacher2@gmail.com
   - **Name**: Teacher Two
   - **Role**: TEACHER

### Students
1. **Email**: student1@gmail.com
   - **Name**: Student One
   - **Role**: STUDENT
   
2. **Email**: student2@gmail.com
   - **Name**: Student Two
   - **Role**: STUDENT

## Approval System Workflow

### Teacher → Academy (Membership Request)
1. Login as a teacher (teacher1@gmail.com or teacher2@gmail.com)
2. Navigate to teacher dashboard
3. Request to join an academy (Academy One or Academy Two)
4. **API**: `POST /api/requests/teacher`
   ```json
   {
     "academyId": "acad-001",
     "message": "Optional message"
   }
   ```

### Academy Approves Teacher
1. Login as academy owner (academy1@gmail.com or academy2@gmail.com)
2. View pending teacher requests
3. Approve or reject teacher request
4. **API**: `POST /api/approvals/academy`
   ```json
   {
     "requestId": "mem-xxx",
     "action": "approve" // or "reject"
   }
   ```
5. **API GET**: `/api/approvals/academy` - Get pending requests

### Student → Teacher (Enrollment Request)
1. Login as student (student1@gmail.com or student2@gmail.com)
2. Browse academies: `GET /api/explore/academies`
3. View teachers in academy: `GET /api/explore/academies/[id]/teachers`
4. Request to join a teacher's class
5. **API**: `POST /api/requests/student`
   ```json
   {
     "academyId": "acad-001",
     "teacherId": "teacher-001",
     "message": "Optional message"
   }
   ```

### Teacher Approves Student
1. Login as teacher
2. View pending student enrollment requests
3. Approve or reject enrollment
4. **API**: `POST /api/approvals/teacher`
   ```json
   {
     "enrollmentId": "enr-xxx",
     "action": "approve" // or "reject"
   }
   ```
5. **API GET**: `/api/approvals/teacher` - Get pending requests

## Database Schema Changes

### AcademyMembership Table
- Added `status` column: 'PENDING' | 'APPROVED' | 'REJECTED'
- Added `requestedAt` timestamp
- Added `approvedAt` timestamp

### ClassEnrollment Table
- Added `status` column: 'PENDING' | 'APPROVED' | 'REJECTED'
- Added `requestedAt` timestamp
- Added `approvedAt` timestamp

## API Routes Created

### Exploration Routes
- `GET /api/explore/academies` - List all academies (for students/teachers)
- `GET /api/explore/academies/[id]/teachers` - List approved teachers in academy

### Request Routes
- `POST /api/requests/teacher` - Teacher requests to join academy
- `GET /api/requests/teacher` - Get teacher's pending academy requests
- `POST /api/requests/student` - Student requests to join teacher's class

### Approval Routes
- `POST /api/approvals/academy` - Academy approves/rejects teacher
- `GET /api/approvals/academy` - Get pending teacher requests for academy
- `POST /api/approvals/teacher` - Teacher approves/rejects student
- `GET /api/approvals/teacher` - Get pending student requests for teacher

## UI Improvements Completed

### Landing Page (Tolerancia Cero Section)
- Fixed card heights to be equal using CSS flexbox
- All three cards now stretch to match the tallest
- Applied `h-full`, `flex flex-col`, and `flex-1` classes

## Next Steps (Not Yet Implemented)
1. Create student UI to browse academies and request to join teachers
2. Create teacher UI to select academy and view pending students
3. Create academy UI to view and approve/reject teacher requests
4. Add notifications for pending requests
5. Add request status badges in dashboards
