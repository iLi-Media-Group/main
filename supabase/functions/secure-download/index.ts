import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("=== Secure Download Function Called ===");
  console.log("Request method:", req.method);
  console.log("Request URL:", req.url);
  
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("Creating Supabase client...");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const trackId = url.searchParams.get("trackId");
    const shareId = url.searchParams.get("shareId");
    const filename = url.searchParams.get("filename") || "download.mp3";
    const fileType = url.searchParams.get("fileType") || "mp3";

    console.log("Request parameters:", { trackId, shareId, filename, fileType });

    if (!trackId) {
      console.log("Missing trackId - returning 400");
      return new Response("Missing trackId", { status: 400, headers: corsHeaders });
    }

    if (!shareId) {
      console.log("Missing shareId - returning 400");
      return new Response("Missing shareId", { status: 400, headers: corsHeaders });
    }

    // 1. Auth check
    console.log("Starting authentication check...");
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    console.log("Token present:", !!token);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    console.log("Auth result:", { user: user?.id, authError });
    
    if (!user || authError) {
      console.log("Authentication failed - returning 401");
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    console.log("User authenticated:", user.id);
    console.log("Checking license for trackId:", trackId);

    // 2. License check - check both sales and sync proposals
    let hasLicense = false;
    
    // Check sales table
    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .select("*")
      .eq("track_id", trackId)
      .eq("buyer_id", user.id)
      .maybeSingle();
    
    console.log("Sales check result:", { sale, saleError });
    
    if (sale) {
      hasLicense = true;
      console.log("License found in sales table");
    } else {
      // Check sync proposals table
      const { data: syncProposal, error: syncError } = await supabase
        .from("sync_proposals")
        .select("*")
        .eq("track_id", trackId)
        .eq("client_id", user.id)
        .eq("payment_status", "paid")
        .maybeSingle();
      
      console.log("Sync proposals check result:", { syncProposal, syncError });
      
      if (syncProposal) {
        hasLicense = true;
        console.log("License found in sync_proposals table");
      }
    }
    
    console.log("Final license check result:", hasLicense);
    
    if (!hasLicense) {
      return new Response("Not licensed", { status: 403, headers: corsHeaders });
    }

    // 3. Fetch file from BoomBox
    // Use the shareId for BoomBox URL construction
    const boomBoxUrl = `https://app.boombox.io/app/shares/${shareId}`;
    console.log("Fetching from BoomBox URL:", boomBoxUrl);
    const fileRes = await fetch(boomBoxUrl);
    if (!fileRes.ok) {
      console.log("BoomBox fetch failed:", fileRes.status, fileRes.statusText);
      return new Response("File error", { status: 500, headers: corsHeaders });
    }

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