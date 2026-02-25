/**
 * Midocean API client — ported from fenix-pub-laravel MidoceanController.php
 * Extended to handle clothing variants (color + size per SKU)
 *
 * Endpoints:
 *   Import   : GET /gateway/products/2.0?language={lang}  (303 redirect → S3 ~25 MB)
 *   Pricelist: GET /gateway/pricelist/2.0?language={lang}
 *   Stock    : GET /gateway/stock/2.0?language={lang}
 */
import { db } from '@/lib/db';
import { products, settings } from '@/lib/schema';
import type { Variant } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';

// ─── Config ───────────────────────────────────────────────────────────────────

interface MidoceanConfig {
  apiKey:  string;
  lang:    string;
  baseUrl: string;
}

export async function getMidoceanSettings(): Promise<MidoceanConfig | null> {
  try {
    const rows = await db.select().from(settings);
    const map  = Object.fromEntries(rows.map(r => [r.key, r.value ?? '']));
    const apiKey  = map['midocean_api_key']  || '';
    const lang    = map['midocean_lang']     || 'fr';
    const baseUrl = (map['midocean_base_url'] || 'https://api.midocean.com').replace(/\/$/, '');
    if (!apiKey) return null;
    return { apiKey, lang, baseUrl };
  } catch {
    return null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isImageUrl(url: string): boolean {
  const path = url.split('?')[0] ?? '';
  return /\.(jpe?g|png|webp|gif)$/i.test(path);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseDimensions(item: any): string | null {
  if (typeof item.dimensions === 'string' && item.dimensions) return item.dimensions;
  const parts = [
    item.length != null ? `${item.length} ${item.length_unit ?? ''}`.trim() : null,
    item.width  != null ? `${item.width}  ${item.width_unit  ?? ''}`.trim() : null,
    item.height != null ? `${item.height} ${item.height_unit ?? ''}`.trim() : null,
  ].filter(Boolean);
  return parts.length ? parts.join(' x ') : null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parsePrice(raw: unknown): string | null {
  if (raw == null) return null;
  if (typeof raw === 'number') return raw.toFixed(2);
  if (typeof raw === 'string' && raw.trim() !== '') return raw;
  // Nested object: { amount: 12.50 } or { value: 12.50 } or { net: 12.50 }
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>;
    const val = obj.amount ?? obj.value ?? obj.net ?? obj.price ?? obj.net_price;
    if (val != null) return parsePrice(val);
  }
  return null;
}

/**
 * Collect all image URLs from a variant's digital_assets.
 * Returns { frontImage, allImages }.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function collectVariantImages(v: any): { front: string | null; all: string[] } {
  const all: string[] = [];
  let front: string | null = null;

  for (const asset of (v.digital_assets ?? [])) {
    const url     = asset.url ?? null;
    const type    = String(asset.type    ?? '').toLowerCase();
    const subtype = String(asset.subtype ?? '').toLowerCase();
    if (!url || !isImageUrl(url)) continue;
    if (type !== 'image') continue;
    if (!all.includes(url)) all.push(url);
    if (!front && subtype.includes('front')) front = url;
  }

  if (!front && all.length > 0) front = all[0];
  return { front, all };
}

/**
 * Extract the primary product image.
 * Priority: front of first variant → any image of any variant → root digital_assets.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractImage(item: any): string | null {
  for (const v of (item.variants ?? [])) {
    const { front } = collectVariantImages(v);
    if (front) return front;
  }
  // Root digital_assets fallback
  for (const asset of (item.digital_assets ?? [])) {
    const url  = asset.url ?? null;
    const type = String(asset.type ?? '').toLowerCase();
    if (url && isImageUrl(url) && type === 'image') return url;
  }
  const fallback = item.image ?? item.imageUrl ?? item.image_url ?? null;
  return (fallback && isImageUrl(String(fallback))) ? String(fallback) : null;
}

/**
 * Collect ALL images across all variants + root digital_assets (deduped).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractAllImages(item: any): string[] {
  const urls: string[] = [];
  for (const v of (item.variants ?? [])) {
    for (const asset of (v.digital_assets ?? [])) {
      const url  = asset.url ?? null;
      const type = String(asset.type ?? '').toLowerCase();
      if (url && isImageUrl(url) && type === 'image' && !urls.includes(url)) urls.push(url);
    }
  }
  for (const asset of (item.digital_assets ?? [])) {
    const url  = asset.url ?? null;
    const type = String(asset.type ?? '').toLowerCase();
    if (url && isImageUrl(url) && type === 'image' && !urls.includes(url)) urls.push(url);
  }
  return urls;
}

/**
 * Extract variants grouped by color.
 * For clothing, each SKU is color+size → we accumulate sizes per color.
 * Each color variant also gets all its images.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractVariants(item: any): Variant[] {
  // Use a Map keyed by color to accumulate sizes & images
  const byColor = new Map<string, Variant & { images: string[] }>();

  for (const v of (item.variants ?? item.variations ?? [])) {
    const color = v.color_group ?? v.colorGroup ?? v.color_description ?? v.color ?? null;
    if (!color) continue;

    const size = v.size ?? v.size_label ?? v.size_description ?? v.sizeName ?? null;

    if (!byColor.has(color)) {
      const { front, all } = collectVariantImages(v);
      byColor.set(color, {
        color,
        color_code: v.color_code  ?? v.colorCode  ?? undefined,
        pms_color:  v.pms_color   ?? v.pmsColor   ?? undefined,
        sku:        v.sku         ?? undefined,
        gtin:       v.gtin        ?? undefined,
        status:     v.plc_status_description ?? v.status ?? undefined,
        image:      front ?? undefined,
        images:     all,
        sizes:      size ? [String(size)] : [],
      });
    } else {
      // Same color — accumulate size and images
      const entry = byColor.get(color)!;

      if (size) {
        const s = String(size);
        if (!entry.sizes?.includes(s)) entry.sizes = [...(entry.sizes ?? []), s];
      }

      const { all } = collectVariantImages(v);
      for (const url of all) {
        if (!entry.images.includes(url)) entry.images.push(url);
      }
      // Update front image if we have a better one
      if (!entry.image && entry.images.length > 0) entry.image = entry.images[0];
    }
  }

  return Array.from(byColor.values());
}

/**
 * Extract all sizes at the product level (aggregated across all color variants).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractSizes(item: any): string[] {
  const seen = new Set<string>();
  for (const v of (item.variants ?? [])) {
    const s = v.size ?? v.size_label ?? v.size_description ?? v.sizeName ?? null;
    if (s) seen.add(String(s));
  }
  return Array.from(seen);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractColors(item: any): string | null {
  if (Array.isArray(item.variants) && item.variants.length > 0) {
    const colors = [...new Set(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      item.variants.map((v: any) =>
        v.color_group ?? v.colorGroup ?? v.color_description ?? v.color ?? null
      ).filter(Boolean)
    )] as string[];
    return colors.length ? colors.join(', ') : null;
  }
  return item.colors ?? null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractPrintTechniques(item: any): string | null {
  const field = item.printing_techniques ?? item.printingTechniques ?? null;
  if (Array.isArray(field) && field.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const names = field.map((t: any) => t.print_type_name ?? t.techniqueName ?? t.name ?? null).filter(Boolean);
    return names.length ? names.join(', ') : null;
  }
  return item.print_techniques ?? null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractPackaging(item: any): Record<string, unknown> | null {
  const data: Record<string, unknown> = {};
  for (const f of [
    'inner_carton_quantity', 'outer_carton_quantity',
    'carton_gross_weight',   'carton_gross_weight_unit',
    'carton_length',         'carton_width',          'carton_height',
    'packaging_after_printing',
  ]) {
    if (item[f] != null) data[f] = item[f];
  }
  return Object.keys(data).length ? data : null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractMeta(item: any, extraMeta?: Record<string, unknown>): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const f of [
    'type_of_products', 'brand', 'number_of_print_positions',
    'net_weight', 'net_weight_unit', 'gross_weight_unit',
    'volume', 'volume_unit', 'commodity_code', 'master_id', 'timestamp',
  ]) {
    if (item[f] != null) data[f] = item[f];
  }
  return { ...data, ...extraMeta };
}

// ─── Map product ──────────────────────────────────────────────────────────────

interface PriceEntry { from_qty: number; net_price: number }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProduct(item: any, prices?: PriceEntry[], totalStock?: number) {
  const ref  = (item.master_code ?? item.masterCode ?? item.sku ?? '').trim();
  const name = (item.product_name ?? item.shortDescription ?? item.name ?? ref).trim();

  // Price: prefer pricelist lowest tier, fallback to catalogue net_price
  let price = parsePrice(item.net_price ?? item.netPrice ?? item.price);
  if (prices && prices.length > 0) {
    const sorted = [...prices].sort((a, b) => a.from_qty - b.from_qty);
    const lowestTier = sorted[0];
    if (lowestTier?.net_price != null) price = String(lowestTier.net_price);
  }

  const extraMeta: Record<string, unknown> = {};
  if (prices && prices.length > 0) extraMeta.prices = prices;
  if (totalStock != null)           extraMeta.stock  = totalStock;

  return {
    ref,
    name,
    description:     item.short_description  ?? item.shortDescription ?? null,
    longDescription: item.long_description   ?? item.longDescription  ?? item.full_description ?? null,
    category:        item.product_class       ?? item.category_code    ?? item.categoryPath     ?? null,
    price,
    moq:             parseInt(String(item.moq ?? 50), 10) || 50,
    material:        item.material            ?? null,
    dimensions:      parseDimensions(item),
    weight:          item.gross_weight        ?? item.grossWeight      ?? item.weight           ?? null,
    countryOfOrigin: item.country_of_origin   ?? item.countryOfOrigin  ?? null,
    hsCode:          item.hs_code             ?? item.hsCode           ?? null,
    image:           extractImage(item),
    images:          extractAllImages(item),
    variants:        extractVariants(item),
    sizes:           extractSizes(item),
    colors:          extractColors(item),
    printTechniques: extractPrintTechniques(item),
    printable:       !!(
      (Array.isArray(item.printing_techniques)  && item.printing_techniques.length > 0) ||
      (Array.isArray(item.printingTechniques)   && item.printingTechniques.length  > 0) ||
      item.printable === 'yes'
    ),
    packaging:       extractPackaging(item),
    meta:            extractMeta(item, extraMeta),
    source:          'midocean' as const,
    active:          false,   // admin activates products manually
    updatedAt:       new Date(),
  };
}

// ─── Fetch catalogue ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchCatalogue(cfg: MidoceanConfig): Promise<any[]> {
  const url = `${cfg.baseUrl}/gateway/products/2.0?language=${cfg.lang}`;
  const res = await fetch(url, {
    headers:  { 'x-Gateway-APIKey': cfg.apiKey },
    redirect: 'follow',   // API returns 303 → S3 ~25 MB
    signal:   AbortSignal.timeout(120_000),
  });
  if (!res.ok) throw new Error(`Midocean API HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}

// ─── Fetch pricelist ──────────────────────────────────────────────────────────

async function fetchPricelist(cfg: MidoceanConfig): Promise<Map<string, PriceEntry[]>> {
  const priceMap = new Map<string, PriceEntry[]>();
  try {
    const url = `${cfg.baseUrl}/gateway/pricelist/2.0?language=${cfg.lang}`;
    const res = await fetch(url, {
      headers: { 'x-Gateway-APIKey': cfg.apiKey },
      redirect: 'follow',
      signal:  AbortSignal.timeout(60_000),
    });
    if (!res.ok) {
      console.warn(`[midocean] pricelist HTTP ${res.status} — skipping prices`);
      return priceMap;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any[] = await res.json();
    for (const item of data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const masterCode: string = item.master_code ?? item.masterCode ?? '';
      if (!masterCode) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawPrices: any[] = item.prices ?? item.price ?? [];
      const entries: PriceEntry[] = rawPrices
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((p: any) => ({
          from_qty:  Number(p.from_qty ?? p.fromQty ?? p.qty ?? 1),
          net_price: Number(p.net_price ?? p.netPrice ?? p.price ?? 0),
        }))
        .filter(e => e.net_price > 0);
      if (entries.length > 0) priceMap.set(masterCode, entries);
    }
  } catch (err) {
    console.warn('[midocean] pricelist fetch error — skipping:', err);
  }
  return priceMap;
}

// ─── Fetch stock ──────────────────────────────────────────────────────────────

async function fetchStock(cfg: MidoceanConfig): Promise<Map<string, number>> {
  const stockMap = new Map<string, number>();
  try {
    const url = `${cfg.baseUrl}/gateway/stock/2.0?language=${cfg.lang}`;
    const res = await fetch(url, {
      headers: { 'x-Gateway-APIKey': cfg.apiKey },
      signal:  AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      console.warn(`[midocean] stock HTTP ${res.status} — skipping stock`);
      return stockMap;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any[] = await res.json();
    for (const item of data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sku: string = item.sku ?? item.masterCode ?? item.master_code ?? '';
      const qty = Number(item.qty ?? item.quantity ?? item.stock ?? 0);
      if (sku) {
        stockMap.set(sku, (stockMap.get(sku) ?? 0) + qty);
      }
    }
  } catch (err) {
    console.warn('[midocean] stock fetch error — skipping:', err);
  }
  return stockMap;
}

// ─── Sync ─────────────────────────────────────────────────────────────────────

export interface SyncResult {
  total:   number;
  created: number;
  updated: number;
  errors:  number;
  skipped: number;
}

const BATCH_SIZE = 50;

export async function syncMidoceanProducts(): Promise<SyncResult> {
  const cfg = await getMidoceanSettings();
  if (!cfg) throw new Error('Clé API Midocean non configurée');

  // Fetch all data sources in parallel
  const [catalogue, priceMap, stockMap] = await Promise.all([
    fetchCatalogue(cfg),
    fetchPricelist(cfg),
    fetchStock(cfg),
  ]);

  const total   = catalogue.length;
  let synced    = 0;
  let errors    = 0;
  let skipped   = 0;

  // Map all products first
  const mapped = [];
  for (const item of catalogue) {
    try {
      const ref       = (item.master_code ?? item.masterCode ?? item.sku ?? '').trim();
      const prices    = priceMap.get(ref);
      // Aggregate stock for all SKUs of this product
      let totalStock: number | undefined;
      for (const v of (item.variants ?? [])) {
        const vSku = v.sku ?? '';
        if (vSku && stockMap.has(vSku)) {
          totalStock = (totalStock ?? 0) + (stockMap.get(vSku) ?? 0);
        }
      }
      // Also check master_code directly in stock map
      if (totalStock == null && stockMap.has(ref)) {
        totalStock = stockMap.get(ref);
      }

      const m = mapProduct(item, prices, totalStock);
      if (!m.ref || !m.name) { skipped++; continue; }
      mapped.push(m);
    } catch (err) {
      console.error('[midocean] map error:', item?.master_code ?? item?.masterCode, err);
      errors++;
    }
  }

  // Batch upsert in parallel batches
  const batches: (typeof mapped)[] = [];
  for (let i = 0; i < mapped.length; i += BATCH_SIZE) {
    batches.push(mapped.slice(i, i + BATCH_SIZE));
  }

  // Process batches in parallel groups of 5 to avoid overwhelming the DB
  const CONCURRENT = 5;
  for (let i = 0; i < batches.length; i += CONCURRENT) {
    const group = batches.slice(i, i + CONCURRENT);
    await Promise.all(group.map(async (batch) => {
      try {
        await db.insert(products)
          .values(batch)
          .onConflictDoUpdate({
            target: products.ref,
            set: {
              name:            sql`excluded.name`,
              description:     sql`excluded.description`,
              longDescription: sql`excluded.long_description`,
              category:        sql`excluded.category`,
              price:           sql`excluded.price`,
              moq:             sql`excluded.moq`,
              material:        sql`excluded.material`,
              dimensions:      sql`excluded.dimensions`,
              weight:          sql`excluded.weight`,
              countryOfOrigin: sql`excluded.country_of_origin`,
              hsCode:          sql`excluded.hs_code`,
              image:           sql`excluded.image`,
              images:          sql`excluded.images`,
              variants:        sql`excluded.variants`,
              sizes:           sql`excluded.sizes`,
              colors:          sql`excluded.colors`,
              printTechniques: sql`excluded.print_techniques`,
              printable:       sql`excluded.printable`,
              packaging:       sql`excluded.packaging`,
              meta:            sql`excluded.meta`,
              source:          sql`excluded.source`,
              updatedAt:       new Date(),
              // active intentionally NOT updated on re-sync
            },
          });
        synced += batch.length;
      } catch (err) {
        console.error('[midocean] batch upsert error:', err);
        errors += batch.length;
      }
    }));
  }

  return { total, created: synced, updated: 0, errors, skipped };
}

// ─── Test connection ──────────────────────────────────────────────────────────

export async function testMidoceanConnection(): Promise<{ ok: boolean; message?: string; error?: string }> {
  try {
    const cfg = await getMidoceanSettings();
    if (!cfg) return { ok: false, error: 'Clé API non configurée' };

    const url = `${cfg.baseUrl}/gateway/stock/2.0?language=${cfg.lang}`;
    const res = await fetch(url, {
      headers: { 'x-Gateway-APIKey': cfg.apiKey },
      signal:  AbortSignal.timeout(10_000),
    });

    if (res.ok) return { ok: true, message: `Connexion API réussie ✓ (HTTP ${res.status})` };
    return { ok: false, error: `HTTP ${res.status}: ${res.statusText}` };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
