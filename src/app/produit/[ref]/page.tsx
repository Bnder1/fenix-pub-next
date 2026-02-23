import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { products } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { imagesArray, priceWithMargin, formatPrice } from '@/lib/utils';
import { auth } from '@/lib/auth';
import Link from 'next/link';
import Image from 'next/image';
import AddToCartButton from './AddToCartButton';

export async function generateMetadata({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const [p] = await db.select().from(products).where(eq(products.ref, ref)).limit(1);
  if (!p) return { title: 'Produit introuvable' };
  return { title: p.name, description: p.description ?? undefined };
}

export default async function ProductPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const [product] = await db.select().from(products).where(eq(products.ref, ref)).limit(1);
  if (!product || !product.active) notFound();

  const session = await auth();
  const images  = imagesArray(product);
  const price   = priceWithMargin(product.price);
  const variants = (product.variants ?? []) as Array<{ color: string; image?: string; sku?: string; pms_color?: string }>;
  const colors   = product.colors ? product.colors.split(',').map(c => c.trim()).filter(Boolean) : [];
  const techs    = product.printTechniques ? product.printTechniques.split(',').map(t => t.trim()).filter(Boolean) : [];
  const meta     = (product.meta ?? {}) as Record<string, string | number | null>;
  const pkg      = (product.packaging ?? {}) as Record<string, string | number | null>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-purple-700">Accueil</Link>
        <span>/</span>
        <Link href="/catalogue" className="hover:text-purple-700">Catalogue</Link>
        <span>/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Gallery */}
        <div>
          <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden flex items-center justify-center mb-3">
            {images[0] ? (
              <Image id="main-img" src={images[0]} alt={product.name} width={500} height={500} className="object-contain w-full h-full" />
            ) : (
              <span className="text-7xl">🎁</span>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {images.slice(0, 8).map((img, i) => (
                <div key={i} className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:border-purple-400 transition-colors">
                  <Image src={img} alt={`${product.name} ${i + 1}`} width={64} height={64} className="object-contain w-full h-full" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-1 rounded">Réf. {product.ref}</span>
            {product.category && <span className="text-xs bg-purple-50 text-purple-700 rounded-full px-2 py-1">{product.category}</span>}
            {product.printable && <span className="text-xs bg-green-50 text-green-700 rounded-full px-2 py-1">✓ Imprimable</span>}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

          {price > 0 && (
            <div className="mb-4">
              <span className="text-sm text-gray-500">Prix à partir de</span>
              <div className="text-3xl font-bold text-purple-700">{formatPrice(price)} €</div>
              {product.moq && <div className="text-sm text-gray-500">MOQ : {product.moq} unités</div>}
            </div>
          )}

          {product.description && (
            <p className="text-gray-600 leading-relaxed mb-6">{product.description}</p>
          )}

          {/* Stock badges */}
          {(meta.type_of_products || pkg.inner_carton_quantity) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {meta.type_of_products && (
                <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1">
                  ✓ {meta.type_of_products === 'stock' ? 'Disponible en stock' : String(meta.type_of_products)}
                </span>
              )}
              {pkg.inner_carton_quantity && (
                <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-3 py-1">
                  📦 Colisage : {String(pkg.inner_carton_quantity)} / {String(pkg.outer_carton_quantity ?? '—')} pcs
                </span>
              )}
              {meta.number_of_print_positions && (
                <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-3 py-1">
                  🖨 {String(meta.number_of_print_positions)} position(s) d&apos;impression
                </span>
              )}
            </div>
          )}

          {/* Colors */}
          {(variants.length > 0 || colors.length > 0) && (
            <div className="mb-4">
              <div className="text-sm font-semibold text-gray-700 mb-2">Couleurs disponibles</div>
              <div className="flex flex-wrap gap-2">
                {(variants.length > 0 ? variants : colors.map(c => ({ color: c }))).map((v, i) => (
                  <span key={i} className="text-xs border border-gray-200 rounded-full px-3 py-1 bg-white hover:border-purple-400 cursor-default">
                    {v.color}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Techniques */}
          {techs.length > 0 && (
            <div className="mb-4">
              <div className="text-sm font-semibold text-gray-700 mb-2">Techniques d&apos;impression</div>
              <div className="flex flex-wrap gap-2">
                {techs.map(t => (
                  <span key={t} className="text-xs bg-purple-50 text-purple-700 rounded-full px-3 py-1">🖨 {t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Specs */}
          {(product.material || product.dimensions || product.weight) && (
            <div className="border-t border-gray-100 pt-4 mb-6 grid grid-cols-2 gap-3">
              {product.material && (
                <div><div className="text-xs text-gray-400 uppercase tracking-wide">Matière</div><div className="text-sm font-medium">{product.material}</div></div>
              )}
              {product.dimensions && (
                <div><div className="text-xs text-gray-400 uppercase tracking-wide">Dimensions</div><div className="text-sm font-medium">{product.dimensions}</div></div>
              )}
              {product.weight && (
                <div><div className="text-xs text-gray-400 uppercase tracking-wide">Poids</div><div className="text-sm font-medium">{String(product.weight)} g</div></div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            {session ? (
              <AddToCartButton productId={product.id} moq={product.moq ?? 1} />
            ) : (
              <>
                <Link href={`/login?redirect=/produit/${product.ref}`} className="flex-1 text-center px-6 py-3 bg-purple-700 text-white rounded-xl font-semibold hover:bg-purple-800 transition-colors">
                  Se connecter pour commander
                </Link>
                <Link href={`/contact?ref=${product.ref}`} className="flex-1 text-center px-6 py-3 border-2 border-purple-700 text-purple-700 rounded-xl font-semibold hover:bg-purple-50 transition-colors">
                  Demander un devis
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
