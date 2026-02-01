import { View, Pressable, Text } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDraft } from '../lib/draft-context';

export default function FloatingButtons() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { reflectDraft, askDraft } = useDraft();

  const hasReflectDraft = !!reflectDraft?.content;
  const hasAskDraft = !!(askDraft?.messages?.length || askDraft?.input);

  // Hide on modal screens
  if (pathname !== '/tracker' && pathname !== '/(main)/tracker') {
    return null;
  }

  return (
    <View
      style={{
        position: 'absolute',
        bottom: insets.bottom + 16,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        paddingHorizontal: 24,
      }}
    >
      <View style={{ flex: 1, position: 'relative' }}>
        <Pressable
          onPress={() => router.push('/(main)/reflect')}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 16,
            paddingVertical: 16,
            borderWidth: 1,
            borderColor: 'rgba(112,121,39,0.2)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Text style={{ textAlign: 'center', color: '#3a5222', fontWeight: '500' }}>
            Reflect
          </Text>
        </Pressable>
        {hasReflectDraft && (
          <View style={{
            position: 'absolute',
            top: -4,
            right: -4,
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: '#de8649',
            borderWidth: 2,
            borderColor: '#ffffff',
          }} />
        )}
      </View>
      <View style={{ flex: 1, position: 'relative' }}>
        <Pressable
          onPress={() => router.push('/(main)/ask')}
          style={{
            backgroundColor: '#de8649',
            borderRadius: 16,
            paddingVertical: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Text style={{ textAlign: 'center', color: '#ffffff', fontWeight: '500' }}>
            Ask
          </Text>
        </Pressable>
        {hasAskDraft && (
          <View style={{
            position: 'absolute',
            top: -4,
            right: -4,
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: '#de8649',
            borderWidth: 2,
            borderColor: '#ffffff',
          }} />
        )}
      </View>
    </View>
  );
}
