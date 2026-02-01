# Zoom Multi-Academy Concurrent Streaming Analysis

**Date:** February 1, 2026  
**Question:** Can multiple academies and teachers stream simultaneously with Zoom Meeting SDK + Pro Plan ($15.99/month)?

---

## TL;DR Answer

**NO** - A single Zoom Pro account ($15.99/month) supports **only 1 concurrent meeting**.

For multiple concurrent streams, you need:
- **Option 1:** Multiple Zoom Pro accounts ($15.99 per teacher streaming)
- **Option 2:** Zoom Business/Enterprise with webinar add-ons
- **Option 3:** Zoom Video SDK (different pricing model)

---

## Detailed Analysis

### Zoom Meeting SDK Licensing Model

Zoom Meeting SDK uses your **Zoom account's meeting capacity**:

- **1 Zoom Pro account** = **1 licensed host** = **1 concurrent meeting**
- Cannot host multiple meetings simultaneously with same account
- Each concurrent meeting requires a separate licensed host

### Your Use Case

**Current Platform Setup:**
- Multiple academies on AKADEMO platform
- Each academy has multiple teachers
- Teachers need to stream classes independently and simultaneously

**Example Scenario:**
- Academy A: Teacher 1 streaming at 10:00 AM
- Academy B: Teacher 2 streaming at 10:00 AM (same time)
- Academy A: Teacher 3 streaming at 10:30 AM

**Concurrent streams needed:** 2-3 at peak times

---

## Solution Options

### Option 1: Multiple Zoom Pro Accounts (RECOMMENDED)

**How It Works:**
- Purchase separate Zoom Pro account for each teacher who streams
- Each account has independent meeting capacity
- Each teacher uses their own Zoom credentials

**Pricing:**
- **$15.99/month per streaming teacher**
- No minimum quantity

**Example:**
- 5 teachers who stream classes = 5 × $15.99 = **$79.95/month**
- 10 teachers = 10 × $15.99 = **$159.90/month**

**Pros:**
✅ Most flexible - add/remove teachers easily  
✅ No minimums - pay only for active teachers  
✅ Each teacher has independent 100-participant limit  
✅ Each meeting can be up to 30 hours  

**Cons:**
❌ Requires managing multiple Zoom accounts  
❌ Each teacher needs separate login credentials

**Implementation:**
```typescript
// In your database, add Zoom account assignment
interface Teacher {
  id: string;
  zoomEmail: string;      // Teacher's Zoom Pro account email
  zoomAccountId: string;  // Zoom account ID for API calls
}

// When teacher starts stream
const zoomCredentials = await getTeacherZoomCredentials(teacherId);
const meeting = await createZoomMeeting(zoomCredentials);
```

---

### Option 2: Zoom Business Plan with Multiple Licenses

**How It Works:**
- Zoom Business plan allows multiple licensed hosts under one account
- Centralized billing and management
- Each host can run concurrent meetings

**Pricing:**
- **$21.99/month per host** (minimum 10 licenses)
- Minimum cost: **$219.90/month** for 10 hosts

**Pros:**
✅ Centralized account management  
✅ Up to 300 participants per meeting (vs. 100 in Pro)  
✅ Zoom Rooms access  
✅ Cloud recording transcripts  
✅ Dedicated support  

**Cons:**
❌ Minimum 10 licenses required ($219.90/month even if you need fewer)  
❌ Higher cost per teacher ($21.99 vs. $15.99)

**Best For:**
- 10+ concurrent streaming teachers
- Need for advanced features (300 participants, transcripts)

---

### Option 3: Zoom Video SDK (Enterprise)

**How It Works:**
- Different licensing model - **not per-account, but per-usage**
- Unlimited concurrent sessions
- Custom branding, no Zoom UI

**Pricing:**
- **$1,499/month** base fee
- Unlimited hosts
- Unlimited concurrent sessions
- Unlimited participants per session

**Pros:**
✅ Unlimited concurrent streams  
✅ No per-teacher cost  
✅ Scales infinitely  
✅ Custom UI/branding  

**Cons:**
❌ Expensive for small scale ($1,499/month)  
❌ Complex implementation (12 weeks dev time)  
❌ Overkill if you have < 100 concurrent streams

**Break-even Point:**
- Video SDK makes sense when: **$1,499 < (number of teachers × $15.99)**
- Break-even: **94 concurrent streaming teachers**
- Below 94 teachers: Multiple Pro accounts cheaper

