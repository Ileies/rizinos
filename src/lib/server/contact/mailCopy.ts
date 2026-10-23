import type { ContactLocale, ContactTopic } from './topics';

interface AutoReplyCopy {
	subject: (ref: string) => string;
	preheader: string;
	greeting: (name: string) => string;
	intro: string;
	reference: string;
	topic: string;
	subjectLabel: string;
	yourMessage: string;
	note: string;
	topics: Record<ContactTopic, string>;
}

/** Localised copy for the confirmation mail sent to the person who used the contact form. */
export const AUTO_REPLY: Record<ContactLocale, AutoReplyCopy> = {
	en: {
		subject: (ref) => `We received your message (${ref})`,
		preheader: 'Thanks for getting in touch. Keep this reference for follow-ups.',
		greeting: (name) => `Hello ${name},`,
		intro:
			'Thanks for contacting RizinOS. Your message has reached our team and we will reply by email.',
		reference: 'Reference',
		topic: 'Topic',
		subjectLabel: 'Subject',
		yourMessage: 'Your message',
		note: 'You can reply to this email to add details. Please keep the reference in the subject line. If you did not send this message, you can ignore this email.',
		topics: {
			general: 'General question',
			account: 'Account or login help',
			bug: 'Bug report',
			feedback: 'Feature request or feedback',
			security: 'Security disclosure',
			press: 'Press, partnership or business',
			legal: 'Abuse, legal or privacy request'
		}
	},
	de: {
		subject: (ref) => `Wir haben deine Nachricht erhalten (${ref})`,
		preheader: 'Danke für deine Nachricht. Bewahre diese Referenz für Rückfragen auf.',
		greeting: (name) => `Hallo ${name},`,
		intro:
			'Danke, dass du dich an RizinOS wendest. Deine Nachricht ist bei unserem Team angekommen und wir antworten per E-Mail.',
		reference: 'Referenz',
		topic: 'Thema',
		subjectLabel: 'Betreff',
		yourMessage: 'Deine Nachricht',
		note: 'Du kannst auf diese E-Mail antworten, um Details zu ergänzen. Bitte lass die Referenz im Betreff stehen. Falls du diese Nachricht nicht gesendet hast, kannst du diese E-Mail ignorieren.',
		topics: {
			general: 'Allgemeine Frage',
			account: 'Hilfe zu Konto oder Anmeldung',
			bug: 'Fehlerbericht',
			feedback: 'Feature-Wunsch oder Feedback',
			security: 'Sicherheitsmeldung',
			press: 'Presse, Partnerschaft oder Geschäftliches',
			legal: 'Missbrauch, Rechtliches oder Datenschutz'
		}
	},
	cn: {
		subject: (ref) => `我们已收到你的消息（${ref}）`,
		preheader: '感谢你的来信。请保留此参考编号以便后续沟通。',
		greeting: (name) => `你好 ${name}，`,
		intro: '感谢你联系 RizinOS。你的消息已送达我们的团队，我们会通过电子邮件回复你。',
		reference: '参考编号',
		topic: '主题',
		subjectLabel: '标题',
		yourMessage: '你的消息',
		note: '你可以直接回复此邮件补充细节，请保留主题中的参考编号。如果这不是你发送的消息，请忽略此邮件。',
		topics: {
			general: '一般问题',
			account: '账户或登录帮助',
			bug: '错误报告',
			feedback: '功能建议或反馈',
			security: '安全漏洞披露',
			press: '媒体、合作或商务',
			legal: '滥用、法律或隐私请求'
		}
	},
	ru: {
		subject: (ref) => `Мы получили ваше сообщение (${ref})`,
		preheader: 'Спасибо за обращение. Сохраните этот номер для дальнейшей переписки.',
		greeting: (name) => `Здравствуйте, ${name}!`,
		intro:
			'Спасибо, что обратились в RizinOS. Ваше сообщение дошло до нашей команды, мы ответим по электронной почте.',
		reference: 'Номер обращения',
		topic: 'Тема',
		subjectLabel: 'Заголовок',
		yourMessage: 'Ваше сообщение',
		note: 'Вы можете ответить на это письмо, чтобы добавить подробности. Пожалуйста, не удаляйте номер обращения из темы письма. Если вы не отправляли это сообщение, просто проигнорируйте письмо.',
		topics: {
			general: 'Общий вопрос',
			account: 'Помощь с аккаунтом или входом',
			bug: 'Сообщение об ошибке',
			feedback: 'Предложение или отзыв',
			security: 'Сообщение об уязвимости',
			press: 'Пресса, партнёрство или бизнес',
			legal: 'Нарушения, юридические вопросы или конфиденциальность'
		}
	}
};
