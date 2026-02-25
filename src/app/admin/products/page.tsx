import { db } from '@/lib/db';
import { products, settings } from '@/lib/schema';
import { eq, like, and, SQL, count, asc } from 'drizzle-orm';
import Link from 'next/link';
import MidoceanSync from './MidoceanSync';
import ProductsClient from './ProductsClient';

export const metadata = { title: 'Produits — Admin' };

const PAGE_SIZE = 50;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; active?: string; page?: string }>;
}) {
  const sp   = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const q    = sp.q ?? '';

  const filters: SQL[] = [];
  if (q)        filters.push(like(products.name, `%${q}%`));
  if (sp.active) filters.push(eq(products.active, true));
  const where = filters.length ? and(...filters) : undefined;

  let items: (typeof products.$inferSelect)[] = [];
  let total = 0;
  let categories: string[] = [];

  try {
    const [countResult] = await db.select({ count: count() }).from(products).where(where);
    total = Number(countResult?.count ?? 0);

    items = await db
      .select()
      .from(products)
      .where(where)
      .orderBy(asc(products.id))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE);

    // Fetch distinct categories for bulk change select
    const catRows = await db
      .selectDistinct({ category: products.category })
      .from(products)
      .orderBy(asc(products.category));
    categories = catRows
      .map(r => r.category)
      .filter((c): c is string => c != null && c.trim() !== '');
  } catch {}

  let lastSync  = '';
  let lastCount = '';
  try {
    const rows = await db.select().from(settings).where(
      eq(settings.key, 'midocean_last_sync')
    );
    if (rows.length) lastSync = rows[0].value ?? '';
    const countRows = await db.select().from(settings).where(
      eq(settings.key, 'midocean_last_count')
    );
    if (countRows.length) lastCount = countRows[0].value ?? '';
  } catch {}

  return (
    <div>
      <MidoceanSync lastSync={lastSync} lastCount={lastCount} />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Produits ({total})</h1>
        <Link
          href="/admin/products/new"
          className="px-4 py-2 bg-purple-700 text-white rounded-lg text-sm font-medium hover:bg-purple-800 transition-colors"
        >
          + Ajouter
        </Link>
      </div>

      <form method="GET" className="flex gap-3 mb-6">
        <input
          name="q"
          defaultValue={q}
          placeholder="Rechercher…"
          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
        />
        <button type="submit" className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm">
          Filtrer
        </button>
      </form>

      <ProductsClient
        items={items.map(p => ({
          id:       p.id,
          ref:      p.ref,
          name:     p.name,
          category: p.category,
          source:   p.source,
          active:   p.active,
          image:    p.image,
          images:   p.images as string[] | null,
        }))}
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        categories={categories}
        searchQuery={q}
      />
    </div>
  );
}
