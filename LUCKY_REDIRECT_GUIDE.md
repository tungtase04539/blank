# 🍀 Lucky Redirect Feature - Hướng Dẫn Sử Dụng

## 🎯 Tính năng là gì?

**Lucky Redirect** cho phép bạn tự động redirect một phần % người dùng đến offer page ngay khi họ click vào link, thay vì xem video.

### Ví dụ:
- **Setting**: 10% Lucky Redirect
- **Kết quả**: 10 người redirect ngay → 90 người xem video (trên 100 người)

---

## 🚀 Cách Sử Dụng

### Bước 1: Cấu hình Redirect URLs

Đầu tiên, bạn cần cấu hình redirect URLs trong dashboard:

1. Vào **Dashboard** → **Redirect URLs**
2. Thêm ít nhất 1 redirect URL
3. Đảm bảo URL đã được **enabled**

### Bước 2: Enable Lucky Redirect cho Link

1. Vào **Links** → Click **Edit** trên link bạn muốn enable
2. Scroll xuống section **🍀 Lucky Redirect**
3. Check ✅ **Bật Lucky Redirect**
4. Điều chỉnh **tỷ lệ %** bằng slider hoặc quick buttons:
   - `5%` - Conservative (ít aggressive)
   - `10%` - Normal (recommended)
   - `20%` - Medium
   - `50%` - Aggressive
   - `100%` - All users redirect (không ai xem video!)

### Bước 3: Chọn Loại Redirect

**🎲 Random Mode** (Mặc định)
- Mỗi lần click = cơ hội mới
- User có thể refresh để thử lại
- Phù hợp: Campaign ngắn hạn, A/B testing

**📅 Daily Mode** (Khuyên dùng)
- Cố định cả ngày cho mỗi user
- User không thể spam refresh
- Ngày mai = cơ hội mới
- Phù hợp: Long-term campaigns, chống gaming

### Bước 4: Save và Test

1. Click **Update Link**
2. Test bằng cách click vào link của bạn
3. Check Console log (F12) để xem kết quả:
   ```
   🍀 Lucky check (random): YES (10% chance)
   🍀 Lucky redirect to: https://offer.com/deal
   ```

---

## 📊 Use Cases

### Use Case 1: Normal Campaign (10% Daily)
```
✅ Lucky Enabled: TRUE
📊 Percentage: 10%
🎲 Type: Daily
📈 Expected: 100 redirects + 900 video views per 1000 visitors
🎯 Goal: Balance content và conversion
```

### Use Case 2: Black Friday (50% Random)
```
✅ Lucky Enabled: TRUE
📊 Percentage: 50%
🎲 Type: Random
📈 Expected: 500 redirects + 500 video views per 1000 visitors
🎯 Goal: Maximize conversions trong limited time
```

### Use Case 3: Content Focus (5% Daily)
```
✅ Lucky Enabled: TRUE
📊 Percentage: 5%
🎲 Type: Daily
📈 Expected: 50 redirects + 950 video views per 1000 visitors
🎯 Goal: Focus video engagement, offer là bonus
```

### Use Case 4: Direct Offer (100% Random)
```
✅ Lucky Enabled: TRUE
📊 Percentage: 100%
🎲 Type: Random
📈 Expected: 1000 redirects + 0 video views
🎯 Goal: Link trở thành direct link đến offer
```

---

## 🔧 Technical Details

### Random Mode Logic
```typescript
// Mỗi lần click
const shouldRedirect = Math.random() * 100 < percentage;
// Example: percentage = 10
// Random = 0.05 → 5 < 10 → TRUE → REDIRECT
// Random = 0.87 → 87 > 10 → FALSE → VIDEO
```

