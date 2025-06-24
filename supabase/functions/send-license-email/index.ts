import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const resendApiKey = Deno.env.get('RESEND_API_KEY');
const siteUrl = Deno.env.get('PUBLIC_SITE_URL');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      },
    });
  }

  try {
    const {
      clientName,
      clientEmail,
      trackName,
      licenseTier,
      licenseDate,
      expirationDate,
      pdfUrl
    } = await req.json();

    const emailBody = `
      <p>Hey ${clientName},</p>
      <p>Thanks for licensing "<strong>${trackName}</strong>" with MyBeatFi Sync! 🎧</p>
      <p><strong>License Tier:</strong> ${licenseTier}<br/>
      <strong>Start Date:</strong> ${new Date(licenseDate).toLocaleDateString()}<br/>
      <strong>Expiration:</strong> ${expirationDate ? new Date(expirationDate).toLocaleDateString() : 'Perpetual (Ultimate Access)'}</p>
      <p><a href="${pdfUrl}">📄 Download Your License PDF</a></p>
      <hr/>
      <p>Need help? <a href="${siteUrl}/contact">Contact Us</a></p>
    `;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "MyBeatFi Sync <noreply@yourdomain.com>",
        to: clientEmail,
        subject: `Your MyBeatFi Sync License for "${trackName}"`,
        html: emailBody,
      }),
    });

    if (!resendRes.ok) throw new Error('Failed to send license email');

    return new Response(JSON.stringify({ message: 'License email sent successfully' }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 400,
    });
  }
});
