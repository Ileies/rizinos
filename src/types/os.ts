import type { Desktop } from '$types/files';
import type { ContextMenu } from '$types/contextMenu';

export enum Theme {
	Light = 'autumn',
	Dark = 'sunset',
	Accent = 'valentine'
}

export interface Action {
	title: string;
	action: () => void;
}

export enum NotificationType {
	INFO = 'info',
	SUCCESS = 'success',
	WARNING = 'warning',
	ERROR = 'error'
}

export interface Notification {
	title: string;
	body: string;
	type: NotificationType;
	appId: string;
	actions: Action[];
	closable: boolean;
	createdAt: Date;
}

export interface Process {
	id: number;
	appId: string;
	isAdmin: boolean;
	isHidden: boolean; // true if background process
	isMinimized: boolean;
	isMaximized: boolean;
	zIndex: number;
	position: {
		top: number;
		left: number;
		height: number;
		width: number;
	};
}

export interface TaskbarItem {
	appId: string;
	isPinned: boolean;
	isFocused: boolean;
	hasWindows: number;
}

export interface Battery {
	level: number;
	isCharging: boolean;
	chargingTime: number;
	dischargingTime: number;
}

export interface OSData {
	isOnline: boolean;
	isMobile: boolean;
	isMuted: boolean;
	isAppLauncherOpen: boolean;
	volume: number;
	desktop: Desktop;
	processList: Process[];
	focusedProcessId: number | null;
	taskbar: string[]; // App ID list
	battery: Battery;
	startTime: Date;
	username: string;
	notifications: Notification[];
	contextMenu: ContextMenu | null;
	wallpaperUrl: string | null;
	theme: Theme;
	language: string;
	screenSize: { width: number; height: number; };
}
