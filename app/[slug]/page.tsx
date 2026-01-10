import { createPublicClient } from '@/lib/supabase/public';
import { notFound } from 'next/navigation';
import LinkPage from './LinkPage';
import Script from 'next/script';

// ✅ ISR: Cache 10 phút - giảm 90% server renders
export const revalidate = 600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

// ✅ OPTIMIZED: Dùng public client (không cần auth), queries chạy parallel
async function getLinkPageData(slug: string) {
  const supabase = createPublicClient();

  // Query 1: Lấy link
  const { data: link } = await supabase
    .from('links')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!link) return null;

  // Query 2, 3, 4: Chạy parallel
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
