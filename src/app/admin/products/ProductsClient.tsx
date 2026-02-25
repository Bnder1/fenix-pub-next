'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { imagesArray } from '@/lib/utils';

type Product = {
  id: number;
  ref: string;
  name: string;
  category: string | null;
  source: string | null;
  active: boolean | null;
  image: string | null;
  images: string[] | null;
};

interface Props {
  items:       Product[];
  total:       number;
  page:        number;
  pageSize:    number;
  categories:  string[];
  searchQuery: string;
}

export default function ProductsClient({ items, total, page, pageSize, categories, searchQuery }: Props) {
  const router = useRouter();
  const [selected,     setSelected]     = useState<Set<number>>(new Set());
  const [bulkCategory, setBulkCategory] = useState('');
  const [message,      setMessage]      = useState('');
  const [isError,      setIsError]      = useState(false);
  const [isPending,    startTransition] = useTransition();

  const totalPages = Math.ceil(total / pageSize);
  const allIds = items.map(p => p.id);
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id));

  function toggleAll() {
    if (allSelected) {
      setSelected(prev => {
        const next = new Set(prev);
        allIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelected(prev => {
        const next = new Set(prev);
        allIds.forEach(id => next.add(id));
        return next;
      });
    }
  }

  function toggleOne(id: number) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function bulkAction(action: string, extra?: Record<string, string>) {
    if (selected.size === 0) return;
    if (action === 'delete' && !confirm(`Supprimer ${selected.size} produit(s) ?`)) return;

    setMessage('');
    setIsError(false);

    const res = await fetch('/api/admin/products/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ids: Array.from(selected), ...extra }),
    });
    const data = await res.json();
    if (!res.ok) {
      setIsError(true);
      setMessage(data.error ?? 'Erreur inconnue');
    } else {
      setMessage(`${data.affected} produit(s) ${actionLabel(action)}`);
      setSelected(new Set());
      startTransition(() => router.refresh());
    }
  }

  function actionLabel(a: string) {
    if (a === 'delete')       return 'supprimé(s)';
    if (a === 'activate')     return 'activé(s)';
    if (a === 'deactivate')   return 'désactivé(s)';
    if (a === 'set_category') return 'mis à jour';
    return 'traité(s)';
  }

  function goPage(p: number) {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    params.set('page', String(p));
    router.push(`/admin/products?${params.toString()}`);
  }

  // Build pagination page numbers with ellipsis
  function pageNumbers(): (number | '…')[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '…')[] = [1];
    if (page > 3) pages.push('…');
    for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) pages.push(p);
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
    return pages;
  }

  return (
    <div>
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl px-4 py-3">
          <span className="text-sm font-medium text-purple-900">{selected.size} sélectionné(s)</span>
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <button
              onClick={() => bulkAction('activate')}
              disabled={isPending}
              className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Activer
            </button>
            <button
              onClick={() => bulkAction('deactivate')}
              disabled={isPending}
              className="px-3 py-1.5 text-xs font-medium text-white bg-gray-500 rounded-lg hover:bg-gray-600 disabled:opacity-50"
            >
              Désactiver
            </button>
            <div className="flex items-center gap-1.5">
              <select
                value={bulkCategory}
                onChange={e => setBulkCategory(e.target.value)}
                className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
              >
                <option value="">— Catégorie —</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button
                onClick={() => bulkCategory && bulkAction('set_category', { category: bulkCategory })}
                disabled={isPending || !bulkCategory}
                className="px-3 py-1.5 text-xs font-medium text-purple-700 bg-white border border-purple-300 rounded-lg hover:bg-purple-50 disabled:opacity-50"
              >
                Appliquer
              </button>
            </div>
            <button
              onClick={() => bulkAction('delete')}
              disabled={isPending}
              className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              Supprimer
            </button>
          </div>
        </div>
      )}

      {message && (
        <p className={`mb-4 text-sm font-medium ${isError ? 'text-red-600' : 'text-green-700'}`}>{message}</p>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="rounded border-gray-300 text-purple-700 focus:ring-purple-300"
                />
              </th>
              <th className="px-4 py-3 text-left">Image</th>
              <th className="px-4 py-3 text-left">Réf / Nom</th>
              <th className="px-4 py-3 text-left">Catégorie</th>
              <th className="px-4 py-3 text-left">Source</th>
              <th className="px-4 py-3 text-center">Actif</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map(p => {
              const img = imagesArray(p)[0];
              const isSelected = selected.has(p.id);
              return (
                <tr key={p.id} className={`hover:bg-gray-50 ${isSelected ? 'bg-purple-50' : ''}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOne(p.id)}
                      className="rounded border-gray-300 text-purple-700 focus:ring-purple-300"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                      {img ? <Image src={img} alt="" width={40} height={40} className="object-contain" /> : <span>🎁</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{p.name}</div>
                    <div className="text-xs text-gray-400 font-mono">{p.ref}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p.category ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.source === 'midocean' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                      {p.source}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block w-2 h-2 rounded-full ${p.active ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/products/${p.id}`} className="text-xs text-purple-700 hover:underline">Modifier</Link>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">Aucun produit trouvé</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} sur {total} produits
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => goPage(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Préc
            </button>
            {pageNumbers().map((p, i) =>
              p === '…' ? (
                <span key={`ell-${i}`} className="px-2 py-1.5 text-xs text-gray-400">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => goPage(p)}
                  className={`px-3 py-1.5 text-xs rounded-lg border ${
                    p === page
                      ? 'bg-purple-700 text-white border-purple-700'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => goPage(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Suiv →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
