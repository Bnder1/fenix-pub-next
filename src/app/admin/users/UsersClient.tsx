'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type UserRow = {
  id:        number;
  name:      string;
  email:     string;
  company:   string | null;
  phone:     string | null;
  role:      string | null;
  active:    boolean | null;
  createdAt: string | null;
};

type EditForm = { name: string; email: string; company: string; phone: string };

export default function UsersClient({ initialUsers }: { initialUsers: UserRow[] }) {
  const router = useRouter();
  const [users,  setUsers]  = useState<UserRow[]>(initialUsers);
  const [saving, setSaving] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ name: '', email: '', company: '', phone: '' });

  function startEdit(u: UserRow) {
    setEditId(u.id);
    setEditForm({ name: u.name, email: u.email, company: u.company ?? '', phone: u.phone ?? '' });
  }

  async function saveEdit(u: UserRow) {
    setSaving(u.id);
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name: editForm.name, email: editForm.email, company: editForm.company || null, phone: editForm.phone || null }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, ...updated } : x));
      setEditId(null);
    }
    setSaving(null);
  }

  async function toggleActive(u: UserRow) {
    setSaving(u.id);
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !u.active }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, active: updated.active } : x));
    }
    setSaving(null);
  }

  async function toggleRole(u: UserRow) {
    const newRole = u.role === 'admin' ? 'client' : 'admin';
    if (!confirm(`Passer ${u.name} en "${newRole}" ?`)) return;
    setSaving(u.id);
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: newRole } : x));
    setSaving(null);
  }

  async function deleteUser(u: UserRow) {
    if (!confirm(`Supprimer le compte de ${u.name} (${u.email}) ? Cette action est irréversible.`)) return;
    setSaving(u.id);
    const res = await fetch(`/api/admin/users/${u.id}`, { method: 'DELETE' });
    if (res.ok) { setUsers(prev => prev.filter(x => x.id !== u.id)); router.refresh(); }
    setSaving(null);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
          <tr>
            <th className="px-4 py-3 text-left">Nom / Email</th>
            <th className="px-4 py-3 text-left">Société / Téléphone</th>
            <th className="px-4 py-3 text-center">Rôle</th>
            <th className="px-4 py-3 text-center">Actif</th>
            <th className="px-4 py-3 text-left">Inscrit le</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {users.length === 0 && (
            <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Aucun utilisateur</td></tr>
          )}
          {users.map(u => (
            <>
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{u.name}</div>
                  <div className="text-xs text-gray-400">{u.email}</div>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  <div>{u.company ?? '—'}</div>
                  {u.phone && <div className="text-gray-400">{u.phone}</div>}
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggleRole(u)} disabled={saving === u.id}
                    className={`text-xs px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80 transition-opacity ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                    {u.role ?? 'client'}
                  </button>
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggleActive(u)} disabled={saving === u.id}
                    className={`inline-block w-8 h-4 rounded-full transition-colors ${u.active ? 'bg-green-400' : 'bg-gray-300'}`}
                    title={u.active ? 'Désactiver' : 'Activer'} />
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button onClick={() => editId === u.id ? setEditId(null) : startEdit(u)}
                      disabled={saving === u.id}
                      className="text-xs text-purple-700 hover:underline disabled:opacity-40">
                      {editId === u.id ? 'Annuler' : 'Modifier'}
                    </button>
                    <button onClick={() => deleteUser(u)} disabled={saving === u.id}
                      className="text-xs text-red-500 hover:underline disabled:opacity-40">
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>

              {/* Inline edit form */}
              {editId === u.id && (
                <tr key={`edit-${u.id}`} className="bg-purple-50/50">
                  <td colSpan={6} className="px-4 py-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Nom</label>
                        <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                          className="w-full px-2.5 py-1.5 border border-purple-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                        <input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                          className="w-full px-2.5 py-1.5 border border-purple-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Société</label>
                        <input value={editForm.company} onChange={e => setEditForm(f => ({ ...f, company: e.target.value }))}
                          className="w-full px-2.5 py-1.5 border border-purple-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Téléphone</label>
                        <input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                          className="w-full px-2.5 py-1.5 border border-purple-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                      </div>
                    </div>
                    <button onClick={() => saveEdit(u)} disabled={saving === u.id || !editForm.name.trim()}
                      className="mt-3 px-4 py-1.5 bg-purple-700 text-white rounded-lg text-xs font-medium hover:bg-purple-800 disabled:opacity-50">
                      {saving === u.id ? 'Enregistrement…' : 'Enregistrer'}
                    </button>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
