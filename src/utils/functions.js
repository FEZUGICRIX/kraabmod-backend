"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSlug = void 0;
const uuid_1 = require("uuid");
const generateSlug = (title) => {
    // Приводим название к нижнему регистру и заменяем пробелы на дефисы
    let slug = title.toLowerCase().replace(/\s+/g, '-');
    // Убираем все неалфавитные и нецифровые символы (например, спецсимволы)
    slug = slug.replace(/[^a-z0-9-]/g, '');
    // Добавляем короткий UUID в конец для уникальности
    const shortUuid = (0, uuid_1.v4)().slice(0, 8); // Обрезаем UUID до 8 символов
    return `${slug}-${shortUuid}`;
};
exports.generateSlug = generateSlug;
