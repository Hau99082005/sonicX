"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLOUD_SECRET = exports.CLOUD_KEY = exports.CLOUD_NAME = exports.JWT_SECRET = exports.SIGN_IN_LINK = exports.PASSWORD_RESET_URL = exports.VERIFICATION_EMAIL = exports.MAILTRAP_PASS = exports.MAILTRAP_USER = exports.URI = void 0;
const { env } = process;
exports.URI = env.URI, exports.MAILTRAP_USER = env.MAILTRAP_USER, exports.MAILTRAP_PASS = env.MAILTRAP_PASS, exports.VERIFICATION_EMAIL = env.VERIFICATION_EMAIL, exports.PASSWORD_RESET_URL = env.PASSWORD_RESET_URL, exports.SIGN_IN_LINK = env.SIGN_IN_LINK, exports.JWT_SECRET = env.JWT_SECRET, exports.CLOUD_NAME = env.CLOUD_NAME, exports.CLOUD_KEY = env.CLOUD_KEY, exports.CLOUD_SECRET = env.CLOUD_SECRET;
