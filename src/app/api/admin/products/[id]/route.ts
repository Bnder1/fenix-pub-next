import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { products } from '@/lib/schema';
import { eq } from 'drizzle-orm';

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  return user?.role === 'admin' ? user : null;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { id } = await params;
    const body = await req.json();
    const [p] = await db.update(products).set({
      name:            body.name,
      category:        body.category        || null,
      price:           body.price           || null,
      moq:             body.moq             || null,
      description:     body.description     || null,
      material:        body.material        || null,
      dimensions:      body.dimensions      || null,
      weight:          body.weight          || null,
      image:           body.image           || null,
      colors:          body.colors          || null,
      printTechniques: body.printTechniques || null,
      source:          body.source,
      active:          body.active,
      updatedAt:       new Date(),
    }).where(eq(products.id, parseInt(id))).returning();
    return NextResponse.json(p);
  } catch (err) {
    console.error('[products/id] PUT error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { id } = await params;
    await db.delete(products).where(eq(products.id, parseInt(id)));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[products/id] DELETE error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
