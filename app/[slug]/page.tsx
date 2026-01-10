import { createPublicClient } from '@/lib/supabase/public';
import { notFound } from 'next/navigation';
import LinkPage from './LinkPage';
import Script from 'next/script';

// ✅ Static Generation + On-demand Revalidate
// Pages được cache vĩnh viễn, chỉ update khi gọi revalidate API
export const revalidate = false; // Disable time-based revalidation
export const dynamicParams = true; // Cho phép generate pages mới

interface PageProps {
  params: Promise<{ slug: string }>;
}

// ✅ OPTIMIZED: Dùng database function (1 query thay vì 4)
async function getLinkPageData(slug: string) {
  const supabase = createPublicClient();

  // Thử dùng optimized function trước
  const { data, error } = await supabase.rpc('get_link_page_data', { p_slug: slug });
  
  if (!error && data?.link) {
    return {
      link: data.link,
      scripts: data.scripts || [],
      globalSettings: data.globalSettings,
      redirectUrls: data.redirectUrls || [],
    };
  }

  // Fallback: queries riêng lẻ (nếu chưa chạy SQL)
  const { data: link } = await supabase
    .from('links')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!link) return null;

  const [scriptsRes, settingsRes, urlsRes] = await Promise.all([
    supabase.from('scripts').select('*').eq('user_id', link.user_id).eq('enabled', true).order('created_at', { ascending: true }),
    supabase.from('global_settings').select('*').eq('user_id', link.user_id).single(),
    supabase.from('redirect_urls').select('url').eq('user_id', link.user_id).eq('enabled', true),
  ]);

  return {
    link,
    scripts: scriptsRes.data || [],
    globalSettings: settingsRes.data,
    redirectUrls: urlsRes.data?.map(u => u.url) || [],
  };
}

export default async function PublicLinkPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getLinkPageData(slug);

  if (!data) {
    notFound();
  }

  const { link, scripts, globalSettings, redirectUrls } = data;

  return (
    <>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-P0Y80ZBPPC"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-P0Y80ZBPPC');
        `}
      </Script>
      
      <LinkPage 
        link={link} 
        scripts={scripts} 
        globalSettings={globalSettings} 
        redirectUrls={redirectUrls}
        userId={link.user_id} 
      />
    </>
  );
}
