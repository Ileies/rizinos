import { db } from '$db';
import { devices } from '$db/schema';
import { eq } from 'drizzle-orm';
import type { Device } from '$types';

export async function deviceLastOnline(deviceToken: string): Promise<Date | undefined> {
	return (await db.query.devices.findFirst({
		where: eq(devices.deviceToken, deviceToken),
		columns: { lastOnline: true }
	}))?.lastOnline;
}

export async function getDeviceByToken(deviceToken: string): Promise<Device | undefined> {
	return db.query.devices.findFirst({ where: eq(devices.deviceToken, deviceToken) });
}

export async function getDeviceBySession(sessionToken: string): Promise<Device | undefined> {
	return db.query.devices.findFirst({ where: eq(devices.sessionToken, sessionToken) });
}

// TODO: Think about this. Repair it
//static async getInfo(ip: string, userAgent: string): Promise<{ os: string; browser: string; countryCode: string; city: string; timezone: number; }> {
//	const { countryCode, city, timezone } = await (await fetch(`https://api.${process.env.domain}`)).json();
//	return { os, browser, countryCode, city, timezone };
//}
