import { db } from '@/lib/db';
import { markingTechniques } from '@/lib/schema';
import { asc } from 'drizzle-orm';
import MarkingTechniquesClient from './MarkingTechniquesClient';

export const metadata = { title: 'Techniques de marquage — Admin' };

export default async function MarkingTechniquesPage() {
  let techniques: (typeof markingTechniques.$inferSelect)[] = [];
  try {
    techniques = await db.select().from(markingTechniques).orderBy(asc(markingTechniques.sortOrder));
  } catch {}

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">🖨️ Techniques de marquage</h1>
      <MarkingTechniquesClient initialTechniques={techniques} />
    </div>
  );
}
