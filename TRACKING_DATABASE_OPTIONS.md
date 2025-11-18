# 💾 Database Options cho Tracking System (500K Traffic/Day)

## 🎯 YÊU CẦU:

- **Traffic**: 500K pageviews/day
- **Writes**: ~500K/day (1 per pageview)
- **Reads**: ~10K/day (dashboard queries)
- **Budget**: FREE hoặc rẻ nhất
- **Performance**: Fast writes, acceptable read latency

---

## 📊 SO SÁNH CÁC OPTIONS:

| Database | Free Tier | Monthly Cost | Best For |
|----------|-----------|--------------|----------|
| **Supabase (hiện tại)** | 500MB, 2GB bandwidth | $0 | ✅ **ALL-IN-ONE** |
| **Upstash Redis** | 10K commands/day | $0 | Fast cache/counters |
| **Cloudflare D1** | 5M reads, 100K writes | $0 | Edge queries |
| **PlanetScale** | 5GB storage | $0 → $29/mo | MySQL scaling |
| **Neon PostgreSQL** | 512MB storage | $0 | PostgreSQL lovers |
| **Vercel KV** | 256MB, 100K commands | $20/mo | ⚠️ NOT FREE |

---

## ⭐ RECOMMENDATION: SUPABASE (Đang dùng) + Tối ưu

### **✅ Ưu điểm:**
- Bạn đã có Supabase
- FREE tier: **500MB DB + 2GB bandwidth**
- PostgreSQL (powerful, familiar)
- RLS (security)
- Real-time subscriptions
- **Đủ cho 500K traffic/day nếu optimize đúng!**

### **💰 Chi phí:**
```
FREE tier:
- 500MB database storage
- 2GB bandwidth/month
- 50K API requests/day ← CẦN TỐI ƯU!

Pro tier ($25/mo):
- 8GB database
- 50GB bandwidth
- 500K API requests/day
```

### **🎯 Chiến lược với Supabase:**

#### **1. Lightweight Tracking Table**
```sql
CREATE TABLE page_views (
  id BIGSERIAL PRIMARY KEY,
  link_id UUID NOT NULL REFERENCES links(id),
  viewed_at TIMESTAMP DEFAULT NOW(),
  -- Bỏ ip_address, user_agent, referer để tiết kiệm
  INDEX idx_link_id_date (link_id, viewed_at DESC)
);
```

#### **2. Aggregate Table (Pre-computed Stats)**
```sql
CREATE TABLE daily_stats (
  id BIGSERIAL PRIMARY KEY,
  link_id UUID NOT NULL,
  date DATE NOT NULL,
  view_count INTEGER DEFAULT 0,
  UNIQUE(link_id, date)
);

-- Update via trigger hoặc scheduled job
```

#### **3. Use Database Functions (giảm API calls)**
```sql
-- Increment counter directly in DB
CREATE OR REPLACE FUNCTION increment_views(p_link_id UUID, p_date DATE)
RETURNS void AS $$
BEGIN
  INSERT INTO daily_stats (link_id, date, view_count)
  VALUES (p_link_id, p_date, 1)
  ON CONFLICT (link_id, date)
  DO UPDATE SET view_count = daily_stats.view_count + 1;
END;
$$ LANGUAGE plpgsql;

-- Call from app:
await supabase.rpc('increment_views', { 
  p_link_id: linkId, 
  p_date: today 
});
```

#### **4. Batch Writes (giảm 90% API calls)**
```typescript
// Client-side: Queue events
const viewQueue: ViewEvent[] = [];

function trackView(linkId: string) {
  viewQueue.push({ linkId, timestamp: Date.now() });
  
  // Send batch every 10 events or 5 seconds
  if (viewQueue.length >= 10) {
    sendBatch();
  }
}

async function sendBatch() {
  await fetch('/api/track-batch', {
    method: 'POST',
    body: JSON.stringify({ events: viewQueue })
  });
  viewQueue.length = 0;
}
```

#### **5. Cleanup Old Data (auto-delete after 30 days)**
```sql
-- Run daily via pg_cron or Supabase Edge Function
DELETE FROM page_views 
WHERE viewed_at < NOW() - INTERVAL '30 days';
```

---

## 🚀 OPTION 2: UPSTASH REDIS (Recommended for counters)

### **✅ Ưu điểm:**
- **FREE tier**: 10K commands/day → ~10K views/day
- Fast writes (Redis)
- Global edge network
- Perfect for counters
- No credit card required

### **💡 Use Case:**
```typescript
// Track views in Redis (fast)
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

// Increment counter
await redis.incr(`views:${linkId}`);
await redis.hincrby(`views:daily:${today}`, linkId, 1);

// Get stats
const views = await redis.get(`views:${linkId}`);
const dailyStats = await redis.hgetall(`views:daily:${today}`);
```

### **💰 Chi phí:**
```
FREE tier: 10K commands/day
Paid: $0.20 per 100K commands

500K views/day = 500K commands
Cost: $1/day = $30/mo ← Vẫn rẻ!
```

