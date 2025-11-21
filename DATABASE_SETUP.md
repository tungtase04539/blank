# 🗄️ HƯỚNG DẪN SETUP DATABASE

## ✅ PHIÊN BẢN STABLE - ĐANG CHẠY TỐT

Hệ thống đã được rollback về phiên bản stable (commit 0299505).

---

## 📋 CẦN LÀM GÌ?

### Bước 1: Vào Supabase SQL Editor

1. Mở: https://supabase.com/dashboard
2. Chọn project của bạn
3. Click **SQL Editor** (sidebar bên trái)

---

### Bước 2: Chạy SQL Script

1. Click **"New Query"**
2. Copy **TOÀN BỘ** nội dung file: `supabase-basic-setup.sql`
3. Paste vào SQL Editor
4. Click **"Run"** (hoặc Ctrl+Enter)

**✅ Kết quả mong đợi:**

Cuối cùng sẽ thấy:

```
✅ Basic setup complete!
📊 Tables: daily_link_views, online_sessions
🔧 Functions: 5 tracking functions
📈 Views: link_stats, last_7_days_stats
🔒 RLS: Enabled with policies

✅ Your system is ready to use!
```

---

## 🔍 SCRIPT LÀM GÌ?

### Tạo Tables:
- ✅ `daily_link_views` - Lưu số views hàng ngày
- ✅ `online_sessions` - Track users đang online

### Tạo Functions:
- ✅ `increment_daily_views()` - Tăng view count
- ✅ `update_online_session()` - Update session
- ✅ `get_online_count()` - Đếm users online
- ✅ `get_total_online_count()` - Tổng users online
- ✅ `cleanup_old_sessions()` - Dọn dẹp sessions cũ

### Tạo Views:
- ✅ `link_stats` - Statistics cho dashboard
- ✅ `last_7_days_stats` - Chart 7 ngày

### Tạo Indexes:
- ✅ Index cho queries nhanh hơn

### Enable RLS:
- ✅ Row Level Security policies

---

## ✅ VERIFY SETUP

Sau khi chạy script, verify bằng query này:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('daily_link_views', 'online_sessions')
ORDER BY table_name;

-- Should see 2 tables ✅

-- Check functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%online%' OR routine_name LIKE '%daily%'
ORDER BY routine_name;

-- Should see 5 functions ✅
```

---

## 🎯 SAU KHI HOÀN TẤT

### Hệ thống sẽ có:
- ✅ Tracking hoạt động (views, online users)
- ✅ Dashboard hiển thị đúng
- ✅ Statistics đầy đủ
- ✅ Auto cleanup sessions cũ

### Không cần:
- ❌ Không cần thêm file code nào
- ❌ Không cần cài thêm packages
- ❌ Không cần deploy lại

---

## 🆘 NẾU CÓ LỖI

### Lỗi: "already exists"

**Giải pháp:** Bỏ qua! Script an toàn, không làm mất data.

Script sử dụng:
- `CREATE IF NOT EXISTS` - Chỉ tạo nếu chưa có
- `CREATE OR REPLACE` - Update nếu đã có
- `DO $$ IF NOT EXISTS` - Check trước khi tạo policies

→ **An toàn chạy nhiều lần!**

---

### Lỗi: "permission denied"

**Giải pháp:** 
1. Check bạn đã login đúng account (owner project)
2. Trong Supabase Settings → Database
3. Check role có quyền admin

---

## 💡 LƯU Ý

### Script này:
- ✅ Safe - Không xóa data cũ
- ✅ Idempotent - Chạy lại nhiều lần OK
- ✅ Backward compatible - Không break code cũ

### Không cần:
- ❌ Không cần backup trước
- ❌ Không cần downtime
- ❌ Không cần restart Vercel

---

## 📊 SYSTEM STATUS

### Code (Vercel):
- ✅ Deployed: Stable version (0299505)
- ✅ Features: Tất cả hoạt động bình thường
- ✅ Bot blocking: Facebook bots đã bị chặn
- ✅ Tracking: Đang hoạt động (8-minute interval)

### Database (Supabase):
- ⏳ Cần chạy: `supabase-basic-setup.sql`
- ⏳ Thời gian: ~10 giây
- ✅ Sau đó: Hoàn tất 100%

---

## 🎉 HOÀN TẤT

Sau khi chạy SQL script:

1. ✅ Website hoạt động bình thường
2. ✅ Tracking views & online users
3. ✅ Dashboard hiển thị đúng
4. ✅ Statistics đầy đủ

**Không cần làm gì thêm!**

---

## 📞 HỖ TRỢ

**Nếu có vấn đề:**
1. Check Vercel Dashboard: Website có online không?
2. Check Supabase Logs: Có lỗi query không?
3. Test website: Mở link và check tracking

**File cần:**
- `supabase-basic-setup.sql` - SQL script chính
- `DATABASE_SETUP.md` - File này (hướng dẫn)

---

**Chạy SQL script và enjoy hệ thống stable! 🚀**

