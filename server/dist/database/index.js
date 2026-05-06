"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dns_1 = __importDefault(require("dns"));
dns_1.default.setDefaultResultOrder("ipv4first");
dns_1.default.setServers(["1.1.1.1", "8.8.8.8"]);
const connectDB = () => {
    const URI = process.env.MONGO_URI;
    mongoose_1.default.connect(URI).then(() => {
        console.log('database is connected');
    }).catch((error) => {
        console.log('database connection failed: ', error);
    });
};
connectDB();
