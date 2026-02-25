import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { products, markingTechniques } from '@/lib/schema';
import type { Variant, MarkingTechnique } from '@/lib/schema';
import { eq, asc } from 'drizzle-orm';
import { imagesArray, priceWithMargin } from '@/lib/utils';
import { auth } from '@/lib/auth';
import Link from 'next/link';
import ProductClientSection from './ProductClientSection';

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

  const session  = await auth();
  const images   = imagesArray(product);
  const price    = priceWithMargin(product.price);
  const variants = (product.variants ?? []) as Variant[];
  const sizes    = (product.sizes    ?? []) as string[];
  const techs    = product.printTechniques ? product.printTechniques.split(',').map(t => t.trim()).filter(Boolean) : [];
  const meta     = (product.meta     ?? {}) as Record<string, string | number | null>;
  const pkg      = (product.packaging ?? {}) as Record<string, string | number | null>;

  // Load all active marking techniques (always available for any product)
  let productMarkingTechniques: Pick<MarkingTechnique, 'id' | 'name' | 'unitPrice' | 'setupFee'>[] = [];
  try {
    productMarkingTechniques = await db.select({
      id:        markingTechniques.id,
      name:      markingTechniques.name,
      unitPrice: markingTechniques.unitPrice,
      setupFee:  markingTechniques.setupFee,
    }).from(markingTechniques)
      .where(eq(markingTechniques.active, true))
      .orderBy(asc(markingTechniques.sortOrder), asc(markingTechniques.name));
  } catch { /* marking_techniques table may not exist yet */ }
  const productMarkingPositions = (product.markingPositions ?? []) as string[];

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

      <ProductClientSection
        product={{
          id:          product.id,
          ref:         product.ref,
          name:        product.name,
          description: product.description,
          category:    product.category,
          printable:   product.printable,
          moq:         product.moq,
          material:    product.material,
          dimensions:  product.dimensions,
          weight:      product.weight ? String(product.weight) : null,
        }}
        price={price}
        variants={variants}
        sizes={sizes}
        allImages={images}
        techs={techs}
        meta={meta}
        pkg={pkg}
        markingTechniques={productMarkingTechniques}
        markingPositions={productMarkingPositions}
        isLoggedIn={!!session}
      />
    </div>
  );
}
