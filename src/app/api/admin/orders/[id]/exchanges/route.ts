import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders, orderExchanges, users } from '@/lib/schema';
import { eq, asc } from 'drizzle-orm';
import { sendBatEmail, sendOrderMessageEmail } from '@/lib/mailer';

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { role?: string; name?: string; email?: string } | undefined;
  return user?.role === 'admin' ? user : null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { id } = await params;
    const rows = await db.select().from(orderExchanges)
      .where(eq(orderExchanges.orderId, parseInt(id)))
      .orderBy(asc(orderExchanges.createdAt));
    return NextResponse.json(rows.map(r => ({
      ...r,
      createdAt:      r.createdAt?.toISOString()      ?? null,
      clientActionAt: r.clientActionAt?.toISOString() ?? null,
    })));
  } catch (err) {
    console.error('[exchanges] GET error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { id } = await params;
    const orderId = parseInt(id);

    // Fetch order for context
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });

    const ct = req.headers.get('content-type') ?? '';
    let message = '';
    let isBat   = false;
    let batUrl: string | null = null;
    let attachment: { filename: string; content: Buffer } | undefined;

    if (ct.includes('multipart/form-data')) {
      const fd     = await req.formData();
      message      = String(fd.get('message') ?? '').trim();
      isBat        = fd.get('isBat') === 'true';
      batUrl       = fd.get('batUrl') ? String(fd.get('batUrl')) : null;
      const file   = fd.get('file') as File | null;
      if (file && file.size > 0) {
        const buf = await file.arrayBuffer();
        attachment = { filename: file.name, content: Buffer.from(buf) };
      }
    } else {
      const body = await req.json();
      message    = String(body.message ?? '').trim();
      isBat      = !!body.isBat;
      batUrl     = body.batUrl ?? null;
    }

    if (!message) return NextResponse.json({ error: 'message requis' }, { status: 422 });

    // If BAT, update orders.batStatus = 'pending'
    if (isBat) {
      await db.update(orders).set({ batStatus: 'pending', updatedAt: new Date() }).where(eq(orders.id, orderId));
    }

    const [exchange] = await db.insert(orderExchanges).values({
      orderId,
      senderType:  'admin',
      message,
      isBat,
      batFilename: attachment?.filename ?? null,
      batUrl:      batUrl ?? (attachment ? null : null),
      batStatus:   isBat ? 'pending' : null,
    }).returning();

    // Fire-and-forget email to client
    if (order.shippingEmail) {
      if (isBat) {
        sendBatEmail({
          to:          order.shippingEmail,
          orderNumber: order.orderNumber ?? String(order.id),
          message,
          attachment,
          batUrl:      batUrl ?? undefined,
        });
      } else {
        sendOrderMessageEmail({
          to:          order.shippingEmail,
          orderNumber: order.orderNumber ?? String(order.id),
          senderName:  'Admin',
          message,
          isAdmin:     true,
        });
      }
    }

    // Also fetch user email if different
    if (order.userId && !order.shippingEmail) {
      const [u] = await db.select({ email: users.email }).from(users).where(eq(users.id, order.userId)).limit(1);
      if (u?.email) {
        sendOrderMessageEmail({
          to:          u.email,
          orderNumber: order.orderNumber ?? String(order.id),
          senderName:  'Admin',
          message,
          isAdmin:     true,
        });
      }
    }

    return NextResponse.json({
      ...exchange,
      createdAt:      exchange.createdAt?.toISOString()      ?? null,
      clientActionAt: exchange.clientActionAt?.toISOString() ?? null,
    }, { status: 201 });
  } catch (err) {
    console.error('[exchanges] POST error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
