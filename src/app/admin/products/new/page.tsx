import { db } from '@/lib/db';
import { categories, markingTechniques } from '@/lib/schema';
import { asc, eq } from 'drizzle-orm';
import ProductForm from '../ProductForm';

export const metadata = { title: 'Ajouter un produit — Admin' };

export default async function NewProductPage() {
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

  return <ProductForm categories={cats} techniques={techs} />;
}
