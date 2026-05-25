"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const variables_1 = require("../utils/variables");
const app_1 = require("firebase/app");
const auth_1 = require("firebase/auth");
const firebaseConfig = {
    apiKey: variables_1.API_KEY_FIREBASE,
    authDomain: variables_1.AUTHDOMAIN,
    projectId: variables_1.ProjectID,
    storageBucket: variables_1.StorageBucket,
    messagingSenderId: variables_1.MessagingSenderId,
    appId: variables_1.AppId,
    measurementId: variables_1.MeasurementId,
};
const app = (0, app_1.initializeApp)(firebaseConfig);
exports.auth = (0, auth_1.getAuth)(app);
