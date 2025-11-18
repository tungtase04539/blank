# 🔍 Check Google Analytics API Status

## Bước 1: Kiểm tra Environment Variables trong Vercel

1. Vào Vercel Dashboard → Project → **Settings** → **Environment Variables**

2. Check 3 variables này có tồn tại không:
   - ✅ `GA_PROPERTY_ID` = số (VD: 123456789)
   - ✅ `GA_CLIENT_EMAIL` = email@...iam.gserviceaccount.com
   - ✅ `GA_PRIVATE_KEY` = -----BEGIN PRIVATE KEY-----\n...

3. **NẾU CHƯA CÓ** → Cần setup (xem hướng dẫn trước)

4. **NẾU ĐÃ CÓ** → Check tiếp Bước 2

---

## Bước 2: Test API Endpoint Trực Tiếp

### **2.1. Mở browser, vào:**
```
https://your-domain.vercel.app/api/analytics
```

### **2.2. Xem response:**

**✅ SUCCESS (có data):**
```json
{
  "topOnlineLinks": [
    {"page": "/abc12mp4", "activeUsers": 5},
    ...
  ]
}
```

**⚠️ EMPTY (chưa có visitors):**
```json
{
  "topOnlineLinks": []
}
```

**❌ ERROR (API lỗi):**
```json
{
  "topOnlineLinks": []
}
```
Hoặc trống rỗng, hoặc lỗi 500.

---

## Bước 3: Test Realtime Endpoint

### **Vào:**
```
https://your-domain.vercel.app/api/analytics/realtime
```

### **Expected response:**
```json
{
  "activeUsers": 1,
  "pageViews": 1,
  "topPages": []
}
```

**Nếu:**
```json
{
  "activeUsers": 0,
  "pageViews": 0,
  "topPages": []
}
```
→ API hoạt động nhưng chưa có data (hoặc chưa setup credentials)

---

## Bước 4: Check Vercel Logs

1. Vercel Dashboard → **Logs** (hoặc **Functions**)
2. Tìm logs của `/api/analytics`

**✅ Good logs:**
```
📦 Serving top online links from cache
🌐 Fetching top online links from Google
```

**❌ Error logs:**
```
Error: Your project's URL and Key are required
Error: getaddrinfo ENOTFOUND
Error: Could not load the default credentials
Error: Permission denied
```

---

## Bước 5: Debug trong Browser Console

### **Mở Dashboard, paste vào Console:**

```javascript
// Check if dashboard is fetching data
fetch('/api/analytics/realtime')
  .then(r => r.json())
  .then(data => {
    console.log('Realtime API response:', data);
  });

fetch('/api/analytics')
  .then(r => r.json())
  .then(data => {
    console.log('Top Online API response:', data);
  });
```

**Expected:**
```
Realtime API response: {activeUsers: 1, pageViews: 1, ...}
Top Online API response: {topOnlineLinks: [...]}
```

---

## 📸 Gửi cho tôi:

1. **Environment Variables screenshot** (blur private key)
2. **API response:** `/api/analytics` và `/api/analytics/realtime`
3. **Vercel Logs** (nếu có errors)
4. **Browser Console** output

Với thông tin này tôi sẽ biết chính xác vấn đề ở đâu!

