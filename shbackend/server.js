import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);

let db;

async function startServer() {
  try {
    await client.connect();
    db = client.db("saccaplath");
    console.log("Connected to MongoDB");

    app.listen(process.env.PORT || 3001, () => {
      console.log(`Server running on port ${process.env.PORT || 3001}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error);
  }
}

app.post("/api/subscribe", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    const collection = db.collection("userupdate");

    const existing = await collection.findOne({ email });

    if (existing) {
      return res.json({ message: "Email already subscribed" });
    }

    await collection.insertOne({
      email,
      subscribedAt: new Date(),
    });

    res.json({ message: "Subscribed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

startServer();