import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    res.json({ status: "ok", message: "Aethelcare API is running" });
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

      // Calculate GST (18%) and Platform Fee (2%) - Optional, 
      // depends on if you want to add these on top or if they are inclusive.
      // Most Indian SaaS include GST in display price or add it.
      // Here we'll treat the price as inclusive of fees for simplicity in matching UI display,
      // but if the user wants they can be added. 
      // For now, let's keep it simple and match the UI price exactly.
      const totalAmount = amount; 

      // Razorpay expects amount in paise (multiply by 100)
      const options = {
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      };

      const order = await razorpay.orders.create(options);
      res.json({ order, amount: totalAmount });
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  };

  app.post("/api/create-order", handleCreateOrder);

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

  app.post("/api/verify-payment", handleVerifyPayment);

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
