'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BatResponseButtons({ orderId }: { orderId: number }) {
  const router = useRouter();
  const [comment,  setComment]  = useState('');
  const [loading,  setLoading]  = useState<'approved' | 'refused' | null>(null);
  const [done,     setDone]     = useState(false);

  async function respond(action: 'approved' | 'refused') {
    setLoading(action);
    const res = await fetch(`/api/account/orders/${orderId}/bat-response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, comment: comment.trim() || undefined }),
    });
    if (res.ok) {
      setDone(true);
      router.refresh();
    }
    setLoading(null);
  }

  if (done) {
    return <p className="text-sm text-green-700 font-medium">Votre réponse a bien été enregistrée.</p>;
  }

  return (
    <div className="space-y-3">
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        rows={3}
        placeholder="Commentaire optionnel (modifications souhaitées…)"
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
      />
      <div className="flex gap-3">
        <button
          onClick={() => respond('approved')}
          disabled={!!loading}
          className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors disabled:opacity-60"
        >
          {loading === 'approved' ? '…' : '✅ Approuver le BAT'}
        </button>
        <button
          onClick={() => respond('refused')}
          disabled={!!loading}
          className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors disabled:opacity-60"
        >
          {loading === 'refused' ? '…' : '❌ Refuser le BAT'}
        </button>
      </div>
    </div>
  );
}
