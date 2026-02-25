import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders, orderExchanges } from '@/lib/schema';
import { eq, asc } from 'drizzle-orm';
import { sendOrderMessageEmail } from '@/lib/mailer';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const userId = parseInt((session.user as { id?: string }).id ?? '0');
  try {
    const { id } = await params;
    const orderId = parseInt(id);
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order || order.userId !== userId) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

    const rows = await db.select().from(orderExchanges)
      .where(eq(orderExchanges.orderId, orderId))
      .orderBy(asc(orderExchanges.createdAt));
    return NextResponse.json(rows.map(r => ({
      ...r,
      createdAt:      r.createdAt?.toISOString()      ?? null,
      clientActionAt: r.clientActionAt?.toISOString() ?? null,
    })));
  } catch (err) {
    console.error('[client exchanges] GET error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const userId   = parseInt((session.user as { id?: string }).id ?? '0');
  const userName = (session.user as { name?: string }).name ?? 'Client';
  try {
    const { id } = await params;
    const orderId = parseInt(id);
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order || order.userId !== userId) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

    const { message } = await req.json();
    if (!message?.trim()) return NextResponse.json({ error: 'message requis' }, { status: 422 });

    const [exchange] = await db.insert(orderExchanges).values({
      orderId,
      senderType: 'client',
      userId,
      message:    message.trim(),
      isBat:      false,
    }).returning();

    // Notify admin (fire-and-forget, no `to` → uses cfg.to)
    sendOrderMessageEmail({
      orderNumber: order.orderNumber ?? String(order.id),
      senderName:  userName,
      message:     message.trim(),
      isAdmin:     false,
    });

    return NextResponse.json({
      ...exchange,
      createdAt:      exchange.createdAt?.toISOString()      ?? null,
      clientActionAt: exchange.clientActionAt?.toISOString() ?? null,
    }, { status: 201 });
  } catch (err) {
    console.error('[client exchanges] POST error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
