export interface ContextMenuAction {
	title: string;
	disabled?: (target: EventTarget) => Promise<boolean> | boolean;
	action: ((target: EventTarget) => void) | ContextMenuAction[];
}

export interface ContextMenu {
	x: number;
	y: number;
	target: HTMLElement;
	actions: ContextMenuAction[];
}
