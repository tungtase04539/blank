// Auto-purge Cloudflare cache khi dữ liệu đổi — để cache 30 ngày không phục vụ nội dung cũ.
//
// Cần 2 env (đặt ở Vercel → Project → Settings → Environment Variables):
//   CLOUDFLARE_ZONE_ID   — Zone ID của cdnvidey.us (Cloudflare → Overview, cột phải)
//   CLOUDFLARE_API_TOKEN — token quyền "Zone > Cache Purge" (My Profile → API Tokens → Create)
//
// Base URL lấy từ NEXT_PUBLIC_APP_URL (phải là URL canonical, vd https://www.cdnvidey.us).
// Nếu thiếu env → tự bỏ qua (no-op). Lỗi purge KHÔNG BAO GIỜ làm gãy action gọi nó.

const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/+$/, '');

async function callPurge(body: Record<string, unknown>): Promise<void> {
  if (!ZONE_ID || !API_TOKEN) return; // chưa cấu hình → bỏ qua an toàn
  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );
    if (!res.ok) {
      console.error('[cloudflare-purge] HTTP', res.status, await res.text());
    }
  } catch (err) {
    console.error('[cloudflare-purge] failed:', err);
    // Nuốt lỗi — purge hỏng không được phép làm hỏng việc lưu dữ liệu.
  }
}

/** Xóa TOÀN BỘ cache — dùng khi đổi CÀI ĐẶT CHUNG (ảnh hưởng mọi trang slug). */
export async function purgeEverything(): Promise<void> {
  await callPurge({ purge_everything: true });
}

/** Chỉ xóa cache các slug cụ thể — dùng khi sửa/xóa 1 link (không đụng các link khác). */
export async function purgeSlugs(slugs: string[]): Promise<void> {
  const files = slugs.filter(Boolean).map((s) => `${BASE_URL}/${s}`);
  if (!BASE_URL || files.length === 0) return;
  await callPurge({ files });
}
