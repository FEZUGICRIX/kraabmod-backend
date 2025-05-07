import { pgClient } from './PgClient'

export const selectFrom = pgClient.select.bind(pgClient)
export const selectFromOne = pgClient.selectOne.bind(pgClient)
export const insertFrom = pgClient.insert.bind(pgClient)
export const updateFrom = pgClient.update.bind(pgClient)
export const deleteFrom = pgClient.delete.bind(pgClient)
