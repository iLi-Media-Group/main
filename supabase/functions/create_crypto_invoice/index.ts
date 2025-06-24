import { serve } from "std/server";
import { createClient } from "@supabase/supabase-js";

serve(async (req) => {
  try {
    const body = await req.json();
    const { productId, userId } = body;

    if (!productId || !userId) {
      return new Response(JSON.stringify({ error: "Missing productId or userId" }), { status: 400 });
    }

    const HELIO_API_KEY = Deno.env.get("HELIO_API_KEY");
    if (!HELIO_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing Helio API key" }), { status: 500 });
    }

    const helioResponse = await fetch("https://api.hel.io/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HELIO_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: `Subscription for product ${productId}`,
        amount: "10", // Replace with your actual product price logic
        currency: "USDC",
        network: "solana",
        customerId: userId
      })
    });

    if (!helioResponse.ok) {
      const errorDetails = await helioResponse.text();
      console.error("Helio API error:", errorDetails);
      return new Response(JSON.stringify({ error: "Failed to create Helio invoice" }), { status: 500 });
    }

    const helioData = await helioResponse.json();
    const invoiceUrl = helioData.paymentUrl;

    return new Response(JSON.stringify({ invoiceUrl }), { status: 200 });

  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(JSON.stringify({ error: "Unexpected error" }), { status: 500 });
  }
});
