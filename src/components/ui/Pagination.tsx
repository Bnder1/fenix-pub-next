'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function Pagination({ page, total, perPage }: { page: number; total: number; perPage: number }) {
  const router = useRouter();
  const params = useSearchParams();
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;

  function go(p: number) {
    const sp = new URLSearchParams(params.toString());
    sp.set('page', String(p));
    router.push('?' + sp.toString());
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      <button onClick={() => go(page - 1)} disabled={page <= 1} className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50">←</button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
        <button key={p} onClick={() => go(p)}
          className={`px-3 py-1.5 rounded-lg border text-sm ${p === page ? 'bg-purple-600 text-white border-purple-600' : 'hover:bg-gray-50'}`}>
          {p}
        </button>
      ))}
      <button onClick={() => go(page + 1)} disabled={page >= totalPages} className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50">→</button>
    </div>
  );
}
