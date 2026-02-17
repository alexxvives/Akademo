# AKADEMO - Cross-Role Component Matrix

## 🎨 Visual Overview: What's Shared vs What's Not

| Page/Feature              | Student       | Teacher       | Academy | Admin | Status |
|--------------             |---------      |---------      |---------|-------|--------|
| **Dashboard (Home)**      | Redirect      | Custom (106L) | Shared ✅ | Shared ✅ | 🟡 Teacher unique |
| **Subjects/Classes List** | Custom (477L) | Shared ✅     | Shared ✅ | Shared ✅ | ✅ Correctly separate* |
| **Subject/Class Detail**  | Custom (787L) | Shared ✅     | Shared ✅ | Shared ✅ | ✅ Correctly separate* |
| **Students/Progress**     | N/A           | Shared ✅      | Shared ✅ | Shared ✅ | ✅ Perfect |
| **Teachers**              | N/A           | N/A            | Shared ✅ | Shared ✅ | ✅ Perfect |
| **Assignments**           | Custom (680L) | Custom (1184L) | Shared ✅ | Shared ✅ | 🔴 UNIFY BOTH |
| **Grades**                | N/A           | Custom (526L)  | Shared ✅ | Shared ✅ | 🔴 UNIFY TEACHER |
| **Feedback**              | N/A           | Shared ✅     | Shared ✅ | Shared ✅ | ✅ Perfect |
| **Streams**               | N/A           | Custom (60L)   | Shared ✅ | Shared ✅ | 🟡 Check if needed |
| **Reports**               | N/A           | Placeholder   | Shared ✅ | Shared ✅ | 🔴 Use shared |
| **Payments/Pagos**        | N/A           | N/A           | Shared ✅ | Shared ✅ | ✅ Perfect |
| **Profile**               | Custom (292L) | Custom (303L) | Custom (1230L) | N/A | 🔴 UNIFY ALL |
| **Quizzes**               | Custom        | N/A          | N/A | N/A | ✅ Student-only |
| **Live**                  | Custom        | N/A          | N/A | N/A | ✅ Student-only |
| **Lessons (List)**        | Custom        | N/A           | Custom | N/A | ✅ Different purposes |
| **Explore**               | Custom        | N/A          | N/A | N/A | ✅ Student-only |
| **Grading**               | N/A           | Custom         | N/A | N/A | ✅ Teacher-only |
| **Academy Join**          | N/A           | Custom         | N/A | N/A | ✅ Teacher-only |
| **Revenue**               | N/A           | N/A         | Custom | N/A | ✅ Academy-only |
| **Accounts (Zoom)**       | N/A           | N/A         | N/A | Custom | ✅ Admin-only |
| **Academies**             | N/A           | N/A           | N/A | Custom | ✅ Admin-only |
| **Facturas**              | N/A           | N/A          | N/A | Custom | ✅ Admin-only |

### Legend:
- ✅ **Perfect** - Correctly shared or correctly unique
- 🔴 **UNIFY** - Should use shared component (HIGH IMPACT)
- 🟡 **Review** - Evaluate if unification makes sense
- **Custom (###L)** - Custom implementation with line count
- **Shared ✅** - Uses component from `components/shared/`

**\* Student Subjects/Classes:** Student views show enrolled classes with payment status and personal progress (read-only consumption). Teacher/Academy/Admin views show managed classes with CRUD operations and all students' data (administrative management). Different use cases = correctly separate implementations.

---

## 📈 Unification Potential by Role

### Student Role
**Current:** 2 opportunities to unify
1. Assignments (680 lines) → Use enhanced `AssignmentsPage`
2. Profile (292 lines) → Use shared `ProfilePage`

**Note on Subjects/Classes:** Student views display enrolled classes with payment status and personal progress, while Teacher/Academy/Admin views show managed classes with edit/delete actions and all students' data. These are fundamentally different use cases and should remain separate.

**Total Savings: 972 lines**

---

### Teacher Role
**Current:** 6 opportunities to unify
1. Profile (303 lines) → Use shared `ProfilePage`
2. Assignments (1,184 lines) → Use enhanced `AssignmentsPage`
3. Grades (526 lines) → Use enhanced `GradesPage`
4. Streams (~60 lines) → Consider using `StreamsPage`
5. Reports (placeholder) → Use `ReportsPage`
6. Dashboard (106 lines) → Keep separate (too unique)

**Total Savings: ~2,079 lines** (excluding dashboard)

---

### Academy Role
**Current:** 1 opportunity to unify
1. Profile (1,230 lines) → Extract integrations, share base

**Total Savings: ~730 lines** (keeping integration code)

---

## 🎯 Priority Matrix

| Priority | Opportunity | Impact | Effort | Lines Saved |
|----------|-------------|--------|--------|-------------|
| 🔥 **P0** | Student subject detail | VERY HIGH | LOW | 787 |
| 🔥 **P0** | Student subjects list | HIGH | MEDIUM | 477 |
| 🚀 **P1** | Teacher assignments | HIGH | MEDIUM | ~600 |
| 🚀 **P1** | Student assignments | HIGH | MEDIUM | ~400 |
| 🚀 **P1** | Teacher grades | MEDIUM | LOW | 521 |
| 📝 **P2** | Profile pages | HIGH | HIGH | 1,325 |
| 📝 **P2** | Teacher reports | LOW | LOW | ~60 |
| 📝 **P2** | Teacher streams | LOW | LOW | ~60 |

**Total Potential:** ~4,230 lines removed

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

- [ ] Student subject detail → Use `ClassDetailPage`
- [ ] Student subjects list → Use `ClassesPage`
- [ ] Teacher grades → Use `GradesPage` with charts
- [ ] Teacher reports → Use `ReportsPage`
- [ ] Teacher streams → Use `StreamsPage` (if UI matches)
- [ ] Student assignments → Use enhanced `AssignmentsPage`
- [ ] Teacher assignments → Use enhanced `AssignmentsPage`
- [ ] Profile pages → Create shared `ProfilePage`

---

## 📚 Reference

For detailed analysis of each opportunity, see [UNIFICATION_OPPORTUNITIES.md](UNIFICATION_OPPORTUNITIES.md)
