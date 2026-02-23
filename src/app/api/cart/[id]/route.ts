import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { cartItems } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const userId = parseInt((session.user as { id?: string }).id ?? '0');
  const { id } = await params;
  const { qty } = await req.json();

  await db.update(cartItems)
    .set({ qty })
    .where(and(eq(cartItems.id, parseInt(id)), eq(cartItems.userId, userId)));

  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const userId = parseInt((session.user as { id?: string }).id ?? '0');
  const { id } = await params;

  await db.delete(cartItems)
    .where(and(eq(cartItems.id, parseInt(id)), eq(cartItems.userId, userId)));

  return NextResponse.json({ ok: true });
}
