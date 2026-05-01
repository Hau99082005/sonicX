import mongoose from "mongoose";
import dns from "dns";

dns.setDefaultResultOrder("ipv4first");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const connectDB = () => {
    const URI = process.env.MONGO_URI as string;
    mongoose.connect(URI).then(() => {
        console.log('database is connected');
    }).catch((error) => {
          console.log('database connection failed: ', error);
    });
};

connectDB();
