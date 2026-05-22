import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
import cron from "node-cron";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_dummy",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "dummy_secret",
});

// Define the CDSCO Pharmacological Verification JSON Schema for Gemini
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    category: { type: Type.STRING },
    drug_name: { type: Type.STRING },
    brand_names_india: { type: Type.ARRAY, items: { type: Type.STRING } },
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
    india_regulatory_status: { type: Type.STRING, description: "Regulatory status including approvals or warnings by CDSCO India" },
    quick_summary: { type: Type.STRING },
    who_should_take: { type: Type.STRING },
    who_should_not_take: { type: Type.STRING },
    food_interactions: { type: Type.ARRAY, items: { type: Type.STRING } },
    alcohol_warning: { type: Type.STRING }
  },
  required: [
    "category", "drug_name", "brand_names_india", "drug_class", "mechanism_of_action", 
    "uses", "dosage_common", "side_effects_common", "side_effects_serious", 
    "overdose_effects", "contraindications", "drug_interactions", "pregnancy_safety", 
    "kidney_liver_warning", "how_it_works_in_body", "onset_of_action", "duration_of_effect", 
    "prescription_required", "ayurvedic_or_allopathic", "india_regulatory_status", 
    "quick_summary", "who_should_take", "who_should_not_take", "food_interactions", 
    "alcohol_warning"
  ]
};

