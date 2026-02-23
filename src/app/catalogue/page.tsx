import { db } from '@/lib/db';
import { products, categories } from '@/lib/schema';
import { eq, like, and, SQL } from 'drizzle-orm';
import ProductCard from '@/components/ui/ProductCard';
import Pagination from '@/components/ui/Pagination';

export const dynamic = 'force-dynamic';
const PER_PAGE = 24;

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q    = sp.q   ?? '';
  const cat  = sp.cat ?? '';
  const page = Math.max(1, parseInt(sp.page ?? '1'));

  const filters: SQL[] = [eq(products.active, true)];
  if (cat)  filters.push(eq(products.category, cat));
  if (q)    filters.push(like(products.name, `%${q}%`));

  const where = and(...filters);

  const all = await db.select({ id: products.id }).from(products).where(where);
  const total = all.length;

  const items = await db.select().from(products)
    .where(where)
    .limit(PER_PAGE)
    .offset((page - 1) * PER_PAGE);

  const cats = await db.select().from(categories).orderBy(categories.sortOrder);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Page hero */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 mb-8">
        <h1 className="text-3xl font-bold text-purple-800 mb-2">Catalogue</h1>
        <p className="text-gray-600">Découvrez nos {total} produits personnalisables</p>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3 mb-8">
        <input
          name="q" defaultValue={q}
          placeholder="Rechercher un produit…"
          className="flex-1 min-w-48 px-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
        />
        <select name="cat" defaultValue={cat} className="px-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
          <option value="">Toutes catégories</option>
          {cats.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <button type="submit" className="px-6 py-2 bg-purple-700 text-white rounded-lg text-sm font-medium hover:bg-purple-800 transition-colors">
          Filtrer
        </button>
        {(q || cat) && (
          <a href="/catalogue" className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50">
            Réinitialiser
          </a>
        )}
      </form>

      {/* Grid */}
      {items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <div className="text-center py-24 text-gray-400">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-lg">Aucun produit trouvé</p>
        </div>
      )}

      <Pagination page={page} total={total} perPage={PER_PAGE} />
    </div>
  );
}
