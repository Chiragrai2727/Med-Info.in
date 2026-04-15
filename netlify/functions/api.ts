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

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_dummy",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "dummy_secret",
});

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Netlify API is running" });
});

router.get("/searchMedicine", async (req, res) => {
  try {
    const { query: searchQuery, lang = 'en' } = req.query;
    if (!searchQuery || typeof searchQuery !== 'string') {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    const medName = searchQuery.toLowerCase().trim();
    const cacheId = `${medName}_${lang}`.replace(/[^a-z0-9_]/g, '_');

    if (db) {
      try {
        const docRef = doc(db, 'medicines_cache', cacheId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return res.json({ source: 'cache', data: docSnap.data().data });
        }
      } catch (e) {
        console.error("Cache read error:", e);
      }
    }

    const languageMap: Record<string, string> = {
      'en': 'English',
      'hi': 'Hindi',
      'mr': 'Marathi',
      'ta': 'Tamil'
    };
    
    const prompt = `Provide detailed medical information for the medicine "${searchQuery}".
    The response MUST be in ${languageMap[lang as string] || 'English'}.
    Include all fields required by the schema accurately. For arrays, provide a list of strings.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            drug_name: { type: Type.STRING },
            brand_names_india: { type: Type.ARRAY, items: { type: Type.STRING } },
            category: { type: Type.STRING },
            drug_class: { type: Type.STRING },
            mechanism_of_action: { type: Type.STRING },
            uses: { type: Type.ARRAY, items: { type: Type.STRING } },
            dosage_common: { type: Type.STRING },
            side_effects_common: { type: Type.ARRAY, items: { type: Type.STRING } },
            side_effects_serious: { type: Type.ARRAY, items: { type: Type.STRING } },
            overdose_effects: { type: Type.STRING },
            contraindications: { type: Type.ARRAY, items: { type: Type.STRING } },
            drug_interactions: { type: Type.ARRAY, items: { type: Type.STRING } },
            pregnancy_safety: { type: Type.STRING },
            kidney_liver_warning: { type: Type.STRING },
            how_it_works_in_body: { type: Type.STRING },
            onset_of_action: { type: Type.STRING },
            duration_of_effect: { type: Type.STRING },
            prescription_required: { type: Type.BOOLEAN },
            ayurvedic_or_allopathic: { type: Type.STRING },
            india_regulatory_status: { type: Type.STRING },
            quick_summary: { type: Type.STRING },
            who_should_take: { type: Type.STRING },
            who_should_not_take: { type: Type.STRING },
            food_interactions: { type: Type.ARRAY, items: { type: Type.STRING } },
            alcohol_warning: { type: Type.STRING },
            missed_dose: { type: Type.STRING }
          },
          required: [
            "drug_name", "brand_names_india", "category", "drug_class", "mechanism_of_action",
            "uses", "dosage_common", "side_effects_common", "side_effects_serious", "overdose_effects",
            "contraindications", "drug_interactions", "pregnancy_safety", "kidney_liver_warning",
            "how_it_works_in_body", "onset_of_action", "duration_of_effect", "prescription_required",
            "ayurvedic_or_allopathic", "india_regulatory_status", "quick_summary", "who_should_take",
            "who_should_not_take", "food_interactions", "alcohol_warning", "missed_dose"
          ]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");

    if (db) {
      try {
        const docRef = doc(db, 'medicines_cache', cacheId);
        await setDoc(docRef, {
          data,
          createdAt: serverTimestamp()
        });
      } catch (e) {
        console.error("Cache write error:", e);
      }
    }

    res.json({ source: 'ai', data });
  } catch (error: any) {
    console.error("Error in /api/searchMedicine:", error?.message || error);
    if (error?.message?.includes("API key not valid")) {
      return res.status(500).json({ error: "Invalid API Key", details: "Please update your Gemini API key in the AI Studio Settings menu." });
    }
    res.status(500).json({ error: "Failed to fetch medicine details", details: error?.message || String(error) });
  }
});

  router.post("/scanMedication", async (req, res) => {
    try {
      const { base64Image, lang = 'en' } = req.body;
      if (!base64Image) return res.status(400).json({ error: "Image required" });

      const prompt = `Identify the medicine in this image. Provide its name, category, a brief description, and your confidence level (0-100).
      Language: ${lang}`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          prompt,
          { inlineData: { data: base64Image.split(',')[1] || base64Image, mimeType: "image/jpeg" } }
        ],
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              category: { type: Type.STRING },
              description: { type: Type.STRING },
              confidence: { type: Type.NUMBER }
            },
            required: ["name", "category", "description", "confidence"]
          }
        }
      });

      res.json(JSON.parse(response.text || "{}"));
    } catch (error: any) {
      console.error("Scan error:", error?.message || error);
      if (error?.message?.includes("API key not valid")) {
        return res.status(500).json({ error: "Invalid API Key", details: "Please update your Gemini API key in the AI Studio Settings menu." });
      }
      res.status(500).json({ error: "Failed to scan medication", details: error?.message || String(error) });
    }
  });

  router.post("/scanLabReport", async (req, res) => {
    try {
      const { base64Image, lang = 'en' } = req.body;
      if (!base64Image) return res.status(400).json({ error: "Image required" });

      const prompt = `Analyze this lab report image. Extract the patient name, test date, and all test parameters (name, value, unit, reference range).
      For each parameter, determine the status (Normal, High, Low, Critical) and provide a brief interpretation.
      Finally, provide an overall summary and recommendations.
      Language: ${lang}`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          prompt,
          { inlineData: { data: base64Image.split(',')[1] || base64Image, mimeType: "image/jpeg" } }
        ],
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              patient_name: { type: Type.STRING },
              test_date: { type: Type.STRING },
              parameters: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    value: { type: Type.STRING },
                    unit: { type: Type.STRING },
                    reference_range: { type: Type.STRING },
                    status: { type: Type.STRING },
                    interpretation: { type: Type.STRING }
                  },
                  required: ["name", "value", "unit", "reference_range", "status", "interpretation"]
                }
              },
              summary: { type: Type.STRING },
              recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
              abnormalFindings: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    testName: { type: Type.STRING },
                    result: { type: Type.STRING },
                    normalRange: { type: Type.STRING },
                    interpretation: { type: Type.STRING }
                  },
                  required: ["testName", "result", "normalRange", "interpretation"]
                }
              }
            },
            required: ["parameters", "summary", "recommendations"]
          }
        }
      });

      res.json(JSON.parse(response.text || "{}"));
    } catch (error: any) {
      console.error("Scan error:", error?.message || error);
      if (error?.message?.includes("API key not valid")) {
        return res.status(500).json({ error: "Invalid API Key", details: "Please update your Gemini API key in the AI Studio Settings menu." });
      }
      res.status(500).json({ error: "Failed to scan lab report", details: error?.message || String(error) });
    }
  });

router.post("/scanPrescription", async (req, res) => {
  try {
    const { base64Image, lang = 'en' } = req.body;
    if (!base64Image) return res.status(400).json({ error: "Image required" });

    const prompt = `Analyze this prescription image. Extract the medicines prescribed.
    Return JSON with:
    - patient_name (string or null)
    - doctor_name (string or null)
    - medicines (array of objects with: name, dosage, frequency, duration, instructions)
    - general_advice (string)
    Language: ${lang}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        prompt,
        { inlineData: { data: base64Image.split(',')[1] || base64Image, mimeType: "image/jpeg" } }
      ],
      config: { responseMimeType: "application/json" }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Scan error:", error?.message || error);
    if (error?.message?.includes("API key not valid")) {
      return res.status(500).json({ error: "Invalid API Key", details: "Please update your Gemini API key in the AI Studio Settings menu." });
    }
    res.status(500).json({ error: "Failed to scan prescription", details: error?.message || String(error) });
  }
});

router.post("/compareMedicines", async (req, res) => {
  try {
    const { med1, med2, lang = 'en' } = req.body;
    if (!med1 || !med2) return res.status(400).json({ error: "Two medicines required" });

    const prompt = `Compare the medicines "${med1}" and "${med2}".
    Language: ${lang}.
    Return JSON with:
    - similarities (array of strings)
    - differences (array of strings)
    - interactions (string describing if they interact with each other)
    - recommendation (string)`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Compare error:", error?.message || error);
    if (error?.message?.includes("API key not valid")) {
      return res.status(500).json({ error: "Invalid API Key", details: "Please update your Gemini API key in the AI Studio Settings menu." });
    }
    res.status(500).json({ error: "Failed to compare medicines", details: error?.message || String(error) });
  }
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

router.post("/conditionSearch", async (req, res) => {
  try {
    const { condition, lang = 'en' } = req.body;
    const prompt = `List 6 common medicines used for "${condition}" in India. 
    Language: ${lang}.
    Return JSON array of objects with: name, category, summary.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    res.json(JSON.parse(response.text || "[]"));
  } catch (error) {
    res.status(500).json({ error: "Condition search failed" });
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
