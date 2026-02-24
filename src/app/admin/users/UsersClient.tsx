'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type UserRow = {
  id: number;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  role: string | null;
  active: boolean | null;
  createdAt: string | null;
};

export default function UsersClient({ initialUsers }: { initialUsers: UserRow[] }) {
  const router   = useRouter();
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [saving, setSaving] = useState<number | null>(null);

  async function toggleActive(u: UserRow) {
    setSaving(u.id);
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
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
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: newRole } : x));
    }
    setSaving(null);
  }

  async function deleteUser(u: UserRow) {
    if (!confirm(`Supprimer le compte de ${u.name} (${u.email}) ? Cette action est irréversible.`)) return;
    setSaving(u.id);
    const res = await fetch(`/api/admin/users/${u.id}`, { method: 'DELETE' });
    if (res.ok) {
      setUsers(prev => prev.filter(x => x.id !== u.id));
      router.refresh();
    }
    setSaving(null);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
          <tr>
            <th className="px-4 py-3 text-left">Nom / Email</th>
            <th className="px-4 py-3 text-left">Société</th>
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
            <tr key={u.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <div className="font-medium text-gray-900">{u.name}</div>
                <div className="text-xs text-gray-400">{u.email}</div>
              </td>
              <td className="px-4 py-3 text-gray-500 text-xs">{u.company ?? '—'}</td>
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => toggleRole(u)}
                  disabled={saving === u.id}
                  className={`text-xs px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80 transition-opacity ${
                    u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {u.role ?? 'client'}
                </button>
              </td>
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => toggleActive(u)}
                  disabled={saving === u.id}
                  className={`inline-block w-8 h-4 rounded-full transition-colors ${u.active ? 'bg-green-400' : 'bg-gray-300'}`}
                  title={u.active ? 'Désactiver' : 'Activer'}
                />
              </td>
              <td className="px-4 py-3 text-xs text-gray-400">
                {u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : '—'}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => deleteUser(u)}
                  disabled={saving === u.id}
                  className="text-xs text-red-500 hover:underline disabled:opacity-40"
                >
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
