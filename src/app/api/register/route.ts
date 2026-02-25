import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, company, phone } = await req.json();
    if (!name || !email || !password) return NextResponse.json({ error: 'Champs requis manquants.' }, { status: 422 });
    if (password.length < 8)          return NextResponse.json({ error: 'Mot de passe trop court (8 caractères min).' }, { status: 422 });

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) return NextResponse.json({ error: 'Cet email est déjà utilisé.' }, { status: 409 });

    const hash = await bcrypt.hash(password, 12);
    await db.insert(users).values({ name, email, password: hash, company: company || null, phone: phone || null, role: 'client', active: true });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error('[register] POST error:', err);
    return NextResponse.json({ error: 'Erreur serveur — réessayez dans un instant.' }, { status: 500 });
  }
}
