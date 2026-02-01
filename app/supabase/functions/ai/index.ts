import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { verifyAuth } from "./utils/auth.ts";
import { log } from "./utils/logger.ts";
import { handleChat } from "./handlers/chat.ts";
import { handleReflect } from "./handlers/reflect.ts";
import { handleOnboarding } from "./handlers/onboarding.ts";
import { handleEntryProcess } from "./handlers/entry-process.ts";
import type { AIRequest, AIResponse } from "./types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handlers: Record<string, (req: AIRequest) => Promise<AIResponse>> = {
  chat: handleChat,
  reflect: handleReflect,
  onboarding: handleOnboarding,
  "entry-process": handleEntryProcess,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("[AI] Request received, headers:", [...req.headers.keys()].join(", "));
    const auth = await verifyAuth(req);
    if (!auth.ok) {
      console.error("[AI] Auth failed:", auth.error);
      // Return detailed error in body for debugging
      return new Response(JSON.stringify({
        error: auth.error,
        debug: "auth_failed",
        hasAuthHeader: req.headers.has("Authorization"),
        headerPreview: req.headers.get("Authorization")?.substring(0, 30),
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.log("[AI] Auth succeeded for:", auth.userId);

    const body = await req.json();
    const { type, ...payload } = body;

    await log.info('AI request', { type, userId: auth.userId });

    const handler = handlers[type];
    if (!handler) {
      await log.warn('Unknown handler type', { type });
      return new Response(JSON.stringify({ error: `Unknown type: ${type}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const start = Date.now();
    const result = await handler({ payload, userId: auth.userId, supabase: auth.supabase });
    const duration = Date.now() - start;

    await log.info('AI response', { type, userId: auth.userId, durationMs: duration });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    await log.error('AI function error', { error: String(error), stack: error instanceof Error ? error.stack : undefined });
    return new Response(JSON.stringify({ error: "Internal error", details: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
