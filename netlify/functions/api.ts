import express, { Router } from "express";
import serverless from "serverless-http";
import Razorpay from "razorpay";
import crypto from "crypto";

const api = express();
api.use(express.json());

const router = Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_dummy",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "dummy_secret",
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
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ error: "Failed to verify payment" });
  }
});

api.use("/api/", router);
api.use("/.netlify/functions/api/", router);
api.use("/", router);

export const handler = serverless(api);
