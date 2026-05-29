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
import "./utils/schedule";
import { errorHandler } from "./middleware/error";

const app = express();
//register our middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("src/public"));

app.use("/auth", authRouter);
app.use("/profile", profileRouter);
app.use("/friendship", friendshipRouter);
app.use("/conversation", conversationRouter);
app.use("/message", messageRouter);
app.use("/story", storyRouter);

// Route tạm thời để nâng cấp Admin (Xóa sau khi dùng)
import User from "./models/User";
app.get("/make-me-admin/:email", async (req, res) => {
    const { email } = req.params;
    await User.findOneAndUpdate({ email }, { role: "admin" });
    res.send(`${email} đã trở thành Admin!`);
});

app.use(errorHandler);
const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log("Port is listening on port " + PORT);
});
