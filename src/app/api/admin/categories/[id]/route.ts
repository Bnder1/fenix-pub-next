import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { categories } from '@/lib/schema';
import { eq } from 'drizzle-orm';

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  return user?.role === 'admin' ? user : null;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { id } = await params;
    const { name, slug, sortOrder } = await req.json();
    if (!name?.trim() || !slug?.trim()) return NextResponse.json({ error: 'name et slug requis' }, { status: 422 });
    const [cat] = await db.update(categories).set({
      name: name.trim(),
      slug: slug.trim(),
      sortOrder: sortOrder ?? undefined,
    }).where(eq(categories.id, parseInt(id))).returning();
    return NextResponse.json(cat);
  } catch (err) {
    console.error('[categories/id] PUT error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { id } = await params;
    await db.delete(categories).where(eq(categories.id, parseInt(id)));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[categories/id] DELETE error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
