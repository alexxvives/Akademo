# AKADEMO - Complete Component × Role Matrix

## 📊 Feature Availability by Role

| Feature/Page | Student | Teacher | Academy | Admin | Implementation |
|---|:---:|:---:|:---:|:---:|---|
| **Dashboard (Home)** | ❌ Redirect | ⚠️ Custom | ✅ Shared | ✅ Shared | `DashboardPage` (academy/admin), custom teacher |
| **Subjects/Classes** | ⚠️ Custom | ✅ Shared | ✅ Shared | ✅ Shared | `ClassesPage` (teacher/academy/admin), custom student |
| **Subject/Class Detail** | ⚠️ Custom | ✅ Shared | ✅ Shared | ✅ Shared | `ClassDetailPage` (teacher/academy/admin), custom student |
| **Students/Progress** | ❌ N/A | ✅ Shared | ✅ Shared | ✅ Shared | `StudentsPage` |
| **Teachers** | ❌ N/A | ❌ N/A | ✅ Shared | ✅ Shared | `TeachersPage` |
| **Assignments** | ⚠️ Custom | ⚠️ Custom | ✅ Shared | ✅ Shared | `AssignmentsPage` (academy/admin), separate student/teacher |
| **Grades** | ❌ N/A | ✅ Shared | ✅ Shared | ✅ Shared | `GradesPage` (teacher/academy/admin) |
| **Feedback** | ❌ N/A | ✅ Shared | ✅ Shared | ✅ Shared |  `FeedbackPage` |
| **Streams** | ❌ N/A | ✅ Shared | ✅ Shared | ✅ Shared | `StreamsPage` (teacher/academy/admin) |
| **Reports** | ❌ N/A | ✅ Shared | ✅ Shared | ✅ Shared | `ReportsPage` (placeholder) |
| **Payments/Pagos** | ❌ N/A | ❌ N/A | ✅ Shared | ✅ Shared | `PaymentsPage` |
| **Profile** | ✅ Custom | ✅ Custom | ✅ Custom | ❌ N/A | Role-specific implementations |
| **Quizzes** | ✅ Unique | ❌ N/A | ❌ N/A | ❌ N/A | Student-only feature |
| **Live** | ✅ Unique | ❌ N/A | ❌ N/A | ❌ N/A | Student-only (view active streams) |
| **Lessons (List)** | ✅ Custom | ❌ N/A | ✅ Custom | ❌ N/A | Different purposes (view vs manage) |
| **Explore** | ✅ Unique | ❌ N/A | ❌ N/A | ❌ N/A | Student-only (discover academies) |
| **Grading** | ❌ N/A | ✅ Unique | ❌ N/A | ❌ N/A | Teacher-only (grade submissions) |
| **Academy Join** | ❌ N/A | ✅ Unique | ❌ N/A | ❌ N/A | Teacher-only (join academy) |
| **Revenue** | ❌ N/A | ❌ N/A | ✅ Unique | ❌ N/A | Academy-only analytics |
| **Accounts (Zoom)** | ❌ N/A | ❌ N/A | ❌ N/A | ✅ Unique | Admin-only |
| **Academies** | ❌ N/A | ❌ N/A | ❌ N/A | ✅ Unique | Admin-only |
| **Facturas** | ❌ N/A | ❌ N/A | ❌ N/A | ✅ Unique | Admin-only (invoices) |
| **Enrolled Academies** | ✅ Unique | ❌ N/A | ❌ N/A | ❌ N/A | Student-only |

### Legend:
- ✅ **Has Feature (Shared Component)** - Role has access via shared component
- ✅ **Unique** - Correctly unique to this role only
- ⚠️ **Custom** - Has feature but custom implementation (unification opportunity)
- ❌ **N/A** - Not applicable for this role

---

## 📁 Component Mapping

### Shared Components (in `src/components/shared/`)
| Component | Used By Roles | File |
|---|---|---|
| `DashboardPage` | Academy, Admin | `DashboardPage.tsx` |
| `ClassesPage` | Teacher, Academy, Admin | `ClassesPage.tsx` |
| `ClassDetailPage` | Teacher, Academy, Admin | `ClassDetailPage.tsx` |
| `StudentsPage` | Teacher, Academy, Admin | `StudentsPage.tsx` |
| `TeachersPage` | Academy, Admin | `TeachersPage.tsx` |
| `AssignmentsPage` | Academy, Admin | `AssignmentsPage.tsx` |
| `GradesPage` | Teacher, Academy, Admin | `GradesPage.tsx` |
| `FeedbackPage` | Teacher, Academy, Admin | `FeedbackPage.tsx` |
| `StreamsPage` | Teacher, Academy, Admin | `StreamsPage.tsx` |
| `ReportsPage` | Teacher, Academy, Admin | `ReportsPage.tsx` |
| `PaymentsPage` | Academy, Admin | `PaymentsPage.tsx` |

### Role-Specific Pages

#### Student (`src/app/dashboard/student/`)
- `page.tsx` - Redirects to /subjects  
- `subjects/page.tsx` - **Custom** (477 lines) - Enrolled classes with payment/signing modals  
- `subject/[id]/page.tsx` - **Custom** (787 lines) - Class detail view  
- `assignments/page.tsx` - **Custom** (680 lines) - Student assignment submission view  
- `profile/page.tsx` - **Custom** (292 lines) - Student profile  
- `quizzes/page.tsx` - Student-only feature  
- `live/page.tsx` - Student-only (active streams)  
- `lessons/page.tsx` - Recently released lessons  
- `explore/page.tsx` - Discover academies  
- `enrolled-academies/subjects/page.tsx` - All enrolled academies

