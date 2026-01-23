# MIDL Journal - Development Setup

## Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator
- Supabase account
- OpenAI API key

## Environment Variables

Create `app/.env.local`:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_OPENAI_API_KEY=sk-your-openai-key
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

## Supabase Setup

1. Create new Supabase project
2. Enable pgvector extension: Database → Extensions → vector
3. Run migration: `supabase/migrations/001_initial_schema.sql`
4. Enable Google/Apple auth in Authentication → Providers
5. For Google OAuth:
   - Create OAuth 2.0 Client ID in Google Cloud Console
   - Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`

## Running the App

```bash
cd app
npm install
npx expo start
```

Press `i` for iOS simulator or `a` for Android emulator.

## Building for Production

```bash
npx expo build:ios
npx expo build:android
```

## Project Structure

```
app/
├── app/                  # Expo Router screens
│   ├── (main)/          # Main app screens
│   ├── onboarding/      # Onboarding flow
│   └── _layout.tsx      # Root layout
├── components/          # Reusable components
├── lib/                 # Utilities and helpers
├── supabase/           # Database migrations
└── assets/             # Images, fonts
```

## Key Files

- `lib/supabase.ts` - Supabase client configuration
- `lib/auth-context.tsx` - Authentication state management
- `lib/openai.ts` - OpenAI chat integration
- `lib/ai-feedback.ts` - AI feedback for reflections
- `lib/entry-processor.ts` - Entry analysis and signals
- `lib/midl-skills.ts` - MIDL meditation skill definitions
