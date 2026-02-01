import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import mongoose from "mongoose";
import User from "../models/user.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "..", "..", ".env") });

const run = async () => {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 8000,
  });
  console.log("Connected. Updating users...");
  const users = await User.find({}, "_id");
  const ids = users.map((u) => u._id.toString());
  const bulk = users.map((u) => ({
    updateOne: {
      filter: { _id: u._id },
      update: {
        $set: {
          following: ids.filter((id) => id !== u._id.toString()),
          followers: ids.filter((id) => id !== u._id.toString()),
        },
      },
    },
  }));

  if (bulk.length) {
    await User.bulkWrite(bulk);
  }
  console.log(`Updated ${users.length} users`);
  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
