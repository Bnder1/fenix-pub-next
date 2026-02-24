import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { documents } from '@/lib/schema';
import { eq } from 'drizzle-orm';

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  return user?.role === 'admin' ? user : null;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const [doc] = await db.update(documents).set({
    title:       body.title       || undefined,
    url:         body.url         ?? null,
    filename:    body.filename    ?? null,
    description: body.description ?? null,
    active:      typeof body.active === 'boolean' ? body.active : undefined,
    updatedAt:   new Date(),
  }).where(eq(documents.id, parseInt(id))).returning();
  return NextResponse.json(doc);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  await db.delete(documents).where(eq(documents.id, parseInt(id)));
  return NextResponse.json({ ok: true });
}
