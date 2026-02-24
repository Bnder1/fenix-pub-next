import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

  const userId = parseInt((session.user as { id?: string }).id ?? '0');
  if (!userId) return NextResponse.json({ error: 'Session invalide' }, { status: 401 });

  const { name, company, phone, currentPassword, newPassword } = await req.json();

  // Si changement de mot de passe demandé
  if (newPassword) {
    if (!currentPassword) return NextResponse.json({ error: 'Mot de passe actuel requis' }, { status: 422 });
    if (newPassword.length < 8) return NextResponse.json({ error: 'Mot de passe trop court (8 min)' }, { status: 422 });

    const [user] = await db.select({ password: users.password }).from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 403 });

    const hash = await bcrypt.hash(newPassword, 12);
    await db.update(users).set({
      name:      name?.trim() || undefined,
      company:   company ?? null,
      phone:     phone   ?? null,
      password:  hash,
      updatedAt: new Date(),
    }).where(eq(users.id, userId));
  } else {
    await db.update(users).set({
      name:      name?.trim() || undefined,
      company:   company ?? null,
      phone:     phone   ?? null,
      updatedAt: new Date(),
    }).where(eq(users.id, userId));
  }

  return NextResponse.json({ ok: true });
}
