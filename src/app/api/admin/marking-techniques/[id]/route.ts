import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { markingTechniques } from '@/lib/schema';
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
    const body   = await req.json();
    const { name, description, unitPrice, setupFee, active, sortOrder } = body;
    const [row] = await db.update(markingTechniques).set({
      name:        name        ?? undefined,
      description: description ?? undefined,
      unitPrice:   unitPrice   ?? undefined,
      setupFee:    setupFee    ?? undefined,
      active:      active      !== undefined ? active : undefined,
      sortOrder:   sortOrder   ?? undefined,
    }).where(eq(markingTechniques.id, parseInt(id))).returning();
    return NextResponse.json(row);
  } catch (err) {
    console.error('[marking-techniques/id] PUT error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { id } = await params;
    await db.delete(markingTechniques).where(eq(markingTechniques.id, parseInt(id)));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[marking-techniques/id] DELETE error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
