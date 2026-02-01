# MIDL Journal

Meditation journaling app built with Expo + Supabase.

## Local Development

### App
```bash
npm install
npx expo start
```

### Edge Functions

1. **Install Supabase CLI**
   ```bash
   brew install supabase/tap/supabase
   ```

2. **Link to project** (one-time)
   ```bash
   supabase link --project-ref yszsiwobkyxtlsgzcezy
   ```

3. **Configure local env**

   Edit `supabase/.env.local`:
   ```
   OPENAI_API_KEY=sk-your-key-here
   ```

4. **Serve locally**
   ```bash
   supabase functions serve ai --env-file supabase/.env.local
   ```

   Endpoint: `http://localhost:54321/functions/v1/ai`

5. **Point app to local functions**

   In `.env.local`, override the Supabase URL or add a flag to use localhost for function calls during development.
