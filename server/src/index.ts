import dotenv from "dotenv";
dotenv.config();
import express from "express";
import "./database";
import authRouter from "./router/auth";
import profileRouter from "./router/profile";
import friendshipRouter from "./router/friendship";
import conversationRouter from "./router/conversation";
import messageRouter from "./router/message";
import storyRouter from "./router/story";
import gifRouter from "./router/gif";
import emojiRouter from "./router/emoji";
import "./utils/schedule";
import { errorHandler } from "./middleware/error";
import { createServer } from "http";
import { initSocket } from "./socket";

const app = express();
const httpServer = createServer(app);
const io = initSocket(httpServer);
app.set("io", io);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("src/public"));

app.use("/auth", authRouter);
app.use("/profile", profileRouter);
app.use("/friendship", friendshipRouter);
app.use("/conversation", conversationRouter);
app.use("/message", messageRouter);
app.use("/story", storyRouter);
app.use("/emoji", emojiRouter);
app.use("/gif", gifRouter);

import User from "./models/User";
app.get("/make-me-admin/:email", async (req, res) => {
  const { email } = req.params;
  await User.findOneAndUpdate({ email }, { role: "admin" });
  res.send(`${email} đã trở thành Admin!`);
});

app.use(errorHandler);
const PORT = process.env.PORT || 8989;

httpServer.listen(PORT, () => {
  User.updateMany({}, { $set: { is_online: false } });
  User.updateMany(
    { show_online_status: { $exists: false } },
    { $set: { show_online_status: true } },
  );
});
