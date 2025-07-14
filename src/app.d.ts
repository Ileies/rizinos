// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import type { Device } from '$types/device';
import type { UserData } from '$types';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			ip: string;
			user: UserData | null;
			device: Device | null;
			apiSession: ApiSession | null;
		}

		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface ApiSession {
		token: string;
		userId: string;
		expires: Date;
		createdAt: Date;
	}

	interface AppMessage<T = unknown> {
		type: string;
		data: T;
	}

	interface Window {
		dataLayer: unknown[];
	}

	interface BatteryManager extends EventTarget {
		charging: boolean;
		chargingTime: number;
		dischargingTime: number;
		level: number;
		onchargingchange: () => void;
		onchargingtimechange: () => void;
		ondischargingtimechange: () => void;
		onlevelchange: () => void;
	}

	interface Navigator {
		getBattery: () => Promise<BatteryManager>;
	}
}

export {};
