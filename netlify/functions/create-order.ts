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
    const { plan, planId } = JSON.parse(event.body || "{}");
    let amount = 0;

    if (planId === "premium") {
      amount = plan === "yearly" ? 699 : 99;
    } else if (plan === "daily") {
      amount = 9; 
    } else {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid plan or planId" }) };
    }

    const totalAmount = amount;

    const razorpayKeyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.warn("Razorpay keys are missing. Simulating order.");
      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
        body: JSON.stringify({
          order: { id: `order_sim_${Date.now()}`, amount: Math.round(totalAmount * 100), currency: "INR" },
          amount: totalAmount,
          key_id: "rzp_test_dummy",
        }),
      };
    }

    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
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
      body: JSON.stringify({ order, amount: totalAmount, key_id: razorpayKeyId }),
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
