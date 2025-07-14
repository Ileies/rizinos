import type { OSData } from '$types';
import { Theme } from '$types';

/**
 * This is kind of like the Windows registry
 */
const os: OSData = $state({
	// Initial state of the OS
	isOnline: false,
	battery: {
		isCharging: false,
		level: 100,
		chargingTime: Infinity,
		dischargingTime: Infinity
	},
	startTime: new Date(),
	contextMenu: null,
	isAppLauncherOpen: false,

	// Initially loaded by server
	username: '',
	isMuted: false,
	isMobile: false,
	volume: 100,
	desktop: {
		files: [],
		cols: 0,
		rows: 0
	},
	focusedProcessId: null,
	processList: [],
	taskbar: [],
	notifications: [],
	wallpaperUrl: null,
	theme: Theme.Light,
	language: 'en',
	screenSize: { width: 0, height: 0 }

	// TODO: Haven't finished thinking about these
	//apps: {
	//  autoStart: [],
	//	defaultAppForFileType: "Maps file extensions to default apps (e.g., .txt → TextEditor).",
	//	autoUpdateEnabled: "Enables or disables automatic updates for apps.",
	//	allowBackgroundProcesses: "Configures whether apps can run in the background.",
	//	defaultPermissions: "Defines default permissions for newly installed apps."
	//},
	//directoryTree: {}
});

export default os;