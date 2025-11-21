# 🔍 KIỂM TRA ONLINE TRACKING

## Bạn nói "nó không còn hoạt động"

Đây là hướng dẫn kiểm tra xem online tracking còn hoạt động không.

---

## ⚡ KIỂM TRA NHANH

### Bước 1: Chạy Script Kiểm Tra

```bash
# Vào Supabase Dashboard → SQL Editor
# Copy & paste nội dung file: verify-online-tracking.sql
# Nhấn Run
```

### Bước 2: Xem Kết Quả

Script sẽ hiển thị:

```
==============================================
📊 ONLINE TRACKING STATUS REPORT
==============================================

✅ Table online_sessions: TỒN TẠI

🔧 Functions: 3 / 3
   ✅ update_online_session
   ✅ get_online_count
   ✅ get_total_online_count

📊 Data: CÓ dữ liệu trong bảng
   ✅ Có session mới trong 30 phút gần đây
   👥 Online hiện tại: 5 users

==============================================
✅ ONLINE TRACKING ĐANG HOẠT ĐỘNG BÌNH THƯỜNG!
==============================================
```

---

## 🎯 CÁC TRƯỜNG HỢP

### ✅ Trường hợp 1: Tất cả OK
```
✅ Table online_sessions: TỒN TẠI
✅ Functions: 3/3
✅ Có data mới

→ Online tracking ĐANG HOẠT ĐỘNG!
```

**Nếu UI không hiển thị:**
- Dashboard có thể đang cache
- F5 (refresh) trang Dashboard
- Chờ 120 giây (auto-refresh interval)

---

### ⚠️ Trường hợp 2: Setup OK nhưng không có data
```
✅ Table online_sessions: TỒN TẠI
✅ Functions: 3/3
⚠️ KHÔNG CÓ data mới (> 30 phút)

→ Tracking setup OK nhưng không có user mới
```

**Cách khắc phục:**
1. Mở một link của bạn: `https://yourdomain.com/<slug>`
2. Giữ tab mở 1-2 phút
3. Quay lại Dashboard → F5
4. Kiểm tra số "Active Users" có tăng không

---

### ❌ Trường hợp 3: Thiếu table hoặc functions
```
❌ Table online_sessions: KHÔNG TỒN TẠI
hoặc
❌ Functions: 0/3

→ Database chưa setup đúng
```

**Cách khắc phục:**
1. Chạy lại SQL setup:
   ```bash
   # Vào Supabase Dashboard → SQL Editor
   # Copy & paste: supabase-basic-setup.sql
   # Nhấn Run
   ```

2. Chạy lại verify script để xác nhận

---

## 🧪 TEST THỦ CÔNG

### Test 1: Mở Link
```bash
1. Mở link của bạn: https://yourdomain.com/<slug>
2. Mở DevTools (F12) → Console tab
3. Xem có log "Track view" không
```

**Kết quả mong đợi:**
```
✅ Skip track (bot detected)  ← OK (nếu là bot)
hoặc
✅ Track view sent           ← OK (tracking đang hoạt động)
```

### Test 2: Kiểm tra API
```bash
# Trong Console của browser (F12)
fetch('/api/track', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    linkId: 'your-link-id-here',
    sessionId: 'test-session-123'
  })
}).then(r => r.json()).then(console.log)
```

**Kết quả mong đợi:**
```json
{ "success": true }
```

### Test 3: Kiểm tra Database
```sql
-- Chạy trong Supabase SQL Editor
SELECT 
  COUNT(*) as total,
  MAX(updated_at) as last_update
FROM online_sessions
WHERE updated_at > NOW() - INTERVAL '5 minutes';
```

**Kết quả mong đợi:**
```
total: > 0
last_update: rất gần hiện tại
```

---

## 🔧 NGUYÊN NHÂN THƯỜNG GẶP

### 1. Bot Detection
```
⚠️ Nếu bạn test từ localhost hoặc với User-Agent đặc biệt
→ Tracking sẽ bị block (by design!)

Giải pháp:
- Test từ browser thật (Chrome, Firefox)
- Không dùng Incognito/Private mode với extensions
- Không dùng DevTools Network throttling
```

### 2. Database Chưa Setup
```
❌ Table hoặc functions không tồn tại

Giải pháp:
→ Chạy: supabase-basic-setup.sql
```

### 3. RLS Policies
```
⚠️ Row Level Security chặn insert/update

Giải pháp:
→ supabase-basic-setup.sql đã tạo policies đúng
→ Nếu vẫn lỗi, kiểm tra Supabase logs
```

### 4. API Route Lỗi
```
❌ /api/track trả về error

Giải pháp:
1. Check Vercel logs (deployment tab)
2. Check Supabase logs (Database → Logs)
3. Kiểm tra env vars (SUPABASE_URL, ANON_KEY)
```

---

## 📊 KIỂM TRA DASHBOARD

### Nơi hiển thị Online Count:

1. **Dashboard → Card "Active Users"** (to, ở đầu)
   ```
   👥 Active Users
   [SỐ LỚN]
   Currently viewing your links
   ```

2. **Dashboard → Top Links** (badge nhỏ)
   ```
   link-name
   🟢 5 online
   ```

3. **Dashboard → Currently Active Links** (cột phải)
   ```
   🌟 Currently Active Links
   [Danh sách links đang có user]
   ```

4. **Links Page → Card "Online Now"**
   ```
   Online Now
   [SỐ]
   ```

5. **Links Page → Table Column**
   ```
   | Link | Views | Online Now |
   | abc  | 100   | 🟢 3       |
   ```

---

## 🎯 KẾT LUẬN

### Nếu verify script báo "✅ HOẠT ĐỘNG":
```
→ Online tracking ĐANG CHẠY
→ Nếu UI không hiển thị:
  - F5 refresh Dashboard
  - Xóa browser cache
  - Chờ 120s (auto-refresh)
```

### Nếu verify script báo "❌ CHƯA HOẠT ĐỘNG":
```
→ Chạy: supabase-basic-setup.sql
→ Chạy lại verify script
→ Test bằng cách mở link
```

---

## 💡 BẠN MUỐN GÌ?

### Option A: Giữ Online Tracking
```
✅ Setup lại database (nếu cần)
✅ Verify tracking hoạt động
💰 Cost: ~$2,000/month (100K traffic)
```

### Option B: Xóa Online Tracking
```
❌ Xóa tất cả UI hiển thị online
❌ Xóa tracking calls
💰 Cost giảm còn: ~$20/month
```

**Bạn muốn làm gì? Chạy verify script trước để xem tình trạng hiện tại!**

