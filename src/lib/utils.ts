export function priceWithMargin(price: number | string | null | undefined): number {
  if (!price) return 0;
  const margin = parseFloat(process.env.PRICE_MARGIN ?? '20');
  return Math.round(parseFloat(String(price)) * (1 + margin / 100) * 100) / 100;
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function imagesArray(product: { images?: string[] | null; image?: string | null }): string[] {
  if (product.images && product.images.length > 0) return product.images;
  if (product.image) return [product.image];
  return [];
}
