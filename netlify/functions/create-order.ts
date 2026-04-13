import Razorpay from "razorpay";

export const handler = async (event: any) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { plan } = JSON.parse(event.body || "{}");
    let amount = 0;

    if (plan === "monthly") amount = 79;
    else if (plan === "yearly") amount = 849;
    else if (plan === "daily") amount = 99;
    else return { statusCode: 400, body: JSON.stringify({ error: "Invalid plan" }) };

    const gst = amount * 0.18;
    const platformFee = amount * 0.02;
    const totalAmount = amount + gst + platformFee;

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_dummy",
      key_secret: process.env.RAZORPAY_KEY_SECRET || "dummy_secret",
    });

    const options = {
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ order, breakdown: { base: amount, gst, platformFee, total: totalAmount } }),
    };
  } catch (error: any) {
    console.error("Error creating order:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: error.message || "Failed to create order" }),
    };
  }
};
