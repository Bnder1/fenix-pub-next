import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { categories } from '@/lib/schema';
import { asc } from 'drizzle-orm';

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  return user?.role === 'admin' ? user : null;
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const cats = await db.select().from(categories).orderBy(asc(categories.sortOrder));
    return NextResponse.json(cats);
  } catch (err) {
    console.error('[categories] GET error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { name, slug, sortOrder } = await req.json();
    if (!name?.trim() || !slug?.trim()) return NextResponse.json({ error: 'name et slug requis' }, { status: 422 });
    const [cat] = await db.insert(categories).values({
      name: name.trim(),
      slug: slug.trim(),
      sortOrder: sortOrder ?? 0,
    }).returning();
    return NextResponse.json(cat, { status: 201 });
  } catch (err) {
    console.error('[categories] POST error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
