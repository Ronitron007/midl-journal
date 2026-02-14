# MIDL Journal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an AI-powered meditation companion app with journal/chat interface, skill progression tracking, and adaptive AI feedback.

**Architecture:** React Native (Expo) app with Supabase backend. Two primary modes (Reflect/Ask) launch from home Tracker screen. AI processes entries via OpenAI API, stores summaries and embeddings for context retrieval.

**Tech Stack:** Expo (React Native), Supabase (auth + Postgres + pgvector), OpenAI API, Tiptap, TypeScript

---

## Phase 1: Project Foundation

### Task 1: Initialize Expo Project

**Files:**

- Create: `/Users/rohanmalik/Projects/midl-journal/app/` (Expo project root)

**Step 1: Create Expo project with TypeScript**

```bash
cd /Users/rohanmalik/Projects/midl-journal
npx create-expo-app@latest app --template blank-typescript
```

**Step 2: Verify project runs**

```bash
cd app
npx expo start
```

Expected: Metro bundler starts, QR code displayed

**Step 3: Commit**

```bash
cd /Users/rohanmalik/Projects/midl-journal
git add app
git commit -m "init: expo project with typescript"
```

---

### Task 2: Install Core Dependencies

**Files:**

- Modify: `app/package.json`

**Step 1: Install navigation + UI dependencies**

```bash
cd /Users/rohanmalik/Projects/midl-journal/app
npx expo install expo-router expo-linking expo-constants expo-status-bar react-native-safe-area-context react-native-screens react-native-gesture-handler react-native-reanimated
```

**Step 2: Install Supabase client**

```bash
npm install @supabase/supabase-js @react-native-async-storage/async-storage
npx expo install expo-secure-store
```

**Step 3: Install UI utilities**

```bash
npm install nativewind tailwindcss
npx expo install expo-linear-gradient
```

**Step 4: Verify dependencies installed**

```bash
cat package.json | grep -E "expo-router|supabase|nativewind"
```

Expected: All packages listed in dependencies

**Step 5: Commit**

```bash
cd /Users/rohanmalik/Projects/midl-journal
git add app/package.json app/package-lock.json
git commit -m "deps: navigation, supabase, nativewind"
```

---

### Task 3: Configure Expo Router

**Files:**

- Modify: `app/app.json`
- Create: `app/app/_layout.tsx`
- Create: `app/app/index.tsx`
- Delete: `app/App.tsx`

**Step 1: Update app.json for expo-router**

Replace `app/app.json`:

```json
{
  "expo": {
    "name": "MIDL Journal",
    "slug": "midl-journal",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "scheme": "midl-journal",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#f5f0ff"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.midljournal.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#f5f0ff"
      },
      "package": "com.midljournal.app"
    },
    "plugins": ["expo-router"]
  }
}
```

**Step 2: Create root layout**

Create `app/app/_layout.tsx`:

```tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(main)" />
      </Stack>
    </>
  );
}
```

**Step 3: Create index redirect**

Create `app/app/index.tsx`:

```tsx
import { Redirect } from 'expo-router';

export default function Index() {
  // TODO: Check auth state and onboarding status
  return <Redirect href="/onboarding" />;
}
```

**Step 4: Delete old App.tsx**

```bash
rm app/App.tsx
```

**Step 5: Update package.json main entry**

In `app/package.json`, update:

```json
{
  "main": "expo-router/entry"
}
```

**Step 6: Verify app loads**

```bash
cd /Users/rohanmalik/Projects/midl-journal/app
npx expo start --clear
```

