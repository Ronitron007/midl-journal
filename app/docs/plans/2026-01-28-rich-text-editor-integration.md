# Rich Text Editor Integration with 10tap-editor

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace basic `TextInput` components in Reflect and Ask screens with a rich text editor using `@10play/tentap-editor` — a battle-tested Tiptap port for React Native.

**Why:** Enable formatting (bold, italic, lists, headings) in journal entries for better expressiveness. Store entries as HTML for consistent rendering and future web compatibility.

**Architecture:** 10tap-editor wraps Tiptap in a WebView with native bridge communication. Uses `useEditorBridge` hook for state management and provides pre-built `RichText` and `Toolbar` components.

**Tech Stack:** @10play/tentap-editor, react-native-webview (peer dep), Tiptap extensions

---

## Research Summary

### Why 10tap-editor?

| Criteria | @10play/tentap-editor |
|----------|----------------------|
| **GitHub Stars** | ~1.1k |
| **Last Updated** | Active (v1.0.1, ~2 months ago) |
| **Expo Compatible** | ✅ Yes (Expo Go + Dev Client) |
| **RN 0.73+ / New Arch** | ✅ Supported |
| **TypeScript** | ✅ Built-in declarations |
| **Keyboard Handling** | ✅ Built-in `useKeyboard` hook |
| **Customizable** | ✅ Custom Tiptap extensions |

### Alternatives Considered

- **Plain TextInput** — Current approach, no formatting
- **react-native-pell-rich-editor** — Less maintained, fewer features
- **DIY WebView + Tiptap** — More control but significant implementation effort

### Trade-offs

✅ **Pros:**
- Full rich text formatting
- Consistent HTML output (future web compatibility)
- Active maintenance
- Good documentation

⚠️ **Cons:**
- WebView performance overhead
- Slightly larger bundle size
- Keyboard handling requires extra config on Android

---

## Phase 1: Setup & Dependencies

### Task 1: Install 10tap-editor and dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install packages**

```bash
cd /Users/rohanmalik/Projects/midl-journal/app
npm install @10play/tentap-editor
npx expo install react-native-webview
```

**Step 2: Verify installation**

```bash
cat package.json | grep -E "tentap-editor|webview"
```

Expected: Both packages listed in dependencies

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add 10tap-editor and react-native-webview"
```

---

### Task 2: Create reusable RichTextEditor component

**Files:**
- Create: `components/RichTextEditor.tsx`

**Step 1: Create the component**

Create `components/RichTextEditor.tsx`:

```tsx
import React, { useEffect } from 'react';
import { View, StyleSheet, Platform, KeyboardAvoidingView } from 'react-native';
import {
  RichText,
  Toolbar,
  useEditorBridge,
  TenTapStartKit,
  CoreBridge,
  darkEditorTheme,
  DEFAULT_TOOLBAR_ITEMS,
} from '@10play/tentap-editor';

type RichTextEditorProps = {
  initialContent?: string;
  placeholder?: string;
  onContentChange?: (html: string) => void;
  editable?: boolean;
  showToolbar?: boolean;
  minHeight?: number;
  autoFocus?: boolean;
};

