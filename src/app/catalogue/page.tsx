import { db } from '@/lib/db';
import { products, categories, documents } from '@/lib/schema';
import { eq, like, and, SQL } from 'drizzle-orm';
import ProductCard from '@/components/ui/ProductCard';
import Pagination from '@/components/ui/Pagination';
import type { Product } from '@/lib/schema';

export const dynamic = 'force-dynamic';
const PER_PAGE = 24;

type DocRow = { id: number; title: string; description: string | null; url: string | null; filename: string | null };

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; page?: string }>;
}) {
  const sp   = await searchParams;
  const q    = sp.q   ?? '';
  const cat  = sp.cat ?? '';
  const page = Math.max(1, parseInt(sp.page ?? '1'));

  const showDocs = cat === 'documents';

  let items: Product[]  = [];
  let total = 0;
  let cats:  { id: number; name: string }[] = [];
  let docs:  DocRow[] = [];

  try {
    cats = await db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(categories.sortOrder);

    if (showDocs) {
      docs = await db
        .select({ id: documents.id, title: documents.title, description: documents.description, url: documents.url, filename: documents.filename })
        .from(documents)
        .where(eq(documents.active, true));
    } else {
      const filters: SQL[] = [eq(products.active, true)];
      if (cat) filters.push(eq(products.category, cat));
      if (q)   filters.push(like(products.name, `%${q}%`));
      const where = and(...filters);

      const all = await db.select({ id: products.id }).from(products).where(where);
      total = all.length;
      items = await db.select().from(products).where(where).limit(PER_PAGE).offset((page - 1) * PER_PAGE);
    }
  } catch {
    // DB not ready
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 mb-8">
        <h1 className="text-3xl font-bold text-purple-800 mb-2">Catalogue</h1>
        <p className="text-gray-600">
          {showDocs
            ? `${docs.length} document${docs.length !== 1 ? 's' : ''} disponible${docs.length !== 1 ? 's' : ''}`
            : total > 0 ? `Découvrez nos ${total} produits personnalisables` : 'Découvrez nos produits personnalisables'}
        </p>
      </div>

      <form method="GET" className="flex flex-wrap gap-3 mb-8">
        {!showDocs && (
          <input name="q" defaultValue={q} placeholder="Rechercher un produit…"
            className="flex-1 min-w-48 px-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
        )}
        <select name="cat" defaultValue={cat} className="px-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
          <option value="">Toutes catégories</option>
          {cats.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          <option value="documents">📄 Documents</option>
        </select>
        <button type="submit" className="px-6 py-2 bg-purple-700 text-white rounded-lg text-sm font-medium hover:bg-purple-800 transition-colors">
          Filtrer
        </button>
        {(q || cat) && (
          <a href="/catalogue" className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50">Réinitialiser</a>
        )}
      </form>

      {showDocs ? (
        docs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {docs.map(doc => (
              <div key={doc.id} className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow">
                <div className="text-2xl">📄</div>
                <div>
                  <div className="font-medium text-gray-900">{doc.title}</div>
                  {doc.description && <p className="text-sm text-gray-500 mt-1">{doc.description}</p>}
                </div>
                {(doc.url || doc.filename) && (
                  <a
                    href={doc.url ?? `/documents/${doc.filename}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto inline-flex items-center gap-1.5 text-sm text-purple-700 font-medium hover:underline"
                  >
                    Télécharger →
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 text-gray-400">
            <div className="text-5xl mb-4">📄</div>
            <p className="text-lg">Aucun document disponible</p>
          </div>
        )
      ) : items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <div className="text-center py-24 text-gray-400">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-lg">Aucun produit trouvé</p>
        </div>
      )}

      {!showDocs && <Pagination page={page} total={total} perPage={PER_PAGE} />}
    </div>
  );
}
