# Zoom Account per Class - Implementation Guide

**Date:** February 1, 2026  
**Question:** Can we use the current methodology where each academy adds a Zoom account for each class?

---

## TL;DR Answer

**YES** - This approach works perfectly and is actually **better** than per-teacher accounts!

✅ **Advantages:**
- More granular control (per-class scheduling)
- Better cost optimization (only pay for active classes)
- Easier academy management
- Natural fit with AKADEMO's class-based structure

---

## Current AKADEMO Architecture

### Database Schema
```sql
-- Existing table structure
CREATE TABLE Class (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  academyId TEXT,
  teacherId TEXT,
  zoomAccountId TEXT,  -- Link to Zoom account (already exists!)
  createdAt TEXT
);

CREATE TABLE ZoomAccount (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  accountId TEXT NOT NULL,
  clientId TEXT,
  clientSecret TEXT,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT
);
```

**You already have `zoomAccountId` column in Class table!** (See [ZOOM_ACCOUNT_ASSIGNMENT.md](zoom-account-assignment.md))

---

## How It Works

### 1. Academy Owner Adds Zoom Account

When creating/editing a class, academy owner connects a Zoom account:

```typescript
// In Class creation/edit form
interface ClassForm {
  name: string;
  teacherId: string;
  zoomAccountId: string;  // Dropdown of available Zoom accounts
}

// Save to database
await db.query(`
  UPDATE Class 
  SET zoomAccountId = ? 
  WHERE id = ?
`, [zoomAccountId, classId]);
```

### 2. Teacher Starts Stream

When teacher clicks "Stream" button:

```typescript
// Backend: /api/live/create
const classData = await db.query(`
  SELECT c.id, c.name, c.zoomAccountId, 
         za.accountId, za.clientId, za.clientSecret
  FROM Class c
  JOIN ZoomAccount za ON c.zoomAccountId = za.id
  WHERE c.id = ?
`, [classId]);

if (!classData.zoomAccountId) {
  return error('Esta clase no tiene cuenta de Zoom asignada. Contacta al administrador.');
}

// Create Zoom meeting using class's assigned account
const meeting = await createZoomMeeting({
  accountId: classData.accountId,
  clientId: classData.clientId,
  clientSecret: classData.clientSecret,
  topic: `${classData.name} - Clase en vivo`,
});
```

### 3. Students Join Stream

Students see "Unirse a clase" button when stream is live:

```typescript
// Students join via the meeting URL
const liveStream = await db.query(`
  SELECT ls.*, c.name as className
  FROM LiveStream ls
  JOIN Class c ON ls.classId = c.id
  WHERE ls.classId = ? AND ls.status = 'LIVE'
`, [classId]);

// Show join button with meeting URL
<a href={liveStream.zoomLink}>Unirse a clase</a>
```

---

## Cost Model: Pay Per Active Class

### Pricing Strategy

**Option A: Zoom Pro per Class**
- **$15.99/month per class with live streaming**
- Only pay for classes that have scheduled live sessions
- Example: 20 total classes, 10 with live streaming = **$159.90/month**

**Option B: Shared Accounts (Optimize Costs)**
- Buy 5 Zoom Pro accounts ($79.95/month)
- Assign same account to multiple classes that don't conflict
- Example: 20 classes sharing 5 accounts (non-overlapping schedules) = **$79.95/month**

### Cost Comparison Examples

#### Scenario 1: Small Academy
- **Classes:** 5 classes
- **Live sessions:** 3 classes have weekly live sessions
- **Cost:** 3 × $15.99 = **$47.97/month**

#### Scenario 2: Medium Academy
- **Classes:** 20 classes
- **Live sessions:** 10 classes have live sessions
- **Scheduling:** 5 morning classes, 5 afternoon classes (no overlap)
- **Optimization:** Share 5 accounts between 10 classes
- **Cost:** 5 × $15.99 = **$79.95/month** (instead of $159.90)

#### Scenario 3: Large Academy
- **Classes:** 50 classes
- **Live sessions:** 30 classes have live sessions
- **Scheduling:** Maximum 10 concurrent streams at peak times
- **Optimization:** Buy 10 Zoom Pro accounts, share across 30 classes
- **Cost:** 10 × $15.99 = **$159.90/month** (instead of $479.70)

---

## Implementation Guide

### Phase 1: UI for Academy Owners

Add Zoom account management to academy dashboard:

