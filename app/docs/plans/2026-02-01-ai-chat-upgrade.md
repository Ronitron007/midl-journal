# AI Chat Upgrade - Implementation Plan

> **Status:** PLANNED
> **Date:** 2026-02-01
> **Priority:** HIGH

## Overview

Replace the current "fools grade" AI implementation with production-grade infrastructure:
- Official OpenAI SDK with proper error handling
- Streaming responses for better UX
- Tool calling for dynamic context
- RAG for semantic entry search

---

## Phase 1: Foundation (OpenAI SDK + Streaming)

### 1.1 Replace OpenAI Provider

**Current:** Raw fetch to OpenAI API
**Target:** Official `openai` npm package (works with Deno)

```typescript
// supabase/functions/ai/providers/openai.ts
import OpenAI from "openai";

export class OpenAIProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: Deno.env.get("OPENAI_API_KEY"),
    });
  }

  async complete(options: CompletionOptions): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: options.messages,
      max_tokens: options.maxTokens ?? 500,
      response_format: options.jsonMode ? { type: "json_object" } : undefined,
    });
    return response.choices[0]?.message?.content ?? "";
  }

  async *stream(options: CompletionOptions): AsyncGenerator<string> {
    const stream = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: options.messages,
      max_tokens: options.maxTokens ?? 500,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) yield content;
    }
  }

  async embed(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    return response.data[0].embedding;
  }
}
```

**Files to modify:**
- `supabase/functions/ai/providers/openai.ts` - replace implementation
- `supabase/functions/ai/types.ts` - add streaming types

### 1.2 Add Streaming Chat Handler

```typescript
// supabase/functions/ai/handlers/chat-stream.ts
export async function handleChatStream(req: AIRequest): Promise<Response> {
  const { messages } = req.payload as ChatPayload;
  const provider = new OpenAIProvider();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of provider.stream({ messages, ... })) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      ...corsHeaders,
    },
  });
}
```

### 1.3 Client-Side Streaming

```typescript
// lib/ai.ts
export async function chatStream(
  messages: Message[],
  onChunk: (content: string) => void
): Promise<void> {
  const session = await getValidSession();

  const response = await fetch(`${SUPABASE_URL}/functions/v1/ai`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type: "chat-stream", messages }),
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (reader) {
    const { done, value } = await reader.read();
    if (done) break;

    const lines = decoder.decode(value).split("\n");
    for (const line of lines) {
      if (line.startsWith("data: ") && line !== "data: [DONE]") {
        const { content } = JSON.parse(line.slice(6));
        onChunk(content);
      }
    }
  }
}
```

---

## Phase 2: Context & Tools

### 2.1 Tool Definitions

```typescript
// supabase/functions/ai/tools/definitions.ts
export const CHAT_TOOLS = [
  {
    type: "function",
    function: {
      name: "get_user_profile",
      description: "Get the user's current skill, stats, and onboarding data",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_skill_details",
      description: "Get details about a MIDL skill including marker, hindrance, and techniques",
      parameters: {
        type: "object",
        properties: {
          skill_id: { type: "string", description: "Skill ID (00-16)" },
        },
        required: ["skill_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_recent_entries",
      description: "Get the user's recent journal entries with extracted signals",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Number of entries (default 5)" },
          skill_filter: { type: "string", description: "Filter by skill practiced" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_progression_stats",
      description: "Get user's progression stats for their current skill",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "search_entries",
      description: "Search user's past entries by topic or theme",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
          limit: { type: "number", description: "Max results (default 3)" },
        },
        required: ["query"],
      },
    },
  },
];
```

### 2.2 Tool Handlers

```typescript
// supabase/functions/ai/tools/handlers.ts
export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  context: { userId: string; supabase: SupabaseClient }
): Promise<unknown> {
  switch (name) {
    case "get_user_profile":
      return getUserProfile(context);
    case "get_skill_details":
      return getSkillDetails(args.skill_id as string);
    case "get_recent_entries":
      return getRecentEntries(context, args.limit as number, args.skill_filter as string);
    case "get_progression_stats":
      return getProgressionStats(context);
    case "search_entries":
      return searchEntries(context, args.query as string, args.limit as number);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
```

