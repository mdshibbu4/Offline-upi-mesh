import mongoose from "mongoose";

export default async function connectDB() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI missing in .env");
    return;
  }
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
  }
}
