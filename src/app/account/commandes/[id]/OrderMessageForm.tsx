'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OrderMessageForm({ orderId }: { orderId: number }) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    const res = await fetch(`/api/account/orders/${orderId}/exchanges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: message.trim() }),
    });
    if (res.ok) {
      setMessage('');
      router.refresh();
    }
    setSending(false);
  }

  return (
    <form onSubmit={send} className="space-y-2">
      <textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        rows={3}
        placeholder="Votre message à l'équipe…"
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
      />
      <button
        type="submit"
        disabled={sending || !message.trim()}
        className="px-6 py-2 bg-purple-700 text-white rounded-lg text-sm font-medium hover:bg-purple-800 disabled:opacity-60 transition-colors"
      >
        {sending ? 'Envoi…' : 'Envoyer'}
      </button>
    </form>
  );
}
