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
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
require("./database");
const auth_1 = __importDefault(require("./router/auth"));
const profile_1 = __importDefault(require("./router/profile"));
const friendship_1 = __importDefault(require("./router/friendship"));
const conversation_1 = __importDefault(require("./router/conversation"));
const message_1 = __importDefault(require("./router/message"));
const story_1 = __importDefault(require("./router/story"));
const gif_1 = __importDefault(require("./router/gif"));
const emoji_1 = __importDefault(require("./router/emoji"));
const search_1 = __importDefault(require("./router/search"));
const banner_1 = __importDefault(require("./router/banner"));
const notification_1 = __importDefault(require("./router/notification"));
require("./utils/schedule");
const error_1 = require("./middleware/error");
const http_1 = require("http");
const socket_1 = require("./socket");
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = (0, socket_1.initSocket)(httpServer);
app.set("io", io);
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use(express_1.default.static("src/public"));
app.use("/auth", auth_1.default);
app.use("/profile", profile_1.default);
app.use("/friendship", friendship_1.default);
app.use("/conversation", conversation_1.default);
app.use("/message", message_1.default);
app.use("/story", story_1.default);
app.use("/emoji", emoji_1.default);
app.use("/gif", gif_1.default);
app.use("/search", search_1.default);
app.use("/notification", notification_1.default);
app.use("/banner", banner_1.default);
const User_1 = __importDefault(require("./models/User"));
app.get("/make-me-admin/:email", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.params;
    yield User_1.default.findOneAndUpdate({ email }, { role: "admin" });
    res.send(`${email} đã trở thành Admin!`);
}));
app.use(error_1.errorHandler);
const PORT = process.env.PORT || 8989;
httpServer.listen(PORT, () => {
    User_1.default.updateMany({}, { $set: { is_online: false } });
    User_1.default.updateMany({ show_online_status: { $exists: false } }, { $set: { show_online_status: true } });
});
