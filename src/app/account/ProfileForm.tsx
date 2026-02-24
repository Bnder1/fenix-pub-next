'use client';

import { useState } from 'react';

type Props = {
  name: string;
  company: string;
  phone: string;
};

export default function ProfileForm({ name, company, phone }: Props) {
  const [open, setOpen]   = useState(false);
  const [form, setForm]   = useState({ name, company, phone, currentPassword: '', newPassword: '', confirmPassword: '' });
  const [status, setStatus] = useState<'idle' | 'saving' | 'ok' | 'error'>('idle');
  const [error, setError]   = useState('');

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.'); return;
    }
    if (form.newPassword && form.newPassword.length < 8) {
      setError('Mot de passe trop court (8 min).'); return;
    }
    setStatus('saving'); setError('');
    const body: Record<string, string> = { name: form.name, company: form.company, phone: form.phone };
    if (form.newPassword) { body.currentPassword = form.currentPassword; body.newPassword = form.newPassword; }

    const res = await fetch('/api/account', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setStatus('ok');
      setTimeout(() => { setStatus('idle'); setOpen(false); }, 1500);
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? 'Erreur lors de la sauvegarde.');
      setStatus('error');
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="w-full text-center px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
        Modifier le profil
      </button>
    );
  }

  return (
    <form onSubmit={save} className="mt-4 space-y-3 border-t border-gray-100 pt-4">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-xs">{error}</div>}
      {status === 'ok' && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-3 py-2 text-xs">Profil mis à jour ✓</div>}

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Nom</label>
        <input value={form.name} onChange={e => set('name', e.target.value)} required
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Société</label>
        <input value={form.company} onChange={e => set('company', e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Téléphone</label>
        <input value={form.phone} onChange={e => set('phone', e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
      </div>

      <div className="text-xs font-medium text-gray-500 pt-1">Changer le mot de passe (optionnel)</div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Mot de passe actuel</label>
        <input type="password" value={form.currentPassword} onChange={e => set('currentPassword', e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Nouveau mot de passe</label>
        <input type="password" value={form.newPassword} onChange={e => set('newPassword', e.target.value)} minLength={8}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Confirmer</label>
        <input type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
      </div>

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={status === 'saving'}
          className="flex-1 py-2 bg-purple-700 text-white rounded-lg text-sm font-medium hover:bg-purple-800 transition-colors disabled:opacity-60">
          {status === 'saving' ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button type="button" onClick={() => setOpen(false)}
          className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors">
          Annuler
        </button>
      </div>
    </form>
  );
}
