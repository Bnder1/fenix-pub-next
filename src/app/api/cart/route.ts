import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { cartItems, products } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  try {
    const userId = parseInt((session.user as { id?: string }).id ?? '0');
    const items = await db
      .select({
        id:  cartItems.id,
        qty: cartItems.qty,
        product: {
          name:  products.name,
          ref:   products.ref,
          price: products.price,
          image: products.image,
        },
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, userId));
    return NextResponse.json(items);
  } catch (err) {
    console.error('[cart] GET error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  try {
    const userId = parseInt((session.user as { id?: string }).id ?? '0');
    const { productId, qty } = await req.json();
    if (!productId || !qty) return NextResponse.json({ error: 'productId et qty requis' }, { status: 422 });

    const existing = await db.select().from(cartItems)
      .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)))
      .limit(1);
    if (existing.length > 0) {
      await db.update(cartItems).set({ qty: existing[0].qty + qty }).where(eq(cartItems.id, existing[0].id));
    } else {
      await db.insert(cartItems).values({ userId, productId, qty });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[cart] POST error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
