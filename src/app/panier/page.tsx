import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { cartItems, products } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { priceWithMargin, formatPrice, imagesArray } from '@/lib/utils';
import Image from 'next/image';
import CartActions from './CartActions';

export const metadata = { title: 'Mon panier' };

export default async function CartPage() {
  const session = await auth();
  if (!session?.user) redirect('/login?redirect=/panier');

  const userId = parseInt((session.user as { id?: string }).id ?? '0');
  const rows = await db
    .select({ item: cartItems, product: products })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.userId, userId));

  const total = rows.reduce((sum, { item, product }) => {
    const p = priceWithMargin(product.price);
    return sum + p * item.qty;
  }, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Mon panier</h1>

      {rows.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <div className="text-5xl mb-4">🛒</div>
          <p className="text-lg mb-4">Votre panier est vide</p>
          <a href="/catalogue" className="px-6 py-2 bg-purple-700 text-white rounded-xl text-sm font-medium hover:bg-purple-800 transition-colors">
            Voir le catalogue
          </a>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-8">
            {rows.map(({ item, product }) => {
              const imgs  = imagesArray(product);
              const price = priceWithMargin(product.price);
              return (
                <div key={item.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex gap-4 items-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                    {imgs[0] ? (
                      <Image src={imgs[0]} alt={product.name} width={80} height={80} className="object-contain" />
                    ) : <span className="text-2xl">🎁</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm truncate">{product.name}</div>
                    <div className="text-xs text-gray-400 font-mono">{product.ref}</div>
                    {price > 0 && <div className="text-purple-700 font-bold text-sm mt-1">{formatPrice(price * item.qty)} €</div>}
                  </div>
                  <CartActions itemId={item.id} qty={item.qty} moq={product.moq ?? 1} />
                </div>
              );
            })}
          </div>

          {total > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-right">
              <div className="text-lg font-bold text-gray-900 mb-4">Total estimé : {formatPrice(total)} € HT</div>
              <p className="text-xs text-gray-400 mb-4">Prix indicatifs — un devis définitif vous sera adressé.</p>
              <a href="/commande" className="px-8 py-3 bg-purple-700 text-white rounded-xl font-semibold hover:bg-purple-800 transition-colors">
                Passer la commande →
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
