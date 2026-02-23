'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function Form() {
  const params = useSearchParams();
  const [form, setForm]   = useState({ name: '', email: '', company: '', phone: '', subject: '', message: '', productRef: params.get('ref') ?? '' });
  const [status, setStatus] = useState<'idle'|'loading'|'ok'|'error'>('idle');

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setStatus(res.ok ? 'ok' : 'error');
  }

  if (status === 'ok') return (
    <div className="text-center py-12">
      <div className="text-5xl mb-4">✅</div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Message envoyé !</h2>
      <p className="text-gray-500">Nous vous répondrons dans les 24h.</p>
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-4">
      {status === 'error' && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">Une erreur est survenue. Réessayez.</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom <span className="text-red-500">*</span></label>
          <input value={form.name} onChange={e => set('name', e.target.value)} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Société</label>
          <input value={form.company} onChange={e => set('company', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
          <input value={form.phone} onChange={e => set('phone', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Sujet</label>
        <input value={form.subject} onChange={e => set('subject', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
      </div>

      {form.productRef && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Référence produit</label>
          <input value={form.productRef} onChange={e => set('productRef', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-mono" />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Message <span className="text-red-500">*</span></label>
        <textarea value={form.message} onChange={e => set('message', e.target.value)} required rows={5}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none" />
      </div>

      <button type="submit" disabled={status === 'loading'}
        className="w-full py-3 bg-purple-700 text-white rounded-xl font-semibold hover:bg-purple-800 transition-colors disabled:opacity-60">
        {status === 'loading' ? 'Envoi…' : 'Envoyer le message'}
      </button>
    </form>
  );
}

export default function ContactForm() {
  return <Suspense><Form /></Suspense>;
}
