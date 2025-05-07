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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pgClient = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class PgClient {
    constructor() {
        // Обработка ошибок PostgreSQL
        this.handleError = (err) => {
            var _a;
            console.error('PostgreSQL error:', err);
            // Проверка на ошибки с кодами, начинающимися с "5"
            if ((_a = err.code) === null || _a === void 0 ? void 0 : _a.startsWith('5')) {
                this.tryReconnect(5000);
            }
        };
        // Проверка наличия переменных окружения перед подключением к базе
        this.checkEnvVariables();
        this.pool = new pg_1.Pool(this.getConfig());
        this.pool.on('error', this.handleError);
    }
    // Проверка наличия переменных окружения
    checkEnvVariables() {
        const requiredEnvVars = [
            'DB_USER',
            'DB_HOST',
            'DB_DATABASE',
            'DB_PASSWORD',
            'DB_PORT',
        ];
        for (const envVar of requiredEnvVars) {
            if (!process.env[envVar]) {
                throw new Error(`Missing required environment variable: ${envVar}`);
            }
        }
    }
    // Конфигурация подключения к базе
    getConfig() {
        return {
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_DATABASE,
            password: process.env.DB_PASSWORD,
            port: Number(process.env.DB_PORT),
        };
    }
    // Попытка переподключения к базе данных
    tryReconnect(delay) {
        setTimeout(() => {
            console.warn('Reconnecting to PostgreSQL...');
            this.pool.end(); // Закрытие старого подключения
            this.pool = new pg_1.Pool(this.getConfig());
            this.pool.on('error', this.handleError);
        }, delay);
    }
    // Метод для выполнения SELECT-запросов
    select(sql_1) {
        return __awaiter(this, arguments, void 0, function* (sql, params = []) {
            try {
                const { rows } = yield this.pool.query(sql, params);
                return rows;
            }
            catch (error) {
                console.error('Error during select operation:', error);
                return null;
            }
        });
    }
    // Метод для выполнения SELECT-запроса, возвращающего одну строку
    selectOne(sql_1) {
        return __awaiter(this, arguments, void 0, function* (sql, params = []) {
            var _a;
            try {
                const { rows } = yield this.pool.query(sql, params);
                return (_a = rows[0]) !== null && _a !== void 0 ? _a : null;
            }
            catch (error) {
                console.error('Error during selectOne operation:', error);
                return null;
            }
        });
    }
    // Метод для выполнения INSERT-запросов с возвратом id
    insert(sql_1) {
        return __awaiter(this, arguments, void 0, function* (sql, params = []) {
            try {
                const { rows } = yield this.pool.query(sql, params);
                return rows;
            }
            catch (error) {
                console.error('Error during insert operation:', error);
                return null;
            }
        });
    }
    // Метод для выполнения UPDATE-запросов
    update(sql_1) {
        return __awaiter(this, arguments, void 0, function* (sql, params = []) {
            try {
                const result = yield this.pool.query(sql, params);
                return result.rowCount !== null && result.rowCount > 0;
            }
            catch (error) {
                console.error('Error during update operation:', error);
                return false;
            }
        });
    }
    // Метод для выполнения DELETE-запросов
    delete(sql_1) {
        return __awaiter(this, arguments, void 0, function* (sql, params = []) {
            try {
                const result = yield this.pool.query(sql, params);
                return result.rowCount !== null && result.rowCount > 0;
            }
            catch (error) {
                console.error('Error during delete operation:', error);
                return false;
            }
        });
    }
    // Закрытие соединения с базой данных
    end() {
        console.info('PostgreSQL disconnected');
        this.pool.end();
    }
}
exports.pgClient = new PgClient();
