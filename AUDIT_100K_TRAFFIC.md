# 🔍 AUDIT: 100,000 TRAFFIC/DAY - Performance Analysis

## 📊 TÍNH TOÁN CHI PHÍ HIỆN TẠI

### Assumptions cho 100K traffic/day:
```
- Total visitors: 100,000/day
- Avg session duration: 5 phút
- Admin dashboard users: 5 users
- Bot traffic: ~30% (blocked)
- Real users: 70,000/day
```

---

## 💰 FUNCTION INVOCATIONS BREAKDOWN

### 1️⃣ `/api/track` - HIGHEST COST ⚠️

**Current behavior:**
```javascript
// Initial page load: 1 call
// Keep-alive: Every 15 minutes while active
// Smart pause: Skip nếu inactive >5 min hoặc tab hidden
```

**Tính toán:**
```
70,000 real users/day
├─ Initial track: 70,000 calls
└─ Keep-alive (avg 2 calls per 5-min session):
   └─ 70,000 × 2 = 140,000 calls
   
With smart pause (skip 30% inactive):
└─ 140,000 × 70% = 98,000 calls

TOTAL /api/track: 70,000 + 98,000 = 168,000 calls/day
→ × 30 days = 5,040,000 invocations/month
```

**Cost:**
```
5,040,000 - 100,000 (free) = 4,940,000 overage
→ 4,940 × $0.40 = $1,976/month 💸
```

---

### 2️⃣ `/api/dashboard-stats` - MEDIUM

**Current behavior:**
```javascript
// Dashboard polling: every 60 seconds
// 5 admin users
```

**Tính toán:**
```
5 admins × 8 hours/day × 60 calls/hour
= 5 × 8 × 60 = 2,400 calls/day
→ × 30 days = 72,000 invocations/month
```

**Cost:**
```
72,000 invocations
→ 72 × $0.40 = $28.80/month
```

---

### 3️⃣ `/api/track-button-click` - LOW

**Assumptions:**
```
- 10% users click buttons
- Avg 1.5 clicks per user
```

**Tính toán:**
```
70,000 × 10% × 1.5 = 10,500 calls/day
→ × 30 days = 315,000 invocations/month
```

**Cost:**
```
315,000 invocations
→ 315 × $0.40 = $126/month
```

---

### 4️⃣ `/api/analytics` - LOW (cached)

**Current behavior:**
```javascript
// Cached 10 minutes
// Stale-while-revalidate
// Only admins access
```

**Tính toán:**
```
5 admins × 6 unique fetches/hour × 8 hours
= 240 calls/day (max, with cache)
→ × 30 days = 7,200 invocations/month
```

**Cost:**
```
7,200 invocations
→ 7.2 × $0.40 = $2.88/month
```

---

### 5️⃣ Lucky Redirect - FREE ✅

**Already optimized:**
```
Client-side random → 0 API calls → $0
```

---

## 💵 TOTAL MONTHLY COST (Current)

```
/api/track:            $1,976.00  (86% of cost)
/api/track-button:       $126.00  (5%)
/api/dashboard-stats:     $28.80  (1%)
/api/analytics:            $2.88  (0.1%)
Lucky redirect:            $0.00  (FREE)
────────────────────────────────
TOTAL:                 $2,133.68/month
```

---

## 🚨 CRITICAL OPTIMIZATIONS NEEDED

### Priority 1: `/api/track` - CẦN TỐI ƯU NGAY! 🔥

**Current cost:** $1,976/month (86% of total)

**🎯 Optimization 1: Batch Tracking**

Thay vì gọi API mỗi 15 phút, batch nhiều events:

```typescript
// Client-side: Queue events
const trackingQueue = [];

// Batch send mỗi 30 phút thay vì 15 phút
setInterval(() => {
  if (trackingQueue.length > 0) {
    fetch('/api/track-batch', {
      method: 'POST',
      body: JSON.stringify({ events: trackingQueue })
    });
    trackingQueue = [];
  }
}, 30 * 60 * 1000);
```

**Impact:**
```
Before: 168,000 calls/day
After:  84,000 calls/day (30-min intervals)
Savings: 50% = $988/month ✅
```

---

**🎯 Optimization 2: Edge Runtime cho /api/track**

Chuyển `/api/track` sang Edge Runtime:

```typescript
// app/api/track/route.ts
export const runtime = 'edge'; // ✅ Edge = FREE invocations!

// Use Edge-compatible Supabase client
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  // ... existing logic ...
}
```

**Impact:**
```
Before: 5,040,000 invocations/month = $1,976/month
After:  0 invocations (Edge = FREE!) = $0/month
Savings: 100% = $1,976/month! 🎉
```

**⚠️ Caveats:**
- Phải test kỹ với Supabase Edge client
- Edge có limits (CPU time, memory)
- Database functions phải compatible

---

**🎯 Optimization 3: Session caching với Redis/Upstash**

Cache session state để giảm database writes:

```typescript
// Instead of writing to database mỗi 15 phút:
// → Cache in Redis (in-memory)
// → Flush to database mỗi 1 giờ

// Upstash Redis (free tier: 10K commands/day)
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN
});

// Update session in Redis (instant, free)
await redis.set(`session:${sessionId}`, lastActive, { ex: 1800 });

// Background job flushes to database hourly
```

