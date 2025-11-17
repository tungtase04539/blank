# Quick Link System

Hệ thống tạo link nhanh với tracking và quản lý video. Được xây dựng với Next.js 14, Supabase, TypeScript và Tailwind CSS.

## Tính năng

### 🔐 Authentication
- Đăng nhập không cần đăng ký
- Admin có thể tạo tài khoản cho users
- Phân quyền Admin/User

### 🔗 Quản lý Links
- Tạo link nhanh với slug tùy chỉnh
- Chèn video WebM
- 2 button cố định ở bottom (Telegram & Web) có thể tùy chỉnh
- Bật/tắt redirect tự động
- Sao chép link nhanh
- Chỉnh sửa và xóa link

### 📊 Tracking & Statistics
- Đo lường traffic tự động
- Tracking IP, User Agent, Referer
- Dashboard với biểu đồ traffic 7 ngày
- Thống kê chi tiết theo tháng
- Top links theo lượt truy cập

### 📝 Script Management
- Thêm scripts vào head hoặc body
- Áp dụng scripts cho tất cả links
- Bật/tắt scripts riêng lẻ
- Hỗ trợ nhiều scripts (Google Analytics, Facebook Pixel, v.v.)

### 👥 Admin Panel
- Quản lý users
- Tạo tài khoản mới
- Phân quyền Admin/User

## Cài đặt

### 1. Clone repository

```bash
git clone <repository-url>
cd quick-link-system
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình Supabase

Tạo project mới trên [Supabase](https://supabase.com/)

#### Chạy SQL Schema

Vào SQL Editor trong Supabase Dashboard và chạy nội dung file `supabase-schema.sql`

### 4. Cấu hình Environment Variables

Tạo file `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Lấy các giá trị từ Settings > API trong Supabase Dashboard.

### 5. Chạy development server

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) trong browser.

## Tài khoản mặc định

- Email: `admin@example.com`
- Password: `admin123`

## Deploy lên Vercel

### 1. Push code lên GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Deploy trên Vercel

1. Vào [Vercel](https://vercel.com/)
2. Import repository
3. Thêm Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` (URL của app sau khi deploy)
4. Deploy

### 3. Cập nhật NEXT_PUBLIC_APP_URL

Sau khi deploy xong, cập nhật `NEXT_PUBLIC_APP_URL` với URL thực tế của bạn trong Vercel Settings.

## Cấu trúc thư mục

```
├── app/
│   ├── [slug]/              # Public link pages
│   ├── admin/               # Admin panel
│   ├── dashboard/           # Dashboard với charts
│   ├── links/               # Quản lý links
│   ├── login/               # Authentication
│   ├── scripts/             # Script management
│   └── statistics/          # Thống kê traffic
├── components/              # Reusable components
├── lib/
│   ├── supabase/           # Supabase clients
│   ├── auth.ts             # Authentication helpers
│   └── types.ts            # TypeScript types
└── supabase-schema.sql     # Database schema

```

## Sử dụng

### Tạo Link Mới

1. Vào "Links" > "Tạo Link Mới"
2. Nhập slug (URL ngắn)
3. Nhập Video URL
4. (Tùy chọn) Thêm Telegram/Web button URLs
5. (Tùy chọn) Bật redirect và thêm destination URL
6. Click "Tạo Link"

### Thêm Scripts

1. Vào "Scripts" > "Thêm Script"
2. Chọn vị trí (head/body)
3. Paste script code
4. Click "Tạo Script"

### Xem Thống Kê

- **Dashboard**: Tổng quan 7 ngày với biểu đồ
- **Thống kê**: Chi tiết traffic theo tháng cho từng link

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth + Custom
- **Styling**: Tailwind CSS
- **Charts**: Chart.js + react-chartjs-2
- **Language**: TypeScript

## License

MIT

