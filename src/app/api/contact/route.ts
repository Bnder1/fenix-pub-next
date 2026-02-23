import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contactMessages } from '@/lib/schema';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, message } = body;
  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Champs requis manquants' }, { status: 422 });
  }

  await db.insert(contactMessages).values({
    name:       body.name,
    email:      body.email,
    company:    body.company  || null,
    phone:      body.phone    || null,
    subject:    body.subject  || null,
    message:    body.message,
    productRef: body.productRef || null,
    status:     'nouveau',
  });

  return NextResponse.json({ ok: true });
}
