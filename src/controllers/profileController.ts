import { Request, Response } from 'express'
import { deleteFrom, insertFrom, selectFrom } from '../database'
import { v4 as uuidv4 } from 'uuid'
import { generateSlug } from '../utils/functions'
import { ProfileTranslation, TranslationsMap } from '../types/profile'
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
        p.id, p.slug, p.images, p.price_list, p.videos, p.price, p.parameters_image,
        pt.locale, pt.title, pt.description, pt.full_description, pt.type, pt.product_variants, pt.section_type, pt.description_section, pt.configuration, pt.characteristics,
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

		res.setHeader('Content-Type', 'application/json; charset=utf-8')
		res.json(result ?? [])
	} catch (error) {
		console.error(error)
		res.status(500).json({ message: 'Ошибка при получении профилей' })
	}
}

export const getProfileBySlug = async (
	req: Request,
	res: Response
): Promise<void> => {
	try {
		const { slug } = req.params
		const { locale } = req.query

		if (!slug) {
			res.status(400).json({ message: 'slug is required' })
			return
		}

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
					p.id, p.slug, p.images, p.price_list, p.videos, p.price, p.parameters_image,
					pt.locale, pt.title, pt.description, pt.full_description, pt.type, pt.product_variants, pt.section_type, pt.description_section, pt.configuration, pt.characteristics,
					${categoryField} AS category
				FROM profiles p
				LEFT JOIN profile_translations pt ON pt.profile_id = p.id AND pt.locale = $2
				LEFT JOIN categories c ON c.id = p.category_id
				WHERE p.slug = $1
			`,
			[slug, locale]
		)

		if (!profile || profile.length === 0) {
			res.status(404).json({ message: 'Профиль не найден' })
			return
		}

		res.setHeader('Content-Type', 'application/json; charset=utf-8')
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
		const {
			translations,
			category_id,
			price_list,
			videos,
			parameters_image,
			images,
			price,
		} = req.body

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
			`INSERT INTO profiles (id, slug, category_id, price_list, videos, images, price, parameters_image) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
			[
				id,
				slug,
				category_id,
				price_list,
				videos,
				images,
				price,
				parameters_image,
			]
		)

		if (!result) {
			res.status(500).json({ message: 'Ошибка при создании профиля' })
			return
		}

		for (const [
			locale,
			{
				title,
				description,
				full_description,
				description_section,
				type,
				product_variants,
				section_type,
				configuration,
				characteristics,
			},
		] of Object.entries(typedTranslations)) {
			if (!title) continue

			await insertFrom(
				`INSERT INTO profile_translations (id, profile_id, locale, title, description, full_description, type, product_variants, section_type, description_section, configuration, characteristics)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
				[
					uuidv4(),
					id,
					locale,
					title,
					description ?? null,
					full_description,
					type,
					product_variants,
					JSON.stringify(section_type),
					JSON.stringify(description_section),
					JSON.stringify(configuration),
					JSON.stringify(characteristics),
				]
			)
		}

		res.status(201).json({ id, slug })
	} catch (error) {
		console.error(error)
		res
			.status(500)
			.json({ message: `Ошибка при создании профиля: ${error}` })
	}
}

export const updateProfile = async (
	req: Request,
	res: Response
): Promise<void> => {
	try {
		const { id } = req.params
		const {
			translations,
			category_id,
			slug,
			images,
			price_list,
			videos,
			price,
		} = req.body as {
			translations?: Record<string, ProfileTranslation>
			category_id?: string
			slug?: string
			images?: any
			price_list?: any
			videos?: any
			price?: number
		}

		if (!id) {
			res.status(400).json({ message: 'id is required' })
			return
		}

		// Обновление таблицы profiles
		const updates: string[] = []
		const values: any[] = []
		let index = 1

		if (slug) {
			updates.push(`slug = $${index++}`)
			values.push(slug)
		}
		if (category_id) {
			updates.push(`category_id = $${index++}`)
			values.push(category_id)
		}
		if (images) {
			updates.push(`images = $${index++}`)
			values.push(images)
		}
		if (price_list) {
			updates.push(`price_list = $${index++}`)
			values.push(price_list)
		}
		if (price) {
			updates.push(`price = $${index++}`)
			values.push(price)
		}
		if (videos) {
			updates.push(`videos = $${index++}`)
			values.push(videos)
		}

		if (updates.length > 0) {
			await insertFrom(
				`UPDATE profiles SET ${updates.join(', ')} WHERE id = $${index}`,
				[...values, id]
			)
		}

		// Обновление переводов
		if (translations && typeof translations === 'object') {
			for (const [locale, data] of Object.entries(translations)) {
				const fields = []
				const values = []
				let index = 1

				if (data.title !== undefined) {
					fields.push(`title = $${index++}`)
					values.push(data.title)
				}
				if (data.description !== undefined) {
					fields.push(`description = $${index++}`)
					values.push(data.description)
				}
				if (data.full_description !== undefined) {
					fields.push(`full_description = $${index++}`)
					values.push(data.full_description)
				}
				if (data.type !== undefined) {
					fields.push(`type = $${index++}`)
					values.push(data.type)
				}
				if (data.product_variants !== undefined) {
					fields.push(`product_variants = $${index++}`)
					values.push(data.product_variants)
				}
				if (data.section_type !== undefined) {
					fields.push(`section_type = $${index++}`)
					values.push(JSON.stringify(data.section_type))
				}
				if (data.description_section !== undefined) {
					fields.push(`description_section = $${index++}`)
					values.push(JSON.stringify(data.description_section))
				}
				if (data.configuration !== undefined) {
					fields.push(`configuration = $${index++}`)
					values.push(JSON.stringify(data.configuration))
				}
				if (data.characteristics !== undefined) {
					fields.push(`characteristics = $${index++}`)
					values.push(JSON.stringify(data.characteristics))
				}

				if (fields.length > 0) {
					await insertFrom(
						`UPDATE profile_translations SET ${fields.join(
							', '
						)} WHERE profile_id = $${index} AND locale = $${index + 1}`,
						[...values, id, locale]
					)
				}
			}
		}

		res.json({ message: 'Профиль успешно обновлён' })
	} catch (error) {
		console.error(error)
		res.status(500).json({ message: 'Ошибка при обновлении профиля' })
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
