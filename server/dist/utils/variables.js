"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.URI = void 0;
const { env } = process;
exports.URI = env.MONGO_URI;
