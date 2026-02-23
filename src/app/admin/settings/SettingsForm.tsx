'use client';

import { useState } from 'react';

export default function SettingsForm({ settings }: { settings: Record<string, string> }) {
  const [form, setForm] = useState({
    price_margin:       settings.price_margin       ?? '20',
    midocean_api_key:   settings.midocean_api_key   ?? '',
    midocean_lang:      settings.midocean_lang      ?? 'fr',
    midocean_base_url:  settings.midocean_base_url  ?? 'https://api.midocean.com',
  });
  const [status, setStatus] = useState<'idle'|'saving'|'ok'|'error'>('idle');

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    const res = await fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setStatus(res.ok ? 'ok' : 'error');
    setTimeout(() => setStatus('idle'), 2000);
  }

  return (
    <form onSubmit={save} className="bg-white rounded-xl border border-gray-100 p-6 max-w-xl space-y-5">
      {status === 'ok'    && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">Paramètres sauvegardés ✓</div>}
      {status === 'error' && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">Erreur lors de la sauvegarde</div>}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Marge prix (%)</label>
        <input type="number" min="0" max="200" value={form.price_margin} onChange={e => setForm(f => ({ ...f, price_margin: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
        <p className="text-xs text-gray-400 mt-1">Appliquée sur tous les prix afichés aux clients</p>
      </div>

      <hr className="border-gray-100" />
      <div className="text-sm font-semibold text-gray-700">Intégration Midocean</div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Clé API</label>
        <input type="password" value={form.midocean_api_key} onChange={e => setForm(f => ({ ...f, midocean_api_key: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Langue</label>
          <select value={form.midocean_lang} onChange={e => setForm(f => ({ ...f, midocean_lang: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
            {['fr','en','de','es','it','nl','pl'].map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL base</label>
          <input value={form.midocean_base_url} onChange={e => setForm(f => ({ ...f, midocean_base_url: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
        </div>
      </div>

      <button type="submit" disabled={status === 'saving'}
        className="px-6 py-2.5 bg-purple-700 text-white rounded-lg text-sm font-medium hover:bg-purple-800 transition-colors disabled:opacity-60">
        {status === 'saving' ? 'Enregistrement…' : 'Sauvegarder'}
      </button>
    </form>
  );
}
