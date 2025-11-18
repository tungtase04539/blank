# 🔍 Debug Google Analytics Tracking

## Bước 1: Check Script trong Browser

### **Mở link của bạn:**
```
https://your-domain.vercel.app/abc12mp4
```

### **Mở Console (F12):**
```javascript
// Paste vào Console và Enter:

// 1. Check gtag function
console.log('gtag function:', typeof gtag);

// 2. Check dataLayer
console.log('dataLayer:', window.dataLayer);

// 3. Check all scripts
console.log('All scripts:', document.querySelectorAll('script').length);
Array.from(document.querySelectorAll('script')).forEach((s, i) => {
  console.log(`Script ${i}:`, s.src || s.textContent.substring(0, 100));
});
```

**Kết quả mong đợi:**
```
gtag function: function
dataLayer: Array [...]
All scripts: 5-10
Script X: https://www.googletagmanager.com/gtag/js?id=G-P0Y80ZBPPC
```

**Nếu thấy "undefined":**
→ Script không load!

---

## Bước 2: Check Network Requests

### **Mở Network Tab (F12):**
1. Click tab **Network**
2. Filter: `collect`
3. Refresh page
4. Visit link

**Tìm request:**
```
www.google-analytics.com/g/collect?...
```

**Nếu KHÔNG thấy:**
→ GA script không chạy!

---

## Bước 3: View Page Source

### **Right click → View Page Source**
Search for: `G-P0Y80ZBPPC`

**Nếu KHÔNG tìm thấy:**
→ Script không được inject vào HTML!

---

## 📸 Gửi cho tôi:

1. **Console output** (screenshot)
2. **Network tab** (có request "collect" không?)
3. **View Source** (có `G-P0Y80ZBPPC` không?)
4. **Script content** từ database:
   ```sql
   SELECT content FROM scripts WHERE enabled = true;
   ```

