'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Testimonial = {
  id: number; text: string; name: string; company: string | null;
  initials: string | null; rating: number | null; sortOrder: number | null; active: boolean | null;
};

const EMPTY = { text: '', name: '', company: '', initials: '', rating: 5, sortOrder: 0, active: true };

export default function TestimonialsClient({ initialList }: { initialList: Testimonial[] }) {
  const router   = useRouter();
  const [list, setList]     = useState<Testimonial[]>(initialList);
  const [editing, setEditing] = useState<Partial<Testimonial> & typeof EMPTY | null>(null);
  const [saving, setSaving]   = useState(false);

  function startNew() { setEditing({ ...EMPTY }); }
  function startEdit(t: Testimonial) {
    setEditing({ ...EMPTY, ...t, company: t.company ?? '', initials: t.initials ?? '', rating: t.rating ?? 5, sortOrder: t.sortOrder ?? 0, active: t.active ?? true });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    const isNew = !('id' in editing) || editing.id === undefined;
    const url  = isNew ? '/api/admin/testimonials' : `/api/admin/testimonials/${editing.id}`;
    const method = isNew ? 'POST' : 'PUT';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) });
    if (res.ok) { setEditing(null); router.refresh(); }
    setSaving(false);
  }

  async function remove(id: number) {
    if (!confirm('Supprimer ce témoignage ?')) return;
    await fetch(`/api/admin/testimonials/${id}`, { method: 'DELETE' });
    setList(prev => prev.filter(t => t.id !== id));
    router.refresh();
  }

  async function toggleActive(t: Testimonial) {
    const res = await fetch(`/api/admin/testimonials/${t.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !t.active }),
    });
    if (res.ok) setList(prev => prev.map(x => x.id === t.id ? { ...x, active: !x.active } : x));
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={startNew} className="px-4 py-2 bg-purple-700 text-white rounded-lg text-sm font-medium hover:bg-purple-800">
          + Ajouter
        </button>
      </div>

      {/* Formulaire */}
      {editing && (
        <form onSubmit={save} className="bg-white rounded-xl border border-purple-200 p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">{('id' in editing && editing.id) ? 'Modifier' : 'Nouveau témoignage'}</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Témoignage *</label>
            <textarea value={editing.text} onChange={e => setEditing(f => f ? { ...f, text: e.target.value } : f)} required rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
              <input value={editing.name} onChange={e => setEditing(f => f ? { ...f, name: e.target.value } : f)} required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Société</label>
              <input value={editing.company ?? ''} onChange={e => setEditing(f => f ? { ...f, company: e.target.value } : f)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Initiales</label>
              <input value={editing.initials ?? ''} maxLength={5} onChange={e => setEditing(f => f ? { ...f, initials: e.target.value } : f)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note (1-5)</label>
              <input type="number" min={1} max={5} value={editing.rating ?? 5} onChange={e => setEditing(f => f ? { ...f, rating: parseInt(e.target.value) } : f)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ordre</label>
              <input type="number" value={editing.sortOrder ?? 0} onChange={e => setEditing(f => f ? { ...f, sortOrder: parseInt(e.target.value) } : f)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-purple-700 text-white rounded-lg text-sm font-medium hover:bg-purple-800 disabled:opacity-60">
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50">
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Liste */}
      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
        {list.length === 0 && <div className="px-4 py-8 text-center text-gray-400 text-sm">Aucun témoignage</div>}
        {list.map(t => (
          <div key={t.id} className="flex items-start gap-4 px-4 py-4">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-sm font-bold text-purple-700 shrink-0">
              {t.initials ?? t.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-900 text-sm">{t.name}</span>
                {t.company && <span className="text-xs text-gray-400">{t.company}</span>}
                <span className="text-yellow-400 text-xs">{'★'.repeat(t.rating ?? 5)}</span>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">{t.text}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => toggleActive(t)}
                className={`text-xs px-2 py-1 rounded-full ${t.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {t.active ? 'Actif' : 'Inactif'}
              </button>
              <button onClick={() => startEdit(t)} className="text-xs text-purple-700 hover:underline">Modifier</button>
              <button onClick={() => remove(t.id)} className="text-xs text-red-500 hover:underline">Supprimer</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
