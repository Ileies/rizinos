import nodemailer from 'nodemailer';
import { PUBLIC_APP_NAME, PUBLIC_ORIGIN } from '$env/static/public';
import { SMTP_HOST, SMTP_PASSWORD, SMTP_USER } from '$env/static/private';
import Logger from '$lib/server/models/Logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Mail-Kategorie steuert Absenderadresse, Unsubscribe-Header und Ton der Mail.
 *
 * Ohne Unsubscribe:
 *   transactional  - E-Mail-Bestätigung, Passwort-Reset, 2FA
 *   security       - Sicherheitswarnungen, Login von neuem Gerät
 *   billing        - Rechnungen, Zahlungsbestätigungen
 *   support        - Support-Tickets, Antworten
 *   alerts         - Infrastruktur-/Monitoring-Alerts, Downtime-Notices
 *   legal          - ToS-Änderungen, GDPR-Pflichtmitteilungen, Compliance
 *
 * Mit Unsubscribe:
 *   welcome        - einmalige Willkommensmail nach Registrierung
 *   onboarding     - mehrstufige Onboarding-Sequenzen
 *   notifications  - allgemeine App- und OS-Benachrichtigungen
 *   newsletter     - Marketing, Produktneuheiten
 */
export type MailCategory =
	| 'transactional'
	| 'security'
	| 'billing'
	| 'support'
	| 'alerts'
	| 'legal'
	| 'welcome'
	| 'onboarding'
	| 'notifications'
	| 'newsletter';

export type EmailBlock =
	| { type: 'text'; content: string }
	| { type: 'html'; content: string }
	| { type: 'divider' }
	| { type: 'spacer'; height?: number }
	| { type: 'list'; items: string[]; ordered?: boolean }
	| { type: 'code'; value: string; label?: string }
	| { type: 'keyvalue'; rows: { label: string; value: string }[] }
	| { type: 'alert'; level: 'info' | 'warning' | 'danger'; content: string }
	| { type: 'button'; label: string; url: string; secondary?: boolean }
	| { type: 'image'; src: string; alt: string; width?: number };

export interface EmailOptions {
	to: string | string[];
	subject: string;
	category: MailCategory;
	/** Vorschautext im Posteingang (vor dem Öffnen sichtbar). Empfohlen: 50-100 Zeichen. */
	preheader?: string;
	/** Anrede, z.B. "Hallo Max," */
	greeting?: string;
	/** Strukturierte Inhaltsblöcke in Reihenfolge */
	blocks: EmailBlock[];
	/** Primärer Call-to-Action-Button (alternativ zum button-Block) */
	cta?: { label: string; url: string };
	replyTo?: string;
	/** Überschreibt die automatisch gewählte Absenderadresse */
	from?: string;
}

// ---------------------------------------------------------------------------
// Interne Konfiguration
// ---------------------------------------------------------------------------

const DOMAIN = PUBLIC_ORIGIN;
const APP_NAME = PUBLIC_APP_NAME;

export const SENDERS: Record<MailCategory, string> = {
	transactional: `"${APP_NAME}" <no-reply@${DOMAIN}>`,
	security: `"${APP_NAME} Security" <security@${DOMAIN}>`,
	billing: `"${APP_NAME} Billing" <billing@${DOMAIN}>`,
	support: `"${APP_NAME} Support" <support@${DOMAIN}>`,
	alerts: `"${APP_NAME} Alerts" <alerts@${DOMAIN}>`,
	legal: `"${APP_NAME} Legal" <legal@${DOMAIN}>`,
	welcome: `"${APP_NAME}" <welcome@${DOMAIN}>`,
	onboarding: `"${APP_NAME}" <onboarding@${DOMAIN}>`,
	notifications: `"${APP_NAME}" <notifications@${DOMAIN}>`,
	newsletter: `"${APP_NAME} Newsletter" <newsletter@${DOMAIN}>`
};

const UNSUBSCRIBABLE: Set<MailCategory> = new Set(['welcome', 'onboarding', 'notifications', 'newsletter']);

// ---------------------------------------------------------------------------
// HTML-Builder
// ---------------------------------------------------------------------------

