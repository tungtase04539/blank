import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import LinkPage from './LinkPage';
import Script from 'next/script';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getLink(slug: string) {
  const supabase = await createClient();
  
  const { data: link } = await supabase
    .from('links')
    .select('*')
    .eq('slug', slug)
    .single();
  
  return link;
}

async function getScripts(userId: string) {
  const supabase = await createClient();
  
  const { data: scripts } = await supabase
    .from('scripts')
    .select('*')
    .eq('user_id', userId)
    .eq('enabled', true)
    .order('created_at', { ascending: true });
  
  return scripts || [];
}

async function getGlobalSettings(userId: string) {
  const supabase = await createClient();
  
  const { data: settings } = await supabase
    .from('global_settings')
    .select(`
      *,
      lucky_enabled,
      lucky_percentage,
      lucky_type
    `)
    .eq('user_id', userId)
    .single();
  
  return settings;
}

export default async function PublicLinkPage({ params }: PageProps) {
  const { slug } = await params;
  const link = await getLink(slug);
  
  if (!link) {
    notFound();
  }
  
  const scripts = await getScripts(link.user_id);
  const globalSettings = await getGlobalSettings(link.user_id);
  
  return (
    <>
      {/* Google Analytics - Hardcoded for reliability */}
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
      
      <LinkPage link={link} scripts={scripts} globalSettings={globalSettings} userId={link.user_id} />
    </>
  );
}

