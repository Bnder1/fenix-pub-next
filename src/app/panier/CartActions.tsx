'use client';

import { useRouter } from 'next/navigation';

export default function CartActions({ itemId, qty, moq }: { itemId: number; qty: number; moq: number }) {
  const router = useRouter();

  async function update(newQty: number) {
    await fetch(`/api/cart/${itemId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ qty: newQty }) });
    router.refresh();
  }

  async function remove() {
    await fetch(`/api/cart/${itemId}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <button onClick={() => update(Math.max(moq, qty - 1))} className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">−</button>
      <span className="w-8 text-center text-sm font-medium">{qty}</span>
      <button onClick={() => update(qty + 1)} className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">+</button>
      <button onClick={remove} className="ml-2 text-red-400 hover:text-red-600 text-xs">✕</button>
    </div>
  );
}
