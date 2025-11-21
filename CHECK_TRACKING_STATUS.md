# 🔍 KIỂM TRA TẠI SAO TRACKING KHÔNG HOẠT ĐỘNG

## 🎯 VẤN ĐỀ

Bạn báo:
- ❌ Total Views ở Dashboard không tăng
- ❌ Total Views ở Links page không tăng
- Google Analytics shows 240 users online
- Database tracking = 0

→ **Tracking API không ghi vào database!**

---

## 🔬 CÁCH KIỂM TRA (3 BƯỚC)

### Bước 1: Kiểm Tra Browser Console

```bash
1. Mở một link của bạn: 
   https://yourdomain.com/xbczcomp4

2. F12 → Console tab

3. Xem có log gì không:
   ✅ "Track view sent" → Đang gọi API
   ⚠️ "Skip track (bot)" → Bị skip
   ❌ Error nào đó → Có lỗi

4. Screenshot và gửi tôi
```

### Bước 2: Kiểm Tra Network Tab

```bash
1. F12 → Network tab

2. Reload trang link

3. Filter: "track"

4. Xem request /api/track:
   Status: 200? 400? 500?
   Response: { "success": true } hay { "blocked": "bot" }?

5. Screenshot và gửi tôi
```

### Bước 3: Kiểm Tra Supabase Logs

```bash
1. Vào: https://supabase.com/dashboard/project/YOUR_PROJECT

2. Click "Logs" → "API"

3. Filter: "increment_daily_views"

4. Xem có log nào trong 5 phút gần đây không?

5. Nếu có lỗi, screenshot và gửi tôi
```

---

## 🐛 CÁC NGUYÊN NHÂN THƯỜNG GẶP

### 1️⃣ Bot Detection Quá Aggressive

**Hiện tượng:**
```
Response: { "success": true, "blocked": "bot" }
```

**Nguyên nhân:**
- User-Agent có chứa "bot", "crawler", "headless"
- Hoặc trống (empty user-agent)

**Giải pháp:**
- Test trên browser thật (Chrome/Firefox)
- Không dùng Incognito với ad blocker
- Không dùng VPN/Proxy

---

### 2️⃣ Database Function Không Tồn Tại

**Hiện tượng:**
```
Supabase logs: "function increment_daily_views does not exist"
```

**Nguyên nhân:**
- Chưa chạy SQL setup
- Hoặc function bị xóa

**Giải pháp:**
```sql
-- Chạy trong Supabase SQL Editor:
-- Copy nội dung file: supabase-basic-setup.sql
-- Paste và Run
```

---

### 3️⃣ RLS Policy Block Insert

**Hiện tượng:**
```
Supabase logs: "new row violates row-level security policy"
```

**Nguyên nhân:**
- RLS chặn insert vào daily_link_views

**Giải pháp:**
```sql
-- Chạy để kiểm tra policies:
SELECT * FROM pg_policies 
WHERE tablename = 'daily_link_views';

-- Nếu không có policy cho INSERT:
CREATE POLICY "Anyone can insert daily views" 
ON daily_link_views
FOR INSERT 
WITH CHECK (true);
```

---

### 4️⃣ CORS hoặc Network Error

**Hiện tượng:**
```
Console: "Failed to fetch"
Network tab: Request failed
```

**Nguyên nhân:**
- CORS issue
- Network firewall
- API route không deploy

**Giải pháp:**
- Check Vercel deployment logs
- Verify route exists: /api/track

---

### 5️⃣ Link ID Không Hợp Lệ

**Hiện tượng:**
```
Response: { "error": "Missing linkId" }
```

**Nguyên nhân:**
- LinkPage không gửi đúng linkId
- Link không tồn tại trong database

**Giải pháp:**
- Check console.log trong LinkPage
- Verify link.id có giá trị

---

## 🧪 TEST FILE ĐỂ DEBUG

Tôi đã tạo file `test-tracking.html` để test tracking.

### Cách dùng:

```bash
1. Lấy Link ID từ database:
   - Vào Supabase → Table Editor → links
   - Copy một ID (UUID format)

2. Sửa trong test-tracking.html:
   const testLinkId = 'PASTE_UUID_HERE';

3. Deploy file lên public folder hoặc chạy local

4. Mở trong browser:
   http://localhost:3000/test-tracking.html

5. Xem kết quả:
   ✅ Success → Tracking works
   ❌ Blocked → Bot detected
   ❌ Error → Something wrong
```

---

## 💡 DEBUG STEPS CHO BẠN

### Step 1: Kiểm Tra Cơ Bản

```bash
1. Mở link trong Chrome normal (không incognito):
   https://yourdomain.com/xbczcomp4

2. F12 → Console
   
3. Gửi tôi screenshot console

4. F12 → Network → Filter "track"
   
5. Gửi tôi screenshot request/response
```

### Step 2: Kiểm Tra Database

```sql
-- Chạy trong Supabase SQL Editor:

-- 1. Check table exists
SELECT * FROM daily_link_views 
ORDER BY updated_at DESC 
LIMIT 5;

-- 2. Check function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'increment_daily_views';

-- 3. Test function manually
SELECT increment_daily_views(
  'YOUR_LINK_ID_HERE'::uuid,
  CURRENT_DATE
);

-- 4. Check if data was inserted
SELECT * FROM daily_link_views
WHERE date = CURRENT_DATE
ORDER BY updated_at DESC;
```

Gửi tôi kết quả của các queries trên!

---

## 🚨 GIẢI PHÁP NHANH

### Nếu muốn test ngay:

**1. Tắt Bot Detection tạm thời:**

```typescript
// app/api/track/route.ts
export async function POST(request: NextRequest) {
  try {
    // ❌ COMMENT OUT BOT DETECTION ĐỂ TEST:
    // const userAgent = request.headers.get('user-agent') || '';
    // if (!userAgent || isBot(userAgent)) {
    //   return NextResponse.json({ success: true, blocked: 'bot' }, { status: 200 });
    // }

    const { linkId } = await request.json();
    
    // Log để debug
    console.log('🔵 Tracking linkId:', linkId);
    
    // ... rest of code
  }
}
```

**2. Deploy và test:**
- Mở link
- Check console log
- Check database

**3. Nếu tracking work → Bot detection là vấn đề**

---

## 📊 GỬI TÔI:

1. **Screenshot Console** khi mở link
2. **Screenshot Network tab** - request /api/track
3. **Kết quả SQL queries** từ Supabase
4. **Vercel deployment logs** nếu có lỗi

Tôi sẽ debug chính xác ngay khi có thông tin này! 🔍

