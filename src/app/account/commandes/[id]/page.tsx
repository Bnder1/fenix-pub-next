import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { orders, orderItems, orderExchanges } from '@/lib/schema';
import { eq, and, asc } from 'drizzle-orm';
import Link from 'next/link';
import BatResponseButtons from './BatResponseButtons';
import OrderMessageForm from './OrderMessageForm';

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<string, string> = {
  pending:    'En attente',
  confirmed:  'Confirmée',
  processing: 'En préparation',
  shipped:    'Expédiée',
  delivered:  'Livrée',
  cancelled:  'Annulée',
};

const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-yellow-50 text-yellow-700',
  confirmed:  'bg-blue-50 text-blue-700',
  processing: 'bg-orange-50 text-orange-700',
  shipped:    'bg-purple-50 text-purple-700',
  delivered:  'bg-green-50 text-green-700',
  cancelled:  'bg-red-50 text-red-600',
};

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect('/login?redirect=/account');
  const userId  = parseInt((session.user as { id?: string }).id ?? '0');

  const { id } = await params;
  const orderId = parseInt(id);

  const [order] = await db.select().from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .limit(1);
  if (!order) notFound();

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  const exchanges = await db.select().from(orderExchanges)
    .where(eq(orderExchanges.orderId, orderId))
    .orderBy(asc(orderExchanges.createdAt));

  // Serialize timestamps
  const exSerialized = exchanges.map(e => ({
    ...e,
    createdAt:      e.createdAt?.toISOString()      ?? '',
    clientActionAt: e.clientActionAt?.toISOString() ?? null,
  }));

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/account" className="hover:text-purple-700">Mon compte</Link>
        <span>/</span>
        <span className="text-gray-900">Commande {order.orderNumber ?? `#${order.id}`}</span>
      </nav>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Commande {order.orderNumber ? `n° ${order.orderNumber}` : `#${order.id}`}
            </h1>
            <div className="text-sm text-gray-400 mt-1">{order.createdAt?.toLocaleDateString('fr-FR')}</div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`text-sm px-3 py-1 rounded-full font-medium ${STATUS_COLORS[order.status ?? ''] ?? 'bg-gray-100 text-gray-500'}`}>
              {STATUS_LABELS[order.status ?? ''] ?? order.status}
            </span>
            {order.total && <span className="text-lg font-bold text-purple-700">{parseFloat(String(order.total)).toFixed(2)} €</span>}
          </div>
        </div>
      </div>

      {/* BAT pending CTA */}
      {order.batStatus === 'pending' && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-6 mb-6">
          <h2 className="text-base font-bold text-blue-900 mb-1">📄 Bon à Tirer en attente de validation</h2>
          <p className="text-sm text-blue-700 mb-4">
            Notre équipe vous a soumis un BAT. Veuillez l&apos;approuver ou le refuser pour que nous puissions lancer la production.
          </p>
          <BatResponseButtons orderId={order.id} />
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Articles</h2>
        <div className="divide-y divide-gray-50">
          {items.map(item => (
            <div key={item.id} className="py-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                  <div className="text-xs text-gray-400 font-mono">Réf. {item.productRef}</div>
                  <div className="text-xs text-gray-500 mt-0.5 flex flex-wrap gap-2">
                    <span>Qté : {item.qty}</span>
                    {item.color && <span>Couleur : {item.color}</span>}
                    {item.size  && <span>Taille : {item.size}</span>}
                    {item.markingTechniqueName && (
                      <span className="text-purple-700">
                        🖨 {item.markingTechniqueName}
                        {item.markingPosition && ` (${item.markingPosition})`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                  {item.unitPrice ? `${(parseFloat(String(item.unitPrice)) * item.qty).toFixed(2)} €` : '—'}
                  {item.markingUnitPrice && (
                    <div className="text-xs font-normal text-purple-600">
                      + {(parseFloat(String(item.markingUnitPrice)) * item.qty + parseFloat(String(item.markingSetupFee ?? 0))).toFixed(2)} € marquage
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Messages & BAT thread */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Messagerie</h2>

        {exSerialized.length > 0 ? (
          <div className="space-y-3 mb-6">
            {exSerialized.map(ex => (
              <div key={ex.id} className={`flex ${ex.senderType === 'client' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${
                  ex.senderType === 'client' ? 'bg-purple-50 text-purple-900' : 'bg-gray-50 text-gray-800'
                }`}>
                  <div className="text-xs font-medium text-gray-400 mb-1">
                    {ex.senderType === 'admin' ? 'Équipe FénixPub' : 'Vous'}
                    {' · '}{new Date(ex.createdAt).toLocaleString('fr-FR')}
                  </div>
                  {ex.isBat && (
                    <div className="text-xs font-semibold text-purple-700 mb-1 flex items-center gap-1">
                      📄 Bon à Tirer
                      {ex.batStatus === 'pending'  && <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">En attente</span>}
                      {ex.batStatus === 'approved' && <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Approuvé</span>}
                      {ex.batStatus === 'refused'  && <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">Refusé</span>}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{ex.message}</div>
                  {ex.batUrl && (
                    <a href={ex.batUrl} target="_blank" rel="noreferrer" className="text-purple-600 hover:underline text-xs block mt-1">
                      {ex.batFilename ?? 'Voir le fichier BAT'}
                    </a>
                  )}
                  {ex.clientActionAt && (
                    <div className="text-gray-400 text-xs mt-1">
                      Répondu le {new Date(ex.clientActionAt).toLocaleString('fr-FR')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 mb-4">Aucun message pour cette commande.</p>
        )}

        <div className="border-t border-gray-100 pt-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Envoyer un message</div>
          <OrderMessageForm orderId={order.id} />
        </div>
      </div>
    </div>
  );
}
