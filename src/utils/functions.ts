import { v4 as uuidv4 } from 'uuid'

export const generateSlug = (title: string): string => {
	// Приводим название к нижнему регистру и заменяем пробелы на дефисы
	let slug = title.toLowerCase().replace(/\s+/g, '-')

	// Убираем все неалфавитные и нецифровые символы (например, спецсимволы)
	slug = slug.replace(/[^a-z0-9-]/g, '')

	// Добавляем короткий UUID в конец для уникальности
	const shortUuid = uuidv4().slice(0, 8) // Обрезаем UUID до 8 символов

	return `${slug}-${shortUuid}`
}
