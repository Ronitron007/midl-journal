import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { verifyAuth } from "./utils/auth.ts";
import { log } from "./utils/logger.ts";
import { handleChat } from "./handlers/chat.ts";
import { handleChatStream } from "./handlers/chat-stream.ts";
import { handleReflect } from "./handlers/reflect.ts";
import { handleOnboarding } from "./handlers/onboarding.ts";
import { handleEntryProcess } from "./handlers/entry-process.ts";
import { handleContextSummary } from "./handlers/context-summary.ts";
import { handleMonthlySummary, handleMonthlySummaryBatch } from "./handlers/monthly-summary.ts";
import type { AIRequest, AIResponse } from "./types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Standard handlers that return JSON
const handlers: Record<string, (req: AIRequest) => Promise<AIResponse>> = {
  chat: handleChat, // Non-streaming fallback
  reflect: handleReflect,
  onboarding: handleOnboarding,
  "entry-process": handleEntryProcess,
  "context-summary": handleContextSummary,
  "monthly-summary": handleMonthlySummary,
  "monthly-summary-batch": handleMonthlySummaryBatch,
};

// Streaming handlers that return Response directly
const streamHandlers: Record<
  string,
  (req: AIRequest, corsHeaders: Record<string, string>) => Promise<Response>
> = {
  "chat-stream": handleChatStream,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const auth = await verifyAuth(req);
    if (!auth.ok) {
      console.error("[AI] Auth failed:", auth.error);
      return new Response(
        JSON.stringify({
          error: auth.error,
          debug: "auth_failed",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.json();
    const { type, ...payload } = body;

    await log.info("AI request", { type, userId: auth.userId });

    const aiRequest: AIRequest = {
      payload,
      userId: auth.userId,
      supabase: auth.supabase,
    };

    // Check for streaming handlers first
    const streamHandler = streamHandlers[type];
    if (streamHandler) {
      return await streamHandler(aiRequest, corsHeaders);
    }

    // Standard JSON handlers
    const handler = handlers[type];
    if (!handler) {
      await log.warn("Unknown handler type", { type });
      return new Response(JSON.stringify({ error: `Unknown type: ${type}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const start = Date.now();
    const result = await handler(aiRequest);
    const duration = Date.now() - start;

    await log.info("AI response", { type, userId: auth.userId, durationMs: duration });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    await log.error("AI function error", {
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return new Response(
      JSON.stringify({ error: "Internal error", details: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
