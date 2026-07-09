/** Reads `${prefix}Sort` / `${prefix}Dir` query params into a relational-query `orderBy` object, if the field is allowed. */
export function parseSort<F extends string>(
	url: URL,
	prefix: string,
	allowedFields: readonly F[]
): Record<F, 'asc' | 'desc'> | undefined {
	const field = url.searchParams.get(`${prefix}Sort`) as F | null;
	if (!field || !allowedFields.includes(field)) return undefined;
	const dir = url.searchParams.get(`${prefix}Dir`) === 'desc' ? 'desc' : 'asc';
	return { [field]: dir } as Record<F, 'asc' | 'desc'>;
}

/** Reads `${prefix}Page` / `${prefix}PageSize` query params and returns Drizzle limit/offset. */
export function parsePage(url: URL, prefix: string, defaultPageSize = 25) {
	const page = Math.max(1, Number(url.searchParams.get(`${prefix}Page`)) || 1);
	const pageSize = Number(url.searchParams.get(`${prefix}PageSize`)) || defaultPageSize;
	return { limit: pageSize, offset: (page - 1) * pageSize };
}