### **🎯 Hybrid Approach:**
```
Redis (Upstash) → Fast counters, real-time
Supabase → Long-term storage, analytics

Flow:
1. Write to Redis (fast, real-time)
2. Batch sync to Supabase every hour (persistent)
3. Dashboard reads from Redis (fast)
4. Reports read from Supabase (historical)
```

---

## 🌐 OPTION 3: CLOUDFLARE D1 (SQLite at Edge)

### **✅ Ưu điểm:**
- **FREE tier**: 5M reads/day, 100K writes/day
- SQLite (simple, fast)
- Edge network (low latency)
- **PERFECT for 500K/day!**

### **💡 Setup:**
```bash
# Create D1 database
npx wrangler d1 create tracking-db

# Schema
CREATE TABLE page_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  link_id TEXT NOT NULL,
  viewed_at INTEGER NOT NULL,
  INDEX idx_link_id (link_id)
);
```

### **💰 Chi phí:**
```
FREE tier:
- 5M reads/day ✅
- 100K writes/day ← 500K views = $0 if batched!
- 5GB storage

Cost if exceed: $0.75 per million reads/writes
```

### **🎯 Use with Cloudflare Workers:**
```typescript
// api/track (Cloudflare Worker)
export default {
  async fetch(request, env) {
    const { linkId } = await request.json();
    
    await env.DB.prepare(
      'INSERT INTO page_views (link_id, viewed_at) VALUES (?, ?)'
    ).bind(linkId, Date.now()).run();
    
    return new Response('OK');
  }
}
```

---

## 📊 HYBRID SOLUTION (Recommended cho 500K/day)

### **Architecture:**

```
┌─────────────────────────────────────────────┐
│  Client (Public Link Page)                  │
│  └─> Track pageview                         │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  Vercel Edge Function                       │
│  └─> Batch events (10 per batch)           │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
┌─────────────┐      ┌────────────────┐
│ Upstash     │      │ Supabase       │
│ Redis       │      │ PostgreSQL     │
│             │      │                │
│ Real-time   │◄─────┤ Hourly sync    │
│ counters    │      │ Long-term data │
└──────┬──────┘      └────────┬───────┘
       │                      │
       └──────────┬───────────┘
                  ▼
         ┌────────────────┐
         │  Dashboard     │
         │  - Fast reads  │
         │    from Redis  │
         │  - Analytics   │
         │    from Supabase│
         └────────────────┘
```

### **Implementation:**

```typescript
// 1. Track event (fast write to Redis)
async function trackView(linkId: string) {
  await redis.incr(`views:${linkId}`);
  await redis.hincrby(`daily:${today}`, linkId, 1);
}

// 2. Sync to Supabase (hourly cron)
// Vercel Cron or Supabase Edge Function
async function syncToSupabase() {
  const dailyKeys = await redis.keys('daily:*');
  
  for (const key of dailyKeys) {
    const date = key.split(':')[1];
    const stats = await redis.hgetall(key);
    
    // Batch insert to Supabase
    await supabase.from('daily_stats').upsert(
      Object.entries(stats).map(([linkId, count]) => ({
        link_id: linkId,
        date,
        view_count: count
      }))
    );
    
    // Delete from Redis after sync
    await redis.del(key);
  }
}

// 3. Dashboard reads from Redis (real-time)
async function getDashboardStats() {
  const topLinks = await redis.hgetall(`daily:${today}`);
  return Object.entries(topLinks)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
}
```

---

## 💰 COST COMPARISON (500K views/day):

| Solution | Setup Time | Monthly Cost | Pros |
|----------|------------|--------------|------|
| **Supabase Only (optimized)** | 1 hour | **$0** | Simple, all-in-one |
| **Upstash + Supabase** | 2 hours | **$30** | Fast, reliable |
| **Cloudflare D1** | 3 hours | **$0** | Edge, fast, free |
| **Supabase Pro** | 0 hours | **$25** | More quota, easy |

---

## 🎯 MY RECOMMENDATION:

### **For 500K/day traffic:**

**Option A: Supabase Only (FREE)** ⭐⭐⭐
- Keep current setup
- Optimize with:
  - Aggregate tables
  - Database functions
  - Batch writes
  - Data cleanup
- **Cost: $0/month**
- **Setup: 2 hours**

**Option B: Upstash Redis + Supabase ($30/mo)** ⭐⭐⭐⭐⭐
- Best performance
- Redis for real-time
- Supabase for long-term
- **Cost: $30/month**
- **Setup: 3 hours**

**Option C: Upgrade Supabase Pro ($25/mo)** ⭐⭐⭐⭐
- Easiest solution
- More quota, less worry
- **Cost: $25/month**
- **Setup: 0 hours**

---

## 📋 NEXT STEPS:

**Bạn muốn:**
1. **Tối ưu Supabase hiện tại** (FREE, cần optimize)
2. **Dùng Upstash Redis** ($30/mo, performance tốt)
3. **Upgrade Supabase Pro** ($25/mo, đơn giản)
4. **Thử Cloudflare D1** (FREE, learning curve)

**Tôi recommend: Option 1 hoặc 2!**

Cho tôi biết bạn chọn option nào, tôi sẽ implement ngay! 🚀

