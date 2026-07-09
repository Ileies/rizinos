# E-Mail-System

Alle ausgehenden Mails laufen über `$lib/server/email.ts`. Es gibt zwei Funktionen:

- `sendEmail()` - Template-Mail mit automatischem HTML, Absender und RFC-Headers
- `sendRawMail()` - direkter SMTP-Versand ohne Template, für Plaintext oder Sonderfälle

## Verwendung

```ts
import { sendEmail, sendRawMail, SENDERS } from '$lib/server/email';

// Template-Mail (Normalfall)
await sendEmail({
	to: user.email,
	subject: 'Betreff',
	category: 'transactional',
	preheader: 'Kurzer Vorschautext (50-100 Zeichen)',
	greeting: `Hallo ${user.username},`,
	blocks: [/* siehe Blöcke unten */],
	cta: { label: 'Button-Text', url: 'https://...' }
});

// Ohne Template
await sendRawMail({
	from: SENDERS.system,
	to: 'empfaenger@example.com',
	subject: 'Betreff',
	text: 'Nur Plaintext.'
});
```

## Kategorien und Absenderadressen

Die `category` steuert Absender und ob ein Unsubscribe-Header gesetzt wird.

| Kategorie       | Absender         | Unsubscribe | Wofür                                        |
| --------------- | ---------------- | ----------- | -------------------------------------------- |
| `transactional` | `no-reply@`      | nein        | E-Mail-Bestätigung, Passwort-Reset, 2FA      |
| `security`      | `security@`      | nein        | Login von neuem Gerät, Sicherheitswarnungen  |
| `billing`       | `billing@`       | nein        | Rechnungen, Zahlungsbestätigungen            |
| `support`       | `support@`       | nein        | Support-Ticket-Bestätigungen, Antworten      |
| `alerts`        | `alerts@`        | nein        | Infrastruktur-/Monitoring-Alerts, Downtime   |
| `legal`         | `legal@`         | nein        | ToS-Änderungen, GDPR-Pflichtmitteilungen     |
| `welcome`       | `welcome@`       | ja          | Einmalige Willkommensmail nach Registrierung |
| `onboarding`    | `onboarding@`    | ja          | Mehrstufige Onboarding-Sequenzen             |
| `notifications` | `notifications@` | ja          | Allgemeine App- und OS-Benachrichtigungen    |
| `newsletter`    | `newsletter@`    | ja          | Marketing, Produktneuheiten                  |

Kategorien mit Unsubscribe setzen automatisch `List-Unsubscribe` (RFC 2369) und `List-Unsubscribe-Post` (RFC 8058) - das erzeugt in Gmail den Unsubscribe-Button oben in der Mail. Für sicherheits- und transaktionskritische Kategorien wird dieser Header bewusst weggelassen.

## Eingangspostfächer

Diese Adressen müssen im SMTP-Server als Postfächer eingerichtet sein. Sie empfangen keine automatisierten Mails, müssen aber erreichbar sein.

| Adresse        | Pflicht                                                              | Grund                                                                   |
| -------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `postmaster@`  | RFC 2821 - technisch vorgeschrieben                                  | Mail-Delivery-Probleme, von jedem Mail-Server erwartet                  |
| `abuse@`       | RFC 2142 - technisch vorgeschrieben                                  | Spam- und Missbrauchsmeldungen, von Hosting-Providern erwartet          |
| `unsubscribe@` | Pflicht solange wir es referenzieren                                 | Steht im `List-Unsubscribe`-Header aller abbestielbaren Mails           |
| `datenschutz@` | DSGVO Art. 12-22 - rechtlich relevant                                | DSGVO-Anfragen: Auskunft, Löschung, Datenportabilität                   |
| `security@`    | Haben wir als Absender, muss auch Eingang sein                       | Vulnerability Reports von Externen (responsible disclosure)             |
| `legal@`       | Haben wir als Absender, muss auch Eingang sein                       | Rechtliche Schreiben, Behördenanfragen, Abmahnungen                     |
| `sales@`       | Operativ wichtig                                                     | Enterprise-Sales-Anfragen, Lizenzanfragen - strikt getrennt von Support |
| `press@`       | Operativ wichtig                                                     | Presseanfragen, Medien, Journalisten                                    |
| `info@`        | Operativ wichtig                                                     | Allgemeiner Erstkontakt für Interessenten und Partner                   |
| `hostmaster@`  | RFC 2142                                                             | DNS-Probleme, von Registraren bei Domainangelegenheiten erwartet        |
| `dpo@`         | DSGVO Art. 37 - je nach Unternehmensgrösse gesetzlich vorgeschrieben | Datenschutzbeauftragter, direkte Kontaktmöglichkeit für Behörden        |

`postmaster@`, `abuse@` und `unsubscribe@` sind die dringendsten - ohne sie können Mails abgelehnt oder rechtliche Anforderungen verletzt werden.

## Parameter

