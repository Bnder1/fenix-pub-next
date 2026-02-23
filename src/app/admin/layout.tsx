import Link from 'next/link';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { contactMessages } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (!user || user.role !== 'admin') redirect('/login');

  let unread = 0;
  try {
    const [r] = await db.select({ count: sql<number>`count(*)` }).from(contactMessages).where(eq(contactMessages.status, 'nouveau'));
    unread = Number(r?.count ?? 0);
  } catch {}

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 text-gray-300 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-800">
          <Link href="/" className="text-white font-bold text-lg">FÉNIX<span className="text-pink-400">PUB</span></Link>
          <div className="text-xs text-gray-500 mt-0.5">Administration</div>
        </div>
        <nav className="flex-1 p-3 space-y-1 text-sm">
          <Link href="/admin" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 hover:text-white transition-colors">
            📊 Tableau de bord
          </Link>
          <div className="pt-3 pb-1 px-3 text-xs text-gray-500 uppercase tracking-wider">Catalogue</div>
          <Link href="/admin/products" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 hover:text-white transition-colors">
            📦 Produits
          </Link>
          <Link href="/admin/products/new" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 hover:text-white transition-colors">
            ➕ Ajouter
          </Link>
          <div className="pt-3 pb-1 px-3 text-xs text-gray-500 uppercase tracking-wider">Clients</div>
          <Link href="/admin/messages" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 hover:text-white transition-colors">
            ✉️ Messages
            {unread > 0 && (
              <span className="ml-auto bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">{unread}</span>
            )}
          </Link>
          <div className="pt-3 pb-1 px-3 text-xs text-gray-500 uppercase tracking-wider">Config</div>
          <Link href="/admin/settings" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 hover:text-white transition-colors">
            ⚙️ Paramètres
          </Link>
        </nav>
      </aside>
      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
          <div className="text-sm text-gray-500">Admin</div>
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">← Voir le site</Link>
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
