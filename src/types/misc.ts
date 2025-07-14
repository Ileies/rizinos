export type ID = `${number}`;

export interface IpInfo {
	status: string; // "success"
	country: string; // "Germany"
	countryCode: string; // "DE"
	region: string; // "NW"
	regionName: string; // "North Rhine-Westphalia"
	city: string; // "Cologne"
	zip: string; // "50670"
	lat: number; // 50.1234
	lon: number; // 6.1234
	timezone: string; // "Europe/Berlin"
	isp: string; // "NetCologne Gesellschaft fur Telekommunikation mbH"
	org: string; // "NetCologne Gesellschaft fuer Telekommunikation mbH"
	as: string; // "AS8422 NetCologne Gesellschaft fur Telekommunikation mbH"
	query: string; // "129.0.0.1"
}

export enum LogLevel {
	INFO = 'info',
	WARNING = 'warning',
	ERROR = 'error',
	DEBUG = 'debug'
}