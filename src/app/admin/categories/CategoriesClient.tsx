'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Cat = { id: number; name: string; slug: string; sortOrder: number | null };

function slugify(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function CategoriesClient({ initialCats }: { initialCats: Cat[] }) {
  const router = useRouter();
  const [cats, setCats]         = useState<Cat[]>(initialCats);
  const [newName, setNewName]   = useState('');
  const [editId, setEditId]     = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving]     = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    const res = await fetch('/api/admin/categories', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), slug: slugify(newName.trim()), sortOrder: cats.length }),
    });
    if (res.ok) { setNewName(''); router.refresh(); }
    setSaving(false);
  }

  async function update(id: number) {
    setSaving(true);
    await fetch(`/api/admin/categories/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, slug: slugify(editName) }),
    });
    setEditId(null); setSaving(false); router.refresh();
  }

  async function remove(id: number) {
    if (!confirm('Supprimer cette catégorie ?')) return;
    await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <div className="max-w-xl space-y-4">
      {/* Add form */}
      <form onSubmit={create} className="bg-white rounded-xl border border-gray-100 p-4 flex gap-3">
        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nouvelle catégorie…"
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
        <button type="submit" disabled={saving || !newName.trim()}
          className="px-4 py-2 bg-purple-700 text-white rounded-lg text-sm font-medium hover:bg-purple-800 disabled:opacity-50">
          Ajouter
        </button>
      </form>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
        {cats.length === 0 && <div className="px-4 py-8 text-center text-gray-400 text-sm">Aucune catégorie</div>}
        {cats.map(c => (
          <div key={c.id} className="flex items-center gap-3 px-4 py-3">
            {editId === c.id ? (
              <>
                <input value={editName} onChange={e => setEditName(e.target.value)} autoFocus
                  className="flex-1 px-3 py-1.5 border border-purple-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                <button onClick={() => update(c.id)} disabled={saving} className="text-xs px-3 py-1.5 bg-purple-700 text-white rounded-lg hover:bg-purple-800">OK</button>
                <button onClick={() => setEditId(null)} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">Annuler</button>
              </>
            ) : (
              <>
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">{c.name}</span>
                  <span className="ml-2 text-xs text-gray-400 font-mono">{c.slug}</span>
                </div>
                <button onClick={() => { setEditId(c.id); setEditName(c.name); }} className="text-xs text-purple-700 hover:underline">Modifier</button>
                <button onClick={() => remove(c.id)} className="text-xs text-red-500 hover:underline">Supprimer</button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
