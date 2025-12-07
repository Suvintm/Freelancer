import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import { Profile } from "./models/Profile.js";
import { Portfolio } from "./models/Portfolio.js";
import { Reel } from "./models/Reel.js";
import User from "./models/User.js";

dotenv.config({ path: "./.env" });

const run = async () => {
    const results = {};
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");

        // Inspect "Travel" portfolio for antigravity
        const travelPortfolio = await Portfolio.findOne({ title: "Travel", user: "69346be8bf771102a6f36390" });
        results.travelPortfolio = travelPortfolio;

        fs.writeFileSync("debug_result.json", JSON.stringify(results, null, 2));
        console.log("Results written to debug_result.json");

    } catch (error) {
        console.error("Error:", error);
        fs.writeFileSync("debug_result.json", JSON.stringify({ error: error.message }, null, 2));
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected.");
    }
};

run();
