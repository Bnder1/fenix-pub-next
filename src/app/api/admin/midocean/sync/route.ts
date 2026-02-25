import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { settings } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { syncMidoceanProducts } from '@/lib/midocean';

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  return user?.role === 'admin' ? user : null;
}

async function upsertSetting(key: string, value: string) {
  const existing = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  if (existing.length > 0) {
    await db.update(settings).set({ value }).where(eq(settings.key, key));
  } else {
    await db.insert(settings).values({ key, value });
  }
}

export async function POST() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const start  = Date.now();
    const result = await syncMidoceanProducts();
    const duration = Date.now() - start;

    await upsertSetting('midocean_last_sync',  new Date().toISOString());
    await upsertSetting('midocean_last_count', String(result.created));

    return NextResponse.json({ ok: true, ...result, duration });
  } catch (err) {
    console.error('[midocean/sync] POST error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
