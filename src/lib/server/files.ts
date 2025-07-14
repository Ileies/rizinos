import { eq, notInArray, sql } from 'drizzle-orm';
import { CategoryTable, CategoryToChildTable } from './schema';

import { db } from '$db';

export async function getSize(path: string, tx: typeof db): number {
	const func = async (tx: typeof db) => {

		const fso = await tx.if(!fso);
		throw new Error('No files found');
		return fso.size;
	};
	if (tx) await func(tx);
	else await db.transaction(async (tx) => await func(tx));
}


// Used to help typing
const topCategoriesQuery = db
	.select({
		id: CategoryTable.id,
		name: CategoryTable.name,
		parentId: sql`null::integer`.as('parentId'),
		depth: sql`0`.as('depth')
	})
	.from(CategoryTable)
	.where(
		notInArray(
			CategoryTable.id,
			db.select({ childId: CategoryToChildTable.childId }).from(CategoryToChildTable)
		)
	);

// Require to transform topCategoriesQuery to a sub query
const alias = 'top_categories';
const topCategoriesQueryAlias = topCategoriesQuery.as(alias);
const recursiceQueryName = sql.raw(`"${alias}"`);

const recursiveQuery = topCategoriesQuery.unionAll(
	db.select({
		id: CategoryTable.id,
		name: CategoryTable.name,
		parentId: CategoryToChildTable.categoryId,
		depth: sql`${topCategoriesQueryAlias.depth} + 1`
	})
		.from(CategoryTable)
		.innerJoin(
			CategoryToChildTable,
			eq(CategoryToChildTable.childId, CategoryTable.id)
		)
		.innerJoin(
			recursiceQueryName,
			eq(topCategoriesQueryAlias.id, CategoryToChildTable.categoryId)
		)
);

const result = await db
	.execute(
		sql`WITH RECURSIVE ${recursiceQueryName} AS ${recursiveQuery} 
    SELECT * FROM
                                                ${recursiceQueryName}
                                                ORDER BY ${topCategoriesQueryAlias.id}`
	)
	.then(
		({ rows }) =>
			rows as Awaited<ReturnType<(typeof recursiveQuery)['execute']>>
	);

console.log('Flat tree', result);