import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import User from "./models/User";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "./utils/variables";

export const initSocket = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("Authentication error"));

      const decode = jwt.verify(token, JWT_SECRET) as { userId: string };
      if (!decode || !decode.userId) return next(new Error("Authentication error"));

      socket.data.userId = decode.userId;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.data.userId;
    socket.join(userId);

    const user = await User.findByIdAndUpdate(userId, { is_online: true }, { returnDocument: 'after' });
    if (user && user.show_online_status) {
      socket.broadcast.emit("user-status", { 
        userId, 
        is_online: true,
        show_online_status: true
      });
    }

    socket.on("typing", (data: { conversationId: string; typing: boolean }) => {
      socket.to(data.conversationId).emit("typing-status", {
        userId,
        conversationId: data.conversationId,
        typing: data.typing,
      });
    });

    socket.on("join-conversation", (conversationId: string) => {
      socket.join(conversationId);
    });

    socket.on("leave-conversation", (conversationId: string) => {
      socket.leave(conversationId);
    });

    socket.on("disconnect", async () => {
      const activeSockets = await io.in(userId).fetchSockets();
      
      if (activeSockets.length === 0) {
        const lastSeen = new Date();
        const user = await User.findByIdAndUpdate(userId, {
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
    });
  });

  return io;
};
