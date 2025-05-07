import { Pool, PoolConfig, QueryResult, QueryResultRow } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

class PgClient {
	private pool: Pool

	constructor() {
		// Проверка наличия переменных окружения перед подключением к базе
		this.checkEnvVariables()
		this.pool = new Pool(this.getConfig())
		this.pool.on('error', this.handleError)
	}

	// Проверка наличия переменных окружения
	private checkEnvVariables() {
		const requiredEnvVars = [
			'DB_USER',
			'DB_HOST',
			'DB_DATABASE',
			'DB_PASSWORD',
			'DB_PORT',
		]

		for (const envVar of requiredEnvVars) {
			if (!process.env[envVar]) {
				throw new Error(`Missing required environment variable: ${envVar}`)
			}
		}
	}

	// Конфигурация подключения к базе
	private getConfig(): PoolConfig {
		return {
			user: process.env.DB_USER!,
			host: process.env.DB_HOST!,
			database: process.env.DB_DATABASE!,
			password: process.env.DB_PASSWORD!,
			port: Number(process.env.DB_PORT),
		}
	}

	// Обработка ошибок PostgreSQL
	private handleError = (err: Error) => {
		console.error('PostgreSQL error:', err)
		// Проверка на ошибки с кодами, начинающимися с "5"
		if ((err as any).code?.startsWith('5')) {
			this.tryReconnect(5000)
		}
	}

	// Попытка переподключения к базе данных
	private tryReconnect(delay: number) {
		setTimeout(() => {
			console.warn('Reconnecting to PostgreSQL...')
			this.pool.end() // Закрытие старого подключения
			this.pool = new Pool(this.getConfig())
			this.pool.on('error', this.handleError)
		}, delay)
	}

	// Метод для выполнения SELECT-запросов
	async select<T extends QueryResultRow>(
		sql: string,
		params: any[] = []
	): Promise<T[] | null> {
		try {
			const { rows } = await this.pool.query<T>(sql, params)
			return rows
		} catch (error) {
			console.error('Error during select operation:', error)
			return null
		}
	}

	// Метод для выполнения SELECT-запроса, возвращающего одну строку
	async selectOne<T extends QueryResultRow>(
		sql: string,
		params: any[] = []
	): Promise<T | null> {
		try {
			const { rows } = await this.pool.query<T>(sql, params)
			return rows[0] ?? null
		} catch (error) {
			console.error('Error during selectOne operation:', error)
			return null
		}
	}

	// Метод для выполнения INSERT-запросов с возвратом id
	async insert<T extends { id: string | number } = { id: number }>(
		sql: string,
		params: any[] = []
	): Promise<T[] | null> {
		try {
			const { rows } = await this.pool.query(sql, params)
			return rows
		} catch (error) {
			console.error('Error during insert operation:', error)
			return null
		}
	}

	// Метод для выполнения UPDATE-запросов
	async update(sql: string, params: any[] = []): Promise<boolean> {
		try {
			const result: QueryResult = await this.pool.query(sql, params)
			return result.rowCount !== null && result.rowCount > 0
		} catch (error) {
			console.error('Error during update operation:', error)
			return false
		}
	}

	// Метод для выполнения DELETE-запросов
	async delete(sql: string, params: any[] = []): Promise<boolean> {
		try {
			const result: QueryResult = await this.pool.query(sql, params)
			return result.rowCount !== null && result.rowCount > 0
		} catch (error) {
			console.error('Error during delete operation:', error)
			return false
		}
	}

	// Закрытие соединения с базой данных
	end(): void {
		console.info('PostgreSQL disconnected')
		this.pool.end()
	}
}

export const pgClient = new PgClient()
