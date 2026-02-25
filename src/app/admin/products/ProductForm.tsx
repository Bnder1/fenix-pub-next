'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Product, MarkingTechnique } from '@/lib/schema';
import Image from 'next/image';

export default function ProductForm({
  product,
  categories  = [],
  techniques  = [],
}: {
  product?:    Product;
  categories?: string[];
  techniques?: Pick<MarkingTechnique, 'id' | 'name' | 'unitPrice' | 'setupFee'>[];
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    ref:                 product?.ref                 ?? '',
    name:                product?.name                ?? '',
    category:            product?.category            ?? '',
    price:               product?.price               ?? '',
    moq:                 product?.moq                 ?? '',
    description:         product?.description         ?? '',
    material:            product?.material            ?? '',
    dimensions:          product?.dimensions          ?? '',
    weight:              product?.weight              ?? '',
    image:               product?.image               ?? '',
    colors:              product?.colors              ?? '',
    printTechniques:     product?.printTechniques     ?? '',
    source:              product?.source              ?? 'manual',
    active:              product?.active              ?? true,
    markingTechniqueIds: (product?.markingTechniqueIds ?? []) as number[],
    markingPositions:    ((product?.markingPositions ?? []) as string[]).join('\n'),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  function set(k: string, v: unknown) { setForm(f => ({ ...f, [k]: v })); }

  function toggleTechnique(id: number) {
    setForm(f => ({
      ...f,
      markingTechniqueIds: f.markingTechniqueIds.includes(id)
        ? f.markingTechniqueIds.filter(x => x !== id)
        : [...f.markingTechniqueIds, id],
    }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    const method = product ? 'PUT' : 'POST';
    const url    = product ? `/api/admin/products/${product.id}` : '/api/admin/products';
    const payload = {
      ...form,
      markingPositions: form.markingPositions
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean),
    };
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setSaving(false);
    if (res.ok) {
      router.push('/admin/products');
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? 'Erreur lors de la sauvegarde.');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">{product ? 'Modifier le produit' : 'Ajouter un produit'}</h1>
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700">← Retour</button>
      </div>

      <form onSubmit={save} className="bg-white rounded-xl border border-gray-100 p-6 max-w-2xl space-y-5">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Référence *</label>
            <input value={form.ref} onChange={e => set('ref', e.target.value)} required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
            {categories.length > 0 ? (
              <select value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white">
                <option value="">— Sans catégorie —</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            ) : (
              <input value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} required
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prix HT (€)</label>
            <input type="number" step="0.01" value={String(form.price)} onChange={e => set('price', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">MOQ</label>
            <input type="number" value={String(form.moq)} onChange={e => set('moq', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Matière</label>
            <input value={form.material} onChange={e => set('material', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dimensions</label>
            <input value={form.dimensions} onChange={e => set('dimensions', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Poids (g)</label>
            <input type="number" value={String(form.weight)} onChange={e => set('weight', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL image</label>
          <input value={form.image} onChange={e => set('image', e.target.value)} type="url"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
          {form.image && (
            <div className="mt-2">
              <Image src={form.image} alt="Preview" width={80} height={80} className="object-contain rounded-lg border border-gray-100" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Couleurs (virgule)</label>
            <input value={form.colors} onChange={e => set('colors', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Techniques impression</label>
            <input value={form.printTechniques} onChange={e => set('printTechniques', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)}
              className="w-4 h-4 rounded accent-purple-600" />
            <span className="text-sm font-medium text-gray-700">Actif (visible dans le catalogue)</span>
          </label>
        </div>

        {/* Marquage */}
        {techniques.length > 0 && (
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div className="text-sm font-semibold text-gray-700">🖨️ Marquage</div>
            <div>
              <label className="block text-xs text-gray-500 mb-2">Techniques disponibles</label>
              <div className="flex flex-wrap gap-2">
                {techniques.map(t => (
                  <label key={t.id} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.markingTechniqueIds.includes(t.id)}
                      onChange={() => toggleTechnique(t.id)}
                      className="w-4 h-4 accent-purple-600"
                    />
                    <span className="text-sm text-gray-700">
                      {t.name}
                      <span className="text-xs text-gray-400 ml-1">({parseFloat(String(t.unitPrice ?? 0)).toFixed(2)} €/u + {parseFloat(String(t.setupFee ?? 0)).toFixed(2)} € calage)</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Positions disponibles (une par ligne)</label>
              <textarea
                value={form.markingPositions}
                onChange={e => set('markingPositions', e.target.value)}
                rows={3}
                placeholder={"Avant\nDos\nManche gauche"}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
              />
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="px-6 py-2.5 bg-purple-700 text-white rounded-lg text-sm font-medium hover:bg-purple-800 transition-colors disabled:opacity-60">
            {saving ? 'Enregistrement…' : product ? 'Enregistrer' : 'Créer'}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
