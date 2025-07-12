import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const trackId = url.searchParams.get("trackId");
    const filename = url.searchParams.get("filename") || "download.mp3";
    const fileType = url.searchParams.get("fileType") || "mp3";

    if (!trackId) {
      return new Response("Missing trackId", { status: 400, headers: corsHeaders });
    }

    // 1. Auth check
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (!user || authError) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    // 2. License check - check both sales and sync proposals
    let hasLicense = false;
    
    // Check sales table
    const { data: sale } = await supabase
      .from("sales")
      .select("*")
      .eq("track_id", trackId)
      .eq("buyer_id", user.id)
      .maybeSingle();
    
    if (sale) {
      hasLicense = true;
    } else {
      // Check sync proposals table
      const { data: syncProposal } = await supabase
        .from("sync_proposals")
        .select("*")
        .eq("track_id", trackId)
        .eq("client_id", user.id)
        .eq("payment_status", "paid")
        .maybeSingle();
      
      if (syncProposal) {
        hasLicense = true;
      }
    }
    
    if (!hasLicense) {
      return new Response("Not licensed", { status: 403, headers: corsHeaders });
    }

    // 3. Fetch file from BoomBox
    // Use the actual BoomBox share URL pattern from the console output
    const boomBoxUrl = `https://app.boombox.io/app/shares/${trackId}`;
    const fileRes = await fetch(boomBoxUrl);
    if (!fileRes.ok) return new Response("File error", { status: 500, headers: corsHeaders });

    // 4. Set content type
    let contentType = "application/octet-stream";
    switch (fileType) {
      case "mp3":
        contentType = "audio/mpeg";
        break;
      case "zip":
        contentType = "application/zip";
        break;
      case "pdf":
        contentType = "application/pdf";
        break;
    }

    // 5. Stream file to client
    return new Response(fileRes.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename=\"${filename}\"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block"
      }
    });
  } catch (error) {
    console.error("Secure download error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
}); 