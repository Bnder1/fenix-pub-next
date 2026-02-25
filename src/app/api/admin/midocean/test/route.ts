import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { testMidoceanConnection } from '@/lib/midocean';

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  return user?.role === 'admin' ? user : null;
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const result = await testMidoceanConnection();
    return NextResponse.json(result);
  } catch (err) {
    console.error('[midocean/test] GET error:', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
