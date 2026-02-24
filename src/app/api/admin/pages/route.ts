import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { cmsPages } from '@/lib/schema';
import { asc } from 'drizzle-orm';

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  return user?.role === 'admin' ? user : null;
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const pages = await db.select().from(cmsPages).orderBy(asc(cmsPages.sortOrder));
  return NextResponse.json(pages);
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const body = await req.json();
    const { title, slug, content, metaDesc, sortOrder, published } = body;
    if (!title || !slug) {
      return NextResponse.json({ error: 'Titre et slug requis' }, { status: 422 });
    }
    const [page] = await db.insert(cmsPages).values({
      title,
      slug,
      content:   content   ?? null,
      metaDesc:  metaDesc  ?? null,
      sortOrder: sortOrder ?? 0,
      published: published ?? false,
    }).returning();
    return NextResponse.json(page, { status: 201 });
  } catch (err) {
    console.error('[pages] POST error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
