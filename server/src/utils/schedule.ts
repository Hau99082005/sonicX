import cron from "node-cron";
import Story from "#/models/Story";

const dailyMaintenance = async () => {
    console.log("Running daily maintenance...");
}

cron.schedule("0 0 * * *", async () => {
    await dailyMaintenance()
})
