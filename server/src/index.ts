import 'dotenv/config';
import express from "express";
import './database';

const app = express();
const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log('Port is listening on port ' + PORT);
})