"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
require("./database");
const auth_1 = __importDefault(require("./router/auth"));
const audio_1 = __importDefault(require("./router/audio"));
const favorite_1 = __importDefault(require("./router/favorite"));
const playlist_1 = __importDefault(require("./router/playlist"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use(express_1.default.static('src/public'));
app.use("/auth", auth_1.default);
app.use("/audio", audio_1.default);
app.use("/favorite", favorite_1.default);
app.use("/playlist", playlist_1.default);
const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log('Port is listening on port ' + PORT);
});
