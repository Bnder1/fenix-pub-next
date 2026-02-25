import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { cartItems, products } from '@/lib/schema';
import { eq, and, isNull } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  try {
    const userId = parseInt((session.user as { id?: string }).id ?? '0');
    const items = await db
      .select({
        id:  cartItems.id,
        qty: cartItems.qty,
        size:  cartItems.size,
        color: cartItems.color,
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
    const { productId, qty, color, size, markingTechniqueId, markingPosition, designNotes, designFile } = await req.json();
    if (!productId || !qty) return NextResponse.json({ error: 'productId et qty requis' }, { status: 422 });

    // Uniqueness: userId + productId + size + color
    const colorCond = color ? eq(cartItems.color, color) : isNull(cartItems.color);
    const sizeCond  = size  ? eq(cartItems.size,  size)  : isNull(cartItems.size);

    const existing = await db.select().from(cartItems)
      .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId), sizeCond, colorCond))
      .limit(1);

    if (existing.length > 0) {
      await db.update(cartItems)
        .set({
          qty:                existing[0].qty + qty,
          markingTechniqueId: markingTechniqueId ?? existing[0].markingTechniqueId,
          markingPosition:    markingPosition    ?? existing[0].markingPosition,
          designNotes:        designNotes        ?? existing[0].designNotes,
          designFile:         designFile         ?? existing[0].designFile,
          updatedAt:          new Date(),
        })
        .where(eq(cartItems.id, existing[0].id));
    } else {
      await db.insert(cartItems).values({
        userId,
        productId,
        qty,
        color:              color              ?? null,
        size:               size               ?? null,
        markingTechniqueId: markingTechniqueId ?? null,
        markingPosition:    markingPosition    ?? null,
        designNotes:        designNotes        ?? null,
        designFile:         designFile         ?? null,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[cart] POST error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
