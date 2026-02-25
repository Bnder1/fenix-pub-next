import { db } from '@/lib/db';
import { categories } from '@/lib/schema';
import { asc } from 'drizzle-orm';
import ProductForm from '../ProductForm';

export const metadata = { title: 'Ajouter un produit — Admin' };

export default async function NewProductPage() {
  let cats: string[] = [];
  try {
    const rows = await db.select({ name: categories.name }).from(categories).orderBy(asc(categories.sortOrder));
    cats = rows.map(r => r.name);
  } catch {}

  return <ProductForm categories={cats} />;
}
