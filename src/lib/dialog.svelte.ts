type ConfirmState = {
	kind: 'confirm';
	message: string;
	resolve: (value: boolean) => void;
};

type PromptState = {
	kind: 'prompt';
	message: string;
	value: string;
	resolve: (value: string | null) => void;
};

export const dialog: { state: ConfirmState | PromptState | null } = $state({ state: null });

export function confirmDialog(message: string): Promise<boolean> {
	return new Promise((resolve) => {
		dialog.state = { kind: 'confirm', message, resolve };
	});
}

export function promptDialog(message: string, defaultValue = ''): Promise<string | null> {
	return new Promise((resolve) => {
		dialog.state = { kind: 'prompt', message, value: defaultValue, resolve };
	});
}
