'use client';

import { useState } from 'react';

export default function SettingsForm({ settings }: { settings: Record<string, string> }) {
  const [form, setForm] = useState({
    price_margin:      settings.price_margin      ?? '20',
    midocean_api_key:  settings.midocean_api_key  ?? '',
    midocean_lang:     settings.midocean_lang     ?? 'fr',
    midocean_base_url: settings.midocean_base_url ?? 'https://api.midocean.com',
    smtp_host:         settings.smtp_host         ?? '',
    smtp_port:         settings.smtp_port         ?? '587',
    smtp_user:         settings.smtp_user         ?? '',
    smtp_pass:         settings.smtp_pass         ?? '',
    smtp_from:         settings.smtp_from         ?? '',
    smtp_to:           settings.smtp_to           ?? '',
    smtp_secure:       settings.smtp_secure       ?? 'false',
  });
  const [status, setStatus] = useState<'idle'|'saving'|'ok'|'error'>('idle');

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setStatus(res.ok ? 'ok' : 'error');
    setTimeout(() => setStatus('idle'), 2000);
  }

  return (
    <form onSubmit={save} className="bg-white rounded-xl border border-gray-100 p-6 max-w-xl space-y-5">
      {status === 'ok'    && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">Paramètres sauvegardés ✓</div>}
      {status === 'error' && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">Erreur lors de la sauvegarde</div>}

      {/* Pricing */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Marge prix (%)</label>
        <input type="number" min="0" max="200" value={form.price_margin}
          onChange={e => setForm(f => ({ ...f, price_margin: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
        <p className="text-xs text-gray-400 mt-1">Appliquée sur tous les prix affichés aux clients</p>
      </div>

      <hr className="border-gray-100" />
      <div className="text-sm font-semibold text-gray-700">Intégration Midocean</div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Clé API</label>
        <input type="password" value={form.midocean_api_key}
          onChange={e => setForm(f => ({ ...f, midocean_api_key: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Langue</label>
          <select value={form.midocean_lang}
            onChange={e => setForm(f => ({ ...f, midocean_lang: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
            {['fr','en','de','es','it','nl','pl'].map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL base</label>
          <input value={form.midocean_base_url}
            onChange={e => setForm(f => ({ ...f, midocean_base_url: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
        </div>
      </div>

      <hr className="border-gray-100" />
      <div className="text-sm font-semibold text-gray-700">Configuration SMTP (email)</div>
      <p className="text-xs text-gray-400 -mt-3">Utilisé pour les notifications email (formulaire de contact, etc.)</p>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Serveur SMTP</label>
          <input type="text" placeholder="smtp.gmail.com" value={form.smtp_host}
            onChange={e => setForm(f => ({ ...f, smtp_host: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
          <input type="number" placeholder="587" value={form.smtp_port}
            onChange={e => setForm(f => ({ ...f, smtp_port: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Utilisateur</label>
          <input type="email" placeholder="user@domain.com" value={form.smtp_user}
            onChange={e => setForm(f => ({ ...f, smtp_user: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
          <input type="password" placeholder="••••••••" value={form.smtp_pass}
            onChange={e => setForm(f => ({ ...f, smtp_pass: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Adresse expéditeur</label>
          <input type="email" placeholder="noreply@domain.com" value={form.smtp_from}
            onChange={e => setForm(f => ({ ...f, smtp_from: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email admin (destinataire)</label>
          <input type="email" placeholder="admin@domain.com" value={form.smtp_to}
            onChange={e => setForm(f => ({ ...f, smtp_to: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="smtp_secure" checked={form.smtp_secure === 'true'}
          onChange={e => setForm(f => ({ ...f, smtp_secure: e.target.checked ? 'true' : 'false' }))}
          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-300" />
        <label htmlFor="smtp_secure" className="text-sm text-gray-700">TLS (port 465)</label>
      </div>

      <button type="submit" disabled={status === 'saving'}
        className="px-6 py-2.5 bg-purple-700 text-white rounded-lg text-sm font-medium hover:bg-purple-800 transition-colors disabled:opacity-60">
        {status === 'saving' ? 'Enregistrement…' : 'Sauvegarder'}
      </button>
    </form>
  );
}
