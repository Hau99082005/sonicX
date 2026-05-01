import 'dotenv/config';
import express from "express";
import './database';
import authRouter from "./router/auth";

const app = express();
//register our middleware
app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.use("/auth", authRouter);
const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log('Port is listening on port ' + PORT);
})