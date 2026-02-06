#!/usr/bin/env python3
"""
Script to update all loading spinners to use LoaderPinwheelIcon
"""

pages_to_update = [
    "src/app/dashboard/academy/lessons/page.tsx",
    "src/app/dashboard/admin/classes/page.tsx",
    "src/app/dashboard/admin/academies/page.tsx",
    "src/app/dashboard/admin/facturas/page.tsx",
    "src/app/dashboard/admin/teachers/page.tsx",
    "src/app/dashboard/admin/page.tsx",
    "src/app/dashboard/student/classes/page.tsx",
    "src/app/dashboard/student/profile/page.tsx",
    "src/app/dashboard/student/lessons/page.tsx",
    "src/app/dashboard/student/explore/page.tsx",
    "src/app/dashboard/student/explore/[academyId]/page.tsx",
    "src/app/dashboard/student/enrolled-academies/classes/page.tsx",
    "src/app/dashboard/student/page.tsx",
    "src/app/dashboard/teacher/classes/page.tsx",
    "src/app/dashboard/teacher/profile/page.tsx",
    "src/app/dashboard/teacher/page.tsx",
    "src/app/dashboard/teacher/academy/[id]/page.tsx",
]

components_to_update = [
    "src/components/shared/FeedbackView.tsx",
    "src/components/shared/StudentsProgressTable.tsx",
]

print("Pages that need LoaderPinwheelIcon update:")
for page in pages_to_update + components_to_update:
    print(f"  - {page}")
print(f"\nTotal: {len(pages_to_update + components_to_update)} files")
