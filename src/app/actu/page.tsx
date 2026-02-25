import { db } from '@/lib/db';
import { cmsPages } from '@/lib/schema';
import { eq, asc } from 'drizzle-orm';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Actualités' };

export default async function ActuPage() {
  let pages: { slug: string; title: string; content: string | null; createdAt: Date | null }[] = [];
  try {
    pages = await db
      .select({ slug: cmsPages.slug, title: cmsPages.title, content: cmsPages.content, createdAt: cmsPages.createdAt })
      .from(cmsPages)
      .where(eq(cmsPages.published, true))
      .orderBy(asc(cmsPages.sortOrder), asc(cmsPages.createdAt));
  } catch { /* DB unavailable at build time */ }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Actualités</h1>
      <p className="text-gray-500 mb-10">Retrouvez nos dernières informations et articles.</p>

      {pages.length === 0 ? (
        <p className="text-gray-400 text-center py-16">Aucune actualité pour le moment.</p>
      ) : (
        <div className="space-y-6">
          {pages.map(page => {
            const excerpt = page.content ? page.content.slice(0, 160).trimEnd() + (page.content.length > 160 ? '…' : '') : null;
            return (
              <Link
                key={page.slug}
                href={`/pages/${page.slug}`}
                className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:border-purple-200 hover:shadow-md transition-all group"
              >
                <h2 className="text-lg font-semibold text-gray-900 group-hover:text-purple-700 transition-colors mb-1">
                  {page.title}
                </h2>
                {page.createdAt && (
                  <div className="text-xs text-gray-400 mb-2">
                    {page.createdAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                )}
                {excerpt && <p className="text-sm text-gray-500 leading-relaxed">{excerpt}</p>}
                <span className="text-xs text-purple-600 font-medium mt-3 block">Lire la suite →</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
