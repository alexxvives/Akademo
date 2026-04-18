# Skill: Add Dashboard Feature

Use this when adding a new page, section, or feature to any role dashboard.

## Parameters
- `ROLE`: STUDENT | TEACHER | ACADEMY | ADMIN
- `FEATURE`: name of the feature, e.g. "grades", "attendance"
- `ROUTE`: the URL path, e.g. `/dashboard/student/grades`

## Steps

### 1. Locate the right dashboard folder
```
src/app/dashboard/student/     ← STUDENT
src/app/dashboard/teacher/     ← TEACHER
src/app/dashboard/academy/     ← ACADEMY
src/app/dashboard/admin/       ← ADMIN
```

### 2. Create the hook (business logic, max 150 lines)
```
src/app/dashboard/[role]/[feature]/use[Feature].ts
```

Pattern:
```typescript
'use client';
import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export function useFeature() {
  const [data, setData] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const res = await apiClient('/feature-endpoint');
      const result = await res.json();
      if (result.success) setData(result.data || []);
    } catch { /* skip */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, []); // load once on mount — no polling

  return { data, loading, reload: loadData };
}
```

Rules:
- **No polling** (`setInterval`) — load once on mount. See `DashboardLayout.tsx` for streams (already handled globally).
- Keep all API calls in the hook, not in the page component.

### 3. Create the page component (orchestrator, max 200 lines)
```
src/app/dashboard/[role]/[feature]/page.tsx
```

```typescript
'use client';
import { useFeature } from './useFeature';
import { FeatureCard } from '@/components/feature/FeatureCard';

export default function FeaturePage() {
  const { data, loading } = useFeature();
  if (loading) return <div>Loading...</div>;
  return <div>{data.map(item => <FeatureCard key={item.id} item={item} />)}</div>;
}
```

### 4. Extract sub-components if needed
If any section exceeds ~80 lines, extract to:
```
src/components/[feature]/FeatureCard.tsx
src/components/[feature]/FeatureList.tsx
```

### 5. Add to the sidebar (if it needs a menu entry)
```
src/components/dashboard-layout/get-menu-items.ts
```
Find the block for the relevant role and add the menu item with the route and label.

### 6. Add the API route if needed
→ Follow `MODEL_KNOWLEDGE/skills/add-api-route.md`

### 7. Build and verify
```powershell
npx @opennextjs/cloudflare build 2>&1 | Select-String "error TS|Type error|Compiled"
```

### 8. Commit
```powershell
git add src/app/dashboard/[role]/[feature]/ src/components/[feature]/
git commit -m "feat: add [feature] to [ROLE] dashboard"
git push
```
