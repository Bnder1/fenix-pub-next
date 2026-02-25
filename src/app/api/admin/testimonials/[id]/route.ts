import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { testimonials } from '@/lib/schema';
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
    const body = await req.json();
    const [t] = await db.update(testimonials).set({
      text:      body.text      || undefined,
      name:      body.name      || undefined,
      company:   body.company   ?? null,
      initials:  body.initials  ?? null,
      rating:    body.rating    ?? undefined,
      sortOrder: body.sortOrder ?? undefined,
      active:    typeof body.active === 'boolean' ? body.active : undefined,
      updatedAt: new Date(),
    }).where(eq(testimonials.id, parseInt(id))).returning();
    return NextResponse.json(t);
  } catch (err) {
    console.error('[testimonials/id] PUT error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { id } = await params;
    await db.delete(testimonials).where(eq(testimonials.id, parseInt(id)));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[testimonials/id] DELETE error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
