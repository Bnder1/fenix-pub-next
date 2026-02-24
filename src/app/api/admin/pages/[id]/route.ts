import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { cmsPages } from '@/lib/schema';
import { eq } from 'drizzle-orm';

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  return user?.role === 'admin' ? user : null;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const pageId = parseInt(id);
  if (isNaN(pageId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  try {
    const body = await req.json();
    const { title, slug, content, metaDesc, sortOrder, published } = body;
    const [updated] = await db.update(cmsPages)
      .set({
        ...(title     !== undefined && { title }),
        ...(slug      !== undefined && { slug }),
        ...(content   !== undefined && { content }),
        ...(metaDesc  !== undefined && { metaDesc }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(published !== undefined && { published }),
        updatedAt: new Date(),
      })
      .where(eq(cmsPages.id, pageId))
      .returning();
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('[pages] PUT error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const pageId = parseInt(id);
  if (isNaN(pageId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  try {
    await db.delete(cmsPages).where(eq(cmsPages.id, pageId));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[pages] DELETE error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
