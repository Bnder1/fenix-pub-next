import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { markingTechniques } from '@/lib/schema';
import { asc } from 'drizzle-orm';

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  return user?.role === 'admin' ? user : null;
}

export async function GET() {
  try {
    const rows = await db.select().from(markingTechniques).orderBy(asc(markingTechniques.sortOrder));
    return NextResponse.json(rows);
  } catch (err) {
    console.error('[marking-techniques] GET error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const body = await req.json();
    const { name, description, unitPrice, setupFee, active, sortOrder } = body;
    if (!name?.trim()) return NextResponse.json({ error: 'name requis' }, { status: 422 });
    const [row] = await db.insert(markingTechniques).values({
      name:        name.trim(),
      description: description ?? null,
      unitPrice:   unitPrice   ?? '0',
      setupFee:    setupFee    ?? '0',
      active:      active      ?? true,
      sortOrder:   sortOrder   ?? 0,
    }).returning();
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    console.error('[marking-techniques] POST error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