| Feld        | Typ                  | Pflicht | Beschreibung                                     |
| ----------- | -------------------- | ------- | ------------------------------------------------ |
| `to`        | `string \| string[]` | ja      | Empfänger                                        |
| `subject`   | `string`             | ja      | Betreff (wird auch als H1 im Template angezeigt) |
| `category`  | `MailCategory`       | ja      | Steuert Absender und Unsubscribe                 |
| `preheader` | `string`             | nein    | Vorschautext im Posteingang (vor dem Öffnen)     |
| `greeting`  | `string`             | nein    | Anrede, z.B. `"Hallo Max,"`                      |
| `blocks`    | `EmailBlock[]`       | ja      | Inhaltsblöcke in Reihenfolge                     |
| `cta`       | `{ label, url }`     | nein    | Primärer Call-to-Action-Button am Ende           |
| `replyTo`   | `string`             | nein    | Reply-To-Adresse                                 |
| `from`      | `string`             | nein    | Überschreibt die automatische Absenderadresse    |

## Inhaltsblöcke

### `text`

Fliesstext. Zeilenumbrüche (`\n`) werden zu `<br>` konvertiert.

```ts
{ type: 'text', content: 'Erste Zeile.\nZweite Zeile.' }
```

### `html`

Rohes HTML für Sonderfälle.

```ts
{ type: 'html', content: '<strong>Fett</strong> und <em>kursiv</em>.' }
```

### `divider` / `spacer`

Trennlinie oder Leeraum.

```ts
{ type: 'divider' }
{ type: 'spacer', height: 32 }  // Standard: 16px
```

### `list`

Aufzählung, geordnet oder ungeordnet.

```ts
{ type: 'list', items: ['Punkt A', 'Punkt B'], ordered: false }
```

### `code`

Grosser Codeblock, z.B. für Verifizierungscodes. Dunkler Hintergrund, grosse Schrift.

```ts
{ type: 'code', value: '847291', label: 'Dein Bestätigungscode' }
```

### `keyvalue`

Tabelle für strukturierte Daten wie Rechnungsdetails.

```ts
{
  type: 'keyvalue',
  rows: [
    { label: 'Rechnungsnummer', value: '#2024-001' },
    { label: 'Betrag', value: '9,99 EUR' },
  ]
}
```

### `alert`

Farbiger Hinweiskasten.

```ts
{ type: 'alert', level: 'info', content: 'Hinweis...' }
{ type: 'alert', level: 'warning', content: 'Achtung...' }
{ type: 'alert', level: 'danger', content: 'Fehler...' }
```

### `button`

Sekundärer Button (zusätzlich zum `cta`-Parameter).

```ts
{ type: 'button', label: 'Details ansehen', url: 'https://...', secondary: true }
```

### `image`

Bild mit automatischer Skalierung auf Mobilgeräten.

```ts
{ type: 'image', src: 'https://...', alt: 'Beschreibung', width: 400 }
```

## Beispiele

### Passwort-Reset (transactional)

```ts
await sendEmail({
	to: user.email,
	subject: 'Passwort zurücksetzen',
	category: 'transactional',
	preheader: 'Hier ist dein Link zum Zurücksetzen deines Passworts.',
	greeting: `Hallo ${user.username},`,
	blocks: [
		{ type: 'text', content: 'Wir haben eine Anfrage erhalten, dein Passwort zurückzusetzen.' },
		{ type: 'alert', level: 'warning', content: 'Dieser Link ist nur 1 Stunde gültig.' }
	],
	cta: { label: 'Passwort zurücksetzen', url: resetUrl }
});
```

### Rechnung (billing)

```ts
await sendEmail({
	to: user.email,
	subject: `Rechnung #${invoice.number}`,
	category: 'billing',
	preheader: `Deine Rechnung über ${invoice.total} EUR ist bereit.`,
	greeting: `Hallo ${user.username},`,
	blocks: [
		{ type: 'text', content: 'Vielen Dank für dein Abonnement. Anbei deine Rechnung.' },
		{
			type: 'keyvalue',
			rows: [
				{ label: 'Rechnungsnummer', value: `#${invoice.number}` },
				{ label: 'Datum', value: invoice.date },
				{ label: 'Betrag', value: `${invoice.total} EUR` }
			]
		}
	],
	cta: { label: 'Rechnung herunterladen', url: invoice.pdfUrl }
});
```

### Sicherheitswarnung (security)

```ts
await sendEmail({
	to: user.email,
	subject: 'Neues Gerät angemeldet',
	category: 'security',
	preheader: 'Ein neues Gerät hat sich in deinen Account eingeloggt.',
	greeting: `Hallo ${user.username},`,
	blocks: [
		{ type: 'text', content: 'Ein neues Gerät hat sich soeben in deinen Account eingeloggt.' },
		{
			type: 'keyvalue',
			rows: [
				{ label: 'Gerät', value: device.name },
				{ label: 'Ort', value: device.location },
				{ label: 'Zeit', value: device.time }
			]
		},
		{ type: 'alert', level: 'danger', content: 'Warst du das nicht? Ändere sofort dein Passwort.' }
	],
	cta: { label: 'Account sichern', url: securityUrl }
});
```
