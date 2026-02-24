# AKADEMO - Cross-Role Component Matrix

> Last updated: 2026-02-24 — auto-audited from actual page.tsx line counts (7L = shared wrapper)

## 🎨 Visual Overview: What's Shared vs What's Not

| Page/Feature              | Student         | Teacher         | Academy         | Admin           | Shared component | Status |
|---------------------------|-----------------|-----------------|-----------------|-----------------|------------------|--------|
| **Dashboard (Home)**      | Redirect (18L)  | Custom (138L)   | Shared ✅ (7L)  | Shared ✅ (7L)  | `DashboardPage`  | 🟡 Admin: global stats, no al día/atrasados |
| **Subjects/Classes List** | Custom (493L)   | Shared ✅ (7L)  | Shared ✅ (7L)  | Shared ✅† (7L) | `ClassesPage`    | ✅ Student sep.* Admin read-only† |
| **Subject/Class Detail**  | Custom (dyn)    | Shared ✅ (dyn) | Shared ✅ (dyn) | Shared ✅ (dyn) | —                | ✅ Correctly separate* |
| **Students/Progress**     | N/A             | Shared ✅ (7L)  | Shared ✅ (9L)  | Shared ✅ (7L)  | `StudentsProgressPage` | ✅ Perfect |
| **Teachers**              | N/A             | N/A             | Shared ✅ (7L)  | Shared ✅† (7L) | `TeachersPage`   | ✅ Admin: no add-button, has academy filter |
| **Assignments**           | Custom (555L)   | Shared ✅ (7L)  | Shared ✅ (7L)  | Shared ✅ (7L)  | `AssignmentsPage` | 🟡 Student still custom |
| **Calendar**              | Shared ✅ (7L)  | Shared ✅ (7L)  | Shared ✅ (7L)  | Shared ✅ (7L)  | `CalendarPage`   | ✅ Perfect |
| **Grades**                | N/A             | Shared ✅ (7L)  | Shared ✅ (7L)  | Shared ✅ (7L)  | `GradesPage`     | ✅ Perfect |
| **Feedback**              | N/A             | Shared ✅ (7L)  | Shared ✅ (7L)  | Shared ✅ (7L)  | `FeedbackPage`   | ✅ Perfect |
| **Streams**               | N/A             | Shared ✅ (7L)  | Shared ✅ (7L)  | Shared ✅ (8L)  | `StreamsPage`    | ✅ Perfect |
| **Reports**               | N/A             | Shared ✅ (7L)  | Shared ✅ (7L)  | Shared ✅ (7L)  | `ReportsPage`    | ✅ Perfect |
| **Payments/Pagos**        | N/A             | N/A             | Shared ✅ (7L)  | Shared ✅ (7L)  | `PagosPage`      | ✅ Perfect |
| **Profile**               | Custom (282L)   | Custom (302L)   | Custom (1737L)  | N/A             | —                | 🔴 UNIFY ALL |
| **Quizzes**               | Custom (31L)    | N/A             | N/A             | N/A             | —                | ✅ Student-only |
| **Live**                  | Custom (106L)   | N/A             | N/A             | N/A             | —                | ✅ Student-only |
| **Lessons (List)**        | Custom (131L)   | N/A             | Custom (232L)   | N/A             | —                | ✅ Different purposes |
| **Explore**               | Custom (107L)   | N/A             | N/A             | N/A             | —                | ✅ Student-only |
| **Enrolled Academies**    | Custom (177L)   | N/A             | N/A             | N/A             | —                | ✅ Student-only |
| **Grading**               | N/A             | Custom (58L)    | N/A             | N/A             | —                | ✅ Teacher-only |
| **Academy Join**          | N/A             | Custom (dyn)    | N/A             | N/A             | —                | ✅ Teacher-only |
| **Revenue**               | N/A             | N/A             | N/A             | Custom (32L)    | —                | ✅ Admin-only |
| **Leads**                 | N/A             | N/A             | N/A             | Custom (352L)   | —                | ✅ Admin-only |
| **Accounts (Zoom)**       | N/A             | N/A             | N/A             | Custom (332L)   | —                | ✅ Admin-only |
| **Academies**             | N/A             | N/A             | N/A             | Custom (174L)   | —                | ✅ Admin-only |
| **Facturas**              | N/A             | N/A             | N/A             | Custom (223L)   | —                | ✅ Admin-only |

