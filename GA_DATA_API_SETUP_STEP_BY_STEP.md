# 🔧 Google Analytics Data API - Setup Chi Tiết

## ✅ CHECKLIST TỔNG QUAN

- [ ] Bước 1: Enable API
- [ ] Bước 2: Create Service Account
- [ ] Bước 3: Download JSON Key
- [ ] Bước 4: Grant GA Access
- [ ] Bước 5: Get Property ID
- [ ] Bước 6: Add Environment Variables
- [ ] Bước 7: Redeploy & Test

---

## 🚀 BƯỚC 1: ENABLE GOOGLE ANALYTICS DATA API

### **1.1. Vào Google Cloud Console:**
```
https://console.cloud.google.com/
```

### **1.2. Select (hoặc Create) Project:**
- Click dropdown ở top bar
- Chọn project hiện tại HOẶC **New Project**
- Nếu tạo mới: Name = `analytics-api-project`

### **1.3. Enable API:**
1. Vào menu **APIs & Services** → **Library**
2. Search: `Google Analytics Data API`
3. Click vào **Google Analytics Data API**
4. Click **ENABLE**
5. Đợi vài giây → Status: ✅ Enabled

✅ **Bước 1 hoàn thành!**

---

## 🔑 BƯỚC 2: CREATE SERVICE ACCOUNT

### **2.1. Vào Credentials:**
```
Menu → APIs & Services → Credentials
```

### **2.2. Create Service Account:**
1. Click **+ CREATE CREDENTIALS** (top bar)
2. Select: **Service account**

### **2.3. Service account details:**
```
Service account name: analytics-reader
Service account ID: analytics-reader (auto-fill)
Description: Read Google Analytics data for dashboard
```
4. Click **CREATE AND CONTINUE**

### **2.4. Grant access (Role):**
1. Select role: **Viewer**
   - Search: "viewer"
   - Select: **Viewer** (Basic role)
2. Click **CONTINUE**

### **2.5. Grant users access:**
- Skip this step (không cần)
- Click **DONE**

✅ **Service Account created!**

---

## 📥 BƯỚC 3: DOWNLOAD JSON KEY

### **3.1. Vào Service Accounts:**
```
APIs & Services → Credentials → Service Accounts section
```

### **3.2. Click vào Service Account vừa tạo:**
```
analytics-reader@your-project.iam.gserviceaccount.com
```

### **3.3. Create Key:**
1. Click tab **KEYS** (top menu)
2. Click **ADD KEY** → **Create new key**
3. Key type: **JSON** ✅
4. Click **CREATE**

### **3.4. File tự động download:**
```
your-project-123456-abc123.json
```

⚠️ **QUAN TRỌNG:**
- LƯU FILE NÀY CẨN THẬN
- KHÔNG share lên GitHub/public
- Sẽ dùng ở Bước 6

✅ **JSON Key downloaded!**

---

## 🔓 BƯỚC 4: GRANT GA ACCESS

### **4.1. Mở JSON file, tìm dòng:**
```json
"client_email": "analytics-reader@your-project-123456.iam.gserviceaccount.com"
```
**Copy email này!**

### **4.2. Vào Google Analytics:**
```
https://analytics.google.com/
```

### **4.3. Vào Admin:**
1. Click **Admin** (icon bánh răng góc dưới trái)
2. Column **Property**: Chọn property của bạn (G-P0Y80ZBPPC)

### **4.4. Property Access Management:**
1. Click **Property access management**
2. Click **➕** (Add users) ở góc phải trên

### **4.5. Add Service Account:**
```
Email address: PASTE email từ JSON (bước 4.1)
Role: Viewer ✅
Notify new users by email: UNCHECK ❌
```
3. Click **Add**

### **4.6. Verify:**
Sẽ thấy service account email trong danh sách users với role **Viewer**.

✅ **Service Account có quyền truy cập GA!**

---

## 🔢 BƯỚC 5: GET PROPERTY ID

### **5.1. Vẫn ở GA Admin:**
1. Column **Property**
2. Click **Property settings**

### **5.2. Copy Property ID:**
```
Property ID: 123456789
```

⚠️ **LƯU Ý:**
- Đây là Property ID (số)
- KHÔNG phải Measurement ID (G-P0Y80ZBPPC)

**Example:**
```
✅ ĐÚNG: 123456789
❌ SAI: G-P0Y80ZBPPC
```

✅ **Property ID copied!**

---

## 🔐 BƯỚC 6: ADD ENVIRONMENT VARIABLES TO VERCEL

### **6.1. Mở JSON file, extract 2 values:**

```json
{
  "client_email": "analytics-reader@project.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgk...\n-----END PRIVATE KEY-----\n"
}
```

### **6.2. Vào Vercel:**
```
https://vercel.com/dashboard
```

### **6.3. Select Project → Settings:**
1. Click vào project của bạn
2. Click **Settings** (tab menu)
3. Click **Environment Variables** (menu bên trái)

### **6.4. Add Variable 1 - GA_PROPERTY_ID:**
```
Name: GA_PROPERTY_ID
Value: 123456789
```
- Check: ☑️ Production, ☑️ Preview, ☑️ Development
- Click **Save**

### **6.5. Add Variable 2 - GA_CLIENT_EMAIL:**
```
Name: GA_CLIENT_EMAIL
Value: analytics-reader@your-project-123456.iam.gserviceaccount.com
```
(Copy từ JSON file)
- Check: ☑️ Production, ☑️ Preview, ☑️ Development
- Click **Save**

