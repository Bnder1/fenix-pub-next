import nodemailer from 'nodemailer';
import { db } from '@/lib/db';
import { settings } from '@/lib/schema';

async function getSmtpConfig() {
  try {
    const rows = await db.select().from(settings);
    const s = Object.fromEntries(rows.map(r => [r.key, r.value ?? '']));
    return {
      host:   s.smtp_host   || process.env.SMTP_HOST || '',
      port:   parseInt(s.smtp_port || process.env.SMTP_PORT || '587'),
      secure: (s.smtp_secure || process.env.SMTP_SECURE || '') === 'true',
      user:   s.smtp_user   || process.env.SMTP_USER || '',
      pass:   s.smtp_pass   || process.env.SMTP_PASS || '',
      from:   s.smtp_from   || process.env.SMTP_FROM || process.env.ADMIN_EMAIL || '',
      to:     s.smtp_to     || process.env.ADMIN_EMAIL || '',
    };
  } catch {
    return {
      host:   process.env.SMTP_HOST || '',
      port:   parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      user:   process.env.SMTP_USER || '',
      pass:   process.env.SMTP_PASS || '',
      from:   process.env.SMTP_FROM || process.env.ADMIN_EMAIL || '',
      to:     process.env.ADMIN_EMAIL || '',
    };
  }
}

export async function sendContactEmail(data: {
  name: string;
  email: string;
  company?: string | null;
  phone?: string | null;
  subject?: string | null;
  message: string;
}) {
  try {
    const cfg = await getSmtpConfig();
    if (!cfg.host || !cfg.user || !cfg.pass || !cfg.to) {
      console.warn('[mailer] SMTP not configured — skipping email notification');
      return;
    }

    const transporter = nodemailer.createTransport({
      host:   cfg.host,
      port:   cfg.port,
      secure: cfg.secure,
      auth:   { user: cfg.user, pass: cfg.pass },
    });

    const subject = `[Contact] ${data.subject || 'Nouveau message'} — ${data.name}`;

    const textLines = [
      `Nom : ${data.name}`,
      `Email : ${data.email}`,
      data.company ? `Société : ${data.company}` : null,
      data.phone   ? `Téléphone : ${data.phone}` : null,
      '',
      data.message,
    ].filter((l): l is string => l !== null);

    const htmlBody = `
      <h2 style="color:#5b21b6">Nouveau message de contact</h2>
      <table cellpadding="4" style="border-collapse:collapse">
        <tr><td><b>Nom</b></td><td>${escHtml(data.name)}</td></tr>
        <tr><td><b>Email</b></td><td>${escHtml(data.email)}</td></tr>
        ${data.company ? `<tr><td><b>Société</b></td><td>${escHtml(data.company)}</td></tr>` : ''}
        ${data.phone   ? `<tr><td><b>Téléphone</b></td><td>${escHtml(data.phone)}</td></tr>` : ''}
      </table>
      <br>
      <p style="white-space:pre-wrap">${escHtml(data.message)}</p>
    `;

    await transporter.sendMail({
      from:    cfg.from || cfg.user,
      to:      cfg.to,
      subject,
      text:    textLines.join('\n'),
      html:    htmlBody,
    });

    console.info('[mailer] Contact email sent to', cfg.to);
  } catch (err) {
    console.error('[mailer] sendContactEmail error:', err);
  }
}

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
