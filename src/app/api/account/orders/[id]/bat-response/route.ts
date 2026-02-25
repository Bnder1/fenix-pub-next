import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders, orderExchanges, users, settings } from '@/lib/schema';
import { eq, and, desc } from 'drizzle-orm';
import { sendBatResponseEmail } from '@/lib/mailer';

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

    const { action, comment } = await req.json();
    if (action !== 'approved' && action !== 'refused') {
      return NextResponse.json({ error: 'action invalide' }, { status: 422 });
    }

    // Find the pending BAT exchange
    const [batExchange] = await db.select().from(orderExchanges)
      .where(and(
        eq(orderExchanges.orderId, orderId),
        eq(orderExchanges.isBat, true),
        eq(orderExchanges.batStatus, 'pending'),
      ))
      .orderBy(desc(orderExchanges.createdAt))
      .limit(1);

    if (!batExchange) return NextResponse.json({ error: 'Aucun BAT en attente' }, { status: 404 });

    const now = new Date();
    await db.update(orderExchanges).set({ batStatus: action, clientActionAt: now })
      .where(eq(orderExchanges.id, batExchange.id));
    await db.update(orders).set({ batStatus: action, updatedAt: now })
      .where(eq(orders.id, orderId));

    // Get user's real name
    const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, userId)).limit(1);
    const clientName = u?.name ?? userName;

    // Get admin email for notification
    let adminEmail = process.env.ADMIN_EMAIL ?? '';
    try {
      const [s] = await db.select().from(settings).where(eq(settings.key, 'smtp_to')).limit(1);
      if (s?.value) adminEmail = s.value;
    } catch {}

    if (adminEmail) {
      sendBatResponseEmail({
        to:          adminEmail,
        orderNumber: order.orderNumber ?? String(order.id),
        clientName,
        action,
        comment:     comment || undefined,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[bat-response] POST error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
