# AKADEMO — Coding Conventions

## API Responses (Hono — akademo-api worker)

```typescript
// ✅ CORRECT
return c.json({ success: true, data: user });
return errorResponse(`User ${id} not found`, 404);

// ❌ WRONG — never use these shapes
return c.json({ user });
return c.json({ error: 'Not found' }, 404);
```

## TypeScript — No `any`

```typescript
// ✅ CORRECT
interface LessonResponse { id: string; title: string; videos: Video[]; }
const load = async (classId: string): Promise<void> => { ... };

// ❌ WRONG
const load = async (classId: any): Promise<any> => { ... };
```

## Database — Always Prepared Statements

```typescript
// ✅ CORRECT — safe
const user = await db.prepare('SELECT * FROM User WHERE id = ?').bind(userId).first();

// ❌ WRONG — SQL injection risk
const user = await db.prepare(`SELECT * FROM User WHERE id = '${userId}'`).first();
```

## React — Memoize Derived Data

```typescript
// ✅ CORRECT
const filtered = useMemo(() => lessons.filter(l => l.active), [lessons]);
const handleSubmit = useCallback((data) => { ... }, [deps]);

// ❌ WRONG — recreates every render
const filtered = lessons.filter(l => l.active);
```

## React Keys — Never Use Index

```typescript
// ✅ CORRECT
items.map(item => <Row key={item.id} />)

// ❌ WRONG
items.map((item, i) => <Row key={i} />)
```

## Async — No Sequential Awaits on Independent Calls

```typescript
// ✅ CORRECT
const [a, b] = await Promise.all([fetchA(), fetchB()]);

// ❌ WRONG
const a = await fetchA();
const b = await fetchB();
```

## Null Safety

```typescript
// ✅ CORRECT
(data || []).filter(...)
user?.name ?? 'Unknown'

// ❌ WRONG
data.filter(...)  // crashes if data is null
```

## Hard Rules

- No files > 250 lines → extract to `/components/[feature]/` or `/hooks/`
- No `localStorage` for sessions → use `academy_session` cookie
- No hardcoded secrets → use `c.env.VAR` (Hono) or `process.env.NEXT_PUBLIC_*` (Next.js)
- No backup files in `src/` → use git history
- TEACHER ≠ ACADEMY: `Academy.ownerId` = ACADEMY role, `Teacher.userId` = TEACHER role
