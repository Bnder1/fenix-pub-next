import { db } from '@/lib/db';
import { products, categories, markingTechniques } from '@/lib/schema';
import { eq, asc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import ProductForm from '../ProductForm';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product] = await db.select().from(products).where(eq(products.id, parseInt(id))).limit(1);
  if (!product) notFound();

  let cats: string[] = [];
  let techs: { id: number; name: string; unitPrice: string | null; setupFee: string | null }[] = [];
  try {
    const rows = await db.select({ name: categories.name }).from(categories).orderBy(asc(categories.sortOrder));
    cats = rows.map(r => r.name);
    techs = await db.select({
      id:        markingTechniques.id,
      name:      markingTechniques.name,
      unitPrice: markingTechniques.unitPrice,
      setupFee:  markingTechniques.setupFee,
    }).from(markingTechniques).where(eq(markingTechniques.active, true)).orderBy(asc(markingTechniques.sortOrder));
  } catch {}

  return <ProductForm product={product} categories={cats} techniques={techs} />;
}
