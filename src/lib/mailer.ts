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

export async function sendBatEmail(data: {
  to: string;
  orderNumber: string;
  message: string;
  attachment?: { filename: string; content: Buffer };
  batUrl?: string;
}) {
  try {
    const cfg = await getSmtpConfig();
    if (!cfg.host || !cfg.user || !cfg.pass || !cfg.to) {
      console.warn('[mailer] SMTP not configured — skipping BAT email');
      return;
    }
    const transporter = nodemailer.createTransport({
      host: cfg.host, port: cfg.port, secure: cfg.secure,
      auth: { user: cfg.user, pass: cfg.pass },
    });
    const htmlBody = `
      <h2 style="color:#5b21b6">Bon à Tirer — Commande ${escHtml(data.orderNumber)}</h2>
      <p style="white-space:pre-wrap">${escHtml(data.message)}</p>
      ${data.batUrl ? `<p><a href="${escHtml(data.batUrl)}" style="color:#5b21b6">Voir le fichier BAT</a></p>` : ''}
      <p style="margin-top:24px;color:#6b7280;font-size:13px">
        <a href="${process.env.NEXTAUTH_URL ?? ''}/account/commandes" style="color:#5b21b6">Accéder à votre espace client</a>
      </p>
    `;
    await transporter.sendMail({
      from:    cfg.from || cfg.user,
      to:      data.to,
      subject: `[BAT] Bon à tirer — Commande ${data.orderNumber}`,
      html:    htmlBody,
      text:    `BAT — Commande ${data.orderNumber}\n\n${data.message}${data.batUrl ? `\n\nFichier : ${data.batUrl}` : ''}`,
      attachments: data.attachment ? [{ filename: data.attachment.filename, content: data.attachment.content }] : [],
    });
    console.info('[mailer] BAT email sent to', data.to);
  } catch (err) {
    console.error('[mailer] sendBatEmail error:', err);
  }
}

export async function sendOrderMessageEmail(data: {
  to?: string;
  orderNumber: string;
  senderName: string;
  message: string;
  isAdmin: boolean;
}) {
  try {
    const cfg = await getSmtpConfig();
    if (!cfg.host || !cfg.user || !cfg.pass) {
      console.warn('[mailer] SMTP not configured — skipping order message email');
      return;
    }
    const recipient = data.to || cfg.to;
    if (!recipient) return;
    const transporter = nodemailer.createTransport({
      host: cfg.host, port: cfg.port, secure: cfg.secure,
      auth: { user: cfg.user, pass: cfg.pass },
    });
    const htmlBody = `
      <h2 style="color:#5b21b6">Message — Commande ${escHtml(data.orderNumber)}</h2>
      <p><b>${data.isAdmin ? 'Admin' : 'Client'} :</b> ${escHtml(data.senderName)}</p>
      <p style="white-space:pre-wrap">${escHtml(data.message)}</p>
      ${!data.isAdmin ? '' : `<p style="margin-top:24px;color:#6b7280;font-size:13px">
        <a href="${process.env.NEXTAUTH_URL ?? ''}/account/commandes" style="color:#5b21b6">Voir dans l'espace client</a>
      </p>`}
    `;
    await transporter.sendMail({
      from:    cfg.from || cfg.user,
      to:      recipient,
      subject: `[Message] Commande ${data.orderNumber} — ${data.senderName}`,
      html:    htmlBody,
      text:    `Message commande ${data.orderNumber}\nDe : ${data.senderName}\n\n${data.message}`,
    });
    console.info('[mailer] Order message email sent to', recipient);
  } catch (err) {
    console.error('[mailer] sendOrderMessageEmail error:', err);
  }
}

export async function sendBatResponseEmail(data: {
  to: string;
  orderNumber: string;
  clientName: string;
  action: 'approved' | 'refused';
  comment?: string;
}) {
  try {
    const cfg = await getSmtpConfig();
    if (!cfg.host || !cfg.user || !cfg.pass || !cfg.to) {
      console.warn('[mailer] SMTP not configured — skipping BAT response email');
      return;
    }
    const transporter = nodemailer.createTransport({
      host: cfg.host, port: cfg.port, secure: cfg.secure,
      auth: { user: cfg.user, pass: cfg.pass },
    });
    const isApproved = data.action === 'approved';
    const color = isApproved ? '#16a34a' : '#dc2626';
    const label = isApproved ? 'APPROUVÉ' : 'REFUSÉ';
    const htmlBody = `
      <h2 style="color:${color}">BAT ${label} — Commande ${escHtml(data.orderNumber)}</h2>
      <p><b>Client :</b> ${escHtml(data.clientName)}</p>
      <p><b>Décision :</b> <span style="color:${color};font-weight:bold">${label}</span></p>
      ${data.comment ? `<p><b>Commentaire :</b><br><span style="white-space:pre-wrap">${escHtml(data.comment)}</span></p>` : ''}
      <p style="margin-top:24px;color:#6b7280;font-size:13px">
        <a href="${process.env.NEXTAUTH_URL ?? ''}/admin/orders" style="color:#5b21b6">Voir dans l'administration</a>
      </p>
    `;
    await transporter.sendMail({
      from:    cfg.from || cfg.user,
      to:      data.to,
      subject: `[BAT ${label}] Commande ${data.orderNumber}`,
      html:    htmlBody,
      text:    `BAT ${label} — Commande ${data.orderNumber}\nClient : ${data.clientName}${data.comment ? `\nCommentaire : ${data.comment}` : ''}`,
    });
    console.info('[mailer] BAT response email sent to', data.to);
  } catch (err) {
    console.error('[mailer] sendBatResponseEmail error:', err);
  }
}
