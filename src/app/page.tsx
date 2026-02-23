import Link from 'next/link';
import { db } from '@/lib/db';
import { products } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import ProductCard from '@/components/ui/ProductCard';
import type { Product } from '@/lib/schema';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let featured: Product[] = [];
  try {
    featured = await db.select().from(products)
      .where(eq(products.active, true))
      .orderBy(desc(products.createdAt))
      .limit(8);
  } catch {
    // DB not ready yet — page still renders without products
  }

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-white via-purple-50 to-pink-50 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
            Objets publicitaires personnalisés
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
            Donnez de la <span className="text-purple-700">visibilité</span> à votre marque
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Des milliers de produits personnalisables — stylos, textiles, goodies, emballages —
            livrés partout en France avec votre logo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/catalogue" className="px-8 py-3 bg-purple-700 text-white rounded-xl font-semibold hover:bg-purple-800 transition-colors shadow-lg shadow-purple-200">
              Voir le catalogue
            </Link>
            <Link href="/contact" className="px-8 py-3 border-2 border-purple-700 text-purple-700 rounded-xl font-semibold hover:bg-purple-50 transition-colors">
              Demander un devis
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { icon: '🎨', label: 'Personnalisation', desc: 'Votre logo, vos couleurs' },
            { icon: '🚀', label: 'Livraison rapide', desc: 'Délais maîtrisés' },
            { icon: '💼', label: 'Grands comptes', desc: 'MOQ adaptés' },
            { icon: '🌱', label: 'Éco-responsable', desc: 'Produits durables' },
          ].map(f => (
            <div key={f.label} className="p-4">
              <div className="text-3xl mb-2">{f.icon}</div>
              <div className="font-semibold text-gray-900 text-sm">{f.label}</div>
              <div className="text-xs text-gray-500 mt-1">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Produits populaires</h2>
              <Link href="/catalogue" className="text-purple-700 text-sm font-medium hover:underline">Voir tout →</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {featured.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-purple-700 py-16 px-4 text-center text-white">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">Prêt à personnaliser vos objets ?</h2>
        <p className="text-purple-200 mb-8">Contactez-nous pour obtenir un devis gratuit sous 24h.</p>
        <Link href="/contact" className="px-8 py-3 bg-white text-purple-700 rounded-xl font-semibold hover:bg-purple-50 transition-colors">
          Obtenir un devis gratuit
        </Link>
      </section>
    </>
  );
}
