import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

// Revalidate on-demand khi data thay đổi
export async function POST(request: NextRequest) {
  try {
    const { slug, path } = await request.json();
    
    if (slug) {
      revalidatePath(`/${slug}`);
      return NextResponse.json({ revalidated: true, slug });
    }
    
    if (path) {
      revalidatePath(path);
      return NextResponse.json({ revalidated: true, path });
    }
    
    return NextResponse.json({ error: 'Missing slug or path' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 });
  }
}