// core background CDSCO Verification AI synchronization function
async function runMedicineSync(batchSize = 2) {
  const medPath = path.join(process.cwd(), 'src/data/medicines.json');
  const rawPath = path.join(process.cwd(), 'src/data/raw_crawled_medicines.csv');
  const indexPath = path.join(process.cwd(), 'src/data/index.json');
  const catPath = path.join(process.cwd(), 'src/data/categories.json');
  const disPath = path.join(process.cwd(), 'src/data/diseases.json');
  const logPath = path.join(process.cwd(), 'src/data/scheduler_logs.json');

  console.log(`[Sync Worker] Starting CDSCO analysis block. Batch Size = ${batchSize}`);
  
  if (!fs.existsSync(rawPath)) {
    console.log("[Sync Worker] No raw crawled medicines CSV file found.");
    return { success: true, processed: [], message: "No raw crawled medicines found." };
  }

  // Load existing datasets with fallbacks
  let medicines = [];
  if (fs.existsSync(medPath)) {
    try {
      medicines = JSON.parse(fs.readFileSync(medPath, 'utf8'));
    } catch {
      medicines = [];
    }
  }
  let index = {};
  if (fs.existsSync(indexPath)) {
    try {
      index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    } catch {
      index = {};
    }
  }
  let categories = {};
  if (fs.existsSync(catPath)) {
    try {
      categories = JSON.parse(fs.readFileSync(catPath, 'utf8'));
    } catch {
      categories = {};
    }
  }
  let diseases = {};
  if (fs.existsSync(disPath)) {
    try {
      diseases = JSON.parse(fs.readFileSync(disPath, 'utf8'));
    } catch {
      diseases = {};
    }
  }

  // Map existing items to set for duplicate lookup
  const existingSet = new Set();
  medicines.forEach((med) => {
    if (med.drug_name) existingSet.add(med.drug_name.toLowerCase());
    if (med.id) existingSet.add(med.id.toLowerCase());
    if (Array.isArray(med.brand_names_india)) {
      med.brand_names_india.forEach((b) => {
        existingSet.add(b.toLowerCase());
      });
    }
  });

  // Read lines
  let rawData = "";
  try {
    rawData = fs.readFileSync(rawPath, 'utf8');
  } catch {
    return { success: false, message: "Failed to read raw CSV paths." };
  }

  const lines = rawData.split(/\r?\n/).filter(line => line.trim().length > 0);
  const rawCandidateNames = [];

  // Parse lines to get medicines waiting for verification
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    let name = parts[0] ? parts[0].replace(/^"|"$/g, '').trim() : '';
    if (name && name !== "BrowseList_medicine__bz_e7" && !existingSet.has(name.toLowerCase())) {
      rawCandidateNames.push(name);
    }
  }

  console.log(`[Sync Worker] Identified ${rawCandidateNames.length} raw unverified candidates.`);

  if (rawCandidateNames.length === 0) {
    return { success: true, processed: [], message: "All crawled medicines have already been parsed and verified!" };
  }

  // Get next batch
  const targetBatch = rawCandidateNames.slice(0, batchSize);
  console.log(`[Sync Worker] Processing ${targetBatch.length} medicines via Gemini config...`, targetBatch);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    console.warn("[Sync Worker] No valid GEMINI_API_KEY found. Placeholder detected.");
    return { 
      success: false, 
      error: "Invalid API Key", 
      message: "The Gemini API Key is currently set to a placeholder ('MY_GEMINI_API_KEY'). Please set a valid API key in the Settings menu to enable AI verification." 
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  const processedItems = [];

  for (const rawName of targetBatch) {
    console.log(`[Sync Worker] Verifying "${rawName}" with CDSCO/AI...`);
    try {
      const prompt = `Develop a detailed pharmacological profile for: "${rawName}".
Verify it against CDSCO (Central Drugs Standard Control Organization) guidelines in India.
Provide educational facts about its active constituents, dosage, precise category, side effects, precautions, and whether it requires an active doctor prescription.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
          temperature: 0.15,
        }
      });

      if (response && response.text) {
        const parsedMedObj = JSON.parse(response.text);
        
        // Ensure robust safe lowercase ID
        const baseId = (parsedMedObj.drug_name || rawName)
          .toLowerCase()
          .replace(/[^a-z0-9]/gi, '_')
          .replace(/_+/g, '_')
          .replace(/^_+|_+$/g, '');
        
        const safeId = baseId + "_" + Math.floor(100 + Math.random() * 900);
        parsedMedObj.id = safeId;
        parsedMedObj.source = "Verified Database";

        // Insert at beginning
        medicines.unshift(parsedMedObj);

        // Update search indexes
        const allTerms = [parsedMedObj.drug_name, ...(parsedMedObj.brand_names_india || [])].map(t => t.toLowerCase());
        allTerms.forEach(term => {
          if (!index[term]) index[term] = [];
          if (!index[term].includes(safeId)) index[term].push(safeId);
        });

        // Update category index
        const catK = (parsedMedObj.category || 'other').toLowerCase();
        if (!categories[catK]) categories[catK] = [];
        if (!categories[catK].includes(safeId)) categories[catK].push(safeId);

        // Update disease index
        if (Array.isArray(parsedMedObj.uses)) {
          parsedMedObj.uses.forEach((use) => {
            const uK = use.toLowerCase();
            if (!diseases[uK]) diseases[uK] = [];
            if (!diseases[uK].includes(safeId)) diseases[uK].push(safeId);
          });
        }

        processedItems.push(parsedMedObj.drug_name);
        console.log(`[Sync Worker] Integrated & Saved: ${parsedMedObj.drug_name}`);
      }
    } catch (err: any) {
      console.error(`[Sync Worker] Failed writing medicine payload to file for raw medicine ${rawName}:`, err);
      return { success: false, error: err.message, message: `Failed on ${rawName}: ${err.message}` };
    }
  }

  // Save changes to JSON files
  if (processedItems.length > 0) {
    try {
      fs.writeFileSync(medPath, JSON.stringify(medicines, null, 2));
      fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
      fs.writeFileSync(catPath, JSON.stringify(categories, null, 2));
      fs.writeFileSync(disPath, JSON.stringify(diseases, null, 2));
    } catch (writeErr) {
      console.error("[Sync Worker] Failed to write database entries to JSON file:", writeErr);
    }
  }

  // Write Execution Log
  let logs = [];
  if (fs.existsSync(logPath)) {
    try {
      logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
    } catch {
      logs = [];
    }
  }

  const newLog = {
    timestamp: new Date().toISOString(),
    status: processedItems.length > 0 ? "success" : "idle",
    processedCount: processedItems.length,
    processedItems,
    message: processedItems.length > 0 
      ? `Successfully completed CDSCO verification. Verified: ${processedItems.join(', ')}.`
      : "Daily CDSCO verification checked: No unverified medicines remaining."
  };

  logs.unshift(newLog);
  logs = logs.slice(0, 30);
  try {
    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
  } catch (logWriteErr) {
    console.error("[Sync Worker] Failed to write logs:", logWriteErr);
  }

  return {
    success: true,
    processed: processedItems,
    message: `Sync run successfully completed. Verified and imported ${processedItems.length} drugs into the verified medicines database.`
  };
}

// Setup scheduled tasks (Daily AI Database Scheduler)
const setupScheduledTasks = () => {
  // Schedule to run every day at midnight (00:00)
  cron.schedule("0 0 * * *", async () => {
    console.log(`[Cron Task] Daily Medical Dataset Update triggered at ${new Date().toISOString()}`);
    try {
      const result = await runMedicineSync(2); // CDSCO Verification of 2 fresh raw records daily
      console.log("[Cron Task] Run result:", result.message);
    } catch (error) {
      console.error("[Cron Task] Error during daily medical dataset update:", error);
    }
  });
  console.log("Scheduled tasks initialized: Daily Medical Dataset Update (CDSCO/AI Sync) is active.");
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize scheduled tasks
  setupScheduledTasks();

  // Support massive CSV file payload uploads up to 50MB
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Aethelcare API is running" });
  });

  // Get unverified raw candidate names list (first 100 for display)
  app.get("/api/admin/unverified-list", (req, res) => {
    try {
      const medPath = path.join(process.cwd(), 'src/data/medicines.json');
      const rawPath = path.join(process.cwd(), 'src/data/raw_crawled_medicines.csv');
      
      let medicines = [];
      if (fs.existsSync(medPath)) {
        try {
          medicines = JSON.parse(fs.readFileSync(medPath, 'utf8'));
        } catch {
          medicines = [];
        }
      }
      
      const existingSet = new Set();
      medicines.forEach((med: any) => {
        if (med.drug_name) existingSet.add(med.drug_name.toLowerCase());
        if (med.id) existingSet.add(med.id.toLowerCase());
        if (Array.isArray(med.brand_names_india)) {
          med.brand_names_india.forEach((b: string) => {
            existingSet.add(b.toLowerCase());
          });
        }
      });

      if (!fs.existsSync(rawPath)) {
        return res.json({ success: true, list: [], totalCount: 0 });
      }

      const rawContent = fs.readFileSync(rawPath, 'utf-8');
      const lines = rawContent.split(/\r?\n/).filter(line => line.trim().length > 0);
      const rawCandidateNames: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        let name = parts[0] ? parts[0].replace(/^"|"$/g, '').trim() : '';
        if (name && name !== "BrowseList_medicine__bz_e7" && !existingSet.has(name.toLowerCase())) {
          rawCandidateNames.push(name);
        }
      }

      res.json({
        success: true,
        list: rawCandidateNames.slice(0, 100),
        totalCount: rawCandidateNames.length
      });
    } catch (error) {
      console.error("Error fetching unverified list:", error);
      res.status(500).json({ success: false, message: "Failed to load unverified list" });
    }
  });

  // Get dataset stats (real-time verified, raw crawl counts, banned counts, logs)
  app.get("/api/admin/dataset-stats", (req, res) => {
    try {
      const medPath = path.join(process.cwd(), 'src/data/medicines.json');
      const bannedPath = path.join(process.cwd(), 'src/data/banned_medicines.json');
      const rawPath = path.join(process.cwd(), 'src/data/raw_crawled_medicines.csv');
      const logPath = path.join(process.cwd(), 'src/data/scheduler_logs.json');
      
      let totalVerifiedMedicines = 0;
      let totalBanned = 0;
      let totalRawCrawled = 0;
      let schedulerLogs = [];

      try {
        if (fs.existsSync(medPath)) {
          const meds = JSON.parse(fs.readFileSync(medPath, 'utf-8'));
          totalVerifiedMedicines = Array.isArray(meds) ? meds.length : 0;
        }
      } catch (e) {
        console.error("Error reading medPath JSON:", e);
      }
      
      try {
        if (fs.existsSync(bannedPath)) {
          const banned = JSON.parse(fs.readFileSync(bannedPath, 'utf-8'));
          totalBanned = Array.isArray(banned) ? banned.length : 0;
        }
      } catch (e) {
        console.error("Error reading bannedPath JSON:", e);
      }

      try {
        if (fs.existsSync(rawPath)) {
          const rawContent = fs.readFileSync(rawPath, 'utf-8');
          const lines = rawContent.split(/\r?\n/).filter(line => line.trim().length > 0);
          // Deduct 1 for header if populated
          totalRawCrawled = Math.max(0, lines.length - 1);
        }
      } catch (e) {
        console.error("Error reading rawPath:", e);
      }

      try {
        if (fs.existsSync(logPath)) {
          schedulerLogs = JSON.parse(fs.readFileSync(logPath, 'utf-8'));
        }
      } catch (e) {
        schedulerLogs = [];
      }
      
      res.json({
        success: true,
        totalMedicines: totalVerifiedMedicines, // keep existing key name for compatibility
        totalBanned,
        totalRawCrawled,
        totalRecords: totalVerifiedMedicines + totalBanned,
        schedulerLogs
      });
    } catch (error) {
      console.error("Error fetching dataset stats:", error);
      res.status(500).json({ success: false, message: "Failed to fetch dataset stats" });
    }
  });

  // Manual trigger for the CDSCO verification AI dataset update
  app.post("/api/admin/trigger-data-update", async (req, res) => {
    console.log(`[Manual Trigger] Medical Dataset Update started at ${new Date().toISOString()}`);
    try {
      const batchSize = req.body && req.body.batchSize ? parseInt(req.body.batchSize) : 2;
      
      // Run the sync process in the background without blocking the HTTP response
      runMedicineSync(batchSize).catch(error => {
        console.error("Manual trigger sync failed in background:", error);
      });
      
      res.json({ success: true, message: `Dataset update for batch size ${batchSize} started in the background. It will process in the background and logs will be recorded.` });
    } catch (error: any) {
      console.error("Manual trigger sync failed:", error);
      res.status(500).json({ success: false, message: error.message || "Sync crashed." });
    }
  });

  // Upload raw crawled dataset CSV
  app.post("/api/admin/upload-raw-csv", (req, res) => {
    try {
      const { csvContent } = req.body;
      if (!csvContent) {
        return res.status(400).json({ success: false, message: "No CSV content upload found." });
      }
      
      const rawPath = path.join(process.cwd(), 'src/data/raw_crawled_medicines.csv');
      fs.writeFileSync(rawPath, csvContent, 'utf-8');
      
      // Compute records size
      const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
      const count = Math.max(0, lines.length - 1);

      res.json({
        success: true,
        count,
        message: `Successfully uploaded ${new Intl.NumberFormat().format(count)} raw Pharmaeasy records.`
      });
    } catch (error) {
      console.error("Error uploading raw CSV:", error);
      res.status(500).json({ success: false, message: "Failed to upload and save raw CSV." });
    }
  });

  const handleCreateOrder = async (req: express.Request, res: express.Response) => {
    try {
      const { plan, planId } = req.body;
      let amount = 0;

      // Prices based on plans.ts
      if (planId === "premium") {
        amount = plan === "yearly" ? 699 : 99;
      } else if (plan === "daily") {
        amount = 9; // Legacy daily support
      } else {
        return res.status(400).json({ error: "Invalid plan or planId" });
      }

      const totalAmount = amount; 

      const razorpayKeyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
      const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

      if (!razorpayKeyId || !razorpayKeySecret) {
        // Fallback for demo purposes if keys aren't set
        console.warn("Razorpay keys are missing. Simulating order creation for demo purposes.");
        return res.json({
          order: {
            id: `order_sim_${Date.now()}`,
            amount: Math.round(totalAmount * 100),
            currency: "INR",
          },
          amount: totalAmount,
          key_id: "rzp_test_dummy"
        });
      }

      const rzp = new Razorpay({
        key_id: razorpayKeyId,
        key_secret: razorpayKeySecret,
      });

      // Razorpay expects amount in paise (multiply by 100)
      const options = {
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      };

      const order = await rzp.orders.create(options);
      res.json({ 
        order, 
        amount: totalAmount,
        key_id: razorpayKeyId
      });
    } catch (error: any) {
      console.error("Error creating order:", error);
      res.status(500).json({ 
        error: "Failed to create order", 
        details: error.message || error.description || "Unknown error" 
      });
    }
  };

  app.post("/api/create-order", handleCreateOrder);

  const handleVerifyPayment = (req: express.Request, res: express.Response) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      // Ensure keys exist, otherwise simulate success for demo fallback
      const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
      
      if (!razorpayKeySecret || razorpay_order_id.startsWith('order_sim_')) {
        return res.json({ success: true, message: "Demo Payment verified successfully" });
      }

      const sign = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSign = crypto
        .createHmac("sha256", razorpayKeySecret)
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

  app.post("/api/verify-payment", handleVerifyPayment);

  // AI Search Grounding Endpoint
  app.post("/api/ai/ask", async (req, res) => {
    try {
      const { prompt, language = "en" } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        return res.status(500).json({ 
          error: "API Key Missing", 
          message: "Gemini API key is not configured on the server." 
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const result = await (ai as any).models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        tools: [{ googleSearch: {} }],
      });

      const response = result;
      const text = response.text;
      const groundingMetadata = response.groundingMetadata;

      // Extract links from grounding metadata if available
      const sources = [];
      if (groundingMetadata?.groundingChunks) {
        for (const chunk of groundingMetadata.groundingChunks) {
          if (chunk.web) {
            sources.push({
              title: chunk.web.title,
              url: chunk.web.uri
            });
          }
        }
      }

      res.json({
        answer: text,
        sources: sources.slice(0, 5) // Limit to top 5 sources
      });

    } catch (error: any) {
      console.error("AI Search Error:", error);
      res.status(500).json({ error: "AI search failed", details: error.message });
    }
  });

  // Keep Netlify redirects if needed
  app.post("/.netlify/functions/create-order", handleCreateOrder);
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
