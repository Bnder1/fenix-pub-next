import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { favorites } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
  const userId = parseInt((session.user as { id?: string }).id ?? '0');

  const { productId } = await req.json();
  if (!productId) return NextResponse.json({ error: 'productId requis' }, { status: 422 });

  // Toggle: si déjà en favori → supprimer, sinon → ajouter
  const existing = await db.select({ id: favorites.id })
    .from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.productId, productId)))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(favorites).where(eq(favorites.id, existing[0].id));
    return NextResponse.json({ favorited: false });
  } else {
    await db.insert(favorites).values({ userId, productId });
    return NextResponse.json({ favorited: true });
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ favorited: false });
  const userId = parseInt((session.user as { id?: string }).id ?? '0');

  const { searchParams } = new URL(req.url);
  const productId = parseInt(searchParams.get('productId') ?? '0');
  if (!productId) return NextResponse.json({ favorited: false });

  const existing = await db.select({ id: favorites.id })
    .from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.productId, productId)))
    .limit(1);

  return NextResponse.json({ favorited: existing.length > 0 });
}
