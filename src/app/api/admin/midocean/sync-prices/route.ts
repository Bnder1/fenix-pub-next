import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { syncMidoceanPrices } from '@/lib/midocean';

export const maxDuration = 300;

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  return user?.role === 'admin' ? user : null;
}

export async function POST() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const start  = Date.now();
    const result = await syncMidoceanPrices();
    return NextResponse.json({ ...result, duration: Date.now() - start });
  } catch (err) {
    console.error('[sync-prices] error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
