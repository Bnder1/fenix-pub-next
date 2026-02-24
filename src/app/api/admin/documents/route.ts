import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { documents } from '@/lib/schema';
import { desc } from 'drizzle-orm';

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  return user?.role === 'admin' ? user : null;
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const list = await db.select().from(documents).orderBy(desc(documents.createdAt));
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { title, url, filename, description, active } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: 'title requis' }, { status: 422 });
  const [doc] = await db.insert(documents).values({
    title: title.trim(), url: url || null, filename: filename || null,
    description: description || null, active: active ?? true,
  }).returning();
  return NextResponse.json(doc, { status: 201 });
}
