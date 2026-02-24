import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { cartItems, orders, orderItems, products, settings } from '@/lib/schema';
import { eq } from 'drizzle-orm';

function generateOrderNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `FP-${date}-${rand}`;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
  const userId = parseInt((session.user as { id?: string }).id ?? '0');

  const { shippingName, shippingEmail, shippingPhone, shippingCompany, shippingAddress, notes } = await req.json();
  if (!shippingName?.trim() || !shippingEmail?.trim()) {
    return NextResponse.json({ error: 'Nom et email de livraison requis' }, { status: 422 });
  }

  // Récupérer les articles du panier avec les infos produit
  const cart = await db.select({
    item:    cartItems,
    product: products,
  }).from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.userId, userId));

  if (cart.length === 0) return NextResponse.json({ error: 'Panier vide' }, { status: 422 });

  // Marge
  let margin = 20;
  try {
    const [s] = await db.select().from(settings).where(eq(settings.key, 'price_margin')).limit(1);
    if (s?.value) margin = parseFloat(s.value);
  } catch {}

  const total = cart.reduce((sum, { item, product }) => {
    const base = parseFloat(String(product.price ?? 0));
    const price = base * (1 + margin / 100);
    return sum + price * item.qty;
  }, 0);

  // Créer la commande
  const [order] = await db.insert(orders).values({
    orderNumber:     generateOrderNumber(),
    userId,
    status:          'pending',
    total:           total.toFixed(2),
    notes:           notes || null,
    shippingName:    shippingName.trim(),
    shippingEmail:   shippingEmail.trim(),
    shippingPhone:   shippingPhone || null,
    shippingCompany: shippingCompany || null,
    shippingAddress: shippingAddress || null,
  }).returning();

  // Créer les lignes de commande
  await db.insert(orderItems).values(
    cart.map(({ item, product }) => {
      const base  = parseFloat(String(product.price ?? 0));
      const price = base * (1 + margin / 100);
      return {
        orderId:     order.id,
        productId:   product.id,
        productRef:  product.ref,
        productName: product.name,
        qty:         item.qty,
        size:        item.size ?? null,
        color:       item.color ?? null,
        unitPrice:   price.toFixed(2),
      };
    })
  );

  // Vider le panier
  await db.delete(cartItems).where(eq(cartItems.userId, userId));

  return NextResponse.json({ ok: true, orderId: order.id, orderNumber: order.orderNumber }, { status: 201 });
}
