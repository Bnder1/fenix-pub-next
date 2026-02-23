'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddToCartButton({ productId, moq }: { productId: number; moq: number }) {
  const [qty, setQty]     = useState(moq);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function addToCart() {
    setLoading(true);
    await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, qty }),
    });
    setLoading(false);
    router.push('/panier');
  }

  return (
    <div className="flex gap-3 flex-1">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">Quantité</label>
        <input
          type="number" value={qty} min={moq} onChange={e => setQty(Math.max(moq, parseInt(e.target.value) || moq))}
          className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
        />
      </div>
      <button
        onClick={addToCart}
        disabled={loading}
        className="flex-1 self-end px-6 py-3 bg-purple-700 text-white rounded-xl font-semibold hover:bg-purple-800 transition-colors disabled:opacity-60"
      >
        {loading ? '…' : '🛒 Ajouter au panier'}
      </button>
    </div>
  );
}