const COLORS = {
	primary: '#4f46e5',
	primaryDark: '#4338ca',
	bg: '#f4f4f7',
	card: '#ffffff',
	text: '#1f2937',
	muted: '#6b7280',
	border: '#e5e7eb',
	alertInfo: '#eff6ff',
	alertInfoBorder: '#93c5fd',
	alertWarning: '#fffbeb',
	alertWarningBorder: '#fbbf24',
	alertDanger: '#fef2f2',
	alertDangerBorder: '#fca5a5'
};

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function renderBlock(block: EmailBlock): string {
	switch (block.type) {
		case 'text':
			return `
        <tr><td style="padding:0 0 16px 0;font-size:15px;line-height:1.7;color:${COLORS.text};">
          ${escapeHtml(block.content).replace(/\n/g, '<br>')}
        </td></tr>`;

		case 'html':
			return `
        <tr><td style="padding:0 0 16px 0;font-size:15px;line-height:1.7;color:${COLORS.text};">
          ${block.content}
        </td></tr>`;

		case 'divider':
			return `
        <tr><td style="padding:8px 0 24px 0;">
          <hr style="border:none;border-top:1px solid ${COLORS.border};margin:0;">
        </td></tr>`;

		case 'spacer':
			return `<tr><td style="height:${block.height ?? 16}px;line-height:${block.height ?? 16}px;">&nbsp;</td></tr>`;

		case 'list': {
			const tag = block.ordered ? 'ol' : 'ul';
			const items = block.items
				.map(
					(i) =>
						`<li style="margin-bottom:6px;font-size:15px;line-height:1.6;color:${COLORS.text};">${escapeHtml(i)}</li>`
				)
				.join('');
			return `
        <tr><td style="padding:0 0 16px 0;">
          <${tag} style="margin:0;padding-left:24px;">${items}</${tag}>
        </td></tr>`;
		}

		case 'code':
			return `
        <tr><td style="padding:0 0 16px 0;">
          ${block.label ? `<p style="margin:0 0 8px 0;font-size:13px;color:${COLORS.muted};text-transform:uppercase;letter-spacing:.05em;">${escapeHtml(block.label)}</p>` : ''}
          <div style="background:#1e1b4b;border-radius:8px;padding:20px 24px;text-align:center;">
            <span style="font-family:'Courier New',Courier,monospace;font-size:28px;font-weight:700;letter-spacing:.25em;color:#a5b4fc;">${escapeHtml(block.value)}</span>
          </div>
        </td></tr>`;

		case 'keyvalue': {
			const rows = block.rows
				.map(
					(r) => `
          <tr>
            <td style="padding:10px 16px;font-size:13px;color:${COLORS.muted};white-space:nowrap;vertical-align:top;border-bottom:1px solid ${COLORS.border};">${escapeHtml(r.label)}</td>
            <td style="padding:10px 16px;font-size:14px;color:${COLORS.text};font-weight:500;border-bottom:1px solid ${COLORS.border};">${escapeHtml(r.value)}</td>
          </tr>`
				)
				.join('');
			return `
        <tr><td style="padding:0 0 20px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${COLORS.border};border-radius:8px;border-collapse:collapse;overflow:hidden;">
            ${rows}
          </table>
        </td></tr>`;
		}

		case 'alert': {
			const styles: Record<typeof block.level, { bg: string; border: string; icon: string }> = {
				info: { bg: COLORS.alertInfo, border: COLORS.alertInfoBorder, icon: 'i' },
				warning: { bg: COLORS.alertWarning, border: COLORS.alertWarningBorder, icon: '!' },
				danger: { bg: COLORS.alertDanger, border: COLORS.alertDangerBorder, icon: '!' }
			};
			const s = styles[block.level];
			return `
        <tr><td style="padding:0 0 16px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:${s.bg};border-left:4px solid ${s.border};border-radius:0 6px 6px 0;">
            <tr><td style="padding:14px 16px;font-size:14px;line-height:1.6;color:${COLORS.text};">
              ${escapeHtml(block.content)}
            </td></tr>
          </table>
        </td></tr>`;
		}

		case 'button': {
			const bg = block.secondary ? '#ffffff' : COLORS.primary;
			const color = block.secondary ? COLORS.primary : '#ffffff';
			const border = block.secondary ? `2px solid ${COLORS.primary}` : 'none';
			return `
        <tr><td style="padding:8px 0 20px 0;text-align:center;">
          <a href="${block.url}" target="_blank" style="display:inline-block;background:${bg};color:${color};font-size:15px;font-weight:600;text-decoration:none;padding:13px 32px;border-radius:8px;border:${border};letter-spacing:.01em;">
            ${escapeHtml(block.label)}
          </a>
        </td></tr>`;
		}

		case 'image':
			return `
        <tr><td style="padding:0 0 20px 0;text-align:center;">
          <img src="${block.src}" alt="${escapeHtml(block.alt)}" width="${block.width ?? 600}" style="max-width:100%;height:auto;border-radius:6px;display:block;margin:0 auto;">
        </td></tr>`;

		default:
			return '';
	}
}

