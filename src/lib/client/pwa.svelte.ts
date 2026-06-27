type BeforeInstallPromptEvent = Event & {
	prompt(): Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const pwa = $state({
	deferredPrompt: null as BeforeInstallPromptEvent | null,
	isStandalone: false
});

export default pwa;
