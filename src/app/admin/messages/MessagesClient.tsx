'use client';

import { useState } from 'react';

type Message = {
  id: number;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  subject: string | null;
  message: string;
  productRef: string | null;
  status: string | null;
  notes: string | null;
  createdAt: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  nouveau:  'Nouveau',
  en_cours: 'En cours',
  traité:   'Traité',
};

const STATUS_COLORS: Record<string, string> = {
  nouveau:  'bg-orange-100 text-orange-700',
  en_cours: 'bg-blue-100 text-blue-700',
  traité:   'bg-green-100 text-green-700',
};

export default function MessagesClient({ initialMessages }: { initialMessages: Message[] }) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [selected, setSelected] = useState<Message | null>(null);
  const [notes, setNotes]       = useState('');
  const [saving, setSaving]     = useState(false);

  function openMessage(m: Message) {
    setSelected(m);
    setNotes(m.notes ?? '');
  }

  async function updateStatus(id: number, status: string) {
    setSaving(true);
    const res = await fetch(`/api/admin/messages/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes: notes }),
    });
    if (res.ok) {
      const updated = await res.json();
      setMessages(prev => prev.map(m => m.id === id ? { ...m, status: updated.status, notes: updated.notes } : m));
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: updated.status, notes: updated.notes } : null);
    }
    setSaving(false);
  }

  async function saveNotes(id: number) {
    setSaving(true);
    const res = await fetch(`/api/admin/messages/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
    if (res.ok) {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, notes } : m));
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, notes } : null);
    }
    setSaving(false);
  }

  return (
    <div className="flex gap-6">
      {/* Liste */}
      <div className="flex-1 bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">Nom / Email</th>
              <th className="px-4 py-3 text-left">Sujet</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-center">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {messages.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Aucun message</td></tr>
            )}
            {messages.map(m => (
              <tr
                key={m.id}
                onClick={() => openMessage(m)}
                className={`hover:bg-gray-50 cursor-pointer transition-colors ${selected?.id === m.id ? 'bg-purple-50' : ''} ${m.status === 'nouveau' ? 'font-medium' : ''}`}
              >
                <td className="px-4 py-3">
                  <div className="text-gray-900">{m.name}</div>
                  <div className="text-xs text-gray-400">{m.email}</div>
                </td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                  {m.subject ?? m.message?.slice(0, 60)}
                </td>
                <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                  {m.createdAt ? new Date(m.createdAt).toLocaleDateString('fr-FR') : '—'}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[m.status ?? ''] ?? 'bg-gray-100 text-gray-500'}`}>
                    {STATUS_LABELS[m.status ?? ''] ?? m.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Détail */}
      {selected && (
        <div className="w-80 shrink-0 bg-white rounded-xl border border-gray-100 p-5 space-y-4 self-start sticky top-0">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm">Détail</h3>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
          </div>

          <div className="space-y-1">
            <div className="text-sm font-medium text-gray-900">{selected.name}</div>
            <div className="text-xs text-gray-500">{selected.email}</div>
            {selected.company && <div className="text-xs text-gray-400">{selected.company}</div>}
            {selected.phone   && <div className="text-xs text-gray-400">{selected.phone}</div>}
          </div>

          {selected.subject && (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-0.5">Sujet</div>
              <div className="text-sm text-gray-800">{selected.subject}</div>
            </div>
          )}

          {selected.productRef && (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-0.5">Réf produit</div>
              <div className="text-sm font-mono text-purple-700">{selected.productRef}</div>
            </div>
          )}

          <div>
            <div className="text-xs font-medium text-gray-500 mb-0.5">Message</div>
            <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{selected.message}</div>
          </div>

          {/* Notes internes */}
          <div>
            <div className="text-xs font-medium text-gray-500 mb-0.5">Notes internes</div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Notes privées…"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
            />
            <button
              onClick={() => saveNotes(selected.id)}
              disabled={saving}
              className="mt-1 text-xs text-purple-700 hover:underline disabled:opacity-40"
            >
              Enregistrer les notes
            </button>
          </div>

          {/* Actions statut */}
          <div>
            <div className="text-xs font-medium text-gray-500 mb-2">Changer le statut</div>
            <div className="flex flex-wrap gap-2">
              {(['nouveau', 'en_cours', 'traité'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => updateStatus(selected.id, s)}
                  disabled={saving || selected.status === s}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-40 ${
                    selected.status === s
                      ? 'bg-purple-700 text-white border-purple-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