function buildHtml(opts: EmailOptions, unsubscribeUrl: string | null): string {
	const preheaderText = opts.preheader ?? '';
	// Auffuellung verhindert, dass Email-Clients eigenen Vorschautext nehmen
	const preheaderPadding = '&nbsp;'.repeat(Math.max(0, 120 - preheaderText.length));

	const blocksHtml = opts.blocks.map(renderBlock).join('');

	const ctaHtml = opts.cta
		? `<tr><td style="padding:8px 0 28px 0;text-align:center;">
        <a href="${opts.cta.url}" target="_blank" style="display:inline-block;background:${COLORS.primary};color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:8px;letter-spacing:.01em;">
          ${escapeHtml(opts.cta.label)}
        </a>
      </td></tr>`
		: '';

	const greetingHtml = opts.greeting
		? `<tr><td style="padding:0 0 20px 0;font-size:16px;font-weight:600;color:${COLORS.text};">
        ${escapeHtml(opts.greeting)}
      </td></tr>`
		: '';

	const unsubscribeFooterHtml = unsubscribeUrl
		? `<tr><td style="padding-top:16px;border-top:1px solid ${COLORS.border};">
        <p style="margin:0;font-size:12px;color:${COLORS.muted};text-align:center;line-height:1.6;">
          Du erhältst diese Mail, weil du ${APP_NAME}-Nutzer bist.<br>
          <a href="${unsubscribeUrl}" style="color:${COLORS.muted};text-decoration:underline;">Benachrichtigungen abbestellen</a>
        </p>
      </td></tr>`
		: '';

	return `<!DOCTYPE html>
<html lang="de" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="format-detection" content="telephone=no,date=no,address=no,email=no">
  <title>${escapeHtml(opts.subject)}</title>
  <style>
    @media only screen and (max-width:600px){
      .email-wrapper{padding:12px!important}
      .email-card{padding:28px 20px!important}
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${COLORS.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">

  <!--[if mso]><table role="presentation" width="100%"><tr><td><![endif]-->

  <!-- Preheader (versteckt, nur als Vorschautext) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    ${escapeHtml(preheaderText)}${preheaderPadding}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-wrapper" style="background:${COLORS.bg};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="padding-bottom:24px;text-align:center;">
          <a href="https://${DOMAIN}" target="_blank" style="text-decoration:none;">
            <span style="font-size:22px;font-weight:800;color:${COLORS.primary};letter-spacing:-.02em;">${escapeHtml(APP_NAME)}</span>
          </a>
        </td></tr>

        <!-- Card -->
        <tr><td>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-card"
                 style="background:${COLORS.card};border-radius:12px;padding:40px 48px;box-shadow:0 1px 3px rgba(0,0,0,.06);">

            <!-- Betreff als H1 -->
            <tr><td style="padding-bottom:24px;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:${COLORS.text};line-height:1.3;">
                ${escapeHtml(opts.subject)}
              </h1>
            </td></tr>

            ${greetingHtml}
            ${blocksHtml}
            ${ctaHtml}

          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:28px 0 0 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="text-align:center;padding-bottom:12px;">
              <a href="https://${DOMAIN}/impressum" style="font-size:12px;color:${COLORS.muted};text-decoration:none;margin:0 8px;">Impressum</a>
              <a href="https://${DOMAIN}/datenschutz" style="font-size:12px;color:${COLORS.muted};text-decoration:none;margin:0 8px;">Datenschutz</a>
              <a href="https://${DOMAIN}/agb" style="font-size:12px;color:${COLORS.muted};text-decoration:none;margin:0 8px;">AGB</a>
            </td></tr>
            <tr><td style="text-align:center;padding-bottom:8px;">
              <p style="margin:0;font-size:12px;color:${COLORS.muted};">
                ${escapeHtml(APP_NAME)} &bull; offlimits IT &bull; Rheinberg, Deutschland
              </p>
            </td></tr>
            ${unsubscribeFooterHtml}
          </table>
        </td></tr>

      </table>
    </td></tr>
  </table>

  <!--[if mso]></td></tr></table><![endif]-->
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Plaintext-Fallback (automatisch generiert)
// ---------------------------------------------------------------------------

function buildPlaintext(opts: EmailOptions): string {
	const lines: string[] = [];

	lines.push(opts.subject);
	lines.push('='.repeat(Math.min(opts.subject.length, 60)));
	lines.push('');

	if (opts.greeting) {
		lines.push(opts.greeting);
		lines.push('');
	}

	for (const block of opts.blocks) {
		switch (block.type) {
			case 'text':
				lines.push(block.content, '');
				break;
			case 'html':
				// Einfaches HTML-Stripping fuer Plaintext
				lines.push(block.content.replace(/<[^>]+>/g, '').trim(), '');
				break;
			case 'divider':
				lines.push('-'.repeat(40), '');
				break;
			case 'list':
				for (let i = 0; i < block.items.length; i++) {
					lines.push(block.ordered ? `${i + 1}. ${block.items[i]}` : `- ${block.items[i]}`);
				}
				lines.push('');
				break;
			case 'code':
				if (block.label) lines.push(block.label + ':');
				lines.push(block.value, '');
				break;
			case 'keyvalue':
				for (const row of block.rows) {
					lines.push(`${row.label}: ${row.value}`);
				}
				lines.push('');
				break;
			case 'alert':
				lines.push(`[${block.level.toUpperCase()}] ${block.content}`, '');
				break;
			case 'button':
				lines.push(`${block.label}: ${block.url}`, '');
				break;
			default:
				break;
		}
	}

	if (opts.cta) {
		lines.push(`${opts.cta.label}:`);
		lines.push(opts.cta.url, '');
	}

	lines.push('--');
	lines.push(`${APP_NAME} - https://${DOMAIN}`);

	return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Öffentliche API
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// SMTP-Transport
// ---------------------------------------------------------------------------

type RawMailOptions = {
	from: string;
	to: string | string[];
	subject: string;
	html?: string;
	text?: string;
	replyTo?: string;
	headers?: Record<string, string>;
};

/** Schickt eine Mail ohne Template direkt über SMTP. Für einfache Plaintext-Mails oder Sonderfälle. */
export async function sendRawMail(opts: RawMailOptions): Promise<string | null> {
	const transporter = nodemailer.createTransport({
		host: SMTP_HOST,
		port: 465,
		secure: true,
		auth: { user: SMTP_USER, pass: SMTP_PASSWORD }
	});

	const info = await transporter.sendMail(opts);

	if (!info.accepted.length || info.rejected.length) {
		Logger.error('Error sending email:', info);
		return null;
	}
	return info.messageId;
}

// ---------------------------------------------------------------------------
// Template-Mail
// ---------------------------------------------------------------------------

export async function sendEmail(opts: EmailOptions): Promise<string | null> {
	const canUnsubscribe = UNSUBSCRIBABLE.has(opts.category);
	const unsubscribeUrl = canUnsubscribe ? `https://${DOMAIN}/unsubscribe` : null;

	const html = buildHtml(opts, unsubscribeUrl);
	const text = buildPlaintext(opts);

	const extraHeaders: Record<string, string> = {};

	if (canUnsubscribe && unsubscribeUrl) {
		// RFC 2369 + RFC 8058 (Gmail One-Click Unsubscribe)
		extraHeaders['List-Unsubscribe'] =
			`<${unsubscribeUrl}>, <mailto:unsubscribe@${DOMAIN}?subject=unsubscribe>`;
		extraHeaders['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
	}

	extraHeaders['X-Mailer'] = `${APP_NAME} Mailer`;
	extraHeaders['X-Entity-Ref-ID'] = crypto.randomUUID();

	return sendRawMail({
		from: opts.from ?? SENDERS[opts.category],
		to: opts.to,
		replyTo: opts.replyTo,
		subject: opts.subject,
		html,
		text,
		headers: extraHeaders
	});
}
