import type { devices } from '$db/schema';

export type Device = typeof devices.$inferInsert & {
	lastOnline: Date;
};
