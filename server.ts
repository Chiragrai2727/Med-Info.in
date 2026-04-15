import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Client SDK for backend use
const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
let db: any = null;
if (fs.existsSync(firebaseConfigPath)) {
  const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)" ? firebaseConfig.firestoreDatabaseId : undefined);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

if (!process.env.GEMINI_API_KEY) {
  console.warn("WARNING: GEMINI_API_KEY is not set in environment variables.");
}

const MODEL_NAME = "gemini-3-flash-preview";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_dummy",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "dummy_secret",
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "MedInfo India API is running" });
  });

  app.get("/api/autocomplete", (req, res) => {
    try {
      const { query: q } = req.query;
      if (!q || typeof q !== 'string') return res.json([]);
      
      const searchDir = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/data/search_directory.json'), 'utf8'));
      const results = searchDir
        .filter((m: any) => m.name.toLowerCase().includes(q.toLowerCase()) || m.category.toLowerCase().includes(q.toLowerCase()))
        .slice(0, 10);
        
      res.json(results);
    } catch (error) {
      console.error("Autocomplete error:", error);
      res.status(500).json({ error: "Autocomplete failed" });
    }
  });

  const handleCreateOrder = async (req: express.Request, res: express.Response) => {
    try {
      const { plan } = req.body;
      let amount = 0;

      // Base prices
      if (plan === "monthly") amount = 79;
      else if (plan === "yearly") amount = 849;
      else if (plan === "daily") amount = 99;
      else return res.status(400).json({ error: "Invalid plan" });

      // Calculate GST (18%) and Platform Fee (2%)
      const gst = amount * 0.18;
      const platformFee = amount * 0.02;
      const totalAmount = amount + gst + platformFee;

      // Razorpay expects amount in paise (multiply by 100)
      const options = {
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      };

      const order = await razorpay.orders.create(options);
      res.json({ order, breakdown: { base: amount, gst, platformFee, total: totalAmount } });
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  };

  app.post("/.netlify/functions/create-order", handleCreateOrder);

  const handleVerifyPayment = (req: express.Request, res: express.Response) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      const sign = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSign = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "dummy_secret")
        .update(sign.toString())
        .digest("hex");

      if (razorpay_signature === expectedSign) {
        return res.json({ success: true, message: "Payment verified successfully" });
      } else {
        return res.status(400).json({ success: false, message: "Invalid signature" });
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ error: "Failed to verify payment" });
    }
  };

  app.post("/.netlify/functions/verify-payment", handleVerifyPayment);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
