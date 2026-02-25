import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { cartItems, orders, orderItems, products, settings, markingTechniques, users } from '@/lib/schema';
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

  const { notes } = await req.json().catch(() => ({}));

  // Load user info from DB (name, email, phone, company)
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 401 });

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

  // Fetch marking techniques for cart items that have one
  const techniqueIds = [...new Set(cart.map(c => c.item.markingTechniqueId).filter(Boolean))] as number[];
  const techniqueMap = new Map<number, typeof markingTechniques.$inferSelect>();
  for (const tid of techniqueIds) {
    const [t] = await db.select().from(markingTechniques).where(eq(markingTechniques.id, tid)).limit(1);
    if (t) techniqueMap.set(tid, t);
  }

  const total = cart.reduce((sum, { item, product }) => {
    const base  = parseFloat(String(product.price ?? 0));
    const price = base * (1 + margin / 100);
    let lineTotal = price * item.qty;
    if (item.markingTechniqueId) {
      const tech = techniqueMap.get(item.markingTechniqueId);
      if (tech) {
        lineTotal += parseFloat(String(tech.unitPrice ?? 0)) * item.qty
          + parseFloat(String(tech.setupFee ?? 0));
      }
    }
    return sum + lineTotal;
  }, 0);

  // Créer la commande (shipping info depuis le compte utilisateur)
  const [order] = await db.insert(orders).values({
    orderNumber:     generateOrderNumber(),
    userId,
    status:          'pending',
    total:           total.toFixed(2),
    notes:           notes || null,
    shippingName:    user.name,
    shippingEmail:   user.email,
    shippingPhone:   user.phone   || null,
    shippingCompany: user.company || null,
    shippingAddress: null,
  }).returning();

  // Créer les lignes de commande
  await db.insert(orderItems).values(
    cart.map(({ item, product }) => {
      const base  = parseFloat(String(product.price ?? 0));
      const price = base * (1 + margin / 100);
      const tech  = item.markingTechniqueId ? techniqueMap.get(item.markingTechniqueId) : null;
      return {
        orderId:              order.id,
        productId:            product.id,
        productRef:           product.ref,
        productName:          product.name,
        qty:                  item.qty,
        size:                 item.size        ?? null,
        color:                item.color       ?? null,
        unitPrice:            price.toFixed(2),
        markingTechniqueId:   tech?.id         ?? null,
        markingTechniqueName: tech?.name       ?? null,
        markingPosition:      item.markingPosition ?? null,
        markingUnitPrice:     tech ? String(tech.unitPrice) : null,
        markingSetupFee:      tech ? String(tech.setupFee)  : null,
        designNotes:          item.designNotes ?? null,
        designFile:           item.designFile  ?? null,
      };
    })
  );

  // Vider le panier
  await db.delete(cartItems).where(eq(cartItems.userId, userId));

  return NextResponse.json({ ok: true, orderId: order.id, orderNumber: order.orderNumber }, { status: 201 });
}
