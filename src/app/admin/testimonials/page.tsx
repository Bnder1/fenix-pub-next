import { db } from '@/lib/db';
import { testimonials } from '@/lib/schema';
import { asc } from 'drizzle-orm';
import TestimonialsClient from './TestimonialsClient';

export const dynamic  = 'force-dynamic';
export const metadata = { title: 'Témoignages — Admin' };

export default async function TestimonialsPage() {
  let list: (typeof testimonials.$inferSelect)[] = [];
  try { list = await db.select().from(testimonials).orderBy(asc(testimonials.sortOrder)); } catch {}
  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Témoignages ({list.length})</h1>
      <TestimonialsClient initialList={list} />
    </div>
  );
}
