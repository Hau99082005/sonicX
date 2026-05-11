"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const serviceAccount = {
    projectId: "sonicx-aafee",
    privateKey: (_a = process.env.FIREBASE_PRIVATE_KEY) === null || _a === void 0 ? void 0 : _a.replace(/\\n/g, "\n"),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};
const currentApps = (0, app_1.getApps)();
let auth;
if (!currentApps.length) {
    const app = (0, app_1.initializeApp)({ credential: (0, app_1.cert)(serviceAccount) });
    exports.auth = auth = (0, auth_1.getAuth)(app);
}
else {
    exports.auth = auth = (0, auth_1.getAuth)(currentApps[0]);
}
