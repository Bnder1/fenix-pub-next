'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Variant } from '@/lib/schema';

interface Props {
  productId: number;
  moq:       number;
  variants:  Variant[];
  sizes:     string[];
}

export default function AddToCartButton({ productId, moq, variants, sizes }: Props) {
  const router = useRouter();

  const hasVariants = variants.length > 0;
  const hasSizes    = sizes.length > 0 || variants.some(v => (v.sizes ?? []).length > 0);

  const [selectedColor, setSelectedColor] = useState<string | null>(
    hasVariants ? null : null
  );
  const [selectedSize,  setSelectedSize]  = useState<string | null>(null);
  const [qty,           setQty]           = useState(moq);
  const [loading,       setLoading]       = useState(false);

  // Sizes available for the selected color (clothing) or all sizes at product level
  const availableSizes: string[] = hasVariants && selectedColor
    ? (variants.find(v => v.color === selectedColor)?.sizes ?? [])
    : sizes;

  async function addToCart() {
    setLoading(true);
    await fetch('/api/cart', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        productId,
        qty,
        color: selectedColor ?? undefined,
        size:  selectedSize  ?? undefined,
      }),
    });
    setLoading(false);
    router.push('/panier');
  }

  return (
    <div className="space-y-4 flex-1">
      {/* Color selection */}
      {hasVariants && (
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">
            Couleur{selectedColor ? ` : ${selectedColor}` : ''}
          </div>
          <div className="flex flex-wrap gap-2">
            {variants.map(v => (
              <button
                key={v.color}
                onClick={() => { setSelectedColor(v.color); setSelectedSize(null); }}
                className={`text-xs border rounded-full px-3 py-1.5 transition-colors ${
                  selectedColor === v.color
                    ? 'border-purple-600 bg-purple-50 text-purple-700 font-medium'
                    : 'border-gray-200 hover:border-purple-300 text-gray-700'
                }`}
              >
                {v.color}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Size selection */}
      {hasSizes && availableSizes.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">
            Taille{selectedSize ? ` : ${selectedSize}` : ''}
          </div>
          <div className="flex flex-wrap gap-2">
            {availableSizes.map(s => (
              <button
                key={s}
                onClick={() => setSelectedSize(s)}
                className={`text-xs border rounded-lg px-3 py-1.5 font-mono transition-colors ${
                  selectedSize === s
                    ? 'border-purple-600 bg-purple-50 text-purple-700 font-medium'
                    : 'border-gray-200 hover:border-purple-300 text-gray-700'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity + add button */}
      <div className="flex gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Quantité (min {moq})</label>
          <input
            type="number"
            value={qty}
            min={moq}
            onChange={e => setQty(Math.max(moq, parseInt(e.target.value) || moq))}
            className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>
        <button
          onClick={addToCart}
          disabled={loading || (hasVariants && !selectedColor) || (hasSizes && availableSizes.length > 0 && !selectedSize)}
          className="flex-1 self-end px-6 py-3 bg-purple-700 text-white rounded-xl font-semibold hover:bg-purple-800 transition-colors disabled:opacity-60"
        >
          {loading ? '…' : '🛒 Ajouter au panier'}
        </button>
      </div>
      {hasVariants && !selectedColor && (
        <p className="text-xs text-amber-600">Veuillez sélectionner une couleur</p>
      )}
      {hasSizes && availableSizes.length > 0 && !selectedSize && (
        <p className="text-xs text-amber-600">Veuillez sélectionner une taille</p>
      )}
    </div>
  );
}
