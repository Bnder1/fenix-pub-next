import { db } from '@/lib/db';
import { orders } from '@/lib/schema';
import { desc } from 'drizzle-orm';
import OrdersClient from './OrdersClient';

export const dynamic  = 'force-dynamic';
export const metadata = { title: 'Commandes — Admin' };

export default async function OrdersPage() {
  let list: (typeof orders.$inferSelect)[] = [];
  try {
    list = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(200);
  } catch {}

  const serialized = list.map(o => ({
    ...o,
    total:     o.total     ? String(o.total)     : null,
    createdAt: o.createdAt ? o.createdAt.toISOString() : null,
    updatedAt: o.updatedAt ? o.updatedAt.toISOString() : null,
  }));

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Commandes ({list.length})</h1>
      <OrdersClient initialOrders={serialized} />
    </div>
  );
}
