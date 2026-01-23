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
    const auth = await verifyAuth(req);
    if (!auth.ok) {
      log.warn('Auth failed', { error: auth.error });
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { type, ...payload } = body;

    log.info('AI request', { type, userId: auth.userId });

    const handler = handlers[type];
    if (!handler) {
      log.warn('Unknown handler type', { type });
      return new Response(JSON.stringify({ error: `Unknown type: ${type}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const start = Date.now();
    const result = await handler({ payload, userId: auth.userId, supabase: auth.supabase });
    const duration = Date.now() - start;

    log.info('AI response', { type, userId: auth.userId, durationMs: duration });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    log.error('AI function error', { error: String(error) });
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
