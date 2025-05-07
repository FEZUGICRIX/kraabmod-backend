"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFrom = exports.updateFrom = exports.insertFrom = exports.selectFromOne = exports.selectFrom = void 0;
const PgClient_1 = require("./PgClient");
exports.selectFrom = PgClient_1.pgClient.select.bind(PgClient_1.pgClient);
exports.selectFromOne = PgClient_1.pgClient.selectOne.bind(PgClient_1.pgClient);
exports.insertFrom = PgClient_1.pgClient.insert.bind(PgClient_1.pgClient);
exports.updateFrom = PgClient_1.pgClient.update.bind(PgClient_1.pgClient);
exports.deleteFrom = PgClient_1.pgClient.delete.bind(PgClient_1.pgClient);
