import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { testimonials } from '@/lib/schema';
import { asc } from 'drizzle-orm';

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  return user?.role === 'admin' ? user : null;
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const list = await db.select().from(testimonials).orderBy(asc(testimonials.sortOrder));
    return NextResponse.json(list);
  } catch (err) {
    console.error('[testimonials] GET error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { text, name, company, initials, rating, sortOrder, active } = await req.json();
    if (!text?.trim() || !name?.trim()) return NextResponse.json({ error: 'text et name requis' }, { status: 422 });
    const [t] = await db.insert(testimonials).values({
      text: text.trim(), name: name.trim(),
      company: company || null, initials: initials || null,
      rating: rating ?? 5, sortOrder: sortOrder ?? 0, active: active ?? true,
    }).returning();
    return NextResponse.json(t, { status: 201 });
  } catch (err) {
    console.error('[testimonials] POST error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
