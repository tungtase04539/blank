# Google Analytics Integration Setup

## 📋 Prerequisites
1. Google Analytics 4 (GA4) account
2. Google Cloud Project with Analytics Data API enabled
3. Service Account with Analytics permissions

---

## 🚀 Step-by-Step Setup

### **1. Enable Google Analytics Data API**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services** → **Library**
4. Search for "Google Analytics Data API"
5. Click **Enable**

---

### **2. Create Service Account**

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **Service Account**
3. Enter name: `analytics-reader`
4. Click **Create and Continue**
5. Grant role: **Viewer**
6. Click **Done**

---

### **3. Generate Service Account Key**

1. Click on the created service account
2. Go to **Keys** tab
3. Click **Add Key** → **Create new key**
4. Choose **JSON** format
5. Click **Create** → File will download automatically

The JSON file looks like:
```json
{
  "type": "service_account",
  "project_id": "your-project-123456",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "analytics-reader@your-project-123456.iam.gserviceaccount.com",
  "client_id": "123456789",
  ...
}
```

---

### **4. Grant Analytics Access**

1. Go to [Google Analytics](https://analytics.google.com/)
2. Click **Admin** (bottom left)
3. Select your **Property**
4. Click **Property Access Management**
5. Click **Add users** (+ icon)
6. Enter the **client_email** from JSON file (e.g., `analytics-reader@...iam.gserviceaccount.com`)
7. Select role: **Viewer**
8. Click **Add**

---

### **5. Get Property ID**

1. In Google Analytics, click **Admin**
2. Under **Property**, click **Property Settings**
3. Copy **Property ID** (format: `123456789`)

---

### **6. Configure Environment Variables in Vercel**

Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**

Add these variables:

```bash
# Google Analytics Measurement ID (for frontend tracking)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Google Analytics Property ID (for API access)
GA_PROPERTY_ID=123456789

# Service Account Email
GA_CLIENT_EMAIL=analytics-reader@your-project-123456.iam.gserviceaccount.com

# Service Account Private Key
GA_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFA...\n-----END PRIVATE KEY-----\n
```

**⚠️ Important:**
- For `GA_PRIVATE_KEY`, copy the ENTIRE private key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Keep the `\n` characters in the key (don't remove them)

---

### **7. Install NPM Package**

Add to `package.json`:

```bash
npm install @google-analytics/data
```

---

### **8. Redeploy**

```bash
git add .
git commit -m "Add Google Analytics Data API integration"
git push origin main
```

---

## ✅ Testing

After deployment, visit your dashboard:
- You should see "Page Views (GA)" and "Online Now" cards populate with data
- Traffic chart should show Google Analytics data
- Data refreshes every 5 minutes automatically

---

## 📊 Available Data

### **Dashboard:**
- Total Page Views (last 7 days)
- Real-time Active Users
- Daily traffic chart
- Top pages
- Device breakdown
- Traffic sources

### **Per-Link Analytics:**
- Views per link
- Daily breakdown
- User engagement

---

## 🔒 Security Notes

1. **NEVER** commit the JSON key file to Git
2. Store all credentials in Vercel Environment Variables only
3. Service Account should have **Viewer** role only (read-only)
4. Rotate keys periodically for security

---

## 🚫 Troubleshooting

### Error: "Failed to fetch analytics"
- Check if GA_PROPERTY_ID is correct
- Verify Service Account has access to the GA property
- Check if Analytics Data API is enabled

### Error: "Permission denied"
- Make sure Service Account email is added to GA Property
- Verify it has **Viewer** role

### Error: "Invalid private key"
- Ensure `\n` characters are preserved in GA_PRIVATE_KEY
- Copy the entire key including BEGIN/END markers
- No extra spaces or line breaks

---

## 💰 Pricing

- **Google Analytics**: FREE (unlimited traffic)
- **Analytics Data API**: FREE (up to 50K requests/day)
- **Your app**: 288 API calls/day (every 5 minutes) = Well within free tier ✅

---

## 🎯 Alternative: Analytics Embed API (iframe)

If you don't want to deal with API setup, you can embed GA dashboard directly:

```tsx
<iframe
  src="https://analytics.google.com/analytics/web/?authuser=0#/embed/report-home/YOUR_PROPERTY_ID"
  width="100%"
  height="600"
  frameBorder="0"
/>
```

**Pros:** No API setup needed
**Cons:** Users must be logged into Google account with GA access

---

## 📚 Resources

- [Google Analytics Data API Docs](https://developers.google.com/analytics/devguides/reporting/data/v1)
- [Service Account Setup](https://cloud.google.com/iam/docs/creating-managing-service-accounts)
- [Analytics API Quickstart](https://developers.google.com/analytics/devguides/reporting/data/v1/quickstart-client-libraries)

