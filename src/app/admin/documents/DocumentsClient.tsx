'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Doc = { id: number; title: string; url: string | null; filename: string | null; description: string | null; active: boolean | null; createdAt: string | null };
const EMPTY = { title: '', url: '', filename: '', description: '', active: true };

export default function DocumentsClient({ initialList }: { initialList: Doc[] }) {
  const router = useRouter();
  const [list, setList] = useState<Doc[]>(initialList);
  const [editing, setEditing] = useState<Partial<Doc> & typeof EMPTY | null>(null);
  const [saving, setSaving] = useState(false);

  function startNew() { setEditing({ ...EMPTY }); }
  function startEdit(d: Doc) {
    setEditing({ ...EMPTY, ...d, url: d.url ?? '', filename: d.filename ?? '', description: d.description ?? '', active: d.active ?? true });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    const isNew = !('id' in editing) || editing.id === undefined;
    const url  = isNew ? '/api/admin/documents' : `/api/admin/documents/${editing.id}`;
    const method = isNew ? 'POST' : 'PUT';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) });
    if (res.ok) { setEditing(null); router.refresh(); }
    setSaving(false);
  }

  async function remove(id: number) {
    if (!confirm('Supprimer ce document ?')) return;
    await fetch(`/api/admin/documents/${id}`, { method: 'DELETE' });
    setList(prev => prev.filter(d => d.id !== id));
  }

  async function toggleActive(d: Doc) {
    const res = await fetch(`/api/admin/documents/${d.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !d.active }),
    });
    if (res.ok) setList(prev => prev.map(x => x.id === d.id ? { ...x, active: !x.active } : x));
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={startNew} className="px-4 py-2 bg-purple-700 text-white rounded-lg text-sm font-medium hover:bg-purple-800">
          + Ajouter un document
        </button>
      </div>

      {editing && (
        <form onSubmit={save} className="bg-white rounded-xl border border-purple-200 p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">{('id' in editing && editing.id) ? 'Modifier' : 'Nouveau document'}</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
            <input value={editing.title} onChange={e => setEditing(f => f ? { ...f, title: e.target.value } : f)} required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL du fichier</label>
            <input value={editing.url ?? ''} onChange={e => setEditing(f => f ? { ...f, url: e.target.value } : f)} type="url"
              placeholder="https://…"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={editing.description ?? ''} onChange={e => setEditing(f => f ? { ...f, description: e.target.value } : f)} rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none" />
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

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">Titre</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-center">Statut</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {list.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Aucun document</td></tr>}
            {list.map(d => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{d.title}</div>
                  {d.url && <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-xs text-purple-600 hover:underline truncate block max-w-[200px]">{d.url}</a>}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px] truncate">{d.description ?? '—'}</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggleActive(d)} className={`text-xs px-2 py-0.5 rounded-full ${d.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {d.active ? 'Actif' : 'Inactif'}
                  </button>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => startEdit(d)} className="text-xs text-purple-700 hover:underline">Modifier</button>
                  <button onClick={() => remove(d.id)} className="text-xs text-red-500 hover:underline">Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