### **6.6. Add Variable 3 - GA_PRIVATE_KEY:**

⚠️ **QUAN TRỌNG NHẤT - ĐỌC KỸ:**

1. Mở JSON file
2. Tìm `"private_key":`
3. Copy TOÀN BỘ value (bao gồm quotes)
4. Remove quotes ở đầu và cuối
5. GIỮ NGUYÊN `\n` characters

**Example:**
```
JSON file có:
"private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQI...\n-----END PRIVATE KEY-----\n"

Copy vào Vercel (remove quotes):
-----BEGIN PRIVATE KEY-----\nMIIEvQI...\n-----END PRIVATE KEY-----\n
```

**Full value:**
```
Name: GA_PRIVATE_KEY
Value: -----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...[very long]...\n-----END PRIVATE KEY-----\n
```

- Check: ☑️ Production, ☑️ Preview, ☑️ Development
- Click **Save**

### **6.7. Verify all 3 variables:**
```
✅ GA_PROPERTY_ID = 123456789
✅ GA_CLIENT_EMAIL = analytics-reader@...
✅ GA_PRIVATE_KEY = -----BEGIN PRIVATE KEY-----\n...
```

✅ **Environment Variables added!**

---

## 🚀 BƯỚC 7: REDEPLOY

### **7.1. Trigger Redeploy:**
1. Vào **Deployments** tab
2. Click **⋮** (3 dots) ở deployment mới nhất
3. Click **Redeploy**
4. Click **Redeploy** để confirm

### **7.2. Wait for deployment:**
```
⏳ Building... (2-3 phút)
✅ Ready!
```

---

## ✅ BƯỚC 8: TEST

### **8.1. Test API Endpoints:**

**Mở browser, vào:**
```
https://your-domain.vercel.app/api/analytics/realtime
```

**Expected response:**
```json
{
  "activeUsers": 1,
  "pageViews": 1,
  "topPages": []
}
```

**Nếu thấy số khác 0 → SUCCESS! ✅**

### **8.2. Test Dashboard:**

**Vào:**
```
https://your-domain.vercel.app/dashboard
```

**Should see:**
```
📊 Real-time Analytics (Last 30 Minutes)
┌────────────────┐  ┌────────────────┐
│ 👥 Active Users│  │ 📄 Page Views  │
│       1        │  │       1        │
└────────────────┘  └────────────────┘
```

### **8.3. Verify Top 10 Online:**
1. Vào 1 link từ điện thoại: `/abc12mp4`
2. Đợi 5 phút
3. Refresh Dashboard
4. Should see trong **Top 10 Online Now** section

---

## 🔍 TROUBLESHOOTING

### **❌ Error: "Permission denied"**

**Check:**
```sql
-- Service Account email có trong GA không?
GA → Admin → Property Access Management
→ Tìm: analytics-reader@...
→ Role: Viewer
```

**Fix:** Làm lại Bước 4

---

### **❌ Error: "Could not load default credentials"**

**Check:**
- `GA_CLIENT_EMAIL` spelling đúng không?
- `GA_PRIVATE_KEY` có đầy đủ không?
- Có dấu space thừa không?

**Fix:** 
1. Vercel → Settings → Environment Variables
2. Delete `GA_PRIVATE_KEY`
3. Re-add với value mới (copy lại từ JSON)
4. Redeploy

---

### **❌ Error: "Property not found"**

**Check:**
- `GA_PROPERTY_ID` đúng không?
- Phải là số (VD: `123456789`)
- KHÔNG phải Measurement ID (`G-P0Y80ZBPPC`)

**Fix:**
1. GA → Admin → Property Settings
2. Copy lại Property ID (số)
3. Update Vercel env var
4. Redeploy

---

### **❌ Dashboard shows "0" everywhere**

**Possible causes:**
1. Chưa có visitors active → Normal
2. API chưa return data → Wait 5-10 minutes
3. Cache → Hard refresh (Ctrl+F5)

**Test:**
1. Mở link từ điện thoại
2. Vào `/api/analytics/realtime` xem response
3. Check Vercel logs for errors

---

## 📊 VERIFY SUCCESS

### **Checklist:**
- [ ] `/api/analytics/realtime` returns activeUsers > 0
- [ ] `/api/analytics` returns topOnlineLinks array
- [ ] Dashboard shows Real-time Analytics card with data
- [ ] Top 10 Online section shows links (when active)
- [ ] No errors in Vercel logs
- [ ] No errors in browser console

### **Vercel Logs should show:**
```
📦 Serving top online links from cache
📦 Serving realtime analytics from cache
🌐 Fetching top online links from Google
```

---

## 🎉 SUCCESS!

**If all checks pass:**
```
✅ GA tracking: Working
✅ GA Data API: Working
✅ Dashboard: Displaying real-time data
✅ Top 10 Online: Working
```

**Your dashboard now shows:**
1. 👥 Active Users (last 30 min)
2. 📄 Page Views
3. 🔥 Most Active Links Now
4. 👥 Top 10 Online Links

---

## 📞 CẦN HỖ TRỢ?

Gửi cho tôi:
1. Screenshot Vercel Environment Variables (blur private key)
2. Response từ `/api/analytics/realtime`
3. Vercel logs (nếu có errors)
4. Browser console errors (nếu có)

Tôi sẽ debug ngay! 🚀

