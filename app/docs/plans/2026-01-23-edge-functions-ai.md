# Move AI Processing to Supabase Edge Functions

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move OpenAI API calls from client-side to Supabase Edge Functions for security and maintainability.

**Architecture:** Two edge functions: `chat` (for Ask feature) and `reflect-feedback` (for Reflect feature). Client calls Supabase functions with auth token, functions call OpenAI server-side.

**Tech Stack:** Supabase Edge Functions (Deno), OpenAI API, Supabase JS Client

---

## Task 1: Create chat edge function

**Files:**

- Create: `supabase/functions/chat/index.ts`

**Step 1: Create function directory and file**

```bash
mkdir -p supabase/functions/chat
```

**Step 2: Write the edge function**

```typescript
// supabase/functions/chat/index.ts
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No auth header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { messages } = await req.json();

    const systemMessage = {
      role: 'system',
      content: `You are a meditation guide specializing in the MIDL (Mindfulness in Daily Life) system. You help users progress through 17 skills across 6 cultivations. Be warm, concise, and practical. When referencing MIDL content, mention that users can learn more at midlmeditation.com. Keep responses brief (2-4 sentences) unless the user asks for more detail.`,
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [systemMessage, ...messages],
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    const content =
      data.choices?.[0]?.message?.content || 'Sorry, I had trouble responding.';

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

**Step 3: Commit**

```bash
git add supabase/functions/chat/index.ts
git commit -m "feat: add chat edge function"
```

---

## Task 2: Create reflect-feedback edge function

**Files:**

- Create: `supabase/functions/reflect-feedback/index.ts`

**Step 1: Create function directory**

```bash
mkdir -p supabase/functions/reflect-feedback
```

**Step 2: Write the edge function**

```typescript
// supabase/functions/reflect-feedback/index.ts
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No auth header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
      }),
    });

    const data = await response.json();
    const feedback =
      data.choices?.[0]?.message?.content ||
      'Good session. You showed up. That matters.';

    return new Response(JSON.stringify({ feedback }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Reflect feedback error:', error);
    return new Response(
      JSON.stringify({
        feedback: 'Good session. You showed up. That matters.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
```

**Step 3: Commit**

```bash
git add supabase/functions/reflect-feedback/index.ts
git commit -m "feat: add reflect-feedback edge function"
```

---

## Task 3: Update lib/openai.ts to call edge function

**Files:**

- Modify: `lib/openai.ts`

**Step 1: Rewrite to use supabase function**

```typescript
// lib/openai.ts
import { supabase } from './supabase';

export type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export async function chat(messages: Message[]): Promise<string> {
  const { data, error } = await supabase.functions.invoke('chat', {
    body: { messages },
  });

  if (error) {
    console.error('Chat error:', error);
    return 'Sorry, I had trouble responding.';
  }

  return data.content;
}
```

**Step 2: Commit**

```bash
git add lib/openai.ts
git commit -m "refactor: use edge function for chat"
```

---

## Task 4: Update lib/ai-feedback.ts to call edge function

**Files:**

- Modify: `lib/ai-feedback.ts`

**Step 1: Rewrite to use supabase function**

```typescript
// lib/ai-feedback.ts
import { supabase } from './supabase';

export type FeedbackContext = {
  content: string;
  duration?: number;
  isGuided?: boolean;
  skillPracticed?: string;
  recentPatterns?: string;
};

export async function getReflectionFeedback(
  context: FeedbackContext
): Promise<string> {
  const { data, error } = await supabase.functions.invoke('reflect-feedback', {
    body: context,
  });

  if (error) {
    console.error('AI feedback error:', error);
    return 'Good session. You showed up. That matters.';
  }

  return data.feedback;
}
```

**Step 2: Commit**

```bash
git add lib/ai-feedback.ts
git commit -m "refactor: use edge function for reflect feedback"
```

---

## Task 5: Remove OPENAI_API_KEY from client env

**Files:**

- Modify: `.env.example`

**Step 1: Remove OPENAI key from env example**

Remove the `EXPO_PUBLIC_OPENAI_API_KEY` line from `.env.example` since it's now server-side only.

**Step 2: Commit**

```bash
git add .env.example
git commit -m "chore: remove client-side openai key"
```

---

## Task 6: Deploy edge functions and set secrets

**Step 1: Deploy functions**

```bash
cd /Users/rohanmalik/Projects/midl-journal/app
supabase functions deploy chat
supabase functions deploy reflect-feedback
```

**Step 2: Set OpenAI API key secret**

```bash
supabase secrets set OPENAI_API_KEY=<your-key>
```

**Step 3: Test locally (optional)**

```bash
supabase functions serve
```

---

## Unresolved Questions

1. Do you have `supabase` CLI installed and linked to your project?
2. Want local function testing before deploy?
3. Keep OpenAI key in .env.local for local dev, or always hit remote?
