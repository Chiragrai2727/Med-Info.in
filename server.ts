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
const firebaseConfigPath = path.join(__dirname, 'firebase-applet-config.json');
let db: any = null;
if (fs.existsSync(firebaseConfigPath)) {
  const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)" ? firebaseConfig.firestoreDatabaseId : undefined);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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

  app.get("/api/searchMedicine", async (req, res) => {
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

      // Cache miss, call Gemini
      const languageMap: Record<string, string> = {
        'en': 'English',
        'hi': 'Hindi',
        'mr': 'Marathi',
        'ta': 'Tamil'
      };
      
      const prompt = `Provide detailed medical information for the medicine "${searchQuery}".
      The response MUST be in ${languageMap[lang as string] || 'English'}.
      Include: drug_name, brand_names_india (array), category, uses (array), side_effects (array), dosage_guidelines, warnings, missed_dose_instructions, and india_regulatory_status (e.g., "CDSCO Approved", "Banned", "Prescription Required (Schedule H)", "OTC").`;

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
              uses: { type: Type.ARRAY, items: { type: Type.STRING } },
              side_effects: { type: Type.ARRAY, items: { type: Type.STRING } },
              dosage_guidelines: { type: Type.STRING },
              warnings: { type: Type.STRING },
              missed_dose_instructions: { type: Type.STRING },
              india_regulatory_status: { type: Type.STRING }
            },
            required: ["drug_name", "brand_names_india", "category", "uses", "side_effects", "dosage_guidelines", "warnings", "missed_dose_instructions", "india_regulatory_status"]
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
    } catch (error) {
      console.error("Error in /api/searchMedicine:", error);
      res.status(500).json({ error: "Failed to fetch medicine details" });
    }
  });

  app.post("/api/scanPrescription", async (req, res) => {
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
    } catch (error) {
      console.error("Scan error:", error);
      res.status(500).json({ error: "Failed to scan prescription" });
    }
  });

  app.post("/api/compareMedicines", async (req, res) => {
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
    } catch (error) {
      console.error("Compare error:", error);
      res.status(500).json({ error: "Failed to compare medicines" });
    }
  });

  app.get("/api/autocomplete", (req, res) => {
    try {
      const { query: q } = req.query;
      if (!q || typeof q !== 'string') return res.json([]);
      
      const searchDir = JSON.parse(fs.readFileSync(path.join(__dirname, 'src/data/search_directory.json'), 'utf8'));
      const results = searchDir
        .filter((m: any) => m.name.toLowerCase().includes(q.toLowerCase()) || m.category.toLowerCase().includes(q.toLowerCase()))
        .slice(0, 10);
        
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Autocomplete failed" });
    }
  });

  app.post("/api/conditionSearch", async (req, res) => {
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
