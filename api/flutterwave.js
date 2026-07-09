import fetch from "node-fetch";



export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const { title, price, seller_email } = req.body;

  if (!title || !price || !seller_email) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  try {
    const amount = Number(price);
    const response = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: "kartz_" + Date.now(),
        amount,
        currency: "USD", // or "RWF"
        redirect_url: "https://your-site.vercel.app/success.html",
        payment_options: "card, mobilemoneyrwanda",
        customer: {
          email: seller_email,
        },
        customizations: {
          title: "Kartz Art Purchase",
          description: title,
          logo: "https://yourlogo.com/logo.png",
        },
        // ✅ Split payment — 5% platform fee automatically
        split_type: "percentage",
        split_value: 5,
      }),
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}