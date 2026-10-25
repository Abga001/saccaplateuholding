import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { MongoClient } from "mongodb";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());

let db;
const client = new MongoClient(process.env.MONGODB_URI);

client
  .connect()
  .then(() => {
    db = client.db("saccaplath");
    console.log("Connected to MongoDB");
  })
  .catch((error) => console.error("MongoDB connection failed:", error));

app.post("/api/subscribe", async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ message: "database not ready, try again shortly" });
    }

    const email = String(req.body?.email || "").trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    const collection = db.collection("userupdate");

    if (await collection.findOne({ email })) {
      return res.json({ message: "Email already subscribed" });
    }

    await collection.insertOne({ email, subscribedAt: new Date() });

    res.json({ message: "Subscribed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Serve the built frontend (after the API routes)
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));