### 2.3 Tool-Aware Chat Handler

```typescript
// supabase/functions/ai/handlers/chat.ts
export async function handleChat(req: AIRequest): Promise<AIResponse> {
  const { messages } = req.payload as ChatPayload;
  const provider = new OpenAIProvider();

  // Build dynamic system prompt with user context
  const userProfile = await getUserProfile({ userId: req.userId, supabase: req.supabase });
  const systemPrompt = buildSystemPrompt(userProfile);

  // Trim conversation to token budget (8k tokens ~= 32k chars)
  const trimmedMessages = trimConversationHistory(messages, 32000);
  let allMessages = [{ role: "system", content: systemPrompt }, ...trimmedMessages];

  let toolCallCount = 0;
  const toolsUsed: string[] = [];

  // Tool loop (max 3 iterations)
  for (let i = 0; i < 3; i++) {
    const response = await provider.completeWithTools({
      messages: allMessages,
      tools: CHAT_TOOLS,
    });

    if (!response.tool_calls?.length) {
      // Log tool usage
      log.info("Chat completed", {
        userId: req.userId,
        toolCallCount,
        toolsUsed,
        iterations: i + 1,
      });
      return { content: response.content };
    }

    // Execute tools and add results
    for (const call of response.tool_calls) {
      toolCallCount++;
      toolsUsed.push(call.function.name);

      const result = await executeTool(call.function.name, JSON.parse(call.function.arguments), {
        userId: req.userId,
        supabase: req.supabase,
      });
      allMessages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
    }
  }

  log.warn("Chat hit tool loop limit", { userId: req.userId, toolCallCount, toolsUsed });
  return { content: "I had trouble processing that request." };
}

function trimConversationHistory(messages: Message[], maxChars: number): Message[] {
  let totalChars = 0;
  const result: Message[] = [];

  // Keep messages from newest to oldest until we hit the limit
  for (let i = messages.length - 1; i >= 0; i--) {
    const msgChars = messages[i].content.length;
    if (totalChars + msgChars > maxChars) break;
    totalChars += msgChars;
    result.unshift(messages[i]);
  }

  return result;
}
```

---

## Phase 3: RAG (Embeddings + Vector Search)

### 3.1 Generate Embeddings on Entry Process

```typescript
// supabase/functions/ai/handlers/entry-process.ts
export async function handleEntryProcess(req: AIRequest): Promise<AIResponse> {
  // ... existing signal extraction ...

  // Generate embedding for the entry
  const provider = new OpenAIProvider();
  const embedding = await provider.embed(content);

  // Update entry with signals AND embedding
  await req.supabase
    .from("entries")
    .update({
      ...signals,
      embedding,
      processed_at: new Date().toISOString(),
    })
    .eq("id", entryId);

  return { signals };
}
```

### 3.2 Vector Search Function

```typescript
// supabase/functions/ai/tools/search.ts
export async function searchEntries(
  context: { userId: string; supabase: SupabaseClient },
  query: string,
  limit = 3
): Promise<Entry[]> {
  const provider = new OpenAIProvider();
  const queryEmbedding = await provider.embed(query);

  const { data, error } = await context.supabase.rpc("match_entries", {
    query_embedding: queryEmbedding,
    match_threshold: 0.7,
    match_count: limit,
    user_id: context.userId,
  });

  return data ?? [];
}
```

### 3.3 Postgres Function for Vector Search

