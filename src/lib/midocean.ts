import { db } from '@/lib/db';
import { products, settings } from '@/lib/schema';
import type { Variant } from '@/lib/schema';
import { eq } from 'drizzle-orm';

// ─── Settings ─────────────────────────────────────────────────────────────────

interface MidoceanConfig {
  apiKey:  string;
  lang:    string;
  baseUrl: string;
}

async function getMidoceanSettings(): Promise<MidoceanConfig | null> {
  try {
    const rows = await db.select().from(settings).where(
      eq(settings.key, 'midocean_api_key')
    );
    if (!rows.length || !rows[0].value) return null;

    const all = await db.select().from(settings);
    const map = Object.fromEntries(all.map(r => [r.key, r.value ?? '']));

    const apiKey  = map['midocean_api_key']  || '';
    const lang    = map['midocean_lang']     || 'fr';
    const baseUrl = (map['midocean_base_url'] || 'https://api.midocean.com').replace(/\/$/, '');

    if (!apiKey) return null;
    return { apiKey, lang, baseUrl };
  } catch (err) {
    console.error('[midocean] getMidoceanSettings error:', err);
    return null;
  }
}

// ─── API Types ────────────────────────────────────────────────────────────────

interface MidoceanPicture {
  url:  string;
  type?: string;
}

interface MidoceanVariant {
  sku?:        string;
  gtin?:       string;
  colorCode?:  string;
  color?:      string;
  pmsColor?:   string;
  status?:     string;
  image?:      string;
  sizes?:      string[];
}

interface MidoceanTechnique {
  techniqueCode?: string;
  techniqueName?: string;
  description?:   string;
}

interface MidoceanProduct {
  masterCode?:         string;
  productName?:        string;
  shortDescription?:   string;
  longDescription?:    string;
  categoryCode?:       string;
  productMoq?:         number | string;
  moq?:                number | string;
  productSize?:        string;
  productWeight?:      number | string;
  countryOfOrigin?:    string;
  hsCode?:             string;
  pictures?:           MidoceanPicture[];
  variants?:           MidoceanVariant[];
  printingTechniques?: MidoceanTechnique[];
  [key: string]:       unknown;
}

// ─── Fetch catalogue ──────────────────────────────────────────────────────────

export async function fetchMidoceanCatalogue(cfg: MidoceanConfig): Promise<MidoceanProduct[]> {
  const url = `${cfg.baseUrl}/gateway/rest/assortment?language=${cfg.lang}`;
  const res = await fetch(url, {
    headers: { 'x-Gateway-APIKey': cfg.apiKey },
    signal:  AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Midocean API ${res.status}: ${res.statusText}`);
  const data = await res.json();
  // API returns array directly or wrapped in { data: [...] }
  return Array.isArray(data) ? data : (data.data ?? data.products ?? []);
}

// ─── Map product ──────────────────────────────────────────────────────────────

function mapProduct(item: MidoceanProduct) {
  const ref  = (item.masterCode ?? '').trim();
  const name = (item.productName ?? ref).trim();

  const pics    = item.pictures ?? [];
  const image   = pics[0]?.url ?? null;
  const images  = pics.map(p => p.url).filter(Boolean);

  const rawVariants: Variant[] = (item.variants ?? []).map(v => ({
    color:      v.color      ?? '',
    color_code: v.colorCode  ?? undefined,
    pms_color:  v.pmsColor   ?? undefined,
    sku:        v.sku        ?? undefined,
    gtin:       v.gtin       ?? undefined,
    status:     v.status     ?? undefined,
    image:      v.image      ?? undefined,
  }));

  const techniques = (item.printingTechniques ?? [])
    .map(t => t.techniqueName ?? t.techniqueCode ?? '')
    .filter(Boolean)
    .join(', ') || null;

  const moqRaw = item.productMoq ?? item.moq;
  const moq    = moqRaw ? parseInt(String(moqRaw), 10) || 1 : 1;

  const weightRaw = item.productWeight;
  const weight    = weightRaw ? String(parseFloat(String(weightRaw)).toFixed(3)) : null;

  return {
    ref,
    name,
    description:     item.shortDescription  ?? null,
    longDescription: item.longDescription   ?? null,
    category:        item.categoryCode      ?? null,
    moq,
    dimensions:      item.productSize       ?? null,
    weight,
    countryOfOrigin: item.countryOfOrigin   ?? null,
    hsCode:          item.hsCode            ?? null,
    image,
    images,
    variants:        rawVariants,
    printTechniques: techniques,
    printable:       (item.printingTechniques?.length ?? 0) > 0,
    source:          'midocean' as const,
    active:          true,
    updatedAt:       new Date(),
  };
}

// ─── Sync ─────────────────────────────────────────────────────────────────────

export interface SyncResult {
  total:   number;
  synced:  number;
  errors:  number;
  skipped: number;
}

export async function syncMidoceanProducts(): Promise<SyncResult> {
  const cfg = await getMidoceanSettings();
  if (!cfg) throw new Error('Clé API Midocean non configurée');

  const catalogue = await fetchMidoceanCatalogue(cfg);
  const total  = catalogue.length;
  let synced   = 0;
  let errors   = 0;
  let skipped  = 0;

  for (const item of catalogue) {
    try {
      const mapped = mapProduct(item);
      if (!mapped.ref || !mapped.name) { skipped++; continue; }

      await db.insert(products)
        .values(mapped)
        .onConflictDoUpdate({
          target: products.ref,
          set: {
            name:            mapped.name,
            description:     mapped.description,
            longDescription: mapped.longDescription,
            category:        mapped.category,
            moq:             mapped.moq,
            dimensions:      mapped.dimensions,
            weight:          mapped.weight,
            countryOfOrigin: mapped.countryOfOrigin,
            hsCode:          mapped.hsCode,
            image:           mapped.image,
            images:          mapped.images,
            variants:        mapped.variants,
            printTechniques: mapped.printTechniques,
            printable:       mapped.printable,
            source:          'midocean',
            updatedAt:       new Date(),
          },
        });
      synced++;
    } catch (err) {
      console.error('[midocean] sync item error:', (item as MidoceanProduct).masterCode, err);
      errors++;
    }
  }

  return { total, synced, errors, skipped };
}

// ─── Test connection ──────────────────────────────────────────────────────────

export async function testMidoceanConnection(): Promise<{ ok: boolean; count?: number; error?: string }> {
  try {
    const cfg = await getMidoceanSettings();
    if (!cfg) return { ok: false, error: 'Clé API non configurée' };

    const url = `${cfg.baseUrl}/gateway/rest/assortment?language=${cfg.lang}`;
    const res = await fetch(url, {
      headers: { 'x-Gateway-APIKey': cfg.apiKey },
      signal:  AbortSignal.timeout(10_000),
    });

    if (!res.ok) return { ok: false, error: `HTTP ${res.status}: ${res.statusText}` };

    const data = await res.json();
    const arr  = Array.isArray(data) ? data : (data.data ?? data.products ?? []);
    return { ok: true, count: arr.length };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
