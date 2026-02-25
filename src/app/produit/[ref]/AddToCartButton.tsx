'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Variant, MarkingTechnique } from '@/lib/schema';

interface Props {
  productId:         number;
  moq:               number;
  price:             number;
  variants:          Variant[];
  sizes:             string[];
  selectedColor:     string | null;
  markingTechniques: Pick<MarkingTechnique, 'id' | 'name' | 'unitPrice' | 'setupFee'>[];
  markingPositions:  string[];
}

export default function AddToCartButton({
  productId, moq, price, variants, sizes,
  selectedColor,
  markingTechniques, markingPositions,
}: Props) {
  const router = useRouter();

  const hasVariants = variants.length > 0;

  const [sizeQtys,           setSizeQtys]           = useState<Record<string, number>>({});
  const [qty,                setQty]                = useState(moq);
  const [selectedTechId,     setSelectedTechId]     = useState<number | null>(null);
  const [selectedPosition,   setSelectedPosition]   = useState<string | null>(null);
  const [loading,            setLoading]            = useState(false);

  // Sizes available for selected color (clothing) or global sizes
  const availableSizes: string[] = hasVariants && selectedColor
    ? (variants.find(v => v.color === selectedColor)?.sizes ?? [])
    : sizes;
  const hasSizes = availableSizes.length > 0;

  // Reset size quantities when color changes
  useEffect(() => { setSizeQtys({}); }, [selectedColor]);

  function setSizeQty(size: string, q: number) {
    setSizeQtys(prev => ({ ...prev, [size]: Math.max(0, q) }));
  }

  const totalQty = hasSizes
    ? Object.values(sizeQtys).reduce((s, q) => s + q, 0)
    : qty;

  const selectedTechnique = markingTechniques.find(t => t.id === selectedTechId) ?? null;
  const markingCost = selectedTechnique
    ? parseFloat(String(selectedTechnique.unitPrice ?? 0)) * totalQty
      + parseFloat(String(selectedTechnique.setupFee  ?? 0))
    : 0;

  const canAdd = !loading
    && (!hasVariants || !!selectedColor)
    && (hasSizes ? totalQty > 0 : qty >= moq);

  async function addToCart() {
    setLoading(true);
    if (hasSizes) {
      const entries = Object.entries(sizeQtys).filter(([, q]) => q > 0);
      await Promise.all(entries.map(([size, q]) =>
        fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId, qty: q,
            color:              selectedColor     ?? undefined,
            size,
            markingTechniqueId: selectedTechId   ?? undefined,
            markingPosition:    selectedPosition  ?? undefined,
          }),
        })
      ));
    } else {
      await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId, qty,
          color:              selectedColor    ?? undefined,
          markingTechniqueId: selectedTechId  ?? undefined,
          markingPosition:    selectedPosition ?? undefined,
        }),
      });
    }
    setLoading(false);
    router.push('/panier');
  }

  const btnBase = 'text-xs border rounded-full px-3 py-1.5 transition-colors';
  const btnActive = `${btnBase} border-purple-600 bg-purple-50 text-purple-700 font-medium`;
  const btnIdle   = `${btnBase} border-gray-200 hover:border-purple-300 text-gray-700`;

  return (
    <div className="space-y-4">
      {/* Qty per size OR simple qty */}
      {hasSizes ? (
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">Quantités par taille</div>
          <div className="flex flex-wrap gap-3">
            {availableSizes.map(s => (
              <div key={s} className="flex flex-col items-center gap-1">
                <span className="text-xs font-mono font-medium text-gray-600">{s}</span>
                <input
                  type="number"
                  min={0}
                  value={sizeQtys[s] ?? 0}
                  onChange={e => setSizeQty(s, parseInt(e.target.value) || 0)}
                  className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>
            ))}
          </div>
          {totalQty > 0 && totalQty < moq && (
            <p className="text-xs text-amber-600 mt-1">Quantité minimale : {moq} unités (total : {totalQty})</p>
          )}
          {totalQty === 0 && <p className="text-xs text-amber-600 mt-1">Saisissez les quantités souhaitées par taille</p>}
        </div>
      ) : (
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
      )}

      {/* Marking techniques */}
      {markingTechniques.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">Marquage</div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setSelectedTechId(null); setSelectedPosition(null); }}
              className={selectedTechId === null ? btnActive : btnIdle}>
              Aucun marquage
            </button>
            {markingTechniques.map(t => (
              <button key={t.id}
                onClick={() => { setSelectedTechId(t.id); setSelectedPosition(null); }}
                className={selectedTechId === t.id ? btnActive : btnIdle}>
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Positions */}
      {selectedTechnique && markingPositions.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">Position</div>
          <div className="flex flex-wrap gap-2">
            {markingPositions.map(pos => (
              <button key={pos}
                onClick={() => setSelectedPosition(pos)}
                className={selectedPosition === pos ? btnActive : btnIdle}>
                {pos}
              </button>
            ))}
          </div>
          {!selectedPosition && <p className="text-xs text-amber-600 mt-1">Veuillez sélectionner une position</p>}
        </div>
      )}

      {/* Price preview */}
      {totalQty > 0 && price > 0 && (
        <div className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
          <span>Base : {(price * totalQty).toFixed(2)} €</span>
          {markingCost > 0 && (
            <span className="text-gray-500">
              {' + '}Marquage : {markingCost.toFixed(2)} €
              <span className="text-xs text-gray-400 ml-1">
                ({(parseFloat(String(selectedTechnique!.unitPrice ?? 0)) * totalQty).toFixed(2)} €/u + {parseFloat(String(selectedTechnique!.setupFee ?? 0)).toFixed(2)} € calage)
              </span>
            </span>
          )}
          <span className="font-semibold text-purple-700 ml-2">
            = {(price * totalQty + markingCost).toFixed(2)} €
          </span>
        </div>
      )}

      {/* Add to cart button */}
      <button
        onClick={addToCart}
        disabled={!canAdd}
        className="w-full px-6 py-3 bg-purple-700 text-white rounded-xl font-semibold hover:bg-purple-800 transition-colors disabled:opacity-60"
      >
        {loading ? '…' : '🛒 Ajouter au panier'}
      </button>
    </div>
  );
}