---

## Cost Comparison

### Scenario: 5 Concurrent Streaming Teachers

| Option | Monthly Cost | Annual Cost | Setup Complexity |
|--------|-------------|-------------|------------------|
| **5 × Pro** | **$79.95** | **$959** | Low (1 week) |
| **Business (10 min)** | $219.90 | $2,639 | Low (1 week) |
| **Video SDK** | $1,499 | $17,988 | High (12 weeks) |

**Winner:** 5 × Zoom Pro accounts

---

### Scenario: 15 Concurrent Streaming Teachers

| Option | Monthly Cost | Annual Cost | Setup Complexity |
|--------|-------------|-------------|------------------|
| **15 × Pro** | **$239.85** | **$2,878** | Low (1 week) |
| **Business (15)** | $329.85 | $3,958 | Low (1 week) |
| **Video SDK** | $1,499 | $17,988 | High (12 weeks) |

**Winner:** 15 × Zoom Pro accounts

---

### Scenario: 100 Concurrent Streaming Teachers

| Option | Monthly Cost | Annual Cost | Setup Complexity |
|--------|-------------|-------------|------------------|
| **100 × Pro** | $1,599 | $19,188 | Medium (manage 100 accounts) |
| **Business (100)** | $2,199 | $26,388 | Medium (manage 100 licenses) |
| **Video SDK** | **$1,499** | **$17,988** | High (but worth it) |

**Winner:** Video SDK (finally makes sense at scale)

---

## Recommended Implementation Strategy

### Phase 1: Start Small (1-10 Teachers)

**Use:** Individual Zoom Pro accounts

**Setup:**
1. Create Zoom Pro account for each streaming teacher
2. Store credentials in your database:
   ```sql
   ALTER TABLE Teacher ADD COLUMN zoomEmail TEXT;
   ALTER TABLE Teacher ADD COLUMN zoomAccountId TEXT;
   ALTER TABLE Teacher ADD COLUMN zoomApiKey TEXT;
   ```
3. Assign account when teacher starts streaming
4. Use OAuth or API keys for authentication

**Monthly Cost:** $15.99 × number of streaming teachers

---

### Phase 2: Growth (10-50 Teachers)

**Use:** Mix of Pro accounts + Business plan

**Strategy:**
- High-frequency streamers: Individual Pro accounts
- Low-frequency streamers: Share Business plan licenses

**Optimization:**
- Track teacher streaming frequency
- Assign dedicated accounts to teachers who stream > 10 times/month
- Share accounts for occasional streamers (schedule conflicts minimized)

---

### Phase 3: Scale (50+ Teachers)

**Use:** Zoom Video SDK

**Why:**
- Cost-effective at $1,499/month (vs. $799+ for 50 Pro accounts)
- No account management overhead
- Unlimited concurrent streams
- Full branding control

**Migration:**
- Gradual transition from Meeting SDK to Video SDK
- Reuse existing watermark/whiteboard implementations
- 12-week development timeline

---

## Technical Implementation

### Database Schema for Multi-Account Management

```sql
-- Store Zoom accounts in your system
CREATE TABLE ZoomAccount (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  accountId TEXT NOT NULL,
  apiKey TEXT,
  apiSecret TEXT,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Link teachers to Zoom accounts
ALTER TABLE Teacher ADD COLUMN zoomAccountId TEXT REFERENCES ZoomAccount(id);

-- Or link to classes if account is shared
ALTER TABLE Class ADD COLUMN zoomAccountId TEXT REFERENCES ZoomAccount(id);

-- Track usage to optimize account assignment
CREATE TABLE ZoomMeetingLog (
  id TEXT PRIMARY KEY,
  zoomAccountId TEXT,
  teacherId TEXT,
  startTime TEXT,
  endTime TEXT,
  participantCount INTEGER
);
```

### Dynamic Account Assignment Logic

