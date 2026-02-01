# Zoom SDK Cost Analysis

**Date:** February 1, 2026  
**Scenario:** 15 students per stream, 1-hour sessions, 1 class per day

---

## Usage Profile

- **Participants per session**: 16 (15 students + 1 teacher)
- **Session duration**: 1 hour
- **Frequency**: 1 session per day = 30 sessions per month
- **Monthly usage**: 30 hours × 16 participants = 480 participant-hours/month

---

## Option 1: Zoom Video SDK (Custom UI)

### What It Includes
- Build completely custom video interface
- Full control over UI/UX
- Native whiteboard and screen sharing via SDK APIs
- Watermark overlays (custom implementation)
- Recording stored in your cloud (not Zoom's)

### Pricing
**Video SDK Plan**: **$1,499/month**

✅ **Includes:**
- Unlimited participants
- Unlimited session duration
- Native screen sharing API
- Native whiteboard API
- No Zoom branding
- Custom UI/UX
- HD video quality

❌ **Not Included:**
- Cloud recording storage (use Bunny Stream - already have)
- Transcription/captions

### Total Monthly Cost
- **Video SDK**: $1,499
- **Bunny Stream** (recording storage): ~$20-50 (already included in current plan)
- **Cloudflare Workers**: Included
- **Total**: **~$1,550/month**

---

## Option 2: Zoom Meeting SDK (Embedded Zoom UI)

### What It Includes
- Embed Zoom's native interface in your website
- Less customization than Video SDK
- Native Zoom controls (participants list, chat, reactions)
- Zoom's whiteboard and screen sharing (built-in)
- Can add custom HTML overlays (watermarks)

### Pricing

#### Pro Plan (Sufficient for Your Use Case)
**$15.99/month per host**

✅ **Includes:**
- Up to 100 participants per meeting
- 30-hour meeting duration limit
- Screen sharing
- Whiteboard
- Cloud recording: 5GB storage (30 hours HD)
- HD video
- Breakout rooms

**For 1 teacher**: $15.99/month

#### Business Plan (If You Need More Hosts)
**$21.99/month per host** (minimum 10 hosts = $219.90/month)

- Everything in Pro
- Up to 300 participants
- Cloud recording transcripts
- Dedicated support

### Does Zoom Pro Include Meeting SDK?

**YES** - Meeting SDK is included with **any Zoom paid plan** (Pro, Business, Enterprise).

You don't need a separate SDK license when using Meeting SDK - it uses your Zoom account's meeting capacity.

### Total Monthly Cost (Pro Plan)
- **Zoom Pro**: $15.99/month (1 host)
- **Bunny Stream** (optional backup storage): ~$20-50
- **Cloudflare Workers**: Included
- **Total**: **~$36-66/month**

---

## Feature Comparison

| Feature | Video SDK ($1,499/mo) | Meeting SDK + Pro ($16/mo) |
|---------|----------------------|---------------------------|
| **Custom UI** | ✅ Full control | ❌ Limited (can overlay HTML) |
| **Screen Sharing** | ✅ Native API | ✅ Built-in Zoom control |
| **Whiteboard** | ✅ Native API | ✅ Built-in Zoom whiteboard |
| **Watermarks** | ✅ Canvas overlay (custom) | ✅ HTML overlay (easier) |
| **Branding** | ✅ No Zoom branding | ⚠️ Minimal Zoom branding |
| **Recording** | Your cloud (Bunny) | Zoom Cloud (5GB) + Bunny |
| **Participants** | Unlimited | 100 (Pro) / 300 (Business) |
| **Duration** | Unlimited | 30 hours per meeting |
| **Complexity** | High (custom build) | Low (embed existing UI) |
| **Dev Time** | 12 weeks | 2 weeks |

---

## Recommendation for Your Use Case

### ✅ **Use Zoom Meeting SDK + Pro Plan ($15.99/month)**

**Why:**
1. **Cost**: 94% cheaper ($16 vs. $1,499/month)
2. **15 students + 1 teacher = 16 participants**: Well within Pro's 100-participant limit
3. **1-hour sessions**: Far below 30-hour duration limit
4. **Built-in whiteboard & screen sharing**: No custom development needed
5. **Watermarks**: Can add HTML overlay on top of Zoom interface
6. **Fast implementation**: 2 weeks vs. 12 weeks for Video SDK

### How It Works

1. **Embed Zoom Meeting SDK** in your website
   - Teacher starts meeting via your UI
   - Students join via embedded Zoom window
   - All standard Zoom controls available

2. **Add Custom HTML Overlay** for watermarks
   ```tsx
   <div className="relative">
     {/* Zoom Meeting SDK Component */}
     <ZoomMeetingComponent />
     
     {/* Watermark Overlay */}
     <div className="absolute top-4 left-4 text-white opacity-70 pointer-events-none">
       {studentName} - {timestamp}
     </div>
   </div>
   ```

3. **Recording**
   - Use Zoom's cloud recording (included in Pro)
   - Webhook downloads recording to Bunny Stream (already implemented)
   - Watermarks appear in recording

---

## When to Consider Video SDK

Only upgrade to Video SDK ($1,499/month) if you need:

1. **100% custom UI** - Complete brand control, no Zoom elements
2. **More than 100 participants** - Large webinars or conferences
3. **Advanced features** - Custom video layouts, AI features, complex integrations
4. **No Zoom branding** - Must be completely white-labeled

**For your scenario (15 students, 1 class/day)**, Video SDK is **overkill**.

---

## Cost Projections

### Current Zoom API (Free Tier)
- **Monthly Cost**: $0
- **Limitations**: 40-minute limit, basic features

### Zoom Pro + Meeting SDK
- **Monthly Cost**: $15.99
- **Annual Cost**: $191.88
- **5-Year Cost**: $959.40

### Video SDK
- **Monthly Cost**: $1,499
- **Annual Cost**: $17,988
- **5-Year Cost**: $89,940

**Savings with Pro**: $88,980 over 5 years

---

## Implementation Timeline

### Meeting SDK + Pro Plan
- **Week 1**: Integrate Meeting SDK, test basic functionality
- **Week 2**: Add watermark overlays, configure recording webhook
- **Total**: 2 weeks

### Video SDK (If You Still Want It)
- **Week 1-2**: SDK integration, basic video
- **Week 3-4**: Watermarking system
- **Week 5-7**: Whiteboard implementation
- **Week 8**: Screen sharing
- **Week 9-11**: Recording pipeline
- **Week 12**: Testing & polish
- **Total**: 12 weeks

---

## Next Steps

1. **Upgrade to Zoom Pro**: $15.99/month (cancel anytime)
2. **Integrate Meeting SDK**: Use existing Zoom OAuth credentials
3. **Test with 15 students**: Verify performance and quality
4. **Add watermark overlays**: Simple HTML/CSS implementation
5. **Monitor usage**: Stay within 100-participant limit

---

## FAQs

### Can I use Meeting SDK with my current Zoom account?
**No** - You currently use Server-to-Server OAuth (API only). Meeting SDK requires a **Zoom Pro** account (paid plan).

### Will watermarks work with Meeting SDK?
**Yes** - You can overlay HTML elements on top of the Zoom meeting window. These appear in screen recordings.

### Can I switch from Pro to Video SDK later?
**Yes** - Both use similar APIs. Migration would take ~4 weeks if you decide to upgrade.

### Do students need Zoom accounts?
**No** - They join via your website with Meeting SDK embedded. No Zoom account required.

### Is screen sharing quality good?
**Yes** - Zoom Pro supports HD screen sharing (1080p at 30fps).

---

## Conclusion

**For 15 students, 1-hour sessions, 1 class per day:**

✅ **Zoom Pro + Meeting SDK = $15.99/month** (Recommended)
- Includes screen sharing, whiteboard, 100 participants
- Fast implementation (2 weeks)
- 94% cheaper than Video SDK

❌ **Video SDK = $1,499/month** (Overkill)
- Only needed for 100+ participants or 100% custom UI
- 12 weeks development time
- Not necessary for your use case

**Start with Zoom Pro**. If you later need more customization, upgrade to Video SDK.
