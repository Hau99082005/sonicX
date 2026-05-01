import mongoose from "mongoose";
import dns from "dns";
import { URI } from "../utils/variables";

dns.setDefaultResultOrder("ipv4first");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

mongoose.set("strictQuery", true);
 
mongoose.connect(URI).then(() => {
    console.log('database is connected');
}).catch((error) => {
    console.log('database connection failed: ', error);
})