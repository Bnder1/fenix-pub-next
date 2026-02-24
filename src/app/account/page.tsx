import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { users, orders, products, favorites } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import Link from 'next/link';
import { imagesArray } from '@/lib/utils';
import Image from 'next/image';
import ProfileForm from './ProfileForm';

export const dynamic  = 'force-dynamic';
export const metadata = { title: 'Mon compte' };

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect('/login?redirect=/account');
  const userId = parseInt((session.user as { id?: string }).id ?? '0');

  let user = null, myOrders: { order: typeof orders.$inferSelect }[] = [], favs: { product: typeof products.$inferSelect }[] = [];
  try {
    [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    myOrders = await db.select({ order: orders }).from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt)).limit(10);
    favs = await db.select({ product: products }).from(favorites)
      .innerJoin(products, eq(favorites.productId, products.id))
      .where(eq(favorites.userId, userId)).limit(12);
  } catch {}

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Mon compte</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Profil */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center text-2xl font-bold text-purple-700 mb-4">
              {(user?.name ?? session.user.name ?? 'U')[0].toUpperCase()}
            </div>
            <div className="font-semibold text-gray-900">{user?.name ?? session.user.name}</div>
            <div className="text-sm text-gray-500">{user?.email ?? session.user.email}</div>
            {user?.company && <div className="text-sm text-gray-400 mt-1">{user.company}</div>}
            {user?.phone   && <div className="text-sm text-gray-400">{user.phone}</div>}
            <div className="mt-4 space-y-2">
              <Link href="/panier" className="block w-full text-center px-4 py-2 bg-purple-700 text-white rounded-lg text-sm font-medium hover:bg-purple-800 transition-colors">
                Mon panier
              </Link>
              <Link href="/catalogue" className="block w-full text-center px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                Catalogue
              </Link>
              <ProfileForm
                name={user?.name ?? session.user.name ?? ''}
                company={user?.company ?? ''}
                phone={user?.phone ?? ''}
              />
            </div>
          </div>
        </div>

        {/* Commandes + Favoris */}
        <div className="md:col-span-2 space-y-6">

          {/* Commandes */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Mes commandes</h2>
            {myOrders.length === 0 ? (
              <p className="text-sm text-gray-400">Aucune commande pour l&apos;instant.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {myOrders.map(({ order: o }) => (
                  <div key={o.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Commande #{o.id}</div>
                      <div className="text-xs text-gray-400">{o.createdAt?.toLocaleDateString('fr-FR')}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      {o.total && <span className="text-sm font-semibold text-purple-700">{parseFloat(String(o.total)).toFixed(2)} €</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        o.status === 'pending'   ? 'bg-yellow-50 text-yellow-700' :
                        o.status === 'confirmed' ? 'bg-green-50 text-green-700'  :
                        'bg-gray-100 text-gray-500'
                      }`}>{o.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Favoris */}
          {favs.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Mes favoris</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {favs.map(({ product: p }) => {
                  const img = imagesArray(p)[0];
                  return (
                    <Link key={p.id} href={`/produit/${p.ref}`} className="group border border-gray-100 rounded-xl p-2 hover:border-purple-200 transition-colors">
                      <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center mb-2">
                        {img ? <Image src={img} alt={p.name} width={80} height={80} className="object-contain" /> : <span className="text-2xl">🎁</span>}
                      </div>
                      <div className="text-xs font-medium text-gray-900 line-clamp-2">{p.name}</div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
