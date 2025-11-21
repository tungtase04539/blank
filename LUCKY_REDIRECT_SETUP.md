# 🍀 Lucky Redirect - Setup Guide

## ✨ Tính năng
**Lucky Redirect GLOBAL** - Tự động redirect một phần % người dùng đến offer ngay khi click, áp dụng cho **TẤT CẢ links**!

---

## 🚀 Setup trong 3 bước

### Bước 1: Chạy SQL Migration

Mở **Supabase SQL Editor** và chạy toàn bộ file:

```sql
-- Copy từ: supabase-lucky-global-settings.sql
```

Hoặc chạy trực tiếp:

```sql
-- Remove old per-link columns (if exist)
ALTER TABLE public.links 
DROP COLUMN IF EXISTS lucky_enabled,
DROP COLUMN IF EXISTS lucky_percentage,
DROP COLUMN IF EXISTS lucky_type;

-- Add global settings
ALTER TABLE public.global_settings 
ADD COLUMN IF NOT EXISTS lucky_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS lucky_percentage INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS lucky_type TEXT DEFAULT 'random';

-- Add constraint
ALTER TABLE public.global_settings 
ADD CONSTRAINT lucky_percentage_range 
CHECK (lucky_percentage >= 0 AND lucky_percentage <= 100);
```

✅ **Done!**

---

### Bước 2: Cấu hình Redirect URLs

1. Dashboard → **Redirect URLs**
2. **Add** ít nhất 1 URL
3. ✅ Enable URL đó

**Lưu ý**: Lucky cần có URLs để redirect!

---

### Bước 3: Bật Lucky Redirect

Ngay trong trang **Redirect URLs**, bạn sẽ thấy:

**🍀 Lucky Redirect** section ở đầu trang:

1. ✅ **Toggle ON** - Enable Lucky Redirect
2. 📊 **Chọn tỷ lệ** - Slider hoặc quick buttons (5%, 10%, 20%, 50%, 100%)
3. 🎲 **Chọn mode**:
   - **Random**: Mỗi click = chance mới
   - **Daily**: Consistent cả ngày (recommended ✓)
4. 💾 **Save Settings**

---

## 🎯 Cách hoạt động

### Example với 10% Daily:

```
User A - 21/11:
→ Click any link → Hash = 7 → 7 < 10 → REDIRECT ✅
→ Click lại → REDIRECT ✅ (consistent!)

User A - 22/11:
→ Click any link → Hash = 84 → 84 > 10 → Video 🎬

User B - 21/11:
→ Click any link → Hash = 52 → 52 > 10 → Video 🎬
```

**Áp dụng cho TẤT CẢ links!** Không cần config từng link riêng.

---

## ⚙️ Recommended Settings

### Bắt đầu:
```
✅ Lucky: ON
📊 Percentage: 10%
🎲 Type: Daily
```

### Black Friday / Campaign mạnh:
```
✅ Lucky: ON
📊 Percentage: 50%
🎲 Type: Random
```

### Content Focus:
```
✅ Lucky: ON
📊 Percentage: 5%
🎲 Type: Daily
```

---

## 🔍 Test

1. Mở bất kỳ link nào
2. Console (F12):

**Lucky user:**
```
🍀 Lucky check (daily): YES (10% chance)
🍀 Lucky redirect to: https://offer.com/deal
```

**Normal user:**
```
🍀 Lucky check (daily): NO (10% chance)
```

---

## 📊 Ưu điểm của Global Settings

| Feature | Per-Link (Old) | Global (New ✓) |
|---------|---------------|----------------|
| Setup | Config từng link riêng ❌ | Config 1 lần cho tất cả ✅ |
| Quản lý | Phức tạp nhiều setting | Đơn giản 1 chỗ |
| Thay đổi | Phải edit từng link | Update 1 lần apply hết |
| UX | Khó kiểm soát | Dễ dàng |

---

## ❓ FAQ

**Q: Có thể tắt lucky cho 1 link cụ thể không?**  
A: Không. Lucky là global setting. Nếu muốn, tạo account/subdomain riêng cho link đó.

**Q: Làm sao biết lucky đang hoạt động?**  
A: Check Console log (F12) khi visit bất kỳ link nào.

**Q: Performance impact?**  
A: KHÔNG! Hash-based, instant, no database queries.

**Q: Random vs Daily?**  
A: Daily recommended - chống spam refresh, UX tốt hơn.

---

## 🎉 Done!

Bây giờ **TẤT CẢ links** của bạn đã có Lucky Redirect! 🍀

Happy redirecting! 💰

