import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
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

  // Validation du rôle
  const allowedRoles = ['client', 'admin'];
  if (body.role && !allowedRoles.includes(body.role)) {
    return NextResponse.json({ error: 'Rôle invalide' }, { status: 422 });
  }

  const [updated] = await db.update(users).set({
    name:      body.name      || undefined,
    company:   body.company   ?? null,
    phone:     body.phone     ?? null,
    role:      body.role      || undefined,
    active:    typeof body.active === 'boolean' ? body.active : undefined,
    updatedAt: new Date(),
  }).where(eq(users.id, parseInt(id))).returning({
    id:        users.id,
    name:      users.name,
    email:     users.email,
    company:   users.company,
    phone:     users.phone,
    role:      users.role,
    active:    users.active,
    createdAt: users.createdAt,
  });
  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  await db.delete(users).where(eq(users.id, parseInt(id)));
  return NextResponse.json({ ok: true });
}
