import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { orders, orderItems } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';

export const metadata = { title: 'Commande confirmée' };

export default async function ConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const { id } = await params;
  const [order] = await db.select().from(orders).where(eq(orders.id, parseInt(id))).limit(1);
  if (!order) redirect('/account');

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="text-5xl mb-4">✅</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Commande envoyée !</h1>
      <p className="text-gray-500 mb-2">
        Numéro de commande : <span className="font-mono font-semibold text-purple-700">{order.orderNumber}</span>
      </p>
      <p className="text-gray-500 mb-8 text-sm">
        Notre équipe va examiner votre commande et vous contactera à{' '}
        <strong>{order.shippingEmail}</strong> pour confirmer les détails.
      </p>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-left mb-8">
        <h2 className="font-semibold text-gray-900 mb-3">Détail de la commande</h2>
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <div>
                <span className="font-medium text-gray-900">{item.productName}</span>
                <span className="text-gray-400 ml-2">x{item.qty}</span>
              </div>
              {item.unitPrice && (
                <span className="text-gray-600">{(parseFloat(String(item.unitPrice)) * item.qty).toFixed(2)} €</span>
              )}
            </div>
          ))}
          {order.total && (
            <div className="border-t border-gray-100 pt-2 flex justify-between font-semibold">
              <span>Total estimé</span>
              <span className="text-purple-700">{parseFloat(String(order.total)).toFixed(2)} €</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 justify-center">
        <Link href="/account" className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
          Mes commandes
        </Link>
        <Link href="/catalogue" className="px-6 py-2.5 bg-purple-700 text-white rounded-xl text-sm font-medium hover:bg-purple-800 transition-colors">
          Continuer les achats
        </Link>
      </div>
    </div>
  );
}