Expected: App starts (will show error about missing onboarding route - that's ok)

**Step 7: Commit**

```bash
cd /Users/rohanmalik/Projects/midl-journal
git add app
git commit -m "feat: expo-router setup with file-based routing"
```

---

### Task 4: Configure NativeWind (Tailwind for RN)

**Files:**

- Create: `app/tailwind.config.js`
- Create: `app/global.css`
- Modify: `app/app/_layout.tsx`
- Create: `app/nativewind-env.d.ts`

**Step 1: Create tailwind config**

Create `app/tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        lavender: '#e6e0f5',
        peach: '#fde8d7',
        sage: '#7c9082',
        'sage-light': '#b8c4ba',
        'muted-blue': '#5c9eb7',
      },
    },
  },
  plugins: [],
};
```

**Step 2: Create global CSS**

Create `app/global.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Step 3: Create type declarations**

Create `app/nativewind-env.d.ts`:

```ts
/// <reference types="nativewind/types" />
```

**Step 4: Update babel config**

Create/update `app/babel.config.js`:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
```

**Step 5: Import CSS in layout**

Update `app/app/_layout.tsx`:

```tsx
import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(main)" />
      </Stack>
    </>
  );
}
```

**Step 6: Commit**

```bash
cd /Users/rohanmalik/Projects/midl-journal
git add app
git commit -m "feat: nativewind/tailwind configuration"
```

---

### Task 5: Create Supabase Project & Config

**Files:**

- Create: `app/lib/supabase.ts`
- Create: `app/.env.local`
- Add to: `app/.gitignore`

**Step 1: Create Supabase client config**

Create `app/lib/supabase.ts`:

```ts
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

**Step 2: Install URL polyfill**

```bash
cd /Users/rohanmalik/Projects/midl-journal/app
npm install react-native-url-polyfill
```

**Step 3: Create env template**

Create `app/.env.local`:

```
EXPO_PUBLIC_SUPABASE_URL=your-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_OPENAI_API_KEY=your-openai-key
```

**Step 4: Update gitignore**

Add to `app/.gitignore`:

```
.env.local
.env*.local
```

**Step 5: Commit**

```bash
cd /Users/rohanmalik/Projects/midl-journal
git add app/lib app/.gitignore
git commit -m "feat: supabase client configuration"
```

---

### Task 6: Database Schema Setup

**Files:**

- Create: `app/supabase/migrations/001_initial_schema.sql`

**Step 1: Create migrations directory**

```bash
mkdir -p /Users/rohanmalik/Projects/midl-journal/app/supabase/migrations
```

**Step 2: Create initial schema migration**

Create `app/supabase/migrations/001_initial_schema.sql`:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  onboarding_data JSONB,
  settings JSONB DEFAULT '{"notifications_enabled": false, "notification_time": "08:00"}'::jsonb,
  current_skill TEXT DEFAULT '00',
  stats JSONB DEFAULT '{"streak": 0, "total_sessions": 0, "current_skill_days": 0}'::jsonb
);

-- Entries table (unified Reflect + Ask)
CREATE TABLE entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),

  type TEXT NOT NULL CHECK (type IN ('reflect', 'ask')),
  is_guided BOOLEAN DEFAULT false,
  track_progress BOOLEAN DEFAULT true,

  raw_content TEXT NOT NULL,
  duration_seconds INTEGER,
  skill_practiced TEXT,

  -- AI-extracted signals (populated async)
  summary TEXT,
  mood_score SMALLINT CHECK (mood_score BETWEEN 1 AND 5),
  mood_tags TEXT[],
  themes TEXT[],
  has_breakthrough BOOLEAN DEFAULT false,
  has_struggle BOOLEAN DEFAULT false,
  has_crisis_flag BOOLEAN DEFAULT false,

  embedding VECTOR(1536),
  processed_at TIMESTAMPTZ
);

-- Rolling summaries
CREATE TABLE context_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),

  entry_ids UUID[] NOT NULL,
  date_range_start TIMESTAMPTZ NOT NULL,
  date_range_end TIMESTAMPTZ NOT NULL,

  summary TEXT NOT NULL,
  key_themes TEXT[],
  mood_trend TEXT,
  notable_events TEXT[],

  parent_summary_id UUID REFERENCES context_summaries(id)
);

-- Indexes
CREATE INDEX idx_entries_user_created ON entries(user_id, created_at DESC);
CREATE INDEX idx_entries_user_themes ON entries USING GIN(themes);
CREATE INDEX idx_entries_embedding ON entries USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_context_summaries_user ON context_summaries(user_id, created_at DESC);

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_summaries ENABLE ROW LEVEL SECURITY;

-- Policies: users can only access their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own entries" ON entries
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own summaries" ON context_summaries
  FOR ALL USING (auth.uid() = user_id);
```

**Step 3: Commit**

```bash
cd /Users/rohanmalik/Projects/midl-journal
git add app/supabase
git commit -m "feat: database schema with RLS policies"
```

---

## Phase 2: Authentication

### Task 7: Auth Context & Provider

**Files:**

- Create: `app/lib/auth-context.tsx`
- Modify: `app/app/_layout.tsx`

**Step 1: Create auth context**

Create `app/lib/auth-context.tsx`:

```tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

**Step 2: Wrap app with AuthProvider**

Update `app/app/_layout.tsx`:

```tsx
import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../lib/auth-context';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(main)" />
      </Stack>
    </AuthProvider>
  );
}
```

**Step 3: Commit**

```bash
cd /Users/rohanmalik/Projects/midl-journal
git add app/lib/auth-context.tsx app/app/_layout.tsx
git commit -m "feat: auth context with session management"
```

---

### Task 8: Social Auth (Google/Apple)

**Files:**

- Modify: `app/app.json`
- Create: `app/app/onboarding/index.tsx`
- Create: `app/app/onboarding/_layout.tsx`

**Step 1: Install auth dependencies**

```bash
cd /Users/rohanmalik/Projects/midl-journal/app
npx expo install expo-auth-session expo-crypto expo-web-browser
npm install @react-native-google-signin/google-signin
npx expo install expo-apple-authentication
```

**Step 2: Update app.json with auth schemes**

Add to `app/app.json` under "expo":

```json
{
  "expo": {
    "plugins": [
      "expo-router",
      "expo-apple-authentication",
      [
        "@react-native-google-signin/google-signin",
        {
          "iosUrlScheme": "com.googleusercontent.apps.YOUR_IOS_CLIENT_ID"
        }
      ]
    ]
  }
}
```

**Step 3: Create onboarding layout**

Create `app/app/onboarding/_layout.tsx`:

```tsx
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="questions" />
    </Stack>
  );
}
```

**Step 4: Create auth screen**

Create `app/app/onboarding/index.tsx`:

```tsx
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';

export default function AuthScreen() {
  const handleAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });

        if (!error) {
          router.replace('/onboarding/questions');
        }
      }
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        console.error('Apple Sign-In Error:', e);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    // TODO: Implement Google Sign-In
    // Requires additional native configuration
    console.log('Google Sign-In not yet configured');
  };

  return (
    <LinearGradient
      colors={['#e6e0f5', '#fde8d7']}
      className="flex-1 justify-center items-center px-8"
    >
      <View className="items-center mb-16">
        <Text className="text-4xl font-serif text-gray-800 mb-2">
          MIDL Journal
        </Text>
        <Text className="text-lg text-gray-600 text-center">
          Your meditation companion
        </Text>
      </View>

      <View className="w-full gap-4">
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={12}
          style={{ width: '100%', height: 50 }}
          onPress={handleAppleSignIn}
        />

        <Pressable
          onPress={handleGoogleSignIn}
          className="bg-white rounded-xl py-4 flex-row justify-center items-center border border-gray-200"
        >
          <Text className="text-gray-800 font-medium text-base">
            Continue with Google
          </Text>
        </Pressable>
      </View>

      <Text className="text-gray-500 text-sm mt-8 text-center">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </Text>
    </LinearGradient>
  );
}
```

**Step 5: Commit**

```bash
cd /Users/rohanmalik/Projects/midl-journal
git add app
git commit -m "feat: social auth screens (Apple/Google)"
```

---

### Task 9: Auth-Based Routing

**Files:**

- Modify: `app/app/index.tsx`

**Step 1: Update index with auth routing**

Update `app/app/index.tsx`:

```tsx
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../lib/auth-context';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Index() {
  const { session, loading } = useAuth();
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    if (session?.user) {
      checkOnboardingStatus();
    }
  }, [session]);

  const checkOnboardingStatus = async () => {
    const { data } = await supabase
      .from('users')
      .select('onboarding_data')
      .eq('id', session!.user.id)
      .single();

    setHasOnboarded(!!data?.onboarding_data);
  };

  if (loading || (session && hasOnboarded === null)) {
    return (
      <View className="flex-1 justify-center items-center bg-lavender">
        <ActivityIndicator size="large" color="#5c9eb7" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/onboarding" />;
  }

  if (!hasOnboarded) {
    return <Redirect href="/onboarding/questions" />;
  }

  return <Redirect href="/(main)/tracker" />;
}
```

**Step 2: Commit**

```bash
cd /Users/rohanmalik/Projects/midl-journal
git add app/app/index.tsx
git commit -m "feat: auth-based routing with onboarding check"
```

---

## Phase 3: Onboarding Flow

### Task 10: Onboarding Questions Screen

**Files:**

- Create: `app/app/onboarding/questions.tsx`
- Create: `app/lib/onboarding-types.ts`

**Step 1: Create onboarding types**

Create `app/lib/onboarding-types.ts`:

```ts
export type OnboardingData = {
  meditation_experience: 'never' | 'a_little' | 'regularly' | 'years';
  styles_tried: string[];
  struggles: string[];
  life_context: string[];
  what_brings_you: string;
  neurodivergence: string[];
  goals: string[];
};

