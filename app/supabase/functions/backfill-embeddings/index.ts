import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const BATCH_SIZE = 10;
const MIN_WORDS = 50;

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text.slice(0, 8000), // truncate to avoid token limits
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI embedding error: ${err}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Parse optional query params
  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dry_run") === "true";
  const limit = parseInt(url.searchParams.get("limit") || "100", 10);

  console.log(`[Backfill] Starting... dry_run=${dryRun}, limit=${limit}`);

  // Fetch reflect entries without embeddings
  const { data: entries, error } = await supabase
    .from("entries")
    .select("id, raw_content")
    .eq("type", "reflect")
    .is("embedding", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[Backfill] Fetch error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Filter to 50+ words
  const eligibleEntries = entries.filter((e) => {
    const plainText = stripHtml(e.raw_content);
    return countWords(plainText) >= MIN_WORDS;
  });

  console.log(`[Backfill] Found ${entries.length} entries without embeddings, ${eligibleEntries.length} with 50+ words`);

  if (dryRun) {
    return new Response(
      JSON.stringify({
        dry_run: true,
        total_without_embedding: entries.length,
        eligible_entries: eligibleEntries.length,
        sample_ids: eligibleEntries.slice(0, 5).map((e) => e.id),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Process in batches
  let processed = 0;
  let failed = 0;
  const errors: { id: string; error: string }[] = [];

  for (let i = 0; i < eligibleEntries.length; i += BATCH_SIZE) {
    const batch = eligibleEntries.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (entry) => {
        try {
          const plainText = stripHtml(entry.raw_content);
          const embedding = await generateEmbedding(plainText);

          const { error: updateError } = await supabase
            .from("entries")
            .update({ embedding })
            .eq("id", entry.id);

          if (updateError) {
            throw updateError;
          }

          processed++;
          console.log(`[Backfill] Embedded entry ${entry.id} (${processed}/${eligibleEntries.length})`);
        } catch (err) {
          failed++;
          errors.push({ id: entry.id, error: String(err) });
          console.error(`[Backfill] Failed entry ${entry.id}:`, err);
        }
      })
    );

    // Small delay between batches to avoid rate limits
    if (i + BATCH_SIZE < eligibleEntries.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  const result = {
    processed,
    failed,
    total_eligible: eligibleEntries.length,
    errors: errors.slice(0, 10), // first 10 errors
  };

  console.log("[Backfill] Complete:", result);

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
