'use client';

import { useState, useRef } from 'react';
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
  batStatus: string | null;
  createdAt: string | null;
};

type ExchangeRow = {
  id: number;
  senderType: string;
  message: string;
  isBat: boolean;
  batFilename: string | null;
  batUrl: string | null;
  batStatus: string | null;
  clientActionAt: string | null;
  createdAt: string;
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
  const [orders, setOrders]     = useState<OrderRow[]>(initialOrders);
  const [selected, setSelected] = useState<OrderRow | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [saving, setSaving]     = useState(false);

  // BAT / exchanges state
  const [exchanges,  setExchanges]  = useState<ExchangeRow[]>([]);
  const [loadingEx,  setLoadingEx]  = useState(false);
  const [exMsg,      setExMsg]      = useState('');
  const [exIsBat,    setExIsBat]    = useState(false);
  const [exBatUrl,   setExBatUrl]   = useState('');
  const [exFile,     setExFile]     = useState<File | null>(null);
  const [sendingEx,  setSendingEx]  = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function open(o: OrderRow) {
    setSelected(o);
    setAdminNotes(o.adminNotes ?? '');
    setExchanges([]);
    setExMsg(''); setExIsBat(false); setExBatUrl(''); setExFile(null);
    setLoadingEx(true);
    try {
      const res = await fetch(`/api/admin/orders/${o.id}/exchanges`);
      if (res.ok) setExchanges(await res.json());
    } catch {}
    setLoadingEx(false);
  }

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

  async function sendExchange() {
    if (!selected || !exMsg.trim()) return;
    setSendingEx(true);
    let res: Response;
    if (exIsBat && exFile) {
      const fd = new FormData();
      fd.append('message', exMsg);
      fd.append('isBat', 'true');
      fd.append('file', exFile);
      res = await fetch(`/api/admin/orders/${selected.id}/exchanges`, { method: 'POST', body: fd });
    } else {
      res = await fetch(`/api/admin/orders/${selected.id}/exchanges`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: exMsg, isBat: exIsBat, batUrl: exBatUrl || undefined }),
      });
    }
    if (res.ok) {
      const row = await res.json();
      setExchanges(prev => [...prev, row]);
      setExMsg(''); setExBatUrl(''); setExFile(null); setExIsBat(false);
      if (fileRef.current) fileRef.current.value = '';
      // Update batStatus in list if it was a BAT
      if (exIsBat) {
        setOrders(prev => prev.map(o => o.id === selected.id ? { ...o, batStatus: 'pending' } : o));
        setSelected(prev => prev ? { ...prev, batStatus: 'pending' } : null);
      }
    }
    setSendingEx(false);
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300';

  return (
    <div className="flex gap-6 h-[calc(100vh-160px)]">
      {/* Liste */}
      <div className="flex-1 bg-white rounded-xl border border-gray-100 overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider sticky top-0">
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
                  <div className="flex flex-col items-center gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[o.status ?? ''] ?? 'bg-gray-100 text-gray-500'}`}>
                      {STATUS_LABELS[o.status ?? ''] ?? o.status}
                    </span>
                    {o.batStatus === 'pending'  && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">BAT envoyé</span>}
                    {o.batStatus === 'approved' && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">BAT approuvé</span>}
                    {o.batStatus === 'refused'  && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">BAT refusé</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Détail */}
      {selected && (
        <div className="w-96 shrink-0 bg-white rounded-xl border border-gray-100 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm">{selected.orderNumber ?? `#${selected.id}`}</h3>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Client */}
            <div className="space-y-0.5">
              <div className="text-sm font-medium text-gray-900">{selected.shippingName}</div>
              <div className="text-xs text-gray-500">{selected.shippingEmail}</div>
              {selected.shippingCompany && <div className="text-xs text-gray-400">{selected.shippingCompany}</div>}
            </div>

            {selected.total && (
              <div className="text-lg font-bold text-purple-700">{parseFloat(selected.total).toFixed(2)} €</div>
            )}

            {/* Notes */}
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">Notes internes</div>
              <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={2}
                className={inputCls + ' resize-none'} />
              <button onClick={() => saveNotes(selected.id)} disabled={saving}
                className="mt-1 text-xs text-purple-700 hover:underline disabled:opacity-40">
                Enregistrer
              </button>
            </div>

            {/* Statut */}
            <div>
              <div className="text-xs font-medium text-gray-500 mb-2">Changer le statut</div>
              <div className="flex flex-wrap gap-1.5">
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

            {/* BAT & Échanges */}
            <div>
              <div className="text-xs font-semibold text-gray-700 mb-2 border-t border-gray-100 pt-3">
                BAT &amp; Échanges
                {selected.batStatus === 'pending'  && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">En attente</span>}
                {selected.batStatus === 'approved' && <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Approuvé</span>}
                {selected.batStatus === 'refused'  && <span className="ml-2 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">Refusé</span>}
              </div>

              {loadingEx && <div className="text-xs text-gray-400 py-2">Chargement…</div>}

              {/* Thread */}
              {exchanges.length > 0 && (
                <div className="space-y-2 mb-3 max-h-64 overflow-y-auto">
                  {exchanges.map(ex => (
                    <div key={ex.id} className={`flex ${ex.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${
                        ex.senderType === 'admin' ? 'bg-purple-50 text-purple-900' : 'bg-gray-50 text-gray-800'
                      }`}>
                        {ex.isBat && (
                          <div className="font-semibold text-purple-700 mb-1 flex items-center gap-1">
                            📄 BAT
                            {ex.batStatus === 'pending'  && <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">En attente</span>}
                            {ex.batStatus === 'approved' && <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Approuvé</span>}
                            {ex.batStatus === 'refused'  && <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">Refusé</span>}
                          </div>
                        )}
                        <div className="whitespace-pre-wrap">{ex.message}</div>
                        {ex.batUrl && (
                          <a href={ex.batUrl} target="_blank" rel="noreferrer" className="text-purple-600 hover:underline block mt-1">
                            {ex.batFilename ?? ex.batUrl}
                          </a>
                        )}
                        {ex.clientActionAt && (
                          <div className="text-gray-400 mt-1">
                            {ex.batStatus === 'approved' ? 'Approuvé' : 'Refusé'} le {new Date(ex.clientActionAt).toLocaleString('fr-FR')}
                          </div>
                        )}
                        <div className="text-gray-400 mt-1">{new Date(ex.createdAt).toLocaleString('fr-FR')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Form */}
              <div className="space-y-2 border-t border-gray-50 pt-3">
                <textarea
                  value={exMsg}
                  onChange={e => setExMsg(e.target.value)}
                  rows={3}
                  placeholder="Message ou commentaire…"
                  className={inputCls + ' resize-none'}
                />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={exIsBat} onChange={e => setExIsBat(e.target.checked)} className="w-4 h-4 accent-purple-600" />
                  <span className="text-xs text-gray-700">Envoyer comme BAT</span>
                </label>
                {exIsBat && (
                  <div className="space-y-1.5">
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.ai,.eps"
                      onChange={e => setExFile(e.target.files?.[0] ?? null)}
                      className="text-xs w-full"
                    />
                    {!exFile && (
                      <input
                        type="url"
                        value={exBatUrl}
                        onChange={e => setExBatUrl(e.target.value)}
                        placeholder="Ou URL du fichier…"
                        className={inputCls}
                      />
                    )}
                  </div>
                )}
                <button
                  onClick={sendExchange}
                  disabled={sendingEx || !exMsg.trim() || (exIsBat && !exFile && !exBatUrl)}
                  className="w-full py-2 text-xs font-medium bg-purple-700 text-white rounded-lg hover:bg-purple-800 disabled:opacity-50 transition-colors"
                >
                  {sendingEx ? 'Envoi…' : exIsBat ? '📄 Envoyer le BAT' : '✉️ Envoyer le message'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
