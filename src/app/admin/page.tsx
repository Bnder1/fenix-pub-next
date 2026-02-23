import { db } from '@/lib/db';
import { products, users, contactMessages } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';

export const metadata = { title: 'Tableau de bord' };

export default async function AdminDashboard() {
  const [[{ total: totalProducts }], [{ total: activeProducts }], [{ total: totalUsers }], [{ total: unreadMessages }]] = await Promise.all([
    db.select({ total: sql<number>`count(*)::int` }).from(products),
    db.select({ total: sql<number>`count(*)::int` }).from(products).where(eq(products.active, true)),
    db.select({ total: sql<number>`count(*)::int` }).from(users),
    db.select({ total: sql<number>`count(*)::int` }).from(contactMessages).where(eq(contactMessages.status, 'nouveau')),
  ]);

  const cards = [
    { label: 'Produits total',      value: totalProducts,  icon: '📦', href: '/admin/products' },
    { label: 'Produits actifs',     value: activeProducts, icon: '✅', href: '/admin/products?active=1' },
    { label: 'Utilisateurs',        value: totalUsers,     icon: '👥', href: '/admin/users' },
    { label: 'Messages non lus',    value: unreadMessages, icon: '✉️', href: '/admin/messages', alert: unreadMessages > 0 },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Tableau de bord</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(c => (
          <a key={c.label} href={c.href} className={`bg-white rounded-xl border p-5 hover:shadow-md transition-shadow ${c.alert ? 'border-orange-300' : 'border-gray-100'}`}>
            <div className="text-2xl mb-2">{c.icon}</div>
            <div className={`text-3xl font-bold ${c.alert ? 'text-orange-600' : 'text-gray-900'}`}>{c.value}</div>
            <div className="text-sm text-gray-500 mt-1">{c.label}</div>
          </a>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a href="/admin/products/new" className="bg-purple-700 text-white rounded-xl p-5 hover:bg-purple-800 transition-colors">
          <div className="text-2xl mb-2">➕</div>
          <div className="font-semibold">Ajouter un produit</div>
          <div className="text-purple-200 text-sm mt-1">Créer un produit manuellement</div>
        </a>
        <a href="/admin/messages" className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow">
          <div className="text-2xl mb-2">✉️</div>
          <div className="font-semibold text-gray-900">Messages clients</div>
          <div className="text-gray-500 text-sm mt-1">{unreadMessages} message(s) non lu(s)</div>
        </a>
      </div>
    </div>
  );
}
