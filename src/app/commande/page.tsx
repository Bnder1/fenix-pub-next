'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

type CartItem = {
  id: number;
  qty: number;
  size?: string | null;
  color?: string | null;
  product: { name: string; ref: string; price: string | null; image: string | null };
};

export default function CommandePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cart, setCart]   = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [notes, setNotes]     = useState('');

  const user = session?.user as { name?: string; email?: string; company?: string; phone?: string } | undefined;

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login?redirect=/commande'); return; }
    if (status === 'authenticated') {
      fetch('/api/cart')
        .then(r => r.ok ? r.json() : [])
        .then(d => { setCart(Array.isArray(d) ? d : []); setLoading(false); })
        .catch(() => { setCart([]); setLoading(false); });
    }
  }, [status, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/commande', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
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

        {/* Formulaire */}
        <form onSubmit={submit} className="lg:col-span-2 space-y-4">
          {/* Infos du compte (lecture seule) */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Vos informations</h2>
            <p className="text-xs text-gray-400">La commande sera associée à votre compte. Pour modifier vos informations, rendez-vous dans <Link href="/account" className="text-purple-700 hover:underline">Mon compte</Link>.</p>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Nom</div>
                <div className="text-sm font-medium text-gray-900">{user?.name ?? '—'}</div>
              </div>
              {user?.company && (
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Société</div>
                  <div className="text-sm font-medium text-gray-900">{user.company}</div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Email</div>
                <div className="text-sm font-medium text-gray-900">{user?.email ?? '—'}</div>
              </div>
              {user?.phone && (
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Téléphone</div>
                  <div className="text-sm font-medium text-gray-900">{user.phone}</div>
                </div>
              )}
            </div>
          </div>

          {/* Note */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Message / Instructions</h2>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={4}
              placeholder="Informations complémentaires, instructions de personnalisation, date souhaitée…"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
            />
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
            <div key={item.id} className="text-sm">
              <div className="font-medium text-gray-900 line-clamp-1">{item.product?.name ?? '—'}</div>
              <div className="text-gray-400 text-xs flex gap-2 flex-wrap">
                <span>x{item.qty}</span>
                {item.color && <span>{item.color}</span>}
                {item.size  && <span>T.{item.size}</span>}
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
