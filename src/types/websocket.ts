import type { Device } from '$types/device';
import type { UserData } from '$types/user';

export interface WebsocketMessage {
	action: string;
	data: unknown;
	error?: Error;
}

export interface WebsocketData {
	user: UserData;
	device: Device;
}