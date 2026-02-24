import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { contactMessages } from '@/lib/schema';
import { eq } from 'drizzle-orm';

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  return user?.role === 'admin' ? user : null;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const { status, notes } = await req.json();

  const allowed = ['nouveau', 'en_cours', 'traité'];
  if (status && !allowed.includes(status)) {
    return NextResponse.json({ error: 'Statut invalide' }, { status: 422 });
  }

  const [msg] = await db.update(contactMessages).set({
    status: status || undefined,
    notes:  notes  ?? undefined,
  }).where(eq(contactMessages.id, parseInt(id))).returning();
  return NextResponse.json(msg);
}
