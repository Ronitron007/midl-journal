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
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { useDraft } from '../../lib/draft-context';
import { createEntry } from '../../lib/entries';
import { getReflectionFeedback } from '../../lib/ai-feedback';

const DURATION_OPTIONS = [
  { label: '15 min', value: 900 },
  { label: '30 min', value: 1800 },
  { label: '45 min', value: 2700 },
  { label: '60 min', value: 3600 },
];

export default function ReflectScreen() {
  const { user } = useAuth();
  const { reflectDraft, setReflectDraft, clearReflectDraft } = useDraft();

  // Initialize from draft or defaults
  const [content, setContent] = useState(reflectDraft?.content ?? '');
  const [showDetails, setShowDetails] = useState(reflectDraft?.showDetails ?? false);
  const [duration, setDuration] = useState<number | null>(reflectDraft?.duration ?? null);
  const [isGuided, setIsGuided] = useState(reflectDraft?.isGuided ?? false);
  const [trackProgress, setTrackProgress] = useState(reflectDraft?.trackProgress ?? true);
  const [skillPracticed, setSkillPracticed] = useState(reflectDraft?.skillPracticed ?? '00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Save draft whenever state changes
  useEffect(() => {
    setReflectDraft({
      content,
      showDetails,
      duration,
      isGuided,
      trackProgress,
      skillPracticed,
    });
  }, [content, showDetails, duration, isGuided, trackProgress, skillPracticed]);

  const handleSubmit = async () => {
    if (!content.trim() || !user) return;

    setIsSubmitting(true);

    const entry = await createEntry(user.id, {
      type: 'reflect',
      raw_content: content.trim(),
      is_guided: isGuided,
      track_progress: trackProgress,
      duration_seconds: duration ?? undefined,
      skill_practiced: skillPracticed,
    });

    if (entry) {
      clearReflectDraft();
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
                  {showDetails ? '- Hide details' : '+ Add details'}
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
