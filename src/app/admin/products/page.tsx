import { db } from '@/lib/db';
import { products } from '@/lib/schema';
import { eq, like, and, SQL } from 'drizzle-orm';
import Link from 'next/link';
import Image from 'next/image';
import { imagesArray } from '@/lib/utils';

export const metadata = { title: 'Produits — Admin' };

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; active?: string }> }) {
  const sp = await searchParams;
  const filters: SQL[] = [];
  if (sp.q)      filters.push(like(products.name, `%${sp.q}%`));
  if (sp.active) filters.push(eq(products.active, true));
  const where = filters.length ? and(...filters) : undefined;

  let items: (typeof products.$inferSelect)[] = [];
  try {
    items = await db.select().from(products).where(where).orderBy(products.id).limit(200);
  } catch {}

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Produits ({items.length})</h1>
        <Link href="/admin/products/new" className="px-4 py-2 bg-purple-700 text-white rounded-lg text-sm font-medium hover:bg-purple-800 transition-colors">
          + Ajouter
        </Link>
      </div>

      <form method="GET" className="flex gap-3 mb-6">
        <input name="q" defaultValue={sp.q} placeholder="Rechercher…"
          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
        <button type="submit" className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm">Filtrer</button>
      </form>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">Image</th>
              <th className="px-4 py-3 text-left">Réf / Nom</th>
              <th className="px-4 py-3 text-left">Catégorie</th>
              <th className="px-4 py-3 text-left">Source</th>
              <th className="px-4 py-3 text-center">Actif</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map(p => {
              const img = imagesArray(p)[0];
              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                      {img ? <Image src={img} alt="" width={40} height={40} className="object-contain" /> : <span>🎁</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{p.name}</div>
                    <div className="text-xs text-gray-400 font-mono">{p.ref}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p.category ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.source === 'midocean' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                      {p.source}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block w-2 h-2 rounded-full ${p.active ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/products/${p.id}`} className="text-xs text-purple-700 hover:underline">Modifier</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
