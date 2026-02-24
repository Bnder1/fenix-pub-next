'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Page = {
  id:        number;
  title:     string;
  slug:      string;
  content:   string;
  metaDesc:  string;
  sortOrder: number;
  published: boolean;
};

function slugify(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const emptyForm = { title: '', slug: '', content: '', metaDesc: '', sortOrder: 0, published: false };

export default function PagesClient({ initialPages }: { initialPages: Page[] }) {
  const router = useRouter();
  const [pages, setPages]   = useState<Page[]>(initialPages);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(emptyForm);
  const [editId, setEditId]   = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Omit<Page, 'id'>>(emptyForm);
  const [saving, setSaving]   = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm.title.trim() || !addForm.slug.trim()) return;
    setSaving(true);
    const res = await fetch('/api/admin/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addForm),
    });
    if (res.ok) {
      const created = await res.json();
      setPages(p => [...p, created]);
      setAddForm(emptyForm);
      setShowAdd(false);
    }
    setSaving(false);
  }

  function startEdit(p: Page) {
    setEditId(p.id);
    setEditForm({ title: p.title, slug: p.slug, content: p.content, metaDesc: p.metaDesc, sortOrder: p.sortOrder, published: p.published });
  }

  async function saveEdit(id: number) {
    setSaving(true);
    const res = await fetch(`/api/admin/pages/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      const updated = await res.json();
      setPages(p => p.map(x => x.id === id ? { ...updated } : x));
      setEditId(null);
    }
    setSaving(false);
  }

  async function togglePublished(p: Page) {
    const res = await fetch(`/api/admin/pages/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !p.published }),
    });
    if (res.ok) {
      setPages(pages => pages.map(x => x.id === p.id ? { ...x, published: !p.published } : x));
    }
  }

  async function remove(id: number) {
    if (!confirm('Supprimer cette page ?')) return;
    const res = await fetch(`/api/admin/pages/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setPages(p => p.filter(x => x.id !== id));
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{pages.length} page{pages.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 bg-purple-700 text-white rounded-lg text-sm font-medium hover:bg-purple-800 transition-colors">
          {showAdd ? 'Annuler' : '+ Nouvelle page'}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={create} className="bg-white rounded-xl border border-purple-100 p-5 space-y-4">
          <div className="text-sm font-semibold text-gray-700 mb-2">Nouvelle page CMS</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Titre *</label>
              <input value={addForm.title}
                onChange={e => setAddForm(f => ({ ...f, title: e.target.value, slug: slugify(e.target.value) }))}
                placeholder="À propos" required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Slug *</label>
              <input value={addForm.slug}
                onChange={e => setAddForm(f => ({ ...f, slug: slugify(e.target.value) }))}
                placeholder="a-propos" required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-300" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Contenu</label>
            <textarea value={addForm.content} rows={6}
              onChange={e => setAddForm(f => ({ ...f, content: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Meta description</label>
              <input value={addForm.metaDesc}
                onChange={e => setAddForm(f => ({ ...f, metaDesc: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ordre</label>
              <input type="number" value={addForm.sortOrder}
                onChange={e => setAddForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="add_published" checked={addForm.published}
              onChange={e => setAddForm(f => ({ ...f, published: e.target.checked }))}
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-300" />
            <label htmlFor="add_published" className="text-sm text-gray-700">Publiée</label>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving || !addForm.title.trim()}
              className="px-5 py-2 bg-purple-700 text-white rounded-lg text-sm font-medium hover:bg-purple-800 disabled:opacity-50">
              Créer la page
            </button>
            <button type="button" onClick={() => setShowAdd(false)}
              className="px-5 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {pages.length === 0 && (
          <div className="px-4 py-10 text-center text-gray-400 text-sm">Aucune page CMS</div>
        )}
        <div className="divide-y divide-gray-50">
          {pages.map(p => (
            <div key={p.id}>
              {editId === p.id ? (
                <div className="p-5 space-y-4 bg-purple-50/30">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Titre</label>
                      <input value={editForm.title}
                        onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                        className="w-full px-3 py-2 border border-purple-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Slug</label>
                      <input value={editForm.slug}
                        onChange={e => setEditForm(f => ({ ...f, slug: slugify(e.target.value) }))}
                        className="w-full px-3 py-2 border border-purple-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-300" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Contenu</label>
                    <textarea value={editForm.content} rows={6}
                      onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))}
                      className="w-full px-3 py-2 border border-purple-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Meta description</label>
                      <input value={editForm.metaDesc}
                        onChange={e => setEditForm(f => ({ ...f, metaDesc: e.target.value }))}
                        className="w-full px-3 py-2 border border-purple-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Ordre</label>
                      <input type="number" value={editForm.sortOrder}
                        onChange={e => setEditForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-purple-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id={`edit_pub_${p.id}`} checked={editForm.published}
                      onChange={e => setEditForm(f => ({ ...f, published: e.target.checked }))}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-300" />
                    <label htmlFor={`edit_pub_${p.id}`} className="text-sm text-gray-700">Publiée</label>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => saveEdit(p.id)} disabled={saving}
                      className="px-4 py-2 bg-purple-700 text-white rounded-lg text-sm font-medium hover:bg-purple-800 disabled:opacity-50">
                      Enregistrer
                    </button>
                    <button onClick={() => setEditId(null)}
                      className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{p.title}</div>
                    <div className="text-xs text-gray-400 font-mono">/{p.slug}</div>
                  </div>
                  <button onClick={() => togglePublished(p)}
                    className={`text-xs px-2 py-0.5 rounded-full ${p.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.published ? 'Publiée' : 'Brouillon'}
                  </button>
                  <button onClick={() => startEdit(p)} className="text-xs text-purple-700 hover:underline">Modifier</button>
                  <button onClick={() => remove(p.id)} className="text-xs text-red-500 hover:underline">Supprimer</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
