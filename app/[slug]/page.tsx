import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import LinkPage from './LinkPage';

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

export default async function PublicLinkPage({ params }: PageProps) {
  const { slug } = await params;
  const link = await getLink(slug);
  
  if (!link) {
    notFound();
  }
  
  const scripts = await getScripts(link.user_id);
  
  return <LinkPage link={link} scripts={scripts} />;
}