#### Teacher (`src/app/dashboard/teacher/`)
- `page.tsx` - **Custom** (106 lines) - Teacher-specific dashboard  
- `subjects/page.tsx` - Uses `ClassesPage`  
- `subject/[slug]/page.tsx` - Uses `ClassDetailPage`  
- `students/page.tsx` - Uses `StudentsPage`  
- `assignments/page.tsx` - Uses `AssignmentsPage`  
- `grades/page.tsx` - Uses `GradesPage`  
- `feedback/page.tsx` - Uses `FeedbackPage`  
- `streams/page.tsx` - Uses `StreamsPage`  
- `reports/page.tsx` - Uses `ReportsPage`  
- `profile/page.tsx` - **Custom** (303 lines) - Teacher profile  
- `grading/[id]/page.tsx` - Teacher-only (grade assignment)  
- `academy-join/page.tsx` - Teacher-only join flow

#### Academy (`src/app/dashboard/academy/`)
- `page.tsx` - Uses `DashboardPage`  
- `subjects/page.tsx` - Uses `ClassesPage`  
- `subject/[slug]/page.tsx` - Uses `ClassDetailPage`  
- `students/page.tsx` - Uses `StudentsPage`  
- `teachers/page.tsx` - Uses `TeachersPage`  
- `assignments/page.tsx` - Uses `AssignmentsPage`  
- `grades/page.tsx` - Uses `GradesPage`  
- `feedback/page.tsx` - Uses `FeedbackPage`  
- `streams/page.tsx` - Uses `StreamsPage`  
- `reports/page.tsx` - Uses `ReportsPage`  
- `pagos/page.tsx` - Uses `PaymentsPage`  
- `revenue/page.tsx` - **Unique** - Revenue analytics  
- `lessons/page.tsx` - Academy lesson management  
- `profile/page.tsx` - **Custom** (1,230 lines) - Academy profile with Zoom/Stripe

#### Admin (`src/app/dashboard/admin/`)
- `page.tsx` - Uses `DashboardPage`  
- `subjects/page.tsx` - Uses `ClassesPage`  
- `subject/[slug]/page.tsx` - Uses `ClassDetailPage`  
- `students/page.tsx` - Uses `StudentsPage`  
- `teachers/page.tsx` - Uses `TeachersPage`  
- `assignments/page.tsx` - Uses `AssignmentsPage`  
- `grades/page.tsx` - Uses `GradesPage`  
- `feedback/page.tsx` - Uses `FeedbackPage`  
- `streams/page.tsx` - Uses `StreamsPage`  
- `reports/page.tsx` - Uses `ReportsPage`  
- `pagos/page.tsx` - Uses `PaymentsPage`  
- `academies/page.tsx` - **Unique** - Academy management  
- `accounts/page.tsx` - **Unique** - Zoom account management  
- `facturas/page.tsx` - **Unique** - Invoice management

---

## 🎯 Sharing Status

### ✅ Perfectly Shared (11 components)
These components successfully serve multiple roles with conditional logic:

1. **DashboardPage** - Academy + Admin  
2. **ClassesPage** - Teacher + Academy + Admin  
3. **ClassDetailPage** - Teacher + Academy + Admin  
4. **StudentsPage** - Teacher + Academy + Admin  
5. **TeachersPage** - Academy + Admin  
6. **AssignmentsPage** - Academy + Admin  
7. **GradesPage** - Teacher + Academy + Admin  
8. **FeedbackPage** - Teacher + Academy + Admin  
9. **StreamsPage** - Teacher + Academy + Admin  
10. **ReportsPage** - Teacher + Academy + Admin (placeholder)  
11. **PaymentsPage** - Academy + Admin

### ⚠️ Unification Opportunities (5 features)

1. **Subjects List** - Student has custom 477-line implementation vs shared `ClassesPage`  
2. **Subject Detail** - Student has custom 787-line implementation vs shared `ClassDetailPage`  
3. **Assignments** - Student (680L) and Teacher (custom) vs shared `AssignmentsPage`  
4. **Profile** - All 3 roles have custom implementations (292L + 303L + 1,230L)  
5. **Teacher Dashboard** - Custom 106-line page (low priority - acceptable as unique)

### ✅ Correctly Unique (10 features)
These are intentionally role-specific:

**Student-Only:**
- Quizzes  
- Live (active stream viewer)  
- Lessons (recent releases)  
- Explore (academy discovery)  
- Enrolled Academies

**Teacher-Only:**
- Grading (assignment grading interface)  
- Academy Join

**Academy-Only:**
- Revenue
- Lessons (management)

**Admin-Only:**
- Academies  
- Zoom Accounts  
- Facturas

---

## 📈 Current Statistics

| Metric | Count |
|---|---|
| **Total Shared Components** | 11 |
| **Total Role-Specific Pages** | ~50+ |
| **Roles Using Shared Components** | Teacher (10), Academy (11), Admin (11), Student (0) |
| **Unification Opportunities** | 5 major features |
| **Lines Saved So Far** | 572 (teacher reports + grades) |
| **Potential Additional Savings** | 4,874+ lines |

---

## 🔮 What's Next?

### High Priority Unifications:
1. **Student Subjects** → Use `ClassesPage` with student mode (~477 lines saved)  
2. **Student Subject Detail** → Use `ClassDetailPage` with read-only mode (~787 lines saved)  
3. **Student Assignments** → Enhance `AssignmentsPage` with submission UI (~680 lines saved)

### Medium Priority:
4. **Profile Pages** → Create shared `ProfilePage` with role-specific sections (~700-800 lines saved)

### Total Potential Savings: **~4,200 lines**

---

**Last Updated:** February 17, 2026  
**Maintained By:** AKADEMO Development Team