export const ONBOARDING_OPTIONS = {
  meditation_experience: [
    { value: 'never', label: 'Never' },
    { value: 'a_little', label: 'A little' },
    { value: 'regularly', label: 'Regularly' },
    { value: 'years', label: 'Years of practice' },
  ],
  styles_tried: [
    'Guided apps',
    'Breath focus',
    'Body scan',
    'Vipassana',
    'Zen',
    'Other',
  ],
  struggles: [
    'Staying consistent',
    'Mind wandering',
    'Restlessness',
    'Sleepiness',
    'Not sure what to do',
  ],
  life_context: [
    'Stress',
    'Anxiety',
    'Depression',
    'Life transition',
    'Seeking growth',
    'Curiosity',
  ],
  neurodivergence: [
    'ADHD',
    'Anxiety',
    'Depression',
    'Trauma history',
    'None',
    'Prefer not to say',
  ],
  goals: [
    'Daily habit',
    'Less anxiety',
    'Better focus',
    'Deeper practice',
    'Self-understanding',
    'Not sure yet',
  ],
};
```

**Step 2: Create questions screen**

Create `app/app/onboarding/questions.tsx`:

```tsx
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth-context';
import { OnboardingData, ONBOARDING_OPTIONS } from '../../lib/onboarding-types';

type Step =
  | 'experience'
  | 'struggles'
  | 'context'
  | 'neuro'
  | 'goals'
  | 'summary';

export default function OnboardingQuestions() {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('experience');
  const [data, setData] = useState<Partial<OnboardingData>>({
    styles_tried: [],
    struggles: [],
    life_context: [],
    neurodivergence: [],
    goals: [],
  });

  const toggleArrayItem = (key: keyof OnboardingData, item: string) => {
    const current = (data[key] as string[]) || [];
    const updated = current.includes(item)
      ? current.filter((i) => i !== item)
      : [...current, item];
    setData({ ...data, [key]: updated });
  };

  const handleComplete = async () => {
    // Create user profile with onboarding data
    const { error } = await supabase.from('users').upsert({
      id: user!.id,
      email: user!.email!,
      onboarding_data: data,
      current_skill: '00',
    });

    if (!error) {
      router.replace('/(main)/tracker');
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'experience':
        return (
          <View className="gap-4">
            <Text className="text-xl font-medium text-gray-800 mb-2">
              Have you meditated before?
            </Text>
            {ONBOARDING_OPTIONS.meditation_experience.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => {
                  setData({ ...data, meditation_experience: opt.value as any });
                  setStep('struggles');
                }}
                className={`p-4 rounded-xl border ${
                  data.meditation_experience === opt.value
                    ? 'bg-muted-blue border-muted-blue'
                    : 'bg-white/80 border-gray-200'
                }`}
              >
                <Text
                  className={
                    data.meditation_experience === opt.value
                      ? 'text-white font-medium'
                      : 'text-gray-800'
                  }
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        );

      case 'struggles':
        return (
          <View className="gap-4">
            <Text className="text-xl font-medium text-gray-800 mb-2">
              What do you struggle with?
            </Text>
            <Text className="text-gray-600 mb-2">Select all that apply</Text>
            <View className="flex-row flex-wrap gap-2">
              {ONBOARDING_OPTIONS.struggles.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => toggleArrayItem('struggles', item)}
                  className={`px-4 py-2 rounded-full border ${
                    data.struggles?.includes(item)
                      ? 'bg-muted-blue border-muted-blue'
                      : 'bg-white/80 border-gray-200'
                  }`}
                >
                  <Text
                    className={
                      data.struggles?.includes(item)
                        ? 'text-white'
                        : 'text-gray-800'
                    }
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={() => setStep('context')}
              className="bg-muted-blue py-4 rounded-xl mt-4"
            >
              <Text className="text-white text-center font-medium">
                Continue
              </Text>
            </Pressable>
          </View>
        );

      case 'context':
        return (
          <View className="gap-4">
            <Text className="text-xl font-medium text-gray-800 mb-2">
              What's going on in your life right now?
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {ONBOARDING_OPTIONS.life_context.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => toggleArrayItem('life_context', item)}
                  className={`px-4 py-2 rounded-full border ${
                    data.life_context?.includes(item)
                      ? 'bg-muted-blue border-muted-blue'
                      : 'bg-white/80 border-gray-200'
                  }`}
                >
                  <Text
                    className={
                      data.life_context?.includes(item)
                        ? 'text-white'
                        : 'text-gray-800'
                    }
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              placeholder="What brings you here? (optional)"
              placeholderTextColor="#9ca3af"
              multiline
              className="bg-white/80 p-4 rounded-xl border border-gray-200 min-h-[100px] text-gray-800"
              value={data.what_brings_you}
              onChangeText={(text) =>
                setData({ ...data, what_brings_you: text })
              }
            />
            <Pressable
              onPress={() => setStep('neuro')}
              className="bg-muted-blue py-4 rounded-xl"
            >
              <Text className="text-white text-center font-medium">
                Continue
              </Text>
            </Pressable>
          </View>
        );

      case 'neuro':
        return (
          <View className="gap-4">
            <Text className="text-xl font-medium text-gray-800 mb-2">
              Anything that affects how you learn or focus?
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {ONBOARDING_OPTIONS.neurodivergence.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => toggleArrayItem('neurodivergence', item)}
                  className={`px-4 py-2 rounded-full border ${
                    data.neurodivergence?.includes(item)
                      ? 'bg-muted-blue border-muted-blue'
                      : 'bg-white/80 border-gray-200'
                  }`}
                >
                  <Text
                    className={
                      data.neurodivergence?.includes(item)
                        ? 'text-white'
                        : 'text-gray-800'
                    }
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={() => setStep('goals')}
              className="bg-muted-blue py-4 rounded-xl mt-4"
            >
              <Text className="text-white text-center font-medium">
                Continue
              </Text>
            </Pressable>
          </View>
        );

      case 'goals':
        return (
          <View className="gap-4">
            <Text className="text-xl font-medium text-gray-800 mb-2">
              What does success look like in 6 months?
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {ONBOARDING_OPTIONS.goals.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => toggleArrayItem('goals', item)}
                  className={`px-4 py-2 rounded-full border ${
                    data.goals?.includes(item)
                      ? 'bg-muted-blue border-muted-blue'
                      : 'bg-white/80 border-gray-200'
                  }`}
                >
                  <Text
                    className={
                      data.goals?.includes(item)
                        ? 'text-white'
                        : 'text-gray-800'
                    }
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={() => setStep('summary')}
              className="bg-muted-blue py-4 rounded-xl mt-4"
            >
              <Text className="text-white text-center font-medium">
                Continue
              </Text>
            </Pressable>
          </View>
        );

      case 'summary':
        return (
          <View className="gap-6">
            <View className="bg-white/90 p-6 rounded-2xl">
              <Text className="text-lg text-gray-800 leading-relaxed">
                Based on what you shared, I'd suggest starting with{' '}
                <Text className="font-bold">
                  Skill 00: Diaphragmatic Breathing
                </Text>
                . It's the foundation for everything else — simple but powerful.
              </Text>
            </View>
            <Pressable
              onPress={handleComplete}
              className="bg-muted-blue py-4 rounded-xl"
            >
              <Text className="text-white text-center font-medium text-lg">
                Let's Begin
              </Text>
            </Pressable>
          </View>
        );
    }
  };

  return (
    <LinearGradient colors={['#e6e0f5', '#fde8d7']} className="flex-1">
      <ScrollView
        className="flex-1 px-6 pt-16"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {step === 'experience' && (
          <View className="mb-8">
            <Text className="text-2xl font-serif text-gray-800 mb-2">
              Let's get to know each other
            </Text>
            <Text className="text-gray-600">
              So I can guide your practice better
            </Text>
          </View>
        )}
        {renderStep()}
      </ScrollView>
    </LinearGradient>
  );
}
```

**Step 3: Commit**

```bash
cd /Users/rohanmalik/Projects/midl-journal
git add app
git commit -m "feat: onboarding questions flow"
```

---

## Phase 4: Main App Screens

### Task 11: Main Layout with Floating Buttons

**Files:**

- Create: `app/app/(main)/_layout.tsx`
- Create: `app/app/(main)/tracker.tsx`
- Create: `app/components/FloatingButtons.tsx`

**Step 1: Create main layout**

Create `app/app/(main)/_layout.tsx`:

```tsx
import { Stack } from 'expo-router';
import FloatingButtons from '../../components/FloatingButtons';
import { View } from 'react-native';

