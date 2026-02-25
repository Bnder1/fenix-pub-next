import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { cmsPages } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const [page] = await db.select().from(cmsPages).where(eq(cmsPages.slug, slug)).limit(1);
    if (!page || !page.published) return { title: 'Page introuvable' };
    return { title: page.title, description: page.metaDesc ?? undefined };
  } catch {
    return { title: 'Page' };
  }
}

export default async function CmsPageRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let page: { title: string; content: string | null; metaDesc: string | null } | null = null;

  try {
    const [row] = await db.select().from(cmsPages).where(eq(cmsPages.slug, slug)).limit(1);
    if (!row || !row.published) notFound();
    page = row;
  } catch {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-purple-700">Accueil</Link>
        <span>/</span>
        <Link href="/actu" className="hover:text-purple-700">Actu</Link>
        <span>/</span>
        <span className="text-gray-900">{page!.title}</span>
      </nav>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{page!.title}</h1>
      {page!.content && (
        <div className="prose prose-purple max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
          {page!.content}
        </div>
      )}
    </div>
  );
}
