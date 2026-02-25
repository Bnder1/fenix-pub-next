'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Variant, MarkingTechnique } from '@/lib/schema';

interface Props {
  productId:         number;
  moq:               number;
  price:             number;
  printable:         boolean;
  variants:          Variant[];
  sizes:             string[];
  selectedColor:     string | null;
  markingTechniques: Pick<MarkingTechnique, 'id' | 'name' | 'unitPrice' | 'setupFee'>[];
  markingPositions:  string[];
}

export default function AddToCartButton({
  productId, moq, price, printable, variants, sizes,
  selectedColor,
  markingTechniques, markingPositions,
}: Props) {
  const router   = useRouter();
  const fileRef  = useRef<HTMLInputElement>(null);

  const hasVariants = variants.length > 0;
  const colorChosen = hasVariants && !!selectedColor;

  // Sizes available for selected color or global
  const availableSizes: string[] = hasVariants && selectedColor
    ? (variants.find(v => v.color === selectedColor)?.sizes ?? [])
    : sizes;
  const hasSizes = availableSizes.length > 0;

  const [sizeQtys,         setSizeQtys]         = useState<Record<string, number>>({});
  const [qty,              setQty]              = useState(moq);
  const [selectedTechId,   setSelectedTechId]   = useState<number | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [designNotes,      setDesignNotes]      = useState('');
  const [designFile,       setDesignFile]       = useState<string | null>(null);
  const [designFileName,   setDesignFileName]   = useState<string | null>(null);
  const [fileError,        setFileError]        = useState('');
  const [loading,          setLoading]          = useState(false);

  // Reset sizes when color changes
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

  // Show design section if printable or if a marking technique is selected
  const showDesign = printable || !!selectedTechnique;

  const canAdd = !loading
    && (!hasVariants || !!selectedColor)
    && (hasSizes ? totalQty > 0 : qty >= moq);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError('');
    const file = e.target.files?.[0];
    if (!file) { setDesignFile(null); setDesignFileName(null); return; }
    const MAX_MB = 5;
    if (file.size > MAX_MB * 1024 * 1024) {
      setFileError(`Fichier trop volumineux (max ${MAX_MB} Mo)`);
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setDesignFile(reader.result as string);
      setDesignFileName(file.name);
    };
    reader.readAsDataURL(file);
  }

  async function addToCart() {
    setLoading(true);
    const base = {
      productId,
      color:              selectedColor     ?? undefined,
      markingTechniqueId: selectedTechId   ?? undefined,
      markingPosition:    selectedPosition  ?? undefined,
      designNotes:        designNotes.trim() || undefined,
      designFile:         designFile        ?? undefined,
    };

    if (hasSizes) {
      const entries = Object.entries(sizeQtys).filter(([, q]) => q > 0);
      await Promise.all(entries.map(([size, q]) =>
        fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...base, qty: q, size }),
        })
      ));
    } else {
      await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...base, qty }),
      });
    }
    setLoading(false);
    router.push('/panier');
  }

  const btnBase   = 'text-xs border rounded-full px-3 py-1.5 transition-colors';
  const btnActive = `${btnBase} border-purple-600 bg-purple-50 text-purple-700 font-medium`;
  const btnIdle   = `${btnBase} border-gray-200 hover:border-purple-300 text-gray-700`;

  return (
    <div className="space-y-5">

      {/* ── Qty / sizes ──────────────────────────────────────── */}
      {hasVariants && !selectedColor ? (
        /* Waiting for color selection — handled in ProductClientSection */
        null
      ) : hasSizes ? (
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">Quantités par taille</div>
          <div className="flex flex-wrap gap-3">
            {availableSizes.map(s => (
              <div key={s} className="flex flex-col items-center gap-1">
                <span className="text-xs font-mono font-semibold text-gray-600 uppercase">{s}</span>
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
          {totalQty === 0 && (
            <p className="text-xs text-gray-400 mt-1">Saisissez les quantités par taille (min. {moq} au total)</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Quantité (min {moq})</label>
          <input
            type="number"
            value={qty}
            min={moq}
            onChange={e => setQty(Math.max(moq, parseInt(e.target.value) || moq))}
            className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>
      )}

      {/* ── Marquage ─────────────────────────────────────────── */}
      {markingTechniques.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">Technique de marquage</div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setSelectedTechId(null); setSelectedPosition(null); }}
              className={selectedTechId === null ? btnActive : btnIdle}>
              Sans marquage
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

      {/* Position de marquage */}
      {selectedTechnique && markingPositions.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">Position du marquage</div>
          <div className="flex flex-wrap gap-2">
            {markingPositions.map(pos => (
              <button key={pos}
                onClick={() => setSelectedPosition(pos)}
                className={selectedPosition === pos ? btnActive : btnIdle}>
                {pos}
              </button>
            ))}
          </div>
          {!selectedPosition && (
            <p className="text-xs text-amber-600 mt-1">Sélectionnez une position</p>
          )}
        </div>
      )}

      {/* ── Design / gravure ─────────────────────────────────── */}
      {showDesign && (
        <div className="border border-dashed border-purple-200 rounded-xl p-4 bg-purple-50/40 space-y-3">
          <div className="text-sm font-medium text-gray-700">Votre fichier de personnalisation</div>

          {/* File upload */}
          <div>
            <div className="text-xs text-gray-500 mb-1">Logo / fichier de gravure (PNG, JPG, PDF, SVG — max 5 Mo)</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-white transition-colors text-gray-700"
              >
                {designFileName ? '📎 Changer le fichier' : '📎 Choisir un fichier'}
              </button>
              {designFileName && (
                <span className="text-xs text-purple-700 font-medium truncate max-w-[180px]">{designFileName}</span>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".png,.jpg,.jpeg,.svg,.pdf,.ai,.eps"
              className="hidden"
              onChange={handleFileChange}
            />
            {fileError && <p className="text-xs text-red-500 mt-1">{fileError}</p>}
          </div>

          {/* Design notes */}
          <div>
            <div className="text-xs text-gray-500 mb-1">Instructions de personnalisation (texte, couleurs Pantone, position…)</div>
            <textarea
              value={designNotes}
              onChange={e => setDesignNotes(e.target.value)}
              rows={2}
              placeholder="Ex : Texte « Mon Entreprise », couleur Pantone 281 C, position centre poitrine…"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none bg-white"
            />
          </div>
        </div>
      )}

      {/* ── Aperçu prix ──────────────────────────────────────── */}
      {totalQty > 0 && price > 0 && (
        <div className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 flex flex-wrap gap-2 items-center">
          <span>Base : {(price * totalQty).toFixed(2)} €</span>
          {markingCost > 0 && (
            <span className="text-gray-500">
              + Marquage : {markingCost.toFixed(2)} €
              <span className="text-xs text-gray-400 ml-1">
                ({(parseFloat(String(selectedTechnique!.unitPrice ?? 0)) * totalQty).toFixed(2)} €/u
                + {parseFloat(String(selectedTechnique!.setupFee ?? 0)).toFixed(2)} € calage)
              </span>
            </span>
          )}
          <span className="font-semibold text-purple-700">
            = {(price * totalQty + markingCost).toFixed(2)} €
          </span>
        </div>
      )}

      {/* ── Bouton ───────────────────────────────────────────── */}
      <button
        onClick={addToCart}
        disabled={!canAdd}
        className="w-full px-6 py-3 bg-purple-700 text-white rounded-xl font-semibold hover:bg-purple-800 transition-colors disabled:opacity-50"
      >
        {loading ? 'Ajout…' : '🛒 Ajouter au panier'}
      </button>

      {hasVariants && !selectedColor && (
        <p className="text-xs text-center text-amber-600">Sélectionnez une couleur ci-dessus pour continuer</p>
      )}
    </div>
  );
}
