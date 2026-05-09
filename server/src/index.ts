import dotenv from "dotenv";
dotenv.config();
import express from "express";
import './database';
import authRouter from "./router/auth";
import audioRouter from "./router/audio";
import favoriteRouter from "./router/favorite";
import playlistRouter from "./router/playlist";
import profileRouter from "./router/profile";
import historyRouter from "./router/history";
import './utils/schedule';
import { errorHandler } from "./middleware/error";

const app = express();
//register our middleware
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(express.static('src/public'));

app.use("/auth", authRouter);
app.use("/audio", audioRouter);
app.use("/favorite", favoriteRouter);
app.use("/playlist", playlistRouter);
app.use("/profile", profileRouter);
app.use("/history", historyRouter);

app.use(errorHandler);
const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log('Port is listening on port ' + PORT);
})