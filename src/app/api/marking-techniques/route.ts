import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { markingTechniques } from '@/lib/schema';
import { eq, asc } from 'drizzle-orm';

// Public endpoint — no auth required
export async function GET() {
  try {
    const rows = await db
      .select({
        id:          markingTechniques.id,
        name:        markingTechniques.name,
        description: markingTechniques.description,
        unitPrice:   markingTechniques.unitPrice,
        setupFee:    markingTechniques.setupFee,
      })
      .from(markingTechniques)
      .where(eq(markingTechniques.active, true))
      .orderBy(asc(markingTechniques.sortOrder), asc(markingTechniques.name));

    return NextResponse.json(rows);
  } catch (err) {
    console.error('[marking-techniques] GET error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
