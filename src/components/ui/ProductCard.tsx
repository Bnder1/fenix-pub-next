import Link from 'next/link';
import Image from 'next/image';
import { imagesArray, priceWithMargin, formatPrice } from '@/lib/utils';
import type { Product } from '@/lib/schema';

export default function ProductCard({ product }: { product: Product }) {
  const images = imagesArray(product);
  const price  = priceWithMargin(product.price);

  return (
    <Link href={`/produit/${product.ref}`} className="group block bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
        {images[0] ? (
          <Image
            src={images[0]}
            alt={product.name}
            width={300}
            height={300}
            className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <span className="text-5xl">🎁</span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="text-xs text-gray-400 font-mono">{product.ref}</span>
          {product.category && (
            <span className="text-xs bg-purple-50 text-purple-700 rounded-full px-2 py-0.5 shrink-0">{product.category}</span>
          )}
        </div>
        <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 mb-2">{product.name}</h3>
        {price > 0 ? (
          <div className="text-purple-700 font-bold text-sm">
            À partir de {formatPrice(price)} €
            {product.moq && <span className="text-xs text-gray-400 font-normal ml-1">/ MOQ {product.moq}</span>}
          </div>
        ) : (
          <div className="text-gray-400 text-sm italic">Sur devis</div>
        )}
        {product.printable && (
          <span className="mt-2 inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 rounded-full px-2 py-0.5">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4v3H4a2 2 0 00-2 2v5a2 2 0 002 2h1v2a1 1 0 001 1h8a1 1 0 001-1v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a1 1 0 00-1-1H6a1 1 0 00-1 1zm2 0h6v3H7V4zm-1 9v-1a1 1 0 011-1h6a1 1 0 011 1v3H6v-2zm8-4a1 1 0 110 2 1 1 0 010-2z"/></svg>
            Imprimable
          </span>
        )}
      </div>
    </Link>
  );
}
