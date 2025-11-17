# Hướng dẫn Deploy lên Vercel và Supabase

## Bước 1: Setup Supabase

### 1.1. Tạo Project mới
1. Truy cập [Supabase](https://supabase.com/)
2. Đăng nhập hoặc tạo tài khoản mới
3. Click "New Project"
4. Điền thông tin:
   - Name: quick-link-system
   - Database Password: (tạo password mạnh)
   - Region: chọn gần nhất (Singapore cho VN)
5. Click "Create new project"

### 1.2. Chạy Database Schema
1. Trong Supabase Dashboard, vào **SQL Editor**
2. Click "New query"
3. Copy toàn bộ nội dung file `supabase-schema.sql`
4. Paste vào SQL Editor
5. Click "Run" để execute

### 1.3. Lấy API Keys
1. Vào **Settings** > **API**
2. Copy các giá trị sau:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` (click "Reveal") → `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **Quan trọng**: Không share `service_role` key công khai!

## Bước 2: Deploy lên Vercel

### 2.1. Push code lên GitHub
```bash
# Initialize git (nếu chưa có)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Quick Link System"

# Tạo repository mới trên GitHub và push
git remote add origin https://github.com/your-username/quick-link-system.git
git branch -M main
git push -u origin main
```

### 2.2. Deploy trên Vercel
1. Truy cập [Vercel](https://vercel.com/)
2. Đăng nhập bằng GitHub
3. Click "Add New..." > "Project"
4. Import repository `quick-link-system`
5. Click "Deploy" (chưa cần config gì)

### 2.3. Thêm Environment Variables
Sau khi deploy lần đầu:

1. Vào **Settings** > **Environment Variables**
2. Thêm các biến sau:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

3. Click "Save"
4. Vào **Deployments** > Click "..." > "Redeploy"

## Bước 3: Cấu hình Supabase Auth (Quan trọng!)

### 3.1. Disable Email Confirmation
1. Vào Supabase Dashboard
2. Vào **Authentication** > **Settings**
3. Tìm "Enable email confirmations"
4. **UNCHECK** option này (vì hệ thống không dùng email confirmation)
5. Scroll xuống, click "Save"

### 3.2. Cấu hình Site URL
1. Vẫn ở **Authentication** > **Settings**
2. Tìm "Site URL"
3. Thay đổi thành URL Vercel của bạn: `https://your-app.vercel.app`
4. Click "Save"

### 3.3. Thêm Redirect URLs
1. Tìm "Redirect URLs"
2. Thêm:
   ```
   https://your-app.vercel.app/*
   http://localhost:3000/*
   ```
3. Click "Save"

## Bước 4: Kiểm tra

1. Truy cập `https://your-app.vercel.app`
2. Đăng nhập với:
   - Email: `admin@example.com`
   - Password: `admin123`
3. Test các tính năng:
   - Tạo link mới
   - Thêm scripts
   - Xem dashboard
   - Tạo user mới (Admin panel)

## Troubleshooting

### Lỗi "Invalid credentials"
- Kiểm tra xem đã chạy SQL schema chưa
- Xem database có user admin@example.com chưa
- Vào Supabase > Table Editor > users để kiểm tra

### Lỗi "Unauthorized"
- Kiểm tra Environment Variables trong Vercel
- Đảm bảo đã redeploy sau khi thêm env vars
- Check Supabase RLS policies đã được tạo

### Links không hoạt động
- Kiểm tra `NEXT_PUBLIC_APP_URL` đúng chưa
- Phải là HTTPS, không có trailing slash
- Redeploy sau khi đổi

### Scripts không chạy
- Kiểm tra script syntax
- Xem browser console có lỗi không
- Đảm bảo script đã được enable

## Custom Domain (Tùy chọn)

### Thêm domain riêng
1. Vào Vercel Dashboard > Project > Settings > Domains
2. Thêm domain của bạn
3. Cấu hình DNS theo hướng dẫn
4. Sau khi domain active:
   - Update `NEXT_PUBLIC_APP_URL` với domain mới
   - Update Supabase Site URL
   - Update Supabase Redirect URLs
   - Redeploy

## Bảo mật

### Khuyến nghị:
1. **Đổi mật khẩu admin**: Ngay sau deploy, đăng nhập và tạo admin mới, xóa admin mặc định
2. **Không commit .env.local**: File này đã được gitignore
3. **Service Role Key**: Chỉ dùng trong Environment Variables, không hardcode
4. **Database Password**: Dùng password mạnh cho Supabase
5. **Enable 2FA**: Bật 2FA cho cả Vercel và Supabase

## Monitor

### Vercel Analytics
1. Vào Vercel Dashboard > Analytics
2. Xem traffic, performance metrics

### Supabase Logs
1. Vào Supabase Dashboard > Logs
2. Xem database queries, errors

## Backup

### Database Backup
1. Vào Supabase Dashboard > Database > Backups
2. Enable automatic daily backups
3. Có thể manual backup bất kỳ lúc nào

## Support

Nếu gặp vấn đề:
1. Check Vercel deployment logs
2. Check Supabase logs
3. Check browser console
4. Xem issues trên GitHub repo

---

🎉 **Chúc mừng!** Hệ thống của bạn đã sẵn sàng!

