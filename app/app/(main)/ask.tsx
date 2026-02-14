import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useRef, useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { useDraft } from '../../lib/draft-context';
import { createEntry } from '../../lib/entries';
import { chat, Message } from '../../lib/ai';

export default function AskScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { askDraft, setAskDraft, clearAskDraft } = useDraft();

  const [messages, setMessages] = useState<Message[]>(askDraft?.messages ?? []);
  const [input, setInput] = useState(askDraft?.input ?? '');
  const [isLoading, setIsLoading] = useState(false);
  const [trackProgress, setTrackProgress] = useState(
    askDraft?.trackProgress ?? true
  );
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Save draft whenever state changes
    if (messages.length > 0 || input) {
      setAskDraft({
        messages,
        input,
        trackProgress,
      });
    }
  }, [messages, input, trackProgress]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chat(newMessages);
      setMessages([...newMessages, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages([
        ...newMessages,
        { role: 'assistant', content: 'Sorry, something went wrong.' },
      ]);
    }

    setIsLoading(false);
  };

  const handleClose = () => {
    // Just go back, draft persists
    router.back();
  };

  const handleNewChat = async () => {
    // Save current conversation if there are messages
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
    // Clear and reset
    clearAskDraft();
    setMessages([]);
    setInput('');
    setTrackProgress(true);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1, backgroundColor: '#f8f4e9' }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 24,
            paddingTop: insets.top + 8,
            paddingBottom: 16,
          }}
        >
          <Pressable onPress={handleClose} style={{ width: 50 }}>
            <Text style={{ color: '#de8649', fontSize: 16 }}>Done</Text>
          </Pressable>
          <Text style={{ color: '#3a5222', fontWeight: '500' }}>Ask</Text>
          <Pressable
            onPress={handleNewChat}
            style={{ width: 50, alignItems: 'flex-end' }}
          >
            <Text style={{ color: '#de8649', fontSize: 16 }}>New</Text>
          </Pressable>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1, paddingHorizontal: 24 }}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 && (
            <View style={{ alignItems: 'center', marginTop: 32 }}>
              <Text style={{ color: '#707927', textAlign: 'center' }}>
                Ask me anything about MIDL meditation, your practice, or how to
                work with specific challenges.
              </Text>
            </View>
          )}

          {messages.map((message, index) => (
            <View
              key={index}
              style={{
                marginBottom: 12,
                maxWidth: '85%',
                alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <View
                style={{
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  backgroundColor:
                    message.role === 'user' ? '#de8649' : '#ffffff',
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    lineHeight: 24,
                    color: message.role === 'user' ? '#ffffff' : '#3a5222',
                  }}
                >
                  {message.content}
                </Text>
              </View>
            </View>
          ))}

          {/* Show typing indicator when loading */}
          {isLoading && (
            <View
              style={{
                alignSelf: 'flex-start',
                marginBottom: 12,
                maxWidth: '85%',
              }}
            >
              <View
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                }}
              >
                <Text style={{ color: '#707927' }}>...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Track Progress Toggle */}
        <View
          style={{
            paddingHorizontal: 24,
            paddingVertical: 8,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Pressable
            onPress={() => setTrackProgress(!trackProgress)}
            style={{ flexDirection: 'row', alignItems: 'center' }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                borderWidth: 1,
                marginRight: 8,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: trackProgress ? '#de8649' : 'transparent',
                borderColor: trackProgress ? '#de8649' : '#d1d5db',
              }}
            >
              {trackProgress && (
                <Text style={{ color: '#ffffff', fontSize: 12 }}>✓</Text>
              )}
            </View>
            <Text style={{ color: '#3a5222', fontSize: 14 }}>
              Track my progress
            </Text>
          </Pressable>
        </View>

        {/* Input Bar */}
        <View
          style={{
            paddingHorizontal: 24,
            paddingBottom: insets.bottom + 8,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: '#ffffff',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: 'rgba(112,121,39,0.2)',
              alignItems: 'center',
            }}
          >
            <TextInput
              placeholder="Ask anything..."
              placeholderTextColor="#707927"
              style={{
                flex: 1,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                color: '#3a5222',
                minHeight: 44,
              }}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
            <Pressable
              onPress={handleSend}
              disabled={!input.trim() || isLoading}
              style={{ paddingHorizontal: 16, justifyContent: 'center' }}
            >
              <Text
                style={{
                  fontWeight: '500',
                  color: input.trim() && !isLoading ? '#de8649' : '#d1d5db',
                }}
              >
                Send
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
