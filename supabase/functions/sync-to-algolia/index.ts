// /supabase/functions/sync-to-algolia/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import algoliasearch from "npm:algoliasearch";
serve(async (req)=>{
  const { record, type } = await req.json();
  const appId = Deno.env.get("ALGOLIA_APP_ID");
  const apiKey = Deno.env.get("ALGOLIA_ADMIN_KEY");
  const indexName = Deno.env.get("ALGOLIA_INDEX_NAME") || "tracks";
  const client = algoliasearch(appId, apiKey);
  const index = client.initIndex(indexName);
  try {
    if (type === "INSERT" || type === "UPDATE") {
      await index.saveObject({
        objectID: record.id,
        ...record
      });
    } else if (type === "DELETE") {
      await index.deleteObject(record.id);
    }
    return new Response("Synced successfully", {
      status: 200
    });
  } catch (err) {
    console.error("Algolia sync failed:", err);
    return new Response("Failed to sync", {
      status: 500
    });
  }
});
