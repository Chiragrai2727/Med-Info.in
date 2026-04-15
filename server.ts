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
    res.json({ status: "ok", message: "aethelcare API is running" });
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
