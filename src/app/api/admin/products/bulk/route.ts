import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { products } from '@/lib/schema';
import { inArray } from 'drizzle-orm';

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  return user?.role === 'admin' ? user : null;
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const body = await req.json();
    const action: string   = body.action ?? '';
    const ids: number[]    = Array.isArray(body.ids) ? body.ids.map(Number).filter(Boolean) : [];
    const category: string = body.category ?? '';

    if (ids.length === 0) {
      return NextResponse.json({ error: 'Aucun produit sélectionné' }, { status: 400 });
    }

    let affected = 0;

    if (action === 'delete') {
      const result = await db.delete(products).where(inArray(products.id, ids)).returning({ id: products.id });
      affected = result.length;

    } else if (action === 'activate') {
      const result = await db.update(products)
        .set({ active: true, updatedAt: new Date() })
        .where(inArray(products.id, ids))
        .returning({ id: products.id });
      affected = result.length;

    } else if (action === 'deactivate') {
      const result = await db.update(products)
        .set({ active: false, updatedAt: new Date() })
        .where(inArray(products.id, ids))
        .returning({ id: products.id });
      affected = result.length;

    } else if (action === 'set_category') {
      if (!category) return NextResponse.json({ error: 'Catégorie requise' }, { status: 400 });
      const result = await db.update(products)
        .set({ category, updatedAt: new Date() })
        .where(inArray(products.id, ids))
        .returning({ id: products.id });
      affected = result.length;

    } else {
      return NextResponse.json({ error: `Action inconnue: ${action}` }, { status: 400 });
    }

    return NextResponse.json({ ok: true, affected });
  } catch (err) {
    console.error('[products/bulk] POST error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
