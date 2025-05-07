import { Request, Response } from 'express'
import { deleteFrom, insertFrom, selectFrom } from '../database'
import { v4 as uuidv4 } from 'uuid'
import { generateSlug } from '../utils/functions'
import { TranslationsMap } from '../types/profile'
import { SUPPORTED_LOCALES, SupportedLocale } from '../types/locales'
import { REQUIRED_FIELDS, REQUIRED_LOCALES } from '../constants'

export const getProfiles = async (
	req: Request,
	res: Response
): Promise<void> => {
	try {
		const { locale, categoryId } = req.query

		if (!locale || typeof locale !== 'string') {
			res.status(400).json({ message: 'locale is required' })
			return
		}

		if (!SUPPORTED_LOCALES.includes(locale as SupportedLocale)) {
			res.status(400).json({ message: `Unsupported locale: ${locale}` })
			return
		}

		if (categoryId && typeof categoryId !== 'string') {
			res
				.status(400)
				.json({ message: 'categoryId must be a string (UUID)' })
			return
		}

		const categoryField = locale === 'fi' ? 'c.name_fi' : 'c.name_en'

		const filters: string[] = ['pt.locale = $1']
		const values: any[] = [locale]

		if (categoryId) {
			filters.push('p.category_id = $2')
			values.push(categoryId)
		}

		const whereClause = filters.length
			? `WHERE ${filters.join(' AND ')}`
			: ''

		const result = await selectFrom(
			`
      SELECT 
        p.id, p.slug,
        pt.locale, pt.title, pt.description, pt.full_description, pt.type,
        ${categoryField} AS category,
        c.id AS category_id
      FROM profiles p
      LEFT JOIN profile_translations pt ON p.id = pt.profile_id AND pt.locale = $1
      LEFT JOIN categories c ON c.id = p.category_id
      ${whereClause}
      ORDER BY p.created_at DESC
      `,
			values
		)

		res.json(result ?? [])
	} catch (error) {
		console.error(error)
		res.status(500).json({ message: 'Ошибка при получении профилей' })
	}
}

export const getProfileById = async (
	req: Request,
	res: Response
): Promise<void> => {
	try {
		const { id } = req.params
		const { locale } = req.query

		if (!locale || typeof locale !== 'string') {
			res.status(400).json({ message: 'locale is required' })
			return
		}

		if (!SUPPORTED_LOCALES.includes(locale as SupportedLocale)) {
			res.status(400).json({ message: `Unsupported locale: ${locale}` })
			return
		}

		const categoryField = locale === 'fi' ? 'c.name_fi' : 'c.name_en'

		const profile = await selectFrom(
			`
      SELECT 
        p.id, p.slug,
        pt.locale, pt.title, pt.description, pt.full_description, pt.type,
        ${categoryField} AS category
      FROM profiles p
      LEFT JOIN profile_translations pt ON pt.profile_id = p.id AND pt.locale = $2
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.id = $1
      `,
			[id, locale]
		)

		if (!profile || profile.length === 0) {
			res.status(404).json({ message: 'Профиль не найден' })
			return
		}

		res.json(profile[0])
	} catch (error) {
		console.error(error)
		res.status(500).json({ message: 'Ошибка при получении профиля' })
	}
}

export const createProfile = async (
	req: Request,
	res: Response
): Promise<void> => {
	try {
		const { translations, category_id } = req.body

		if (!translations || typeof translations !== 'object') {
			res.status(400).json({ message: 'translations are required' })
			return
		}

		const id = uuidv4()
		const slug = generateSlug(translations.en.title)

		// Проверка на обязательные локали
		for (const locale of REQUIRED_LOCALES) {
			const data = translations[locale]
			if (!data || typeof data !== 'object') {
				res
					.status(400)
					.json({ message: `Missing translation for locale: ${locale}` })
				return
			}

			for (const field of REQUIRED_FIELDS) {
				if (!data[field]) {
					res.status(400).json({
						message: `Missing field "${field}" in locale: ${locale}`,
					})
					return
				}
			}
		}

		// Приведение к нужному типу
		const typedTranslations = translations as TranslationsMap

		// Вставляем профиль и получаем результат
		const result = await insertFrom(
			`INSERT INTO profiles (id, slug, category_id) VALUES ($1, $2, $3) RETURNING id`,
			[id, slug, category_id]
		)

		if (!result) {
			res.status(500).json({ message: 'Ошибка при создании профиля' })
			return
		}

		for (const [
			locale,
			{ title, description, full_description, type },
		] of Object.entries(typedTranslations)) {
			if (!title) continue

			await insertFrom(
				`INSERT INTO profile_translations (id, profile_id, locale, title, description, full_description, type)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
				[
					uuidv4(),
					id,
					locale,
					title,
					description ?? null,
					full_description,
					type,
				]
			)
		}

		res.status(201).json({ id, slug })
	} catch (error) {
		console.error(error)
		res.status(500).json({ message: 'Ошибка при создании профиля' })
	}
}

export const deleteProfile = async (
	req: Request,
	res: Response
): Promise<void> => {
	try {
		const { id } = req.params

		if (!id) {
			res.status(400).json('Отсутствует id')
			return
		}

		const result = await deleteFrom(`DELETE FROM profiles WHERE id = $1`, [
			id,
		])

		if (result) {
			res.json({
				message: 'Profile deleted successfully',
				successful: true,
			})
		} else {
			res
				.status(404)
				.json({ message: 'Profile not found', successful: false })
		}
	} catch (error) {
		console.error(error)
		res.status(500).json({ message: 'Ошибка при удалении профиля' })
	}
}
