# Auto-purge Cloudflare cache

Trang slug được Cloudflare cache **30 ngày** (Cache Rule). Code này **tự purge cache**
mỗi khi bạn đổi dữ liệu, nên bạn **không phải "Purge Everything" thủ công** nữa.

## Hoạt động thế nào

| Khi bạn... | Purge |
|---|---|
| Đổi settings / redirect URLs / lucky / timed / scripts (ảnh hưởng MỌI slug) | **Purge Everything** |
| Sửa / xóa / bật-tắt 1 link | **Purge riêng slug đó** (không đụng link khác) |
| Tạo link mới | Không purge (slug mới chưa có cache) |

Logic ở `lib/cloudflare-purge.ts`. Purge lỗi **không bao giờ** làm hỏng việc lưu dữ liệu
(bọc try/catch, và tự bỏ qua nếu chưa cấu hình env).

## Cấu hình (bắt buộc để purge chạy)

Thêm 2 biến vào **Vercel → Project → Settings → Environment Variables** (Production):

```
CLOUDFLARE_ZONE_ID   = <Zone ID của cdnvidey.us>
CLOUDFLARE_API_TOKEN = <token quyền Zone > Cache Purge>
```

- **Zone ID**: Cloudflare → chọn domain `cdnvidey.us` → tab **Overview** → cột phải, mục
  **API** → copy **Zone ID**.
- **API Token**: Cloudflare → **My Profile → API Tokens → Create Token** →
  **Create Custom Token**:
  - Permissions: **Zone → Cache Purge → Purge**
  - Zone Resources: **Include → Specific zone → cdnvidey.us**
  - Create → copy token (chỉ hiện 1 lần).

> Ngoài ra cần `NEXT_PUBLIC_APP_URL` = URL canonical (vd `https://www.cdnvidey.us`) để
> purge-theo-slug tạo đúng URL. (Purge Everything không cần cái này.)

Sau khi thêm env → **Redeploy** trên Vercel để áp dụng.

## Kiểm tra
1. Vào `/settings` đổi 1 giá trị → Save.
2. Cloudflare → **Caching → Overview** xem có sự kiện purge, hoặc mở lại 1 slug và xem
   `cf-cache-status: MISS` ngay sau khi purge (rồi `HIT` ở lần sau).

## Nếu chưa đặt env
Code tự **no-op** (không purge, không lỗi). Lúc đó vẫn phải purge thủ công như cũ.