**1. Zoom Accounts Page** (`/dashboard/academy/zoom-accounts`)

```tsx
// List of academy's Zoom accounts
<div>
  <h1>Cuentas de Zoom</h1>
  <button onClick={openAddZoomAccount}>+ Agregar Cuenta</button>
  
  <table>
    <thead>
      <tr>
        <th>Email</th>
        <th>Clases asignadas</th>
        <th>Estado</th>
        <th>Acciones</th>
      </tr>
    </thead>
    <tbody>
      {zoomAccounts.map(account => (
        <tr key={account.id}>
          <td>{account.email}</td>
          <td>{account.assignedClasses.length} clases</td>
          <td>{account.isActive ? 'Activa' : 'Inactiva'}</td>
          <td>
            <button onClick={() => editAccount(account.id)}>Editar</button>
            <button onClick={() => deleteAccount(account.id)}>Eliminar</button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

**2. Add Zoom Account Modal**

```tsx
<form onSubmit={handleAddZoomAccount}>
  <input 
    type="email" 
    placeholder="Zoom account email"
    value={email}
    onChange={e => setEmail(e.target.value)}
  />
  
  <input 
    type="text" 
    placeholder="Zoom Account ID"
    value={accountId}
  />
  
  <input 
    type="password" 
    placeholder="Client ID"
    value={clientId}
  />
  
  <input 
    type="password" 
    placeholder="Client Secret"
    value={clientSecret}
  />
  
  <button type="submit">Guardar</button>
</form>
```

**3. Class Creation/Edit - Assign Zoom Account**

```tsx
// In /dashboard/academy/classes/create or edit
<form>
  <input type="text" placeholder="Nombre de la clase" />
  
  <select name="teacherId">
    <option value="">Seleccionar profesor</option>
    {teachers.map(t => <option value={t.id}>{t.name}</option>)}
  </select>
  
  <select name="zoomAccountId">
    <option value="">Sin cuenta de Zoom (sin streaming)</option>
    {zoomAccounts.map(za => (
      <option value={za.id}>
        {za.email} ({za.assignedClasses.length} clases)
      </option>
    ))}
  </select>
  
  <button type="submit">Crear Clase</button>
