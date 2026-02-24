import { db } from '@/lib/db';
import { documents } from '@/lib/schema';
import { eq, asc } from 'drizzle-orm';

export const metadata = { title: 'Documents — FENIXPUB' };

export default async function DocumentsPage() {
  let docs: (typeof documents.$inferSelect)[] = [];
  try {
    docs = await db.select().from(documents).where(eq(documents.active, true)).orderBy(asc(documents.createdAt));
  } catch {}

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Documents</h1>
      <p className="text-gray-500 mb-8">Téléchargez nos catalogues, fiches techniques et guides.</p>

      {docs.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">📄</div>
          <p>Aucun document disponible pour l&apos;instant.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {docs.map(doc => (
            <div key={doc.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
              <div className="text-3xl shrink-0">📄</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900">{doc.title}</div>
                {doc.description && <p className="text-sm text-gray-500 mt-1">{doc.description}</p>}
                {doc.url ? (
                  <a href={doc.url} target="_blank" rel="noopener noreferrer"
                    className="inline-block mt-3 text-sm text-purple-700 font-medium hover:underline">
                    Télécharger →
                  </a>
                ) : (
                  <span className="text-xs text-gray-400 mt-2 block">Bientôt disponible</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
