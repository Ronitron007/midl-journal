// supabase/functions/reflect-feedback/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { content, duration, isGuided, skillPracticed } = await req.json();

    const prompt = `You are a meditation guide. The user just completed a meditation session and wrote this reflection:

"${content}"

${duration ? `Duration: ${Math.round(duration / 60)} minutes` : ''}
${isGuided ? 'This was a guided session.' : ''}
${skillPracticed ? `They were practicing MIDL Skill ${skillPracticed}.` : ''}

Give brief, warm feedback (1-3 sentences). You can:
- Acknowledge what went well
- Offer a gentle suggestion for next time
- Note patterns if relevant
- Simply validate their effort

Keep it conversational and supportive. No emojis.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150,
      }),
    });

    const data = await response.json();
    const feedback = data.choices?.[0]?.message?.content || "Good session. You showed up. That matters.";

    return new Response(JSON.stringify({ feedback }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Reflect feedback error:", error);
    return new Response(JSON.stringify({ feedback: "Good session. You showed up. That matters." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
