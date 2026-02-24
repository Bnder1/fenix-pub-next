import { db } from '@/lib/db';
import { documents } from '@/lib/schema';
import { desc } from 'drizzle-orm';
import DocumentsClient from './DocumentsClient';

export const dynamic  = 'force-dynamic';
export const metadata = { title: 'Documents — Admin' };

export default async function DocumentsPage() {
  let list: (typeof documents.$inferSelect)[] = [];
  try { list = await db.select().from(documents).orderBy(desc(documents.createdAt)); } catch {}

  const serialized = list.map(d => ({
    ...d,
    createdAt: d.createdAt?.toISOString() ?? null,
    updatedAt: d.updatedAt?.toISOString() ?? null,
  }));

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Documents ({list.length})</h1>
      <DocumentsClient initialList={serialized} />
    </div>
  );
}