```sql
-- supabase/migrations/006_add_vector_search.sql
CREATE OR REPLACE FUNCTION match_entries(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  user_id uuid
)
RETURNS TABLE (
  id uuid,
  raw_content text,
  summary text,
  skill_practiced text,
  created_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    entries.id,
    entries.raw_content,
    entries.summary,
    entries.skill_practiced,
    entries.created_at,
    1 - (entries.embedding <=> query_embedding) AS similarity
  FROM entries
  WHERE entries.user_id = match_entries.user_id
    AND entries.embedding IS NOT NULL
    AND 1 - (entries.embedding <=> query_embedding) > match_threshold
  ORDER BY entries.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

---

## Phase 4: Smart Context

### 4.1 Dynamic System Prompt

```typescript
// supabase/functions/ai/prompts/system.ts
export function buildSystemPrompt(profile: UserProfile): string {
  const skill = SKILLS_DATA[profile.current_skill];

  return `You are a meditation guide for MIDL (Mindfulness in Daily Life).

USER CONTEXT:
- Current skill: ${skill.id} - ${skill.name}
- Days on this skill: ${profile.stats.current_skill_days}
- Total sessions: ${profile.stats.total_sessions}
- Streak: ${profile.stats.streak} days

CURRENT SKILL FOCUS:
- Marker to develop: ${skill.marker}
- Hindrance to work with: ${skill.hindrance}
- Key techniques: ${skill.techniques.join(", ")}

GUIDELINES:
- Be warm, concise, practical (2-4 sentences unless asked for more)
- Reference the user's current skill when relevant
- Use tools to fetch specific data when needed
- Suggest techniques appropriate to their level
- For detailed MIDL content, mention midlmeditation.com`;
}
```

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/ai/providers/openai.ts` | Rewrite | Use official SDK, add streaming + embed |
| `supabase/functions/ai/handlers/chat.ts` | Rewrite | Tool-aware with dynamic context, logging |
| `supabase/functions/ai/handlers/chat-stream.ts` | New | SSE streaming handler |
| `supabase/functions/ai/tools/definitions.ts` | New | Tool schemas |
| `supabase/functions/ai/tools/handlers.ts` | New | Tool execution |
| `supabase/functions/ai/tools/search.ts` | New | Vector search |
| `supabase/functions/ai/prompts/system.ts` | New | Dynamic prompt builder |
| `supabase/functions/ai/handlers/entry-process.ts` | Modify | Add embedding generation |
| `supabase/functions/backfill-embeddings/index.ts` | New | Backfill embeddings for existing entries |
| `supabase/migrations/006_add_vector_search.sql` | New | match_entries RPC |
| `app/lib/ai.ts` | Modify | Add chatStream function |
| `app/app/(main)/ask.tsx` | Modify | Use streaming, show tokens as they arrive |

---

## Deployment Order

1. Deploy migration (vector search function)
2. Deploy updated edge function
3. Update client app
4. Run backfill script

## Backfill Script

**Location:** `supabase/functions/backfill-embeddings/index.ts`

**Usage:**
```bash
# Deploy the function
supabase functions deploy backfill-embeddings

# Dry run - see how many entries would be processed
curl -X POST "https://<project>.supabase.co/functions/v1/backfill-embeddings?dry_run=true" \
  -H "Authorization: Bearer <service_role_key>"

# Run with limit
curl -X POST "https://<project>.supabase.co/functions/v1/backfill-embeddings?limit=50" \
  -H "Authorization: Bearer <service_role_key>"

# Full run (default limit 100)
curl -X POST "https://<project>.supabase.co/functions/v1/backfill-embeddings" \
  -H "Authorization: Bearer <service_role_key>"
```

**What it does:**
- Fetches reflect entries without embeddings
- Filters to 50+ words
- Generates embeddings via text-embedding-3-small
- Processes in batches of 10 with 500ms delays
- Returns processed/failed counts

---

## Decisions

| Question | Decision |
|----------|----------|
| Rate limiting | No limit for now, but **log tool usage count** per request |
| Token budget | **8,000 tokens** for conversation history (~10-15 exchanges), sliding window |
| Streaming | **Default for chat**, non-streaming for other handlers |
| Backfill | Script for reflect entries with **50+ words** |

## Token Budget Breakdown

| Component | Tokens |
|-----------|--------|
| System prompt | ~500 |
| Tool definitions | ~1,000 |
| User context (profile, skill) | ~500 |
| Conversation history | **8,000 max** |
| Tool results | ~2,000 |
| Response buffer | ~500 |
| **Total** | ~12,500 (well under 128k limit) |