### Legend:
- ✅ **Perfect** - Correctly shared or correctly unique
- 🔴 **UNIFY** - Should use shared component (HIGH IMPACT)
- 🟡 **Review** - Evaluate if unification makes sense
- **Custom (###L)** - Custom implementation with actual line count
- **Shared ✅ (7L)** - 7-line wrapper delegating to a `components/shared/` component
- **dyn** - Dynamic route (line count not meaningful)
- **†** - Shared component but Admin gets a **read-only/view-only** variant (different API data, no mutating actions)

**\* Student Subjects/Classes:** Student views show enrolled classes with payment status and personal progress (read-only consumption). Teacher/Academy/Admin views show managed classes — but Admin is **read-only** (no edit/delete/zoom buttons; carrera/uni pills depend on API returning those fields).

**† Dashboard difference:** Both Academy and Admin use `DashboardPage`, but Academy sees al día/atrasados payment stats while Admin sees global platform metrics (revenue, academies, users). Same component, different data sections activated by role.

---

## 📈 Unification Potential by Role

### Student Role
**Shared:** Calendar ✅
**Still custom:**
1. Assignments (555L) → Use enhanced `AssignmentsPage`
2. Profile (282L) → Use shared `ProfilePage`

**Note on Subjects/Classes:** Student views display enrolled classes with payment status and personal progress, while Teacher/Academy/Admin views show managed classes with edit/delete actions and all students' data. These are fundamentally different use cases and should remain separate.

**Total Savings potential: ~837 lines**

---

### Teacher Role
**All shared:** Assignments ✅ · Streams ✅ · Feedback ✅ · Grades ✅ · Reports ✅ · Students ✅ · Calendar ✅ · Subjects ✅
**Still custom:**
1. Dashboard (138L) — unique teacher home, likely intentional
2. Profile (302L) → Use shared `ProfilePage`
3. Grading (58L) — teacher-only feature

**Total Savings potential: ~302 lines** (profile only)

---

### Academy Role
**All shared:** Assignments ✅ · Streams ✅ · Feedback ✅ · Grades ✅ · Reports ✅ · Students ✅ · Calendar ✅ · Subjects ✅ · Teachers ✅ · Payments ✅ · Dashboard ✅
**Still custom:**
1. Profile (1,737L) → Extract integrations (Zoom/Bunny/Stripe), share base profile
2. Lessons (232L) — academy-specific lesson management

**Total Savings potential: ~1,000 lines** (keeping integration code)

---

### Admin Role
**All shared:** Assignments ✅ · Streams ✅ · Feedback ✅ · Grades ✅ · Reports ✅ · Students ✅ · Calendar ✅ · Subjects ✅ · Teachers ✅ · Pagos ✅ · Dashboard ✅
**Intentionally custom (admin-only):** Leads (352L) · Accounts/Zoom (332L) · Facturas (223L) · Academies (174L) · Revenue (32L)

**No unification needed** — custom pages are admin-specific features

## 🎯 Priority Matrix

| Priority | Opportunity | Actual Lines | Impact | Status |
|----------|-------------|-------------|--------|--------|
| ✅ **DONE** | Teacher assignments | 1,184 → 7L | VERY HIGH | Saved ~1,177L |
| ✅ **DONE** | Teacher streams | 60 → 7L | LOW | Saved ~53L |
| ✅ **DONE** | Teacher feedback | 125 → 7L | MEDIUM | Saved ~118L |
| ✅ **DONE** | Teacher grades | 526 → 7L | HIGH | Saved ~519L |
| ✅ **DONE** | Teacher reports | placeholder → 7L | LOW | Saved ~60L |
| ✅ **DONE** | Calendar (all roles) | — → 7L each | MEDIUM | Shared ✅ |
| 🔥 **P0** | Student assignments | 555L | HIGH | Not started |
| 🚀 **P1** | Profile pages (Student + Teacher) | 282L + 302L | HIGH | Not started |
| 🏗️ **P2** | Academy profile base | 1,737L (large!) | HIGH | Not started |

**Total already saved: ~1,927+ lines**
**Total remaining potential: ~1,839 lines**

---

## 🏗️ Architecture Pattern

### Current Best Practice (✅ FOLLOW THIS):
```
src/
  components/shared/
    ClassesPage.tsx          # Shared implementation
  app/dashboard/
    teacher/subjects/
      page.tsx               # <ClassesPage role="teacher" />
    academy/subjects/
      page.tsx               # <ClassesPage role="academy" />
    admin/subjects/
      page.tsx               # <ClassesPage role="admin" />
```

### Anti-Pattern (❌ AVOID THIS):
```
src/
  app/dashboard/
    student/subjects/
      page.tsx               # 477 lines of duplicate code
    teacher/subjects/
      page.tsx               # 450 lines of duplicate code
    academy/subjects/
      page.tsx               # 450 lines of duplicate code
```

---

## 💡 Quick Wins Checklist

- [x] ~~Teacher grades → Use `GradesPage` with charts~~ ✅ **DONE** (526→7L)
- [x] ~~Teacher assignments → Use enhanced `AssignmentsPage`~~ ✅ **DONE** (1,184→7L)
- [x] ~~Teacher streams → Use `StreamsPage`~~ ✅ **DONE** (60→7L)
- [x] ~~Teacher feedback → Use `FeedbackPage` with class filter~~ ✅ **DONE** (125→7L)
- [x] ~~Teacher reports → Use `ReportsPage`~~ ✅ **DONE** (placeholder→7L)
- [x] ~~Calendar → Use `CalendarPage` (all roles)~~ ✅ **DONE** (7L each)
- [ ] **Student assignments** → Use `AssignmentsPage` (555L → 7L)
- [ ] **Student profile** → Use shared `ProfilePage` (282L → 7L)
- [ ] **Teacher profile** → Use shared `ProfilePage` (302L → 7L)
- [ ] **Academy profile** → Extract integrations, share base (1,737L → ~500L)

**Note:** Student subjects/classes are intentionally separate (different use cases).

---

## 📚 Reference

For detailed analysis of each opportunity, see [UNIFICATION_OPPORTUNITIES.md](UNIFICATION_OPPORTUNITIES.md)
