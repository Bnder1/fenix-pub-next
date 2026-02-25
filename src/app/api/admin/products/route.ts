import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { products } from '@/lib/schema';

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (!user || user.role !== 'admin') return null;
  return user;
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const body = await req.json();
    const [p] = await db.insert(products).values({
      ref:             body.ref,
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
      source:          body.source          ?? 'manual',
      active:          body.active          ?? true,
    }).returning();
    return NextResponse.json(p, { status: 201 });
  } catch (err) {
    console.error('[products] POST error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
