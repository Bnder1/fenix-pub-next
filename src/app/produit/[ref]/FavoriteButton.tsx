'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function FavoriteButton({ productId }: { productId: number }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetch(`/api/favorites?productId=${productId}`)
      .then(r => r.json())
      .then(d => setFavorited(d.favorited ?? false))
      .catch(() => {});
  }, [productId, session]);

  async function toggle() {
    if (!session) { router.push('/login'); return; }
    setLoading(true);
    const res = await fetch('/api/favorites', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    });
    if (res.ok) {
      const d = await res.json();
      setFavorited(d.favorited);
    }
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={favorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 font-semibold text-sm transition-colors disabled:opacity-60 ${
        favorited
          ? 'bg-pink-50 border-pink-400 text-pink-600 hover:bg-pink-100'
          : 'border-gray-200 text-gray-500 hover:border-pink-300 hover:text-pink-500'
      }`}
    >
      <span className="text-lg">{favorited ? '❤️' : '🤍'}</span>
      {favorited ? 'Dans vos favoris' : 'Ajouter aux favoris'}
    </button>
  );
}
