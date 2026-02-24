'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type OrderRow = {
  id: number;
  orderNumber: string | null;
  status: string | null;
  total: string | null;
  shippingName: string | null;
  shippingEmail: string | null;
  shippingCompany: string | null;
  adminNotes: string | null;
  createdAt: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-700',
  confirmed:  'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped:    'bg-indigo-100 text-indigo-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
};
const STATUS_LABELS: Record<string, string> = {
  pending:    'En attente',
  confirmed:  'Confirmé',
  processing: 'En préparation',
  shipped:    'Expédié',
  delivered:  'Livré',
  cancelled:  'Annulé',
};

export default function OrdersClient({ initialOrders }: { initialOrders: OrderRow[] }) {
  const router = useRouter();
  const [orders, setOrders]   = useState<OrderRow[]>(initialOrders);
  const [selected, setSelected] = useState<OrderRow | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);

  function open(o: OrderRow) { setSelected(o); setAdminNotes(o.adminNotes ?? ''); }

  async function updateStatus(id: number, status: string) {
    setSaving(true);
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminNotes }),
    });
    if (res.ok) {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status, adminNotes } : o));
      setSelected(prev => prev ? { ...prev, status, adminNotes } : null);
      router.refresh();
    }
    setSaving(false);
  }

  async function saveNotes(id: number) {
    setSaving(true);
    await fetch(`/api/admin/orders/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminNotes }),
    });
    setOrders(prev => prev.map(o => o.id === id ? { ...o, adminNotes } : o));
    setSaving(false);
  }

  return (
    <div className="flex gap-6">
      {/* Liste */}
      <div className="flex-1 bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">N° / Client</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-center">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Aucune commande</td></tr>
            )}
            {orders.map(o => (
              <tr key={o.id} onClick={() => open(o)}
                className={`hover:bg-gray-50 cursor-pointer transition-colors ${selected?.id === o.id ? 'bg-purple-50' : ''}`}>
                <td className="px-4 py-3">
                  <div className="font-mono text-xs text-purple-700">{o.orderNumber ?? `#${o.id}`}</div>
                  <div className="text-sm text-gray-900">{o.shippingName ?? '—'}</div>
                  <div className="text-xs text-gray-400">{o.shippingEmail ?? ''}</div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                  {o.createdAt ? new Date(o.createdAt).toLocaleDateString('fr-FR') : '—'}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900 text-sm">
                  {o.total ? `${parseFloat(o.total).toFixed(2)} €` : '—'}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[o.status ?? ''] ?? 'bg-gray-100 text-gray-500'}`}>
                    {STATUS_LABELS[o.status ?? ''] ?? o.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Détail */}
      {selected && (
        <div className="w-80 shrink-0 bg-white rounded-xl border border-gray-100 p-5 space-y-4 self-start sticky top-0">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm">{selected.orderNumber ?? `#${selected.id}`}</h3>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
          </div>

          <div className="space-y-0.5">
            <div className="text-sm font-medium text-gray-900">{selected.shippingName}</div>
            <div className="text-xs text-gray-500">{selected.shippingEmail}</div>
            {selected.shippingCompany && <div className="text-xs text-gray-400">{selected.shippingCompany}</div>}
          </div>

          {selected.total && (
            <div className="text-lg font-bold text-purple-700">{parseFloat(selected.total).toFixed(2)} €</div>
          )}

          <div>
            <div className="text-xs font-medium text-gray-500 mb-1">Notes internes</div>
            <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none" />
            <button onClick={() => saveNotes(selected.id)} disabled={saving}
              className="mt-1 text-xs text-purple-700 hover:underline disabled:opacity-40">
              Enregistrer
            </button>
          </div>

          <div>
            <div className="text-xs font-medium text-gray-500 mb-2">Changer le statut</div>
            <div className="flex flex-wrap gap-2">
              {(['pending','confirmed','processing','shipped','delivered','cancelled'] as const).map(s => (
                <button key={s} onClick={() => updateStatus(selected.id, s)}
                  disabled={saving || selected.status === s}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors disabled:opacity-40 ${
                    selected.status === s
                      ? 'bg-purple-700 text-white border-purple-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}>
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
