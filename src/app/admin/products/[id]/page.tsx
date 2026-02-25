import { db } from '@/lib/db';
import { products, categories } from '@/lib/schema';
import { eq, asc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import ProductForm from '../ProductForm';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product] = await db.select().from(products).where(eq(products.id, parseInt(id))).limit(1);
  if (!product) notFound();

  let cats: string[] = [];
  try {
    const rows = await db.select({ name: categories.name }).from(categories).orderBy(asc(categories.sortOrder));
    cats = rows.map(r => r.name);
  } catch {}

  return <ProductForm product={product} categories={cats} />;
}
