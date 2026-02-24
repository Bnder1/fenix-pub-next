import { db } from '@/lib/db';
import { categories } from '@/lib/schema';
import { asc } from 'drizzle-orm';
import CategoriesClient from './CategoriesClient';

export const dynamic  = 'force-dynamic';
export const metadata = { title: 'Catégories — Admin' };

export default async function CategoriesPage() {
  let cats: (typeof categories.$inferSelect)[] = [];
  try { cats = await db.select().from(categories).orderBy(asc(categories.sortOrder)); } catch {}
  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Catégories ({cats.length})</h1>
      <CategoriesClient initialCats={cats} />
    </div>
  );
}