export default function RichTextEditor({
  initialContent = '',
  placeholder = 'Write freely...',
  onContentChange,
  editable = true,
  showToolbar = true,
  minHeight = 200,
  autoFocus = false,
}: RichTextEditorProps) {
  const editor = useEditorBridge({
    autofocus: autoFocus,
    avoidIosKeyboard: true,
    initialContent,
    bridgeExtensions: [
      ...TenTapStartKit,
      CoreBridge.configureCSS(`
        * {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .ProseMirror {
          padding: 16px;
          min-height: ${minHeight}px;
          font-size: 16px;
          line-height: 1.6;
          color: #1f2937;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: "${placeholder}";
          color: #9ca3af;
          pointer-events: none;
          float: left;
          height: 0;
        }
        .ProseMirror:focus {
          outline: none;
        }
      `),
    ],
  });

  // Sync content changes to parent
  useEffect(() => {
    if (onContentChange && editor) {
      const unsubscribe = editor.subscribeToContentUpdate(() => {
        editor.getHTML().then((html) => {
          onContentChange(html);
        });
      });
      return unsubscribe;
    }
  }, [editor, onContentChange]);

  // Simplified toolbar items for journal use
  const toolbarItems = [
    DEFAULT_TOOLBAR_ITEMS.bold,
    DEFAULT_TOOLBAR_ITEMS.italic,
    DEFAULT_TOOLBAR_ITEMS.bulletList,
    DEFAULT_TOOLBAR_ITEMS.orderedList,
    DEFAULT_TOOLBAR_ITEMS.heading,
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={[styles.editorContainer, { minHeight }]}>
        <RichText
          editor={editor}
          style={styles.richText}
        />
      </View>
      {showToolbar && (
        <Toolbar
          editor={editor}
          items={toolbarItems}
          style={styles.toolbar}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  editorContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  richText: {
    flex: 1,
  },
  toolbar: {
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingVertical: 8,
  },
});
```

**Step 2: Commit**

```bash
git add components/RichTextEditor.tsx
git commit -m "feat: create reusable RichTextEditor component"
```

---

### Task 3: Create editor utility functions

**Files:**
- Create: `lib/rich-text-utils.ts`

**Step 1: Create utility file**

Create `lib/rich-text-utils.ts`:

```ts
/**
 * Strip HTML tags to get plain text for summaries/previews
 */
export function htmlToPlainText(html: string): string {
  if (!html) return '';
  
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Check if HTML content is empty (just whitespace or empty tags)
 */
export function isHtmlEmpty(html: string): boolean {
  if (!html) return true;
  const plainText = htmlToPlainText(html);
  return plainText.length === 0;
}

/**
 * Truncate HTML content safely (converts to plain text first)
 */
export function truncateHtml(html: string, maxLength: number): string {
  const plainText = htmlToPlainText(html);
  if (plainText.length <= maxLength) return plainText;
  return plainText.substring(0, maxLength - 3) + '...';
}

/**
 * Count words in HTML content
 */
export function wordCount(html: string): number {
  const plainText = htmlToPlainText(html);
  return plainText.split(/\s+/).filter(Boolean).length;
}
```

**Step 2: Commit**

```bash
git add lib/rich-text-utils.ts
git commit -m "feat: add rich text utility functions"
```

---

## Phase 2: Integrate into Reflect Screen

### Task 4: Update Reflect screen to use RichTextEditor

**Files:**
- Modify: `app/(main)/reflect.tsx`

**Step 1: Update imports and state**

At the top of `app/(main)/reflect.tsx`:

```tsx
// Add new imports
import RichTextEditor from '../../components/RichTextEditor';
import { isHtmlEmpty, htmlToPlainText } from '../../lib/rich-text-utils';

// Update state - content is now HTML
const [content, setContent] = useState('');
const [plainTextContent, setPlainTextContent] = useState('');

// Add content change handler
const handleContentChange = (html: string) => {
  setContent(html);
  setPlainTextContent(htmlToPlainText(html));
};
```

**Step 2: Replace TextInput with RichTextEditor**

Replace the TextInput inside the main card:

```tsx
{/* Replace this: */}
<TextInput
  placeholder="Write freely..."
  placeholderTextColor="#9ca3af"
  multiline
  className="min-h-[200px] text-base text-gray-800 leading-relaxed"
  value={content}
  onChangeText={setContent}
  textAlignVertical="top"
/>

{/* With this: */}
<View className="min-h-[200px] -mx-6 -mt-2">
  <RichTextEditor
    placeholder="Write freely about your practice..."
    onContentChange={handleContentChange}
    showToolbar={true}
    minHeight={200}
    autoFocus={true}
  />
</View>
```

**Step 3: Update validation and submission**

Update the handleSubmit and button disabled state:

```tsx
const handleSubmit = async () => {
  if (isHtmlEmpty(content) || !user) return;

  setIsSubmitting(true);

  const entry = await createEntry(user.id, {
    type: 'reflect',
    raw_content: content, // Now stores HTML
    is_guided: isGuided,
    track_progress: trackProgress,
    duration_seconds: duration,
    skill_practiced: skillPracticed,
  });

  if (entry) {
    // Pass plain text to AI for feedback
    const aiFeedback = await getReflectionFeedback({
      content: plainTextContent,
      duration: duration || undefined,
      isGuided,
      skillPracticed,
    });
    setFeedback(aiFeedback);
  }

  setIsSubmitting(false);
};

// Update button disabled state
<Pressable
  onPress={handleSubmit}
  disabled={isHtmlEmpty(content) || isSubmitting}
  // ...
>
```

**Step 4: Commit**

```bash
git add app/\(main\)/reflect.tsx
git commit -m "feat: integrate rich text editor into Reflect screen"
```

---

### Task 5: Update entries display to render HTML

**Files:**
- Create: `components/HtmlRenderer.tsx`
- Modify: `app/(main)/tracker.tsx`

**Step 1: Create HTML renderer component**

Create `components/HtmlRenderer.tsx`:

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { truncateHtml } from '../lib/rich-text-utils';

type HtmlRendererProps = {
  html: string;
  maxLength?: number;
  style?: object;
};

/**
 * Simple HTML renderer for entry previews.
 * For full rendering, consider react-native-render-html.
 * This is a lightweight solution for previews only.
 */
export default function HtmlRenderer({ 
  html, 
  maxLength = 100,
  style 
}: HtmlRendererProps) {
  const preview = truncateHtml(html, maxLength);
  
  return (
    <Text style={[styles.text, style]} numberOfLines={2}>
      {preview}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    color: '#1f2937',
    fontSize: 14,
    lineHeight: 20,
  },
});
```

**Step 2: Update tracker to use HtmlRenderer**

In `app/(main)/tracker.tsx`, update the entry preview:

```tsx
// Add import
import HtmlRenderer from '../../components/HtmlRenderer';

// Replace the raw_content display:
{/* Replace this: */}
<Text
  className="text-gray-800 mt-1"
  numberOfLines={2}
>
  {entry.raw_content.substring(0, 100)}
  {entry.raw_content.length > 100 ? '...' : ''}
</Text>

{/* With this: */}
<HtmlRenderer
  html={entry.raw_content}
  maxLength={100}
  style={{ marginTop: 4 }}
/>
```

**Step 3: Commit**

```bash
git add components/HtmlRenderer.tsx app/\(main\)/tracker.tsx
git commit -m "feat: add HTML renderer for entry previews"
```

---

## Phase 3: Integrate into Ask Screen

### Task 6: Update Ask screen with rich text input

**Files:**
- Modify: `app/(main)/ask.tsx`

**Step 1: Create simplified editor for chat input**

Since the Ask screen has a chat-style input (single line with send button), we'll use a lighter approach:

```tsx
// At top of file, add imports
import RichTextEditor from '../../components/RichTextEditor';
import { isHtmlEmpty, htmlToPlainText } from '../../lib/rich-text-utils';

// Update state
const [inputHtml, setInputHtml] = useState('');

// Update handleSend
const handleSend = async () => {
  const plainText = htmlToPlainText(inputHtml);
  if (!plainText.trim() || isLoading) return;

  const userMessage: Message = { role: 'user', content: plainText };
  const newMessages = [...messages, userMessage];
  setMessages(newMessages);
  setInputHtml(''); // Clear input
  setIsLoading(true);

  try {
    const response = await chat(newMessages);
    const assistantMessage: Message = { role: 'assistant', content: response };
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
```

**Step 2: Option A - Keep simple TextInput for Ask**

For the Ask screen, a plain TextInput may actually be preferable for chat-style interaction. The rich text editor is more suited for longer-form journal entries in Reflect mode.

If you prefer to keep Ask simple, no changes needed here.

**Step 2: Option B - Add rich text to Ask**

If you want rich text in Ask, replace the input bar:

```tsx
{/* Input Bar with Rich Text */}
<View className="px-6 pb-4">
  <View className="bg-white/90 rounded-2xl border border-gray-200 overflow-hidden">
    <RichTextEditor
      placeholder="Ask anything..."
      onContentChange={setInputHtml}
      showToolbar={false}
      minHeight={44}
      autoFocus={false}
    />
    <Pressable
      onPress={handleSend}
      disabled={isHtmlEmpty(inputHtml) || isLoading}
      className="absolute right-4 top-1/2 -translate-y-1/2"
    >
      <Text
        className={`font-medium ${
          !isHtmlEmpty(inputHtml) && !isLoading
            ? 'text-muted-blue'
            : 'text-gray-300'
        }`}
      >
        Send
      </Text>
    </Pressable>
  </View>
</View>
```

**Step 3: Commit**

```bash
git add app/\(main\)/ask.tsx
git commit -m "feat: update Ask screen input handling"
```

---

## Phase 4: Database & AI Processing Updates

### Task 7: Update entry processing for HTML content

**Files:**
- Modify: `lib/entry-processor.ts`

**Step 1: Update processor to handle HTML**

In `lib/entry-processor.ts`, update to strip HTML before sending to AI:

```ts
import { htmlToPlainText, wordCount } from './rich-text-utils';

export async function processEntry(
  entryId: string,
  rawContent: string // May be HTML
): Promise<ProcessedSignals | null> {
  // Convert HTML to plain text for processing
  const content = htmlToPlainText(rawContent);
  
  // Skip very short entries
  if (wordCount(rawContent) < 10) {
    return null;
  }

  const prompt = `Analyze this meditation journal entry and extract:
// ... rest of prompt using 'content' (plain text)
`;
  // ... rest of function
}
```

**Step 2: Commit**

```bash
git add lib/entry-processor.ts
git commit -m "refactor: update entry processor to handle HTML content"
```

---

### Task 8: Add full entry view with HTML rendering

**Files:**
- Create: `app/(main)/entry/[id].tsx`

**Step 1: Create entry detail screen**

For viewing full entries with formatting, you may want to install a proper HTML renderer:

```bash
npm install react-native-render-html
```

Create `app/(main)/entry/[id].tsx`:

```tsx
import { View, Text, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import RenderHtml from 'react-native-render-html';
import { supabase } from '../../../lib/supabase';
import { Entry } from '../../../lib/entries';

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntry();
  }, [id]);

  const loadEntry = async () => {
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('id', id)
      .single();

    if (!error && data) {
      setEntry(data);
    }
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <LinearGradient colors={['#e6e0f5', '#fde8d7']} className="flex-1 justify-center items-center">
        <Text className="text-gray-500">Loading...</Text>
      </LinearGradient>
    );
  }

  if (!entry) {
    return (
      <LinearGradient colors={['#e6e0f5', '#fde8d7']} className="flex-1 justify-center items-center">
        <Text className="text-gray-500">Entry not found</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#e6e0f5', '#fde8d7']} className="flex-1">
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row justify-between items-center px-6 py-4">
          <Pressable onPress={() => router.back()}>
            <Text className="text-muted-blue text-base">← Back</Text>
          </Pressable>
          <Text className="text-gray-500 text-sm capitalize">{entry.type}</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView className="flex-1 px-6">
          {/* Entry Card */}
          <View className="bg-white/90 rounded-3xl p-6 shadow-sm">
            <Text className="text-gray-500 text-sm mb-2">
              {formatDate(entry.created_at)}
            </Text>
            
            {entry.duration_seconds && (
              <Text className="text-gray-500 text-sm mb-4">
                {Math.round(entry.duration_seconds / 60)} minutes
              </Text>
            )}

            {/* Rendered HTML Content */}
            <RenderHtml
              contentWidth={width - 80}
              source={{ html: entry.raw_content }}
              tagsStyles={{
                body: { color: '#1f2937', fontSize: 16, lineHeight: 24 },
                p: { marginBottom: 12 },
                ul: { marginLeft: 16 },
                ol: { marginLeft: 16 },
                li: { marginBottom: 4 },
                strong: { fontWeight: '600' },
                em: { fontStyle: 'italic' },
              }}
            />

            {/* AI Summary if available */}
            {entry.summary && (
              <View className="mt-6 pt-4 border-t border-gray-100">
                <Text className="text-gray-500 text-sm mb-2">AI Summary</Text>
                <Text className="text-gray-700">{entry.summary}</Text>
              </View>
            )}

            {/* Themes/Tags */}
            {entry.themes && entry.themes.length > 0 && (
              <View className="mt-4 flex-row flex-wrap gap-2">
                {entry.themes.map((theme, i) => (
                  <View key={i} className="bg-lavender px-3 py-1 rounded-full">
                    <Text className="text-gray-600 text-sm">{theme}</Text>
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

**Step 2: Update main layout to include entry route**

In `app/(main)/_layout.tsx`, add the entry screen:

```tsx
<Stack.Screen
  name="entry/[id]"
  options={{ presentation: 'card' }}
/>
```

**Step 3: Make entries tappable in tracker**

In `app/(main)/tracker.tsx`, wrap entries in Pressable:

```tsx
<Pressable
  key={entry.id}
  onPress={() => router.push(`/(main)/entry/${entry.id}`)}
  className="bg-white/80 rounded-2xl p-4"
>
  {/* ... entry content ... */}
</Pressable>
```

**Step 4: Commit**

```bash
git add app/\(main\)/entry/\[id\].tsx app/\(main\)/_layout.tsx app/\(main\)/tracker.tsx
git commit -m "feat: add entry detail view with HTML rendering"
```

---

## Phase 5: Polish & Testing

### Task 9: Handle keyboard properly on Android

**Files:**
- Modify: `components/RichTextEditor.tsx`

**Step 1: Add Android-specific keyboard handling**

The 10tap-editor handles iOS keyboard well by default. For Android, you may need adjustments:

```tsx
// In RichTextEditor.tsx, update the KeyboardAvoidingView
import { Keyboard, Platform } from 'react-native';

// Add keyboard dismiss on toolbar tap (Android workaround)
const handleToolbarPress = () => {
  if (Platform.OS === 'android') {
    // Workaround for Android keyboard issues
    Keyboard.dismiss();
    setTimeout(() => editor.focus(), 100);
  }
};
```

**Step 2: Test on both platforms**

```bash
# iOS
npx expo start --ios

# Android
npx expo start --android
```

**Step 3: Commit**

```bash
git add components/RichTextEditor.tsx
git commit -m "fix: improve Android keyboard handling for editor"
```

---

### Task 10: Add dark mode support (optional)

**Files:**
- Modify: `components/RichTextEditor.tsx`

**Step 1: Add dark theme variant**

```tsx
import { useColorScheme } from 'react-native';

// Inside component
const colorScheme = useColorScheme();
const isDark = colorScheme === 'dark';

// Update CSS in bridgeExtensions
CoreBridge.configureCSS(`
  .ProseMirror {
    background-color: ${isDark ? '#1f2937' : '#ffffff'};
    color: ${isDark ? '#f9fafb' : '#1f2937'};
    // ... rest of styles
  }
`)
```

**Step 2: Commit**

```bash
git add components/RichTextEditor.tsx
git commit -m "feat: add dark mode support for rich text editor"
```

---

## Summary

**Phases completed:**
1. Setup & Dependencies (Tasks 1-3)
2. Integrate into Reflect Screen (Tasks 4-5)
3. Integrate into Ask Screen (Task 6)
4. Database & AI Processing Updates (Tasks 7-8)
5. Polish & Testing (Tasks 9-10)

**Total tasks:** 10

**What's built:**
- Reusable `RichTextEditor` component wrapping 10tap-editor
- HTML utility functions for text extraction/truncation
- Rich text journaling in Reflect mode
- Entry detail view with HTML rendering
- Backward-compatible — existing plain text entries still work

**Dependencies added:**
- `@10play/tentap-editor` — Core editor
- `react-native-webview` — Peer dependency
- `react-native-render-html` — For entry display (optional)

**Not included (future considerations):**
- Image embedding in entries
- Custom mention extensions (@skill, @date)
- Offline editor state persistence
- Rich text in Ask mode (kept simple TextInput)

---

## Rollback Plan

If issues arise, rollback is straightforward:

1. Revert Reflect screen to use `TextInput`
2. Entries stored as HTML will still display (just without formatting in preview)
3. Remove 10tap-editor dependency

```bash
git revert HEAD~10  # Revert all tasks
npm uninstall @10play/tentap-editor react-native-render-html
```

---

## Resources

- **10tap-editor Docs:** https://10play.github.io/10tap-editor/docs/
- **GitHub:** https://github.com/10play/10tap-editor
- **Tiptap Docs (for extensions):** https://tiptap.dev/docs/editor/introduction