```typescript
// Assign available Zoom account to teacher
async function assignZoomAccount(teacherId: string): Promise<ZoomAccount> {
  // Check if teacher has dedicated account
  const teacher = await db.query('SELECT zoomAccountId FROM Teacher WHERE id = ?', [teacherId]);
  
  if (teacher.zoomAccountId) {
    return getZoomAccount(teacher.zoomAccountId);
  }
  
  // Find available shared account (not currently in use)
  const availableAccount = await db.query(`
    SELECT za.* FROM ZoomAccount za
    LEFT JOIN LiveStream ls ON za.id = ls.zoomAccountId AND ls.status = 'LIVE'
    WHERE za.isActive = 1 AND ls.id IS NULL
    LIMIT 1
  `);
  
  if (!availableAccount) {
    throw new Error('No Zoom accounts available. All are in use.');
  }
  
  return availableAccount;
}

// When teacher starts stream
app.post('/live/start', async (c) => {
  const { teacherId, classId } = await c.req.json();
  
  const zoomAccount = await assignZoomAccount(teacherId);
  
  const meeting = await createZoomMeeting({
    accountId: zoomAccount.accountId,
    apiKey: zoomAccount.apiKey,
    topic: 'Live Class',
    // ... other params
  });
  
  await db.query(`
    INSERT INTO LiveStream (id, teacherId, classId, zoomAccountId, zoomMeetingId, status)
    VALUES (?, ?, ?, ?, ?, 'LIVE')
  `, [nanoid(), teacherId, classId, zoomAccount.id, meeting.id]);
  
  return c.json({ meetingUrl: meeting.join_url });
});
```

---

## Frequently Asked Questions

### Q: Can teachers share one Zoom Pro account?

**A:** Yes, but **NOT simultaneously**. Only one meeting at a time per account.

**Example:**
- Teacher A uses shared account at 9:00 AM - 10:00 AM ✅
- Teacher B wants to use same account at 9:30 AM ❌ CONFLICT
- Teacher B uses same account at 10:30 AM ✅

**Solution:** Either schedule to avoid conflicts or buy multiple accounts.

---

### Q: Can we use Zoom's Webinar feature?

**A:** Yes, but it's more expensive and designed for large audiences.

**Webinar Pricing:**
- Requires Business plan ($21.99/host)
- Webinar add-on: $79/month for 500 attendees
- Total: **~$100/month per host**

**Not recommended** for small classes (15 students). Use regular meetings instead.

---

### Q: What about Zoom's Developer Platform limits?

**A:** Meeting SDK has no additional API limits beyond your account tier.

**API Rate Limits:**
- Create meeting: No practical limit
- Get participants: 30 requests/second
- Start/stop recording: No limit

**Should not be an issue** for hundreds of concurrent meetings.

---

### Q: Can we mix Meeting SDK and Video SDK?

**A:** No - they use different authentication and SDKs.

You must choose one:
- **Meeting SDK:** Uses Zoom account (Pro/Business/Enterprise)
- **Video SDK:** Separate $1,499/month license

Cannot use both simultaneously.

---

## Final Recommendation

### For Current AKADEMO Platform:

**Start with Multiple Zoom Pro Accounts**

**Implementation:**
1. **Now:** Buy 3-5 Zoom Pro accounts ($48-80/month)
   - Assign to most active streaming teachers
   - Store credentials in database
   
2. **Monitor usage** for 3 months
   - Track concurrent stream peaks
   - Identify scheduling patterns
   
3. **Optimize:**
   - Add Pro accounts as needed (scale linearly)
   - Consider Business plan when you hit 15+ teachers
   
4. **Long-term:** Migrate to Video SDK when you reach 100+ concurrent streams

**Expected Costs (Year 1):**
- Months 1-6: 5 accounts = $480
- Months 7-12: 10 accounts = $960
- **Total Year 1:** ~$1,440

**vs. Video SDK Year 1:** $17,988

**Savings:** $16,548 in Year 1

---

## Migration Path to Video SDK (Future)

**When to migrate:** 50-100+ concurrent streams

**Steps:**
1. Keep Meeting SDK running (no downtime)
2. Build Video SDK in parallel (12 weeks)
3. A/B test with 10% of teachers
4. Gradually migrate teachers over 2-3 months
5. Deprecate Meeting SDK when all migrated

**Budget for migration:**
- Development: $18,000-30,000
- Ongoing: $1,499/month (saves money vs. 100 Pro accounts)

---

## Conclusion

✅ **Yes, multiple academies/teachers can stream simultaneously**  
✅ **But requires multiple Zoom Pro accounts ($15.99 each)**  
✅ **NOT possible with single Zoom Pro account**  

**Best approach:**
- **Small scale (< 50 teachers):** Multiple Pro accounts
- **Large scale (100+ teachers):** Zoom Video SDK

**Immediate action:**
Purchase 5 Zoom Pro accounts to support initial concurrent streams, then scale as needed.