### Daily Mode Logic
```typescript
// Hash based on userId + date
const seed = `${userId}-2025-11-21`;
const hash = hashFunction(seed) % 100;
const shouldRedirect = hash < percentage;

// Example:
// User A + 2025-11-21 → hash = 7 → 7 < 10 → REDIRECT (cả ngày)
// User A + 2025-11-22 → hash = 84 → 84 > 10 → VIDEO (ngày mới)
// User B + 2025-11-21 → hash = 52 → 52 > 10 → VIDEO
```

---

## 📈 Monitoring & Analytics

### Check Performance

Trong Console log (F12) khi user visit link:

**Lucky User:**
```
🍀 Lucky check (daily): YES (10% chance)
🍀 Lucky redirect to: https://offer.com/deal
```

**Normal User:**
```
🍀 Lucky check (daily): NO (10% chance)
```

### Expected vs Actual

- **Expected**: Setting 10% → ~100 redirects / 1000 visits
- **Actual**: Có thể dao động 8-12% do randomness
- **Long-term**: Càng nhiều visitors, càng gần với expected %

---

## ⚠️ Lưu Ý Quan Trọng

### 1. Cần có Redirect URLs
```
❌ KHÔNG CÓ redirect URLs → User xem video bình thường
✅ CÓ redirect URLs → Lucky feature hoạt động
```

### 2. Lucky vs Normal Redirect
```
Lucky Redirect: NGAY KHI CLICK → instant redirect
Normal Redirect: SAU KHI XEM VIDEO → video ended redirect
```

Hai features **KHÔNG conflict**, có thể enable cả 2:
- Lucky users → redirect ngay
- Normal users → xem video → redirect sau khi xong

### 3. Performance Impact
```
✅ NO DATABASE QUERIES (hash-based)
✅ NO PERFORMANCE IMPACT
✅ INSTANT CHECK (<1ms)
```

### 4. Bot Protection
Lucky redirect vẫn áp dụng bot blocking:
```
✅ Real users → Lucky check
❌ Bots → Skip (không track, không redirect)
```

---

## 🐛 Troubleshooting

### Problem 1: Lucky enabled nhưng không redirect

**Nguyên nhân:**
- Chưa cấu hình redirect URLs
- Redirect URLs bị disabled
- API `/api/smart-redirect` error

**Fix:**
1. Check Dashboard → Redirect URLs
2. Đảm bảo có ít nhất 1 URL enabled
3. Check Console log (F12) để xem error

### Problem 2: Tỷ lệ redirect không đúng

**Nguyên nhân:**
- Sample size nhỏ (< 100 users)
- Random variance

**Fix:**
- Đợi đủ traffic (>1000 users)
- Long-term sẽ đúng với expected %

### Problem 3: Daily mode không consistent

**Nguyên nhân:**
- Browser cache
- Cookies cleared
- Different userId

**Fix:**
- Check userId trong Console log
- Xoá cache và test lại

---

## 🎓 Best Practices

### 1. Start Conservative
```
Ngày 1-7:   10% daily → monitor
Ngày 8-14:  20% daily → scale up
Ngày 15+:   Optimize based on data
```

### 2. Use Daily Mode for Long-term
```
✅ Daily: Consistent UX, no gaming
❌ Random: Confusing UX, spam refresh
```

### 3. A/B Test Different Percentages
```
Link A: 5% lucky
Link B: 10% lucky  
Link C: 20% lucky
→ Compare conversion rates
```

### 4. Combine with Normal Redirect
```
Lucky users (10%): Instant offer
Normal users (90%): Video → then offer
→ Dual conversion funnel
```

---

## 📞 Support

Nếu có vấn đề hoặc câu hỏi:
1. Check Console log (F12) để debug
2. Verify redirect URLs configured
3. Test với incognito mode

---

## 🎉 Summary

Lucky Redirect là công cụ mạnh mẽ để:
- ✅ Tăng conversion rate
- ✅ Balance giữa content và offers
- ✅ Flexible control (5-100%)
- ✅ No performance impact
- ✅ Easy to use

**Recommended setting**: 10% Daily Mode 🍀

Happy redirecting! 🚀

