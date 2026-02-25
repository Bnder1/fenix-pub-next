/**
 * Midocean API client — ported from fenix-pub-laravel MidoceanController.php
 * Extended to handle clothing variants (color + size per SKU)
 *
 * Endpoints:
 *   Import : GET /gateway/products/2.0?language={lang}  (303 redirect → S3 ~25 MB)
 *   Test   : GET /gateway/stock/2.0?language={lang}
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
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>;
    const val = obj.amount ?? obj.value ?? obj.net ?? obj.price ?? obj.net_price;
    if (val != null) return parsePrice(val);
  }
  return null;
}

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractImage(item: any): string | null {
  for (const v of (item.variants ?? [])) {
    const { front } = collectVariantImages(v);
    if (front) return front;
  }
  for (const asset of (item.digital_assets ?? [])) {
    const url  = asset.url ?? null;
    const type = String(asset.type ?? '').toLowerCase();
    if (url && isImageUrl(url) && type === 'image') return url;
  }
  const fallback = item.image ?? item.imageUrl ?? item.image_url ?? null;
  return (fallback && isImageUrl(String(fallback))) ? String(fallback) : null;
}

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractVariants(item: any): Variant[] {
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
      const entry = byColor.get(color)!;
      if (size) {
        const s = String(size);
        if (!entry.sizes?.includes(s)) entry.sizes = [...(entry.sizes ?? []), s];
      }
      const { all } = collectVariantImages(v);
      for (const url of all) {
        if (!entry.images.includes(url)) entry.images.push(url);
      }
      if (!entry.image && entry.images.length > 0) entry.image = entry.images[0];
    }
  }

  return Array.from(byColor.values());
}

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
function extractMeta(item: any): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const f of [
    'type_of_products', 'brand', 'number_of_print_positions',
    'net_weight', 'net_weight_unit', 'gross_weight_unit',
    'volume', 'volume_unit', 'commodity_code', 'master_id', 'timestamp',
  ]) {
    if (item[f] != null) data[f] = item[f];
  }
  return data;
}

// ─── Map product ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProduct(item: any) {
  const ref  = (item.master_code ?? item.masterCode ?? item.sku ?? '').trim();
  const name = (item.product_name ?? item.shortDescription ?? item.name ?? ref).trim();

  return {
    ref,
    name,
    description:     item.short_description  ?? item.shortDescription ?? null,
    longDescription: item.long_description   ?? item.longDescription  ?? item.full_description ?? null,
    category:        item.product_class       ?? item.category_code    ?? item.categoryPath     ?? null,
    price:           parsePrice(item.net_price ?? item.netPrice ?? item.price),
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
    meta:            extractMeta(item),
    source:          'midocean' as const,
    active:          false,
    updatedAt:       new Date(),
  };
}

// ─── Fetch catalogue ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchCatalogue(cfg: MidoceanConfig): Promise<any[]> {
  const url = `${cfg.baseUrl}/gateway/products/2.0?language=${cfg.lang}`;
  const res = await fetch(url, {
    headers:  { 'x-Gateway-APIKey': cfg.apiKey },
    redirect: 'follow',
    signal:   AbortSignal.timeout(120_000),
  });
  if (!res.ok) throw new Error(`Midocean API HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}

// ─── Sync ─────────────────────────────────────────────────────────────────────

export interface SyncResult {
  total:   number;
  created: number;
  updated: number;
  errors:  number;
  skipped: number;
}

// Large batches = fewer DB round trips = faster sync within Netlify 26s window
const BATCH_SIZE  = 500;
const CONCURRENT  = 3;

export async function syncMidoceanProducts(): Promise<SyncResult> {
  const cfg = await getMidoceanSettings();
  if (!cfg) throw new Error('Clé API Midocean non configurée');

  const catalogue = await fetchCatalogue(cfg);
  const total   = catalogue.length;
  let synced    = 0;
  let errors    = 0;
  let skipped   = 0;

  // Map all products
  const mapped = [];
  for (const item of catalogue) {
    try {
      const m = mapProduct(item);
      if (!m.ref || !m.name) { skipped++; continue; }
      mapped.push(m);
    } catch (err) {
      console.error('[midocean] map error:', item?.master_code ?? item?.masterCode, err);
      errors++;
    }
  }

  // Batch upsert — 500 items per batch, 3 concurrent
  const batches: (typeof mapped)[] = [];
  for (let i = 0; i < mapped.length; i += BATCH_SIZE) {
    batches.push(mapped.slice(i, i + BATCH_SIZE));
  }

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
              // active NOT updated on re-sync
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

// ─── Pricelist sync ──────────────────────────────────────────────────────────
// Reuses the catalogue endpoint (which includes net_price) rather than a
// separate /gateway/price endpoint that may not be available.

export async function syncMidoceanPrices(): Promise<{ updated: number; errors: number }> {
  const cfg = await getMidoceanSettings();
  if (!cfg) throw new Error('Clé API non configurée');

  // Catalogue already contains net_price for each product
  const catalogue = await fetchCatalogue(cfg);

  const priceMap = new Map<string, string>();
  for (const item of catalogue) {
    const code  = (item.master_code ?? item.masterCode ?? '').trim();
    const price = parsePrice(item.net_price ?? item.netPrice ?? item.price);
    if (code && price) priceMap.set(code, price);
  }

  let updated = 0, errors = 0;
  for (const [ref, price] of priceMap) {
    try {
      await db.update(products).set({ price, updatedAt: new Date() }).where(eq(products.ref, ref));
      updated++;
    } catch {
      errors++;
    }
  }
  return { updated, errors };
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
