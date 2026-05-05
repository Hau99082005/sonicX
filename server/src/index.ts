import dotenv from "dotenv";
dotenv.config();
import express from "express";
import './database';
import authRouter from "./router/auth";
import audioRouter from "./router/audio";

const app = express();
//register our middleware
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(express.static('src/public'));

app.use("/auth", authRouter);
app.use("/audio", audioRouter);
const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log('Port is listening on port ' + PORT);
})