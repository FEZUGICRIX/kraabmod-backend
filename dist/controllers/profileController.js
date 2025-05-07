"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProfile = exports.createProfile = exports.getProfileById = exports.getProfiles = void 0;
const database_1 = require("../database");
const uuid_1 = require("uuid");
const functions_1 = require("../utils/functions");
const locales_1 = require("../types/locales");
const constants_1 = require("../constants");
const getProfiles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { locale, categoryId } = req.query;
        if (!locale || typeof locale !== 'string') {
            res.status(400).json({ message: 'locale is required' });
            return;
        }
        if (!locales_1.SUPPORTED_LOCALES.includes(locale)) {
            res.status(400).json({ message: `Unsupported locale: ${locale}` });
            return;
        }
        if (categoryId && typeof categoryId !== 'string') {
            res
                .status(400)
                .json({ message: 'categoryId must be a string (UUID)' });
            return;
        }
        const categoryField = locale === 'fi' ? 'c.name_fi' : 'c.name_en';
        const filters = ['pt.locale = $1'];
        const values = [locale];
        if (categoryId) {
            filters.push('p.category_id = $2');
            values.push(categoryId);
        }
        const whereClause = filters.length
            ? `WHERE ${filters.join(' AND ')}`
            : '';
        const result = yield (0, database_1.selectFrom)(`
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
      `, values);
        res.json(result !== null && result !== void 0 ? result : []);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка при получении профилей' });
    }
});
exports.getProfiles = getProfiles;
const getProfileById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { locale } = req.query;
        if (!locale || typeof locale !== 'string') {
            res.status(400).json({ message: 'locale is required' });
            return;
        }
        if (!locales_1.SUPPORTED_LOCALES.includes(locale)) {
            res.status(400).json({ message: `Unsupported locale: ${locale}` });
            return;
        }
        const categoryField = locale === 'fi' ? 'c.name_fi' : 'c.name_en';
        const profile = yield (0, database_1.selectFrom)(`
      SELECT 
        p.id, p.slug,
        pt.locale, pt.title, pt.description, pt.full_description, pt.type,
        ${categoryField} AS category
      FROM profiles p
      LEFT JOIN profile_translations pt ON pt.profile_id = p.id AND pt.locale = $2
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.id = $1
      `, [id, locale]);
        if (!profile || profile.length === 0) {
            res.status(404).json({ message: 'Профиль не найден' });
            return;
        }
        res.json(profile[0]);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка при получении профиля' });
    }
});
exports.getProfileById = getProfileById;
const createProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { translations, category_id } = req.body;
        if (!translations || typeof translations !== 'object') {
            res.status(400).json({ message: 'translations are required' });
            return;
        }
        const id = (0, uuid_1.v4)();
        const slug = (0, functions_1.generateSlug)(translations.en.title);
        // Проверка на обязательные локали
        for (const locale of constants_1.REQUIRED_LOCALES) {
            const data = translations[locale];
            if (!data || typeof data !== 'object') {
                res
                    .status(400)
                    .json({ message: `Missing translation for locale: ${locale}` });
                return;
            }
            for (const field of constants_1.REQUIRED_FIELDS) {
                if (!data[field]) {
                    res.status(400).json({
                        message: `Missing field "${field}" in locale: ${locale}`,
                    });
                    return;
                }
            }
        }
        // Приведение к нужному типу
        const typedTranslations = translations;
        // Вставляем профиль и получаем результат
        const result = yield (0, database_1.insertFrom)(`INSERT INTO profiles (id, slug, category_id) VALUES ($1, $2, $3) RETURNING id`, [id, slug, category_id]);
        if (!result) {
            res.status(500).json({ message: 'Ошибка при создании профиля' });
            return;
        }
        for (const [locale, { title, description, full_description, type },] of Object.entries(typedTranslations)) {
            if (!title)
                continue;
            yield (0, database_1.insertFrom)(`INSERT INTO profile_translations (id, profile_id, locale, title, description, full_description, type)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
                (0, uuid_1.v4)(),
                id,
                locale,
                title,
                description !== null && description !== void 0 ? description : null,
                full_description,
                type,
            ]);
        }
        res.status(201).json({ id, slug });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка при создании профиля' });
    }
});
exports.createProfile = createProfile;
const deleteProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json('Отсутствует id');
            return;
        }
        const result = yield (0, database_1.deleteFrom)(`DELETE FROM profiles WHERE id = $1`, [
            id,
        ]);
        if (result) {
            res.json({
                message: 'Profile deleted successfully',
                successful: true,
            });
        }
        else {
            res
                .status(404)
                .json({ message: 'Profile not found', successful: false });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка при удалении профиля' });
    }
});
exports.deleteProfile = deleteProfile;
