import { defineRelations } from 'drizzle-orm';
import * as schema from './schema';

export const relations = defineRelations(schema, (r) => ({
	users: {
		tokens: r.many.tokens(),
		mcUser: r.one.mcUsers({
			from: r.users.id,
			to: r.mcUsers.userId
		}),
		dcUser: r.one.dcUsers({
			from: r.users.id,
			to: r.dcUsers.userId
		})
	},
	tokens: {
		user: r.one.users({
			from: r.tokens.userId,
			to: r.users.id,
			optional: false
		}),
		deviceByDeviceToken: r.one.devices({
			from: r.tokens.token,
			to: r.devices.deviceToken
		}),
		deviceBySessionToken: r.one.devices({
			from: r.tokens.token,
			to: r.devices.sessionToken
		})
	},
	devices: {
		deviceTokenRelation: r.one.tokens({
			from: r.devices.deviceToken,
			to: r.tokens.token
		}),
		sessionTokenRelation: r.one.tokens({
			from: r.devices.sessionToken,
			to: r.tokens.token
		})
	},
	transactions: {
		sender: r.one.users({
			from: r.transactions.senderId,
			to: r.users.id
		}),
		receiver: r.one.users({
			from: r.transactions.receiverId,
			to: r.users.id
		})
	},
	mcUsers: {
		user: r.one.users({
			from: r.mcUsers.userId,
			to: r.users.id,
			optional: false
		})
	},
	mcWorlds: {
		group: r.one.mcWorldGroups({
			from: r.mcWorlds.groupName,
			to: r.mcWorldGroups.name,
			optional: false
		})
	},
	mcWorldGroups: {
		worlds: r.many.mcWorlds()
	},
	mcInventories: {
		owner: r.one.mcUsers({
			from: r.mcInventories.ownerUuid,
			to: r.mcUsers.uuid,
			optional: false
		}),
		world: r.one.mcWorldGroups({
			from: r.mcInventories.worldGroup,
			to: r.mcWorldGroups.name,
			optional: false
		})
	},
	minechatHooks: {
		server: r.one.minechatServers({
			from: r.minechatHooks.minecraftServerId,
			to: r.minechatServers.serverId
		})
	},
	minechatServers: {
		hook: r.one.minechatHooks({
			from: r.minechatServers.serverId,
			to: r.minechatHooks.minecraftServerId
		})
	},
	apps: {
		user: r.one.users({
			from: r.apps.authorId,
			to: r.users.id
		})
	},
	dcUsers: {
		user: r.one.users({
			from: r.dcUsers.userId,
			to: r.users.id
		})
	}
}));
