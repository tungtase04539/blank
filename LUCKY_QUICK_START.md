# 🍀 Lucky Redirect - Quick Start (3 bước)

## Bước 1: Chạy SQL Migration ⚡

**Mở Supabase SQL Editor** và chạy:

```sql
-- Copy toàn bộ file: supabase-add-lucky-feature.sql
```

Hoặc chạy trực tiếp:

```sql
ALTER TABLE public.links 
ADD COLUMN IF NOT EXISTS lucky_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS lucky_percentage INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS lucky_type TEXT DEFAULT 'random';
```

✅ **Done!** Cột đã được thêm vào bảng `links`.

---

## Bước 2: Cấu hình Redirect URLs 🔗

1. Vào **Dashboard** → **Redirect URLs**
2. Click **Add URL**
3. Nhập URL offer của bạn (vd: `https://offer.com/deal`)
4. ✅ Check **Enabled**
5. Click **Save**

**Lưu ý**: Lucky redirect SẼ KHÔNG hoạt động nếu không có redirect URLs!

---

## Bước 3: Enable Lucky cho Link 🎯

1. Vào **Links** → Click **Edit** trên link bạn muốn
2. Scroll xuống **🍀 Lucky Redirect**
3. ✅ Check **Bật Lucky Redirect**
4. Chọn tỷ lệ %:
   - **10%** (recommended) - Click quick button
   - Hoặc kéo slider để chọn % khác
5. Chọn loại:
   - **🎲 Random** - Mỗi lần click = chance mới
   - **📅 Daily** - Consistent cả ngày (recommended)
6. Click **Update Link**

---

## ✅ Test Ngay!

1. Mở link của bạn
2. Mở Console (F12)
3. Xem logs:

**Nếu lucky:**
```
🍀 Lucky check (daily): YES (10% chance)
🍀 Lucky redirect to: https://offer.com/deal
```

**Nếu không lucky:**
```
🍀 Lucky check (daily): NO (10% chance)
```

---

## 🎯 Settings Khuyên Dùng

### Cho Beginners:
```
✅ Lucky: ON
📊 Percentage: 10%
🎲 Type: Daily
```

### Cho Black Friday / Aggressive Campaign:
```
✅ Lucky: ON
📊 Percentage: 50%
🎲 Type: Random
```

### Cho Content Focus:
```
✅ Lucky: ON
📊 Percentage: 5%
🎲 Type: Daily
```

---

## ❓ Troubleshooting

### Không redirect?
- ✅ Check đã chạy SQL migration chưa
- ✅ Check đã có redirect URLs chưa
- ✅ Check redirect URLs đã enabled chưa
- ✅ Check Console log (F12) xem lỗi gì

### Tỷ lệ không đúng?
- ⏳ Đợi đủ traffic (>100 users)
- 📊 Random variance là bình thường

---

## 📚 Đọc thêm

Chi tiết đầy đủ: `LUCKY_REDIRECT_GUIDE.md`

---

**That's it!** 🎉 Feature đã sẵn sàng!

