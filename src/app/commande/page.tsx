'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

type CartItem = {
  id: number;
  qty: number;
  product: { name: string; ref: string; price: string | null; image: string | null };
};

export default function CommandePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cart, setCart]       = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [form, setForm] = useState({
    shippingName: '', shippingEmail: '', shippingPhone: '',
    shippingCompany: '', shippingAddress: '', notes: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login?redirect=/commande'); return; }
    if (status === 'authenticated') {
      fetch('/api/cart')
        .then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then(d => {
          setCart(Array.isArray(d) ? d : []);
          setLoading(false);
        })
        .catch(() => {
          setCart([]);
          setLoading(false);
        });
      const u = session?.user as { name?: string; email?: string } | undefined;
      setForm(f => ({ ...f, shippingName: u?.name ?? '', shippingEmail: u?.email ?? '' }));
    }
  }, [status, session, router]);

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/commande', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const d = await res.json().catch(() => ({}));
        router.push(`/commande/confirmation/${d.orderId ?? ''}`);
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? 'Erreur lors de la commande.');
      }
    } catch {
      setError('Erreur réseau — veuillez réessayer.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-20 text-center text-gray-400">Chargement…</div>;
  if (cart.length === 0) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="text-4xl mb-4">🛒</div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">Panier vide</h1>
      <Link href="/catalogue" className="text-purple-700 hover:underline">Retour au catalogue</Link>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Finaliser la commande</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Formulaire livraison */}
        <form onSubmit={submit} className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Informations de livraison</h2>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
                <input value={form.shippingName} onChange={e => set('shippingName', e.target.value)} required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Société</label>
                <input value={form.shippingCompany} onChange={e => set('shippingCompany', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" value={form.shippingEmail} onChange={e => set('shippingEmail', e.target.value)} required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input value={form.shippingPhone} onChange={e => set('shippingPhone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse de livraison</label>
              <textarea value={form.shippingAddress} onChange={e => set('shippingAddress', e.target.value)} rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Instructions</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
                placeholder="Informations complémentaires, instructions de personnalisation…"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none" />
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="w-full py-3 bg-purple-700 text-white rounded-xl font-semibold hover:bg-purple-800 transition-colors disabled:opacity-60">
            {saving ? 'Envoi en cours…' : 'Confirmer la commande'}
          </button>
          <p className="text-xs text-gray-400 text-center">
            En confirmant, notre équipe vous contactera pour valider les détails et le délai de livraison.
          </p>
        </form>

        {/* Récap panier */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 self-start space-y-3">
          <h2 className="font-semibold text-gray-900">Récapitulatif</h2>
          {cart.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <div>
                <div className="font-medium text-gray-900 line-clamp-1">{item.product?.name ?? '—'}</div>
                <div className="text-gray-400 text-xs">x{item.qty}</div>
              </div>
            </div>
          ))}
          <div className="border-t border-gray-100 pt-3">
            <Link href="/panier" className="text-xs text-purple-700 hover:underline">← Modifier le panier</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
