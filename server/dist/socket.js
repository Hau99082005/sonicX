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
exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
const User_1 = __importDefault(require("./models/User"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const variables_1 = require("./utils/variables");
const initSocket = (server) => {
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });
    io.use((socket, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const token = socket.handshake.auth.token;
            if (!token)
                return next(new Error("Authentication error"));
            const decode = jsonwebtoken_1.default.verify(token, variables_1.JWT_SECRET);
            if (!decode || !decode.userId)
                return next(new Error("Authentication error"));
            socket.data.userId = decode.userId;
            next();
        }
        catch (error) {
            next(new Error("Authentication error"));
        }
    }));
    io.on("connection", (socket) => __awaiter(void 0, void 0, void 0, function* () {
        const userId = socket.data.userId;
        socket.join(userId);
        const user = yield User_1.default.findByIdAndUpdate(userId, { is_online: true }, { returnDocument: 'after' });
        if (user && user.show_online_status) {
            socket.broadcast.emit("user-status", {
                userId,
                is_online: true,
                show_online_status: true
            });
        }
        socket.on("typing", (data) => {
            socket.to(data.conversationId).emit("typing-status", {
                userId,
                conversationId: data.conversationId,
                typing: data.typing,
            });
        });
        socket.on("join-conversation", (conversationId) => {
            socket.join(conversationId);
        });
        socket.on("leave-conversation", (conversationId) => {
            socket.leave(conversationId);
        });
        socket.on("call-user", (data) => __awaiter(void 0, void 0, void 0, function* () {
            const fromUser = yield User_1.default.findById(data.from).select("username name avatar");
            socket.to(data.to).emit("incoming-call", {
                from: fromUser,
                conversationId: data.conversationId,
                type: data.type,
            });
        }));
        socket.on("start-outgoing-sound", () => {
            socket.emit("out-going-call");
        });
        socket.on("accept-call", (data) => {
            socket.to(data.to).emit("call-accepted", {
                conversationId: data.conversationId,
            });
        });
        socket.on("reject-call", (data) => {
            socket.to(data.to).emit("call-rejected", {
                conversationId: data.conversationId,
            });
        });
        socket.on("end-call", (data) => {
            socket.to(data.to).emit("call-ended", {
                conversationId: data.conversationId,
            });
        });
        socket.on("disconnect", () => __awaiter(void 0, void 0, void 0, function* () {
            const activeSockets = yield io.in(userId).fetchSockets();
            if (activeSockets.length === 0) {
                const lastSeen = new Date();
                const user = yield User_1.default.findByIdAndUpdate(userId, {
                    is_online: false,
                    last_seen: lastSeen,
                }, { returnDocument: 'after' });
                if (user && user.show_online_status) {
                    socket.broadcast.emit("user-status", {
                        userId,
                        is_online: false,
                        last_seen: lastSeen,
                        show_online_status: true
                    });
                }
            }
        }));
    }));
    return io;
};
exports.initSocket = initSocket;
