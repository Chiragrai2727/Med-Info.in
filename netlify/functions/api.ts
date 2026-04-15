import express from "express";
import serverless from "serverless-http";
import Razorpay from "razorpay";
import crypto from "crypto";
import cors from "cors";
import { GoogleGenAI, Type } from "@google/genai";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import fs from "fs";
import path from "path";
import searchDir from "../../src/data/search_directory.json";

// Attempt to import the config directly so esbuild bundles it
let firebaseConfig: any = null;
try {
  // @ts-ignore
  firebaseConfig = require("../../firebase-applet-config.json");
} catch (e) {
  // Ignore
}

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Client SDK for backend use
let db: any = null;
try {
  if (firebaseConfig && firebaseConfig.projectId) {
    const firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)" ? firebaseConfig.firestoreDatabaseId : undefined);
  } else {
    // Fallback to env vars
    const envConfig = {
      apiKey: process.env.VITE_FIREBASE_API_KEY,
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.VITE_FIREBASE_APP_ID,
      firestoreDatabaseId: process.env.VITE_FIRESTORE_DATABASE_ID
    };
    if (envConfig.projectId) {
      const firebaseApp = initializeApp(envConfig);
      db = getFirestore(firebaseApp, envConfig.firestoreDatabaseId && envConfig.firestoreDatabaseId !== "(default)" ? envConfig.firestoreDatabaseId : undefined);
    }
  }
} catch (e) {
  console.error("Firebase init error in Netlify function:", e);
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

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Netlify API is running" });
});

router.get("/autocomplete", (req, res) => {
  try {
    const { query: q } = req.query;
    if (!q || typeof q !== 'string') return res.json([]);
    
    try {
      const results = searchDir
        .filter((m: any) => m.name.toLowerCase().includes(q.toLowerCase()) || m.category.toLowerCase().includes(q.toLowerCase()))
        .slice(0, 10);
      res.json(results);
    } catch (e) {
      console.error("Autocomplete file read error:", e);
      res.json([]);
    }
  } catch (error) {
    res.status(500).json({ error: "Autocomplete failed" });
  }
});

router.post("/create-order", async (req, res) => {
  try {
    const { plan } = req.body;
    let amount = 0;

    if (plan === "monthly") amount = 79;
    else if (plan === "yearly") amount = 849;
    else if (plan === "daily") amount = 99;
    else return res.status(400).json({ error: "Invalid plan" });

    const gst = amount * 0.18;
    const platformFee = amount * 0.02;
    const totalAmount = amount + gst + platformFee;

    const options = {
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json({ order, breakdown: { base: amount, gst, platformFee, total: totalAmount } });
  } catch (error: any) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: error.message || "Failed to create order", details: error });
  }
});

router.post("/verify-payment", (req, res) => {
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
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ error: error.message || "Failed to verify payment" });
  }
});

// Catch all possible path variations that Netlify might use
app.use("/", router);
app.use("/api", router);
app.use("/.netlify/functions/api", router);

// Catch-all for debugging 404s
app.use((req, res) => {
  console.log("404 Not Found:", req.method, req.path, req.url);
  res.status(404).json({ error: `Express route not found: ${req.method} ${req.path}` });
});

export const handler = serverless(app);
