import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { contactMessages } from '@/lib/schema';
import { sendContactEmail } from '@/lib/mailer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, message } = body;
    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 422 });
    }

    let userId: number | null = null;
    try {
      const session = await auth();
      const u = session?.user as { id?: string } | undefined;
      if (u?.id) userId = parseInt(u.id);
    } catch {}

    await db.insert(contactMessages).values({
      userId,
      name:       body.name,
      email:      body.email,
      company:    body.company   || null,
      phone:      body.phone     || null,
      subject:    body.subject   || null,
      message:    body.message,
      productRef: body.productRef || null,
      status:     'nouveau',
    });

    // Fire-and-forget — never blocks the response
    sendContactEmail({
      name:    body.name,
      email:   body.email,
      company: body.company || null,
      phone:   body.phone   || null,
      subject: body.subject || null,
      message: body.message,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[contact] POST error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
