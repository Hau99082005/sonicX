"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const app_1 = require("firebase/app");
const auth_1 = require("firebase/auth");
const firebaseConfig = {
    apiKey: "AIzaSyB3G8mTuJgOTwHJPN56sV2ca7JhxN7eluY",
    authDomain: "sonicx-aafee.firebaseapp.com",
    projectId: "sonicx-aafee",
    storageBucket: "sonicx-aafee.firebasestorage.app",
    messagingSenderId: "739589186628",
    appId: "1:739589186628:web:d5ab4dc5de1734a8a74811",
    measurementId: "G-85E4VEBNWJ",
};
const currentApps = (0, app_1.getApps)();
let auth;
if (!currentApps.length) {
    const app = (0, app_1.initializeApp)(firebaseConfig);
    exports.auth = auth = (0, auth_1.getAuth)(app);
}
else {
    const app = currentApps[0];
    exports.auth = auth = (0, auth_1.getAuth)(app);
}