**Impact:**
```
Before: 168,000 database writes/day
After:  7,000 database writes/day (hourly flush)
Savings: 96% database load ✅
Cost: Still counts as invocations, but lighter
```

---

### Priority 2: `/api/dashboard-stats` - Optimization EASY

**Current cost:** $28.80/month

**🎯 Optimization: Increase polling interval**

```typescript
// Current: 60 seconds
// Proposed: 120 seconds (2 minutes)

const interval = setInterval(refreshStats, 120 * 1000);
```

**Impact:**
```
Before: 72,000 calls/month = $28.80
After:  36,000 calls/month = $14.40
Savings: 50% = $14.40/month ✅
```

**Alternative: WebSocket real-time updates**
```
Use Supabase Realtime subscriptions (FREE)
→ 0 polling invocations
→ Savings: 100% = $28.80/month
```

---

### Priority 3: `/api/track-button-click` - Already good

**Current cost:** $126/month

**Status:** ✅ Already batched, acceptable cost

**Possible optimization:**
```
Client-side batching: Queue clicks, send every 30s
→ Could save 50% = $63/month
→ Not worth complexity for this cost
```

---

## 🎯 RECOMMENDED OPTIMIZATION PLAN

### Phase 1: QUICK WINS (1 hour work)

**1. Tăng tracking interval: 15min → 30min**
```
File: app/[slug]/LinkPage.tsx
Change: setInterval(trackView, 30 * 60 * 1000)
Savings: $988/month
```

**2. Tăng dashboard polling: 60s → 120s**
```
File: app/dashboard/DashboardHybrid.tsx
Change: setInterval(refreshStats, 120 * 1000)
Savings: $14.40/month
```

**Total Phase 1 savings: $1,002.40/month**
**New cost: $2,133.68 - $1,002.40 = $1,131.28/month**

---

### Phase 2: EDGE RUNTIME (2-3 hours work, testing)

**Move `/api/track` to Edge**
```
Savings: $1,976/month → $0/month
New total cost: $157.68/month
```

**⚠️ Requires:**
- Supabase JS client (not server client)
- Testing database function calls
- Edge runtime limits check

---

### Phase 3: ADVANCED (Optional, if cost still high)

**1. Redis caching layer**
```
Tool: Upstash Redis (free tier)
Savings: Reduce database load 96%
Cost: $0 (free tier) or $10/month (pro)
```

**2. Supabase Realtime for dashboard**
```
Replace polling with WebSocket
Savings: $28.80/month
```

---

## 📊 COST PROJECTION SUMMARY

| Phase | Monthly Cost | Savings | Effort |
|-------|--------------|---------|--------|
| **Current** | $2,133.68 | - | - |
| **Phase 1** | $1,131.28 | $1,002 | 1 hour ✅ |
| **Phase 2** | $157.68 | $1,976 | 3 hours ✅✅ |
| **Phase 3** | $118.88 | $39 | 8 hours |

---

## 🎯 KHUYẾN NGHỊ NGAY

### ✅ IMPLEMENT PHASE 1 (EASY, BIG WIN)

**Changes needed:**

1. **app/[slug]/LinkPage.tsx** (line ~103):
```typescript
// Change from:
keepAliveInterval = setInterval(trackView, 15 * 60 * 1000);

// To:
keepAliveInterval = setInterval(trackView, 30 * 60 * 1000);
```

2. **app/dashboard/DashboardHybrid.tsx** (line ~36):
```typescript
// Change from:
const interval = setInterval(refreshStats, 60 * 1000);

// To:
const interval = setInterval(refreshStats, 120 * 1000);
```

**Result:**
```
$2,133.68/month → $1,131.28/month
SAVINGS: $1,002.40/month (47% reduction)
TIME: 5 minutes to implement
```

---

### 🚀 CONSIDER PHASE 2 (EDGE RUNTIME)

**If $1,131/month vẫn cao**, implement Edge Runtime:

**Benefits:**
- Tracking = FREE (no invocations)
- Fast (closer to users)
- Scalable to millions

**Risks:**
- Need thorough testing
- Edge limits (max 10 seconds runtime)
- Supabase compatibility check

---

## 🎉 FINAL RECOMMENDATION

**Với 100K traffic/day:**

1. ✅ **IMPLEMENT PHASE 1 NGAY** 
   - 5 phút work
   - Giảm ngay $1,000/month
   - Zero risk

2. ⚠️ **MONITOR for 1 tuần**
   - Xem $1,131/month có chấp nhận được không
   - Check user experience impact

3. 🚀 **NẾU VẪN CAO** → Phase 2 (Edge Runtime)
   - Giảm xuống $157/month
   - Cần test kỹ

---

## 📞 NEXT STEPS

Bạn muốn:
1. ✅ Implement Phase 1 ngay? (30min → 120s)
2. 🚀 Straight to Phase 2? (Edge Runtime)
3. 📊 Monitor current cost trước?

**Khuyến nghị: Option 1 → Monitor → Option 2 nếu cần**

