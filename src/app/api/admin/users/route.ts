import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { desc } from 'drizzle-orm';

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  return user?.role === 'admin' ? user : null;
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    // Ne jamais retourner le hash du mot de passe
    const list = await db.select({
      id:        users.id,
      name:      users.name,
      email:     users.email,
      company:   users.company,
      phone:     users.phone,
      role:      users.role,
      active:    users.active,
      createdAt: users.createdAt,
    }).from(users).orderBy(desc(users.createdAt));
    return NextResponse.json(list);
  } catch (err) {
    console.error('[users] GET error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
