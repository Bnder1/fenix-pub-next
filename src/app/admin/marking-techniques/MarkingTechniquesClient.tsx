'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Technique = {
  id:          number;
  name:        string;
  description: string | null;
  unitPrice:   string | null;
  setupFee:    string | null;
  active:      boolean | null;
  sortOrder:   number | null;
};

type FormState = { name: string; description: string; unitPrice: string; setupFee: string; active: boolean; sortOrder: string };
const blank: FormState = { name: '', description: '', unitPrice: '0', setupFee: '0', active: true, sortOrder: '0' };

export default function MarkingTechniquesClient({ initialTechniques }: { initialTechniques: Technique[] }) {
  const router = useRouter();
  const [techniques, setTechniques] = useState<Technique[]>(initialTechniques);
  const [form,       setForm]       = useState<FormState>(blank);
  const [editId,     setEditId]     = useState<number | null>(null);
  const [editForm,   setEditForm]   = useState<FormState>(blank);
  const [saving,     setSaving]     = useState(false);

  function setF(k: keyof FormState, v: unknown) { setForm(f => ({ ...f, [k]: v })); }
  function setEF(k: keyof FormState, v: unknown) { setEditForm(f => ({ ...f, [k]: v })); }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    const res = await fetch('/api/admin/marking-techniques', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:        form.name.trim(),
        description: form.description || null,
        unitPrice:   form.unitPrice,
        setupFee:    form.setupFee,
        active:      form.active,
        sortOrder:   parseInt(form.sortOrder) || 0,
      }),
    });
    if (res.ok) { setForm(blank); router.refresh(); }
    setSaving(false);
  }

  function startEdit(t: Technique) {
    setEditId(t.id);
    setEditForm({
      name:        t.name,
      description: t.description ?? '',
      unitPrice:   t.unitPrice   ?? '0',
      setupFee:    t.setupFee    ?? '0',
      active:      t.active      ?? true,
      sortOrder:   String(t.sortOrder ?? 0),
    });
  }

  async function update(id: number) {
    setSaving(true);
    await fetch(`/api/admin/marking-techniques/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:        editForm.name.trim(),
        description: editForm.description || null,
        unitPrice:   editForm.unitPrice,
        setupFee:    editForm.setupFee,
        active:      editForm.active,
        sortOrder:   parseInt(editForm.sortOrder) || 0,
      }),
    });
    setEditId(null); setSaving(false); router.refresh();
  }

  async function remove(id: number) {
    if (!confirm('Supprimer cette technique de marquage ?')) return;
    await fetch(`/api/admin/marking-techniques/${id}`, { method: 'DELETE' });
    setTechniques(prev => prev.filter(t => t.id !== id));
    router.refresh();
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300';

  return (
    <div className="max-w-2xl space-y-4">
      {/* Add form */}
      <form onSubmit={create} className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Nouvelle technique</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Nom *</label>
            <input value={form.name} onChange={e => setF('name', e.target.value)} placeholder="Ex : Gravure laser" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Prix / unité (€)</label>
            <input type="number" step="0.01" value={form.unitPrice} onChange={e => setF('unitPrice', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Frais de calage (€)</label>
            <input type="number" step="0.01" value={form.setupFee} onChange={e => setF('setupFee', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ordre</label>
            <input type="number" value={form.sortOrder} onChange={e => setF('sortOrder', e.target.value)} className={inputCls} />
          </div>
          <div className="flex items-center gap-2 pt-4">
            <input type="checkbox" id="newActive" checked={form.active} onChange={e => setF('active', e.target.checked)} className="w-4 h-4 accent-purple-600" />
            <label htmlFor="newActive" className="text-sm text-gray-700">Actif</label>
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Description</label>
          <input value={form.description} onChange={e => setF('description', e.target.value)} className={inputCls} />
        </div>
        <button type="submit" disabled={saving || !form.name.trim()}
          className="px-4 py-2 bg-purple-700 text-white rounded-lg text-sm font-medium hover:bg-purple-800 disabled:opacity-50">
          Ajouter
        </button>
      </form>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">Nom</th>
              <th className="px-4 py-3 text-right">€/u</th>
              <th className="px-4 py-3 text-right">Calage</th>
              <th className="px-4 py-3 text-center">Actif</th>
              <th className="px-4 py-3 text-center">Ordre</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {techniques.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Aucune technique</td></tr>
            )}
            {techniques.map(t => (
              <tr key={t.id}>
                {editId === t.id ? (
                  <td colSpan={6} className="px-4 py-3">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <input value={editForm.name} onChange={e => setEF('name', e.target.value)} autoFocus placeholder="Nom" className={inputCls} />
                      <input value={editForm.description} onChange={e => setEF('description', e.target.value)} placeholder="Description" className={inputCls} />
                      <input type="number" step="0.01" value={editForm.unitPrice} onChange={e => setEF('unitPrice', e.target.value)} placeholder="€/u" className={inputCls} />
                      <input type="number" step="0.01" value={editForm.setupFee} onChange={e => setEF('setupFee', e.target.value)} placeholder="Calage" className={inputCls} />
                      <input type="number" value={editForm.sortOrder} onChange={e => setEF('sortOrder', e.target.value)} placeholder="Ordre" className={inputCls} />
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={editForm.active} onChange={e => setEF('active', e.target.checked)} className="w-4 h-4 accent-purple-600" />
                        <span className="text-sm text-gray-700">Actif</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => update(t.id)} disabled={saving} className="text-xs px-3 py-1.5 bg-purple-700 text-white rounded-lg hover:bg-purple-800">OK</button>
                      <button onClick={() => setEditId(null)} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">Annuler</button>
                    </div>
                  </td>
                ) : (
                  <>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{t.name}</div>
                      {t.description && <div className="text-xs text-gray-400">{t.description}</div>}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{parseFloat(t.unitPrice ?? '0').toFixed(2)} €</td>
                    <td className="px-4 py-3 text-right text-gray-700">{parseFloat(t.setupFee  ?? '0').toFixed(2)} €</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${t.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {t.active ? 'Oui' : 'Non'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">{t.sortOrder ?? 0}</td>
                    <td className="px-4 py-3 text-right flex gap-3 justify-end">
                      <button onClick={() => startEdit(t)} className="text-xs text-purple-700 hover:underline">Modifier</button>
                      <button onClick={() => remove(t.id)} className="text-xs text-red-500 hover:underline">Supprimer</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
