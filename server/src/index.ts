import dotenv from "dotenv";
dotenv.config();
import express from "express";
import "./database";
import authRouter from "./router/auth";
import audioRouter from "./router/audio";
import favoriteRouter from "./router/favorite";
import playlistRouter from "./router/playlist";
import profileRouter from "./router/profile";
import historyRouter from "./router/history";
import bannerRouter from "./router/banner";
import dynamicMusicRouter from "./router/dynamicMusic";
import "./utils/schedule";
import { errorHandler } from "./middleware/error";

const app = express();
//register our middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("src/public"));

app.use("/auth", authRouter);
app.use("/audio", audioRouter);
app.use("/favorite", favoriteRouter);
app.use("/playlist", playlistRouter);
app.use("/profile", profileRouter);
app.use("/history", historyRouter);
app.use("/banner", bannerRouter);
app.use("/dynamic-music", dynamicMusicRouter);

// Route tạm thời để nâng cấp Admin (Xóa sau khi dùng)
import User from "./models/User";
app.get("/make-me-admin/:email", async (req, res) => {
    const { email } = req.params;
    await User.findOneAndUpdate({ email }, { role: "admin" });
    res.send(`${email} đã trở thành Admin!`);
});
app.use("/api/dynamic", dynamicMusicRouter);

app.use(errorHandler);
const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log("Port is listening on port " + PORT);
});
