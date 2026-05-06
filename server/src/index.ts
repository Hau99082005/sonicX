import dotenv from "dotenv";
dotenv.config();
import express from "express";
import './database';
import authRouter from "./router/auth";
import audioRouter from "./router/audio";
import favoriteRouter from "./router/favorite";
import playlistRouter from "./router/playlist";
import profileRouter from "./router/profile";

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
const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log('Port is listening on port ' + PORT);
})