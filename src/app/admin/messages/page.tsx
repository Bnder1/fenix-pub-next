import { db } from '@/lib/db';
import { contactMessages } from '@/lib/schema';
import { desc } from 'drizzle-orm';
import MessagesClient from './MessagesClient';

export const dynamic  = 'force-dynamic';
export const metadata = { title: 'Messages — Admin' };

export default async function MessagesPage() {
  let messages: (typeof contactMessages.$inferSelect)[] = [];
  try {
    messages = await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)).limit(200);
  } catch {}

  // Serialise les dates pour le composant client
  const serialized = messages.map(m => ({
    ...m,
    createdAt: m.createdAt?.toISOString() ?? null,
  }));

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Messages clients ({messages.length})</h1>
      <MessagesClient initialMessages={serialized} />
    </div>
  );
}
