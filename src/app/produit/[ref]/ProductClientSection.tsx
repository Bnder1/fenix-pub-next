'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Variant, MarkingTechnique } from '@/lib/schema';
import ImageGallery from './ImageGallery';
import AddToCartButton from './AddToCartButton';
import FavoriteButton from './FavoriteButton';

type Meta = Record<string, string | number | null>;

interface ProductInfo {
  id:              number;
  ref:             string;
  name:            string;
  description?:    string | null;
  longDescription?: string | null;
  category?:       string | null;
  printable?:      boolean | null;
  moq?:            number | null;
  material?:       string | null;
  dimensions?:     string | null;
  weight?:         string | null;
  image?:          string | null;
}

interface Props {
  product:           ProductInfo;
  price:             number;
  variants:          Variant[];
  sizes:             string[];
  allImages:         string[];
  techs:             string[];
  meta:              Meta;
  pkg:               Meta;
  markingTechniques: Pick<MarkingTechnique, 'id' | 'name' | 'unitPrice' | 'setupFee'>[];
  markingPositions:  string[];
  isLoggedIn:        boolean;
}

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

export default function ProductClientSection({
  product, price, variants, sizes, allImages, techs, meta, pkg,
  markingTechniques, markingPositions, isLoggedIn,
}: Props) {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const colorVariant = selectedColor ? variants.find(v => v.color === selectedColor) : null;
  const displayImages = colorVariant?.images && colorVariant.images.length > 0
    ? colorVariant.images
    : allImages;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      {/* Gallery */}
      <ImageGallery key={selectedColor ?? '__all'} images={displayImages} name={product.name} />

      {/* Info */}
      <div>
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-1 rounded">Réf. {product.ref}</span>
          {product.category && <span className="text-xs bg-purple-50 text-purple-700 rounded-full px-2 py-1">{product.category}</span>}
          {product.printable && <span className="text-xs bg-green-50 text-green-700 rounded-full px-2 py-1">✓ Imprimable</span>}
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

        {price > 0 && (
          <div className="mb-4">
            <span className="text-sm text-gray-500">Prix à partir de</span>
            <div className="text-3xl font-bold text-purple-700">{fmt(price)} €</div>
            {product.moq && <div className="text-sm text-gray-500">MOQ : {product.moq} unités</div>}
          </div>
        )}

        {product.description && (
          <p className="text-gray-600 leading-relaxed mb-6">{product.description}</p>
        )}

        {/* Color swatches — interactive */}
        {variants.length > 0 && (
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">
              Couleur{selectedColor ? ` : ${selectedColor}` : ''}
            </div>
            <div className="flex flex-wrap gap-2">
              {variants.map(v => (
                <button
                  key={v.color}
                  title={v.color}
                  onClick={() => setSelectedColor(v.color)}
                  className={`w-7 h-7 rounded-full overflow-hidden flex-shrink-0 transition-all ${
                    selectedColor === v.color
                      ? 'border-2 border-purple-600 scale-110 shadow-md'
                      : 'border border-gray-200 hover:border-purple-400'
                  }`}
                  style={{ backgroundColor: v.color_code ?? '#ccc' }}
                >
                  {!v.color_code && v.image && (
                    <Image src={v.image} alt={v.color} width={28} height={28} className="object-cover w-full h-full" />
                  )}
                </button>
              ))}
            </div>
            {!selectedColor && <p className="text-xs text-amber-600 mt-1">Sélectionnez une couleur pour voir les tailles</p>}
          </div>
        )}

        {/* Stock badges */}
        {(meta.type_of_products || pkg.inner_carton_quantity) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {meta.type_of_products && (
              <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1">
                ✓ {meta.type_of_products === 'stock' ? 'Disponible en stock' : String(meta.type_of_products)}
              </span>
            )}
            {pkg.inner_carton_quantity && (
              <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-3 py-1">
                📦 Colisage : {String(pkg.inner_carton_quantity)} / {String(pkg.outer_carton_quantity ?? '—')} pcs
              </span>
            )}
            {meta.number_of_print_positions && (
              <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-3 py-1">
                🖨 {String(meta.number_of_print_positions)} position(s) d&apos;impression
              </span>
            )}
          </div>
        )}

        {/* Printing techniques */}
        {techs.length > 0 && (
          <div className="mb-4">
            <div className="text-sm font-semibold text-gray-700 mb-2">Techniques d&apos;impression</div>
            <div className="flex flex-wrap gap-2">
              {techs.map(t => (
                <span key={t} className="text-xs bg-purple-50 text-purple-700 rounded-full px-3 py-1">🖨 {t}</span>
              ))}
            </div>
          </div>
        )}

        {/* Specs */}
        {(product.material || product.dimensions || product.weight) && (
          <div className="border-t border-gray-100 pt-4 mb-6 grid grid-cols-2 gap-3">
            {product.material && (
              <div><div className="text-xs text-gray-400 uppercase tracking-wide">Matière</div><div className="text-sm font-medium">{product.material}</div></div>
            )}
            {product.dimensions && (
              <div><div className="text-xs text-gray-400 uppercase tracking-wide">Dimensions</div><div className="text-sm font-medium">{product.dimensions}</div></div>
            )}
            {product.weight && (
              <div><div className="text-xs text-gray-400 uppercase tracking-wide">Poids</div><div className="text-sm font-medium">{String(product.weight)} g</div></div>
            )}
          </div>
        )}

        {/* Actions */}
        {isLoggedIn ? (
          <div className="flex flex-col gap-3">
            <AddToCartButton
              productId={product.id}
              moq={product.moq ?? 1}
              price={price}
              variants={variants}
              sizes={sizes}
              selectedColor={selectedColor}
              markingTechniques={markingTechniques}
              markingPositions={markingPositions}
            />
            <FavoriteButton productId={product.id} />
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href={`/login?redirect=/produit/${product.ref}`}
              className="flex-1 text-center px-6 py-3 bg-purple-700 text-white rounded-xl font-semibold hover:bg-purple-800 transition-colors">
              Se connecter pour commander
            </Link>
            <Link href={`/contact?ref=${product.ref}`}
              className="flex-1 text-center px-6 py-3 border-2 border-purple-700 text-purple-700 rounded-xl font-semibold hover:bg-purple-50 transition-colors">
              Demander un devis
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
