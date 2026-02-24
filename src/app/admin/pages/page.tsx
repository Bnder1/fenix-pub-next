import { db } from '@/lib/db';
import { cmsPages } from '@/lib/schema';
import { asc } from 'drizzle-orm';
import PagesClient from './PagesClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pages CMS — Admin' };

export default async function PagesPage() {
  const pages = await db.select().from(cmsPages).orderBy(asc(cmsPages.sortOrder));
  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Pages CMS</h1>
      <PagesClient
        initialPages={pages.map(p => ({
          id:        p.id,
          title:     p.title,
          slug:      p.slug,
          content:   p.content   ?? '',
          metaDesc:  p.metaDesc  ?? '',
          sortOrder: p.sortOrder ?? 0,
          published: p.published ?? false,
        }))}
      />
    </div>
  );
}
