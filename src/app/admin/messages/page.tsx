import { db } from '@/lib/db';
import { contactMessages } from '@/lib/schema';
import { desc } from 'drizzle-orm';

export const metadata = { title: 'Messages — Admin' };

export default async function MessagesPage() {
  let messages: (typeof contactMessages.$inferSelect)[] = [];
  try {
    messages = await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)).limit(100);
  } catch {}

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Messages clients ({messages.length})</h1>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">Nom / Email</th>
              <th className="px-4 py-3 text-left">Sujet</th>
              <th className="px-4 py-3 text-left">Réf</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-center">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {messages.map(m => (
              <tr key={m.id} className={`hover:bg-gray-50 ${m.status === 'nouveau' ? 'font-medium' : ''}`}>
                <td className="px-4 py-3">
                  <div className="text-gray-900">{m.name}</div>
                  <div className="text-xs text-gray-400">{m.email}</div>
                </td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{m.subject ?? m.message?.slice(0, 60)}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-400">{m.productRef ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{m.createdAt?.toLocaleDateString('fr-FR')}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    m.status === 'nouveau'  ? 'bg-orange-100 text-orange-700' :
                    m.status === 'traité'   ? 'bg-green-100 text-green-700'   :
                    'bg-gray-100 text-gray-500'
                  }`}>{m.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