export default function MainLayout() {
  return (
    <View className="flex-1">
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="tracker" />
        <Stack.Screen
          name="reflect"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="ask"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      </Stack>
      <FloatingButtons />
    </View>
  );
}
```

**Step 2: Create floating buttons component**

Create `app/components/FloatingButtons.tsx`:

```tsx
import { View, Pressable, Text } from 'react-native';
import { router, usePathname } from 'expo-router';

export default function FloatingButtons() {
  const pathname = usePathname();

  // Hide on modal screens
  if (pathname !== '/tracker' && pathname !== '/(main)/tracker') {
    return null;
  }

  return (
    <View className="absolute bottom-8 left-0 right-0 flex-row justify-center gap-4 px-6">
      <Pressable
        onPress={() => router.push('/(main)/reflect')}
        className="flex-1 bg-white rounded-2xl py-4 shadow-lg border border-gray-100"
      >
        <Text className="text-center text-gray-800 font-medium">Reflect</Text>
      </Pressable>
      <Pressable
        onPress={() => router.push('/(main)/ask')}
        className="flex-1 bg-muted-blue rounded-2xl py-4 shadow-lg"
      >
        <Text className="text-center text-white font-medium">Ask</Text>
      </Pressable>
    </View>
  );
}
```

**Step 3: Create tracker placeholder**

Create `app/app/(main)/tracker.tsx`:

```tsx
import { View, Text, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TrackerScreen() {
  return (
    <LinearGradient colors={['#e6e0f5', '#fde8d7']} className="flex-1">
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1 px-6 pt-4">
          {/* Skill Map Section */}
          <View className="mb-6">
            <Text className="text-lg font-medium text-gray-800 mb-3">
              Your Journey
            </Text>
            <View className="bg-white/80 rounded-2xl p-4 h-32 justify-center items-center">
              <Text className="text-gray-500">Skill Map (coming soon)</Text>
            </View>
          </View>

          {/* Stats Section */}
          <View className="flex-row gap-4 mb-6">
            <View className="flex-1 bg-white/80 rounded-2xl p-4">
              <Text className="text-gray-500 text-sm">Streak</Text>
              <Text className="text-2xl font-bold text-gray-800">0 days</Text>
            </View>
            <View className="flex-1 bg-white/80 rounded-2xl p-4">
              <Text className="text-gray-500 text-sm">Current Skill</Text>
              <Text className="text-2xl font-bold text-gray-800">00</Text>
              <Text className="text-gray-500 text-sm">Day 1</Text>
            </View>
          </View>

          {/* Session History */}
          <View className="mb-32">
            <Text className="text-lg font-medium text-gray-800 mb-3">
              Recent Sessions
            </Text>
            <View className="bg-white/80 rounded-2xl p-6 items-center">
              <Text className="text-gray-500">No sessions yet</Text>
              <Text className="text-gray-400 text-sm mt-1">
                Tap Reflect or Ask to start
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
```

**Step 4: Commit**

```bash
cd /Users/rohanmalik/Projects/midl-journal
git add app
git commit -m "feat: main layout with tracker and floating buttons"
```

---

### Task 12: Reflect Screen (Journal Entry)

**Files:**

- Create: `app/app/(main)/reflect.tsx`
- Create: `app/lib/entries.ts`

**Step 1: Create entries helper**

Create `app/lib/entries.ts`:

```ts
import { supabase } from './supabase';

export type Entry = {
  id: string;
  user_id: string;
  created_at: string;
  type: 'reflect' | 'ask';
  is_guided: boolean;
  track_progress: boolean;
  raw_content: string;
  duration_seconds: number | null;
  skill_practiced: string | null;
  summary: string | null;
  mood_score: number | null;
  mood_tags: string[] | null;
  themes: string[] | null;
  has_breakthrough: boolean;
  has_struggle: boolean;
};

export async function createEntry(
  userId: string,
  data: {
    type: 'reflect' | 'ask';
    raw_content: string;
    is_guided?: boolean;
    track_progress?: boolean;
    duration_seconds?: number;
    skill_practiced?: string;
  }
): Promise<Entry | null> {
  const { data: entry, error } = await supabase
    .from('entries')
    .insert({
      user_id: userId,
      ...data,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating entry:', error);
    return null;
  }

  return entry;
}

export async function getRecentEntries(
  userId: string,
  limit = 10
): Promise<Entry[]> {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching entries:', error);
    return [];
  }

  return data || [];
}
```

**Step 2: Create reflect screen**

Create `app/app/(main)/reflect.tsx`:

```tsx
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Switch,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { createEntry } from '../../lib/entries';

const DURATION_OPTIONS = [
  { label: '15 min', value: 900 },
  { label: '30 min', value: 1800 },
  { label: '45 min', value: 2700 },
  { label: '60 min', value: 3600 },
];

export default function ReflectScreen() {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [isGuided, setIsGuided] = useState(false);
  const [trackProgress, setTrackProgress] = useState(true);
  const [skillPracticed, setSkillPracticed] = useState('00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!content.trim() || !user) return;

    setIsSubmitting(true);

    const entry = await createEntry(user.id, {
      type: 'reflect',
      raw_content: content.trim(),
      is_guided: isGuided,
      track_progress: trackProgress,
      duration_seconds: duration,
      skill_practiced: skillPracticed,
    });

    if (entry) {
      // TODO: Call AI for feedback
      setFeedback('Good session. You showed up. That matters.');
    }

    setIsSubmitting(false);
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <LinearGradient colors={['#e6e0f5', '#fde8d7']} className="flex-1">
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 py-4">
            <Pressable onPress={handleClose}>
              <Text className="text-muted-blue text-base">Cancel</Text>
            </Pressable>
            <Text className="text-gray-800 font-medium">Reflect</Text>
            <View style={{ width: 50 }} />
          </View>

          <ScrollView className="flex-1 px-6">
            {/* Main Card */}
            <View className="bg-white/90 rounded-3xl p-6 shadow-sm">
              {/* Header */}
              <Text className="text-xl font-serif text-gray-800 mb-4">
                How was your practice?
              </Text>

              {/* Text Input */}
              <TextInput
                placeholder="Write freely..."
                placeholderTextColor="#9ca3af"
                multiline
                className="min-h-[200px] text-base text-gray-800 leading-relaxed"
                value={content}
                onChangeText={setContent}
                textAlignVertical="top"
              />

              {/* Add Details Toggle */}
              <Pressable
                onPress={() => setShowDetails(!showDetails)}
                className="flex-row items-center mt-4 py-2"
              >
                <Text className="text-muted-blue">
                  {showDetails ? '− Hide details' : '+ Add details'}
                </Text>
              </Pressable>

              {/* Details Section */}
              {showDetails && (
                <View className="mt-4 pt-4 border-t border-gray-100">
                  {/* Duration */}
                  <Text className="text-gray-600 mb-2">Duration</Text>
                  <View className="flex-row flex-wrap gap-2 mb-4">
                    {DURATION_OPTIONS.map((opt) => (
                      <Pressable
                        key={opt.value}
                        onPress={() => setDuration(opt.value)}
                        className={`px-4 py-2 rounded-full ${
                          duration === opt.value
                            ? 'bg-muted-blue'
                            : 'bg-gray-100'
                        }`}
                      >
                        <Text
                          className={
                            duration === opt.value
                              ? 'text-white'
                              : 'text-gray-700'
                          }
                        >
                          {opt.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {/* Guided Toggle */}
                  <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-gray-600">Guided session</Text>
                    <Switch
                      value={isGuided}
                      onValueChange={setIsGuided}
                      trackColor={{ false: '#d1d5db', true: '#5c9eb7' }}
                    />
                  </View>

                  {/* Track Progress Toggle */}
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-600">Track my progress</Text>
                    <Switch
                      value={trackProgress}
                      onValueChange={setTrackProgress}
                      trackColor={{ false: '#d1d5db', true: '#5c9eb7' }}
                    />
                  </View>
                </View>
              )}

              {/* Submit Button */}
              <Pressable
                onPress={handleSubmit}
                disabled={!content.trim() || isSubmitting}
                className={`mt-6 py-4 rounded-2xl ${
                  content.trim() && !isSubmitting
                    ? 'bg-muted-blue'
                    : 'bg-gray-200'
                }`}
              >
                <Text
                  className={`text-center font-medium ${
                    content.trim() && !isSubmitting
                      ? 'text-white'
                      : 'text-gray-400'
                  }`}
                >
                  {isSubmitting ? 'Saving...' : 'Get Insights'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>

          {/* Feedback Modal */}
          <Modal visible={!!feedback} transparent animationType="fade">
            <Pressable
              onPress={handleClose}
              className="flex-1 bg-black/50 justify-center items-center px-6"
            >
              <View className="bg-white rounded-3xl p-6 w-full">
                <Text className="text-xl font-serif text-gray-800 mb-4">
                  Reflection saved
                </Text>
                <Text className="text-gray-600 text-base leading-relaxed mb-6">
                  {feedback}
                </Text>
                <Pressable
                  onPress={handleClose}
                  className="bg-muted-blue py-4 rounded-2xl"
                >
                  <Text className="text-white text-center font-medium">
                    Done
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Modal>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
```

**Step 3: Commit**

```bash
cd /Users/rohanmalik/Projects/midl-journal
git add app
git commit -m "feat: reflect screen with journal entry flow"
```

---

### Task 13: Ask Screen (Chat)

**Files:**

- Create: `app/app/(main)/ask.tsx`
- Create: `app/lib/openai.ts`

**Step 1: Create OpenAI helper**

Create `app/lib/openai.ts`:

```ts
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

export type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export async function chat(messages: Message[]): Promise<string> {
  const systemMessage: Message = {
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
  return (
    data.choices?.[0]?.message?.content || 'Sorry, I had trouble responding.'
  );
}
```

**Step 2: Create ask screen**

Create `app/app/(main)/ask.tsx`:

```tsx
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { createEntry } from '../../lib/entries';
import { chat, Message } from '../../lib/openai';

export default function AskScreen() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [trackProgress, setTrackProgress] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chat(newMessages);
      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
      };
      setMessages([...newMessages, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages([
        ...newMessages,
        { role: 'assistant', content: 'Sorry, something went wrong.' },
      ]);
    }

    setIsLoading(false);
  };

  const handleClose = async () => {
    // Save conversation as entry if there were messages
    if (messages.length > 0 && user) {
      const content = messages
        .map((m) => `${m.role}: ${m.content}`)
        .join('\n\n');

      await createEntry(user.id, {
        type: 'ask',
        raw_content: content,
        track_progress: trackProgress,
      });
    }
    router.back();
  };

  return (
    <LinearGradient colors={['#e6e0f5', '#fde8d7']} className="flex-1">
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 py-4">
            <Pressable onPress={handleClose}>
              <Text className="text-muted-blue text-base">Done</Text>
            </Pressable>
            <Text className="text-gray-800 font-medium">Ask</Text>
            <View style={{ width: 50 }} />
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-6"
            onContentSizeChange={() =>
              scrollViewRef.current?.scrollToEnd({ animated: true })
            }
          >
            {messages.length === 0 && (
              <View className="items-center mt-8">
                <Text className="text-gray-500 text-center">
                  Ask me anything about MIDL meditation, your practice, or how
                  to work with specific challenges.
                </Text>
              </View>
            )}

            {messages.map((message, index) => (
              <View
                key={index}
                className={`mb-3 max-w-[85%] ${
                  message.role === 'user' ? 'self-end' : 'self-start'
                }`}
              >
                <View
                  className={`rounded-2xl px-4 py-3 ${
                    message.role === 'user' ? 'bg-muted-blue' : 'bg-white/90'
                  }`}
                >
                  <Text
                    className={`text-base leading-relaxed ${
                      message.role === 'user' ? 'text-white' : 'text-gray-800'
                    }`}
                  >
                    {message.content}
                  </Text>
                </View>
              </View>
            ))}

            {isLoading && (
              <View className="self-start mb-3 max-w-[85%]">
                <View className="bg-white/90 rounded-2xl px-4 py-3">
                  <Text className="text-gray-500">Thinking...</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Track Progress Toggle */}
          <View className="px-6 py-2 flex-row items-center">
            <Pressable
              onPress={() => setTrackProgress(!trackProgress)}
              className="flex-row items-center"
            >
              <View
                className={`w-5 h-5 rounded border mr-2 items-center justify-center ${
                  trackProgress
                    ? 'bg-muted-blue border-muted-blue'
                    : 'border-gray-300'
                }`}
              >
                {trackProgress && <Text className="text-white text-xs">✓</Text>}
              </View>
              <Text className="text-gray-600 text-sm">Track my progress</Text>
            </Pressable>
          </View>

          {/* Input Bar */}
          <View className="px-6 pb-4">
            <View className="flex-row bg-white/90 rounded-2xl border border-gray-200">
              <TextInput
                placeholder="Ask anything..."
                placeholderTextColor="#9ca3af"
                className="flex-1 px-4 py-3 text-base text-gray-800"
                value={input}
                onChangeText={setInput}
                onSubmitEditing={handleSend}
                returnKeyType="send"
              />
              <Pressable
                onPress={handleSend}
                disabled={!input.trim() || isLoading}
                className="px-4 justify-center"
              >
                <Text
                  className={`font-medium ${
                    input.trim() && !isLoading
                      ? 'text-muted-blue'
                      : 'text-gray-300'
                  }`}
                >
                  Send
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
```

**Step 3: Commit**

```bash
cd /Users/rohanmalik/Projects/midl-journal
git add app
git commit -m "feat: ask screen with AI chat"
```

---

### Task 14: Skill Map Component (Horizontal Timeline)

**Files:**

- Create: `app/components/SkillMap.tsx`
- Create: `app/lib/midl-skills.ts`
- Modify: `app/app/(main)/tracker.tsx`

**Step 1: Create MIDL skills data**

Create `app/lib/midl-skills.ts`:

```ts
export type Skill = {
  id: string;
  name: string;
  cultivation: number;
  marker: string;
  hindrance: string;
};

export const CULTIVATIONS = [
  { id: 1, name: 'Mindfulness of Body', skills: ['00', '01', '02', '03'] },
  { id: 2, name: 'Mindfulness of Breathing', skills: ['04', '05', '06'] },
  { id: 3, name: 'Calm & Tranquillity', skills: ['07', '08', '09'] },
  { id: 4, name: 'Joyfulness & Unification', skills: ['10', '11', '12'] },
  {
    id: 5,
    name: 'Pleasure Jhana & Equanimity',
    skills: ['13', '14', '15', '16'],
  },
];

export const SKILLS: Record<string, Skill> = {
  '00': {
    id: '00',
    name: 'Diaphragmatic Breathing',
    cultivation: 1,
    marker: 'Diaphragm Breathing',
    hindrance: 'Stress Breathing',
  },
  '01': {
    id: '01',
    name: 'Body Relaxation',
    cultivation: 1,
    marker: 'Body Relaxation',
    hindrance: 'Physical Restlessness',
  },
  '02': {
    id: '02',
    name: 'Mind Relaxation',
    cultivation: 1,
    marker: 'Mind Relaxation',
    hindrance: 'Mental Restlessness',
  },
  '03': {
    id: '03',
    name: 'Mindful Presence',
    cultivation: 1,
    marker: 'Mindful Presence',
    hindrance: 'Sleepiness & Dullness',
  },
  '04': {
    id: '04',
    name: 'Content Presence',
    cultivation: 2,
    marker: 'Content Presence',
    hindrance: 'Habitual Forgetting',
  },
  '05': {
    id: '05',
    name: 'Natural Breathing',
    cultivation: 2,
    marker: 'Natural Breathing',
    hindrance: 'Habitual Control',
  },
  '06': {
    id: '06',
    name: 'Whole of Each Breath',
    cultivation: 2,
    marker: 'Whole of Each Breath',
    hindrance: 'Mind Wandering',
  },
  '07': {
    id: '07',
    name: 'Breath Sensations',
    cultivation: 3,
    marker: 'Breath Sensations',
    hindrance: 'Gross Dullness',
  },
  '08': {
    id: '08',
    name: 'One Point of Sensation',
    cultivation: 3,
    marker: 'One Point of Sensation',
    hindrance: 'Subtle Dullness',
  },
  '09': {
    id: '09',
    name: 'Sustained Attention',
    cultivation: 3,
    marker: 'Sustained Attention',
    hindrance: 'Subtle Wandering',
  },
  '10': {
    id: '10',
    name: 'Whole-Body Breathing',
    cultivation: 4,
    marker: 'Whole-Body Breathing',
    hindrance: 'Sensory Stimulation',
  },
  '11': {
    id: '11',
    name: 'Sustained Awareness',
    cultivation: 4,
    marker: 'Sustained Awareness',
    hindrance: 'Anticipation of Pleasure',
  },
  '12': {
    id: '12',
    name: 'Access Concentration',
    cultivation: 4,
    marker: 'Access Concentration',
    hindrance: 'Fear of Letting Go',
  },
  '13': {
    id: '13',
    name: 'Pleasure Jhana',
    cultivation: 5,
    marker: 'Pleasure Jhana',
    hindrance: 'Attachment to Pleasure',
  },
  '14': {
    id: '14',
    name: 'Happy Jhana',
    cultivation: 5,
    marker: 'Happy Jhana',
    hindrance: 'Restless Energy',
  },
  '15': {
    id: '15',
    name: 'Content Jhana',
    cultivation: 5,
    marker: 'Content Jhana',
    hindrance: 'Subtle Discontent',
  },
  '16': {
    id: '16',
    name: 'Equanimity Jhana',
    cultivation: 5,
    marker: 'Equanimity Jhana',
    hindrance: 'Subtle Preferences',
  },
};

export function getSkillNumber(skillId: string): number {
  return parseInt(skillId, 10);
}

export function isSkillCompleted(
  skillId: string,
  currentSkill: string
): boolean {
  return getSkillNumber(skillId) < getSkillNumber(currentSkill);
}

export function isCurrentSkill(skillId: string, currentSkill: string): boolean {
  return skillId === currentSkill;
}
```

**Step 2: Create SkillMap component**

Create `app/components/SkillMap.tsx`:

```tsx
import { View, Text, ScrollView, Pressable } from 'react-native';
import {
  SKILLS,
  CULTIVATIONS,
  isSkillCompleted,
  isCurrentSkill,
} from '../lib/midl-skills';
import { useState } from 'react';

type SkillMapProps = {
  currentSkill: string;
  onSkillPress?: (skillId: string) => void;
};

export default function SkillMap({
  currentSkill,
  onSkillPress,
}: SkillMapProps) {
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  const handleSkillPress = (skillId: string) => {
    setSelectedSkill(skillId === selectedSkill ? null : skillId);
    onSkillPress?.(skillId);
  };

  const allSkills = Object.keys(SKILLS);

  return (
    <View className="bg-white/80 rounded-2xl p-4">
      {/* Timeline */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row items-center py-2">
          {allSkills.map((skillId, index) => {
            const skill = SKILLS[skillId];
            const isCompleted = isSkillCompleted(skillId, currentSkill);
            const isCurrent = isCurrentSkill(skillId, currentSkill);
            const isSelected = selectedSkill === skillId;

            // Check if this is the start of a new cultivation
            const prevSkill = index > 0 ? SKILLS[allSkills[index - 1]] : null;
            const isNewCultivation =
              !prevSkill || prevSkill.cultivation !== skill.cultivation;

            return (
              <View key={skillId} className="flex-row items-center">
                {/* Cultivation marker */}
                {isNewCultivation && index > 0 && (
                  <View className="w-px h-8 bg-gray-200 mx-2" />
                )}

                {/* Skill node */}
                <Pressable
                  onPress={() => handleSkillPress(skillId)}
                  className="items-center mx-1"
                >
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center border-2 ${
                      isCurrent
                        ? 'bg-muted-blue border-muted-blue'
                        : isCompleted
                          ? 'bg-sage border-sage'
                          : 'bg-white border-gray-200'
                    }`}
                  >
                    <Text
                      className={`font-medium text-sm ${
                        isCurrent || isCompleted
                          ? 'text-white'
                          : 'text-gray-400'
                      }`}
                    >
                      {skillId}
                    </Text>
                  </View>
                  {isCurrent && (
                    <View className="w-2 h-2 rounded-full bg-muted-blue mt-1" />
                  )}
                </Pressable>

                {/* Connecting line */}
                {index < allSkills.length - 1 && (
                  <View
                    className={`w-4 h-0.5 ${
                      isCompleted ? 'bg-sage' : 'bg-gray-200'
                    }`}
                  />
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Selected skill details */}
      {selectedSkill && (
        <View className="mt-4 pt-4 border-t border-gray-100">
          <Text className="font-medium text-gray-800">
            Skill {selectedSkill}: {SKILLS[selectedSkill].name}
          </Text>
          <Text className="text-gray-500 text-sm mt-1">
            Marker: {SKILLS[selectedSkill].marker}
          </Text>
          <Text className="text-gray-500 text-sm">
            Works with: {SKILLS[selectedSkill].hindrance}
          </Text>
          <Text className="text-muted-blue text-sm mt-2">
            Learn more at midlmeditation.com →
          </Text>
        </View>
      )}
    </View>
  );
}
```

**Step 3: Update tracker to use SkillMap**

Update `app/app/(main)/tracker.tsx`:

```tsx
import { View, Text, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import { supabase } from '../../lib/supabase';
import { getRecentEntries, Entry } from '../../lib/entries';
import SkillMap from '../../components/SkillMap';

export default function TrackerScreen() {
  const { user } = useAuth();
  const [currentSkill, setCurrentSkill] = useState('00');
  const [stats, setStats] = useState({ streak: 0, current_skill_days: 0 });
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    // Load user profile
    const { data: profile } = await supabase
      .from('users')
      .select('current_skill, stats')
      .eq('id', user!.id)
      .single();

    if (profile) {
      setCurrentSkill(profile.current_skill || '00');
      setStats(profile.stats || { streak: 0, current_skill_days: 0 });
    }

    // Load recent entries
    const recentEntries = await getRecentEntries(user!.id, 10);
    setEntries(recentEntries);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <LinearGradient colors={['#e6e0f5', '#fde8d7']} className="flex-1">
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1 px-6 pt-4">
          {/* Skill Map Section */}
          <View className="mb-6">
            <Text className="text-lg font-medium text-gray-800 mb-3">
              Your Journey
            </Text>
            <SkillMap currentSkill={currentSkill} />
          </View>

          {/* Stats Section */}
          <View className="flex-row gap-4 mb-6">
            <View className="flex-1 bg-white/80 rounded-2xl p-4">
              <Text className="text-gray-500 text-sm">Streak</Text>
              <Text className="text-2xl font-bold text-gray-800">
                {stats.streak} days
              </Text>
            </View>
            <View className="flex-1 bg-white/80 rounded-2xl p-4">
              <Text className="text-gray-500 text-sm">Current Skill</Text>
              <Text className="text-2xl font-bold text-gray-800">
                {currentSkill}
              </Text>
              <Text className="text-gray-500 text-sm">
                Day {stats.current_skill_days || 1}
              </Text>
            </View>
          </View>

          {/* Session History */}
          <View className="mb-32">
            <Text className="text-lg font-medium text-gray-800 mb-3">
              Recent Sessions
            </Text>
            {entries.length === 0 ? (
              <View className="bg-white/80 rounded-2xl p-6 items-center">
                <Text className="text-gray-500">No sessions yet</Text>
                <Text className="text-gray-400 text-sm mt-1">
                  Tap Reflect or Ask to start
                </Text>
              </View>
            ) : (
              <View className="gap-3">
                {entries.map((entry) => (
                  <View key={entry.id} className="bg-white/80 rounded-2xl p-4">
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2">
                          <Text className="text-gray-500 text-sm">
                            {formatDate(entry.created_at)}
                          </Text>
                          <View
                            className={`px-2 py-0.5 rounded ${
                              entry.type === 'reflect'
                                ? 'bg-sage-light'
                                : 'bg-lavender'
                            }`}
                          >
                            <Text className="text-xs text-gray-600 capitalize">
                              {entry.type}
                            </Text>
                          </View>
                          {entry.duration_seconds && (
                            <Text className="text-gray-400 text-sm">
                              {Math.round(entry.duration_seconds / 60)} min
                            </Text>
                          )}
                        </View>
                        <Text className="text-gray-800 mt-1" numberOfLines={2}>
                          {entry.raw_content.substring(0, 100)}
                          {entry.raw_content.length > 100 ? '...' : ''}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
```

**Step 4: Commit**

```bash
cd /Users/rohanmalik/Projects/midl-journal
git add app
git commit -m "feat: skill map horizontal timeline component"
```

---

## Phase 5: AI Integration

### Task 15: AI Feedback for Reflect Mode

**Files:**

- Create: `app/lib/ai-feedback.ts`
- Modify: `app/app/(main)/reflect.tsx`

**Step 1: Create AI feedback helper**

Create `app/lib/ai-feedback.ts`:

```ts
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

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
  const prompt = `You are a meditation guide. The user just completed a meditation session and wrote this reflection:

"${context.content}"

${context.duration ? `Duration: ${Math.round(context.duration / 60)} minutes` : ''}
${context.isGuided ? 'This was a guided session.' : ''}
${context.skillPracticed ? `They were practicing MIDL Skill ${context.skillPracticed}.` : ''}

Give brief, warm feedback (1-3 sentences). You can:
- Acknowledge what went well
- Offer a gentle suggestion for next time
- Note patterns if relevant
- Simply validate their effort

Keep it conversational and supportive. No emojis.`;

  try {
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
    return (
      data.choices?.[0]?.message?.content ||
      'Good session. You showed up. That matters.'
    );
  } catch (error) {
    console.error('AI feedback error:', error);
    return 'Good session. You showed up. That matters.';
  }
}
```

**Step 2: Update reflect screen to use AI feedback**

In `app/app/(main)/reflect.tsx`, update the `handleSubmit` function:

```tsx
// Add import at top
import { getReflectionFeedback } from '../../lib/ai-feedback';

// Update handleSubmit function
const handleSubmit = async () => {
  if (!content.trim() || !user) return;

  setIsSubmitting(true);

  const entry = await createEntry(user.id, {
    type: 'reflect',
    raw_content: content.trim(),
    is_guided: isGuided,
    track_progress: trackProgress,
    duration_seconds: duration,
    skill_practiced: skillPracticed,
  });

  if (entry) {
    const aiFeedback = await getReflectionFeedback({
      content: content.trim(),
      duration: duration || undefined,
      isGuided,
      skillPracticed,
    });
    setFeedback(aiFeedback);
  }

  setIsSubmitting(false);
};
```

**Step 3: Commit**

```bash
cd /Users/rohanmalik/Projects/midl-journal
git add app
git commit -m "feat: AI feedback for reflection entries"
```

---

### Task 16: Entry Processing (Summaries & Signals)

**Files:**

- Create: `app/lib/entry-processor.ts`

**Step 1: Create entry processor**

Create `app/lib/entry-processor.ts`:

```ts
import { supabase } from './supabase';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

export type ProcessedSignals = {
  summary: string;
  mood_score: number;
  mood_tags: string[];
  themes: string[];
  has_breakthrough: boolean;
  has_struggle: boolean;
  has_crisis_flag: boolean;
};

export async function processEntry(
  entryId: string,
  content: string
): Promise<ProcessedSignals | null> {
  // Skip very short entries
  if (content.split(' ').length < 10) {
    return null;
  }

  const prompt = `Analyze this meditation journal entry and extract:
1. A brief summary (1-2 sentences)
2. Mood score (1-5, where 1=very negative, 5=very positive)
3. Mood tags (list of emotions like "anxious", "calm", "frustrated", "peaceful")
4. Themes (topics like "sleep", "work", "restlessness", "breathing")
5. Whether this describes a breakthrough moment (true/false)
6. Whether this describes a struggle (true/false)
7. Whether this contains crisis language like self-harm or suicidal ideation (true/false)

Entry: "${content}"

Respond in JSON format:
{
  "summary": "...",
  "mood_score": 3,
  "mood_tags": ["..."],
  "themes": ["..."],
  "has_breakthrough": false,
  "has_struggle": false,
  "has_crisis_flag": false
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        response_format: { type: 'json_object' },
      }),
    });

    const data = await response.json();
    const signals = JSON.parse(
      data.choices?.[0]?.message?.content || '{}'
    ) as ProcessedSignals;

    // Update entry with signals
    await supabase
      .from('entries')
      .update({
        summary: signals.summary,
        mood_score: signals.mood_score,
        mood_tags: signals.mood_tags,
        themes: signals.themes,
        has_breakthrough: signals.has_breakthrough,
        has_struggle: signals.has_struggle,
        has_crisis_flag: signals.has_crisis_flag,
        processed_at: new Date().toISOString(),
      })
      .eq('id', entryId);

    return signals;
  } catch (error) {
    console.error('Entry processing error:', error);
    return null;
  }
}
```

**Step 2: Commit**

```bash
cd /Users/rohanmalik/Projects/midl-journal
git add app/lib/entry-processor.ts
git commit -m "feat: entry processing for summaries and signals"
```

---

## Phase 6: Final Polish

### Task 17: Safe Area & Platform Adjustments

**Files:**

- Modify: `app/app/_layout.tsx`

**Step 1: Add SafeAreaProvider**

Update `app/app/_layout.tsx`:

```tsx
import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../lib/auth-context';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(main)" />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
```

**Step 2: Commit**

```bash
cd /Users/rohanmalik/Projects/midl-journal
git add app/app/_layout.tsx
git commit -m "feat: add SafeAreaProvider"
```

---

### Task 18: Environment Setup Documentation

**Files:**

- Create: `app/SETUP.md`

**Step 1: Create setup documentation**

Create `app/SETUP.md`:

```markdown
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

````

## Supabase Setup

1. Create new Supabase project
2. Enable pgvector extension: Database → Extensions → vector
3. Run migration: `supabase/migrations/001_initial_schema.sql`
4. Enable Google/Apple auth in Authentication → Providers

## Running the App

```bash
cd app
npm install
npx expo start
````

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

````

**Step 2: Commit**

```bash
cd /Users/rohanmalik/Projects/midl-journal
git add app/SETUP.md
git commit -m "docs: development setup guide"
````

---

## Summary

**Phases completed:**

1. Project Foundation (Tasks 1-6)
2. Authentication (Tasks 7-9)
3. Onboarding Flow (Task 10)
4. Main App Screens (Tasks 11-14)
5. AI Integration (Tasks 15-16)
6. Final Polish (Tasks 17-18)

**Total tasks:** 18

**What's built:**

- Expo + React Native app with TypeScript
- Supabase auth (Google/Apple)
- Onboarding questionnaire
- Tracker home screen with skill map
- Reflect mode (journal) with AI feedback
- Ask mode (chat) with AI
- Entry processing for summaries/signals

**Not included (future):**

- Push notifications
- Rolling summaries
- Semantic search (pgvector)
- Settings screen
- Skill advancement warnings
