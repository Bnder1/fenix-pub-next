import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders } from '@/lib/schema';
import { eq } from 'drizzle-orm';

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  return user?.role === 'admin' ? user : null;
}

const ALLOWED_STATUSES = ['pending','confirmed','processing','shipped','delivered','cancelled'];

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const body = await req.json();

  if (body.status && !ALLOWED_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: 'Statut invalide' }, { status: 422 });
  }

  const [updated] = await db.update(orders).set({
    status:     body.status     || undefined,
    adminNotes: body.adminNotes ?? undefined,
    updatedAt:  new Date(),
  }).where(eq(orders.id, parseInt(id))).returning();
  return NextResponse.json(updated);
}