</form>
```

---

### Phase 2: Backend Implementation

**1. API Endpoint: Add Zoom Account**

```typescript
// POST /api/zoom-accounts
app.post('/zoom-accounts', async (c) => {
  const session = await requireAuth(c);
  
  if (session.role !== 'ACADEMY') {
    return c.json({ error: 'Solo academias pueden agregar cuentas' }, 403);
  }
  
  const { email, accountId, clientId, clientSecret } = await c.req.json();
  
  // Verify academy owns this account (optional: validate Zoom credentials)
  const zoomAccountId = nanoid();
  
  await c.env.DB.prepare(`
    INSERT INTO ZoomAccount (id, email, accountId, clientId, clientSecret, ownerId)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(zoomAccountId, email, accountId, clientId, clientSecret, session.id).run();
  
  return c.json({ success: true, data: { id: zoomAccountId } });
});

// GET /api/zoom-accounts - List academy's Zoom accounts
app.get('/zoom-accounts', async (c) => {
  const session = await requireAuth(c);
  
  const accounts = await c.env.DB.prepare(`
    SELECT 
      za.*,
      COUNT(c.id) as assignedClassCount
    FROM ZoomAccount za
    LEFT JOIN Class c ON za.id = c.zoomAccountId
    WHERE za.ownerId = ?
    GROUP BY za.id
  `).bind(session.id).all();
  
  return c.json({ success: true, data: accounts.results });
});
```

**2. Validate Zoom Account Availability**

```typescript
// When teacher starts stream, check if account is available
app.post('/live/create', async (c) => {
  const { classId } = await c.req.json();
  
  const classData = await c.env.DB.prepare(`
    SELECT c.*, za.accountId, za.clientId, za.clientSecret
    FROM Class c
    LEFT JOIN ZoomAccount za ON c.zoomAccountId = za.id
    WHERE c.id = ?
  `).bind(classId).first();
  
  if (!classData.zoomAccountId) {
    return c.json({ 
      error: 'Esta clase no tiene cuenta de Zoom asignada. Contacta al administrador de la academia.' 
    }, 400);
  }
  
  // Check if this Zoom account is already in use
  const accountInUse = await c.env.DB.prepare(`
    SELECT ls.id 
    FROM LiveStream ls
    JOIN Class c ON ls.classId = c.id
    WHERE c.zoomAccountId = ? AND ls.status = 'LIVE'
  `).bind(classData.zoomAccountId).first();
  
  if (accountInUse) {
    return c.json({ 
      error: 'Esta cuenta de Zoom está en uso por otra clase. Intenta más tarde o contacta al administrador.' 
    }, 409);
  }
  
  // Create meeting
  const meeting = await createZoomMeeting({ /* ... */ });
  
  return c.json({ success: true, data: meeting });
});
```

---

## Optimization Strategies

### Strategy 1: Manual Assignment (Simple)

Academy owner manually assigns Zoom accounts to classes based on schedule:

- **Morning classes (8 AM - 12 PM):** Use Zoom Account 1
- **Afternoon classes (2 PM - 6 PM):** Use Zoom Account 1 (same account, no conflict)
- **Evening classes (7 PM - 10 PM):** Use Zoom Account 1 (still no conflict)

**Result:** 10 classes share 1 Zoom account = **$15.99/month**

---

### Strategy 2: Auto-Assignment (Smart)

System automatically suggests available Zoom account when creating stream:

```typescript
// Find available Zoom account for this time slot
async function findAvailableZoomAccount(classId: string, startTime: Date): Promise<string | null> {
  const accounts = await db.query(`
    SELECT za.id, za.email
    FROM ZoomAccount za
    JOIN Class c ON za.id = c.zoomAccountId
    WHERE c.academyId = (SELECT academyId FROM Class WHERE id = ?)
  `, [classId]);
  
  for (const account of accounts) {
    // Check if account has conflicting stream at this time
    const conflict = await db.query(`
      SELECT ls.id
      FROM LiveStream ls
      JOIN Class c ON ls.classId = c.id
      WHERE c.zoomAccountId = ?
      AND ls.startedAt <= ?
      AND ls.endedAt >= ?
    `, [account.id, startTime, startTime]);
    
    if (!conflict) {
      return account.id; // This account is available
    }
  }
  
  return null; // No available accounts
}
```

---

### Strategy 3: Pool of Shared Accounts

Create a pool of Zoom accounts that auto-assign on demand:

```sql
-- Mark accounts as "shared pool"
ALTER TABLE ZoomAccount ADD COLUMN isPooled INTEGER DEFAULT 0;

-- When teacher starts stream
SELECT za.id 
FROM ZoomAccount za
LEFT JOIN (
  SELECT c.zoomAccountId, COUNT(*) as activeStreams
  FROM LiveStream ls
  JOIN Class c ON ls.classId = c.id
  WHERE ls.status = 'LIVE'
  GROUP BY c.zoomAccountId
) active ON za.id = active.zoomAccountId
WHERE za.isPooled = 1 
AND (active.activeStreams IS NULL OR active.activeStreams = 0)
ORDER BY za.createdAt ASC
LIMIT 1;
```

---

## Migration from Current System

### Current System (if using per-teacher)
```sql
-- Old: Teacher has zoomAccountId
ALTER TABLE Teacher ADD COLUMN zoomAccountId TEXT;
```

### New System (per-class)
```sql
-- Already exists in AKADEMO!
ALTER TABLE Class ADD COLUMN zoomAccountId TEXT;
```

**Migration Steps:**

1. **Keep both systems** (no breaking changes)
2. **Prioritize Class.zoomAccountId** over Teacher.zoomAccountId
3. **Fallback to teacher account** if class doesn't have one

```typescript
// Smart fallback logic
const getZoomAccount = async (classId: string) => {
  const classData = await db.query(`
    SELECT c.zoomAccountId as classZoomId, 
           c.teacherId,
           t.zoomAccountId as teacherZoomId
    FROM Class c
    LEFT JOIN Teacher t ON c.teacherId = t.userId
    WHERE c.id = ?
  `, [classId]);
  
  // Prefer class-level account
  if (classData.classZoomId) {
    return getZoomAccountDetails(classData.classZoomId);
  }
  
  // Fallback to teacher account
  if (classData.teacherZoomId) {
    return getZoomAccountDetails(classData.teacherZoomId);
  }
  
  throw new Error('No Zoom account available');
};
```

---

## Academy Owner Workflow

### Step 1: Purchase Zoom Pro Accounts

Academy owner buys Zoom Pro accounts based on their needs:

- **5 classes with live streaming:** Buy 2-3 Zoom Pro accounts ($32-48/month)
- **15 classes with live streaming:** Buy 5-7 accounts ($80-112/month)

### Step 2: Add Accounts to AKADEMO

1. Go to `/dashboard/academy/zoom-accounts`
2. Click "Agregar Cuenta"
3. Enter Zoom credentials:
   - Email: `academy-zoom-1@example.com`
   - Account ID: (from Zoom)
   - Client ID: (from Zoom App Marketplace)
   - Client Secret: (from Zoom App Marketplace)
4. Save

### Step 3: Assign to Classes

1. Go to `/dashboard/academy/classes`
2. Edit each class
3. Select Zoom account from dropdown
4. Save

### Step 4: Monitor Usage

View which accounts are being used:

```tsx
<div>
  <h2>Zoom Account Usage</h2>
  {zoomAccounts.map(account => (
    <div key={account.id}>
      <p>{account.email}</p>
      <p>Assigned to: {account.classes.map(c => c.name).join(', ')}</p>
      <p>Status: {account.isInUse ? '🔴 En uso' : '🟢 Disponible'}</p>
    </div>
  ))}
</div>
```

---

## Advantages Over Per-Teacher Accounts

### ✅ Better Cost Optimization

**Per-Teacher Accounts:**
- 10 teachers × $15.99 = $159.90/month
- Problem: Not all teachers stream regularly

**Per-Class Accounts:**
- 10 active streaming classes × $15.99 = $159.90/month
- But can share: 10 classes → 5 accounts = **$79.95/month**

**Savings:** 50% with smart scheduling

---

### ✅ Easier Management for Academies

**Per-Teacher:**
- Teacher leaves → need to transfer account to new teacher
- Teacher teaches multiple classes → all use same account (conflicts!)

**Per-Class:**
- Class is permanent (teacher can change)
- Clear ownership: "Math 101 uses zoom-account-1"
- No conflicts when teacher teaches multiple simultaneous classes

---

### ✅ Better Scheduling Control

Academy can plan Zoom account usage based on class schedule:

```
Monday 9 AM:  Math 101     → Zoom Account 1
Monday 10 AM: Science 201  → Zoom Account 2
Monday 11 AM: History 301  → Zoom Account 1 (Math class ended)
```

Clear visibility of which account is used when.

---

### ✅ Natural Fit with AKADEMO Architecture

AKADEMO is class-centric:
- Students enroll in **classes** (not teachers)
- Content belongs to **classes** (not teachers)
- Live streams belong to **classes** (not teachers)

Zoom account per class aligns perfectly with this model.

---

## Cost Summary

### Small Academy (5 streaming classes)
- **Buy:** 2-3 Zoom Pro accounts
- **Cost:** $32-48/month
- **Savings:** vs. $80 for 5 separate accounts

### Medium Academy (15 streaming classes)
- **Buy:** 5-7 Zoom Pro accounts
- **Cost:** $80-112/month
- **Savings:** vs. $240 for 15 separate accounts

### Large Academy (30 streaming classes)
- **Buy:** 10-15 Zoom Pro accounts
- **Cost:** $160-240/month
- **Savings:** vs. $480 for 30 separate accounts

**Break-even with Video SDK:** 100 accounts ($1,599) ≈ Video SDK ($1,499)

---

## Recommendation

✅ **Use per-class Zoom accounts with shared pool strategy**

**Implementation Priority:**

1. **Phase 1 (Now):** 
   - Add Zoom account management UI for academy owners
   - Allow manual assignment of accounts to classes
   - **Timeline:** 1 week
   
2. **Phase 2 (Later):** 
   - Add auto-assignment logic
   - Show real-time availability
   - Conflict detection
   - **Timeline:** 2 weeks

3. **Phase 3 (Future):** 
   - AI-based optimization suggestions
   - Usage analytics
   - Cost optimization recommendations
   - **Timeline:** 4 weeks

**Total Development:** 7 weeks spread over time

**Immediate Action:**
Start with manual assignment (easiest to implement, works perfectly).

---

## Conclusion

✅ **YES - Per-class Zoom account assignment is the BEST approach for AKADEMO**

**Why:**
- Better cost optimization (share accounts smartly)
- Aligns with AKADEMO's class-centric architecture
- Easier for academy owners to manage
- Already supported in database (`Class.zoomAccountId`)
- Flexible for future growth

**Start simple:** Manual assignment → Add smart features later

**Expected savings:** 30-50% vs. per-teacher or per-account approaches
