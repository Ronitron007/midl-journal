import {
  View,
  Text,
  Pressable,
  ScrollView,
  Switch,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { useDraft } from '../../lib/draft-context';
import { createEntry } from '../../lib/entries';
import { processEntry } from '../../lib/ai';
import type { SkillPhase } from '../../../shared/types';
import RichTextEditor from '../../components/RichTextEditor';
import { isHtmlEmpty, htmlToPlainText } from '../../lib/rich-text-utils';
import { SKILLS, CULTIVATIONS } from '../../lib/midl-skills';
import { supabase } from '../../lib/supabase';
import { generateNudges, Nudge } from '../../lib/nudges';
import { NudgeOverlay } from '../../components/NudgeOverlay';
import { Celebration } from '../../components/Celebration';
import * as Haptics from 'expo-haptics';

// "Don't know..." option + ordered skill list from cultivations
const DONT_KNOW_OPTION = { id: 'unknown', name: "Don't know..." };
const SKILL_OPTIONS = [
  DONT_KNOW_OPTION,
  ...CULTIVATIONS.flatMap((c) =>
    c.skills.map((id) => ({ id, name: SKILLS[id].name }))
  ),
];

const DURATION_OPTIONS = [
  { label: '15 min', value: 900 },
  { label: '30 min', value: 1800 },
  { label: '45 min', value: 2700 },
  { label: '60 min', value: 3600 },
];

const getTodayString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0]; // YYYY-MM-DD
};

const formatDateDisplay = (dateStr: string) => {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.getTime() === today.getTime()) return 'Today';
  if (date.getTime() === yesterday.getTime()) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
};

export default function ReflectScreen() {
  const { user } = useAuth();
  const { reflectDraft, setReflectDraft, clearReflectDraft } = useDraft();

  // User's current skill from profile (fetched on mount)
  const [userCurrentSkill, setUserCurrentSkill] = useState<string | null>(null);

  // Initialize from draft or defaults
  const [content, setContent] = useState(reflectDraft?.content ?? '');
  const [plainTextContent, setPlainTextContent] = useState('');
  const [showDetails, setShowDetails] = useState(
    reflectDraft?.showDetails ?? false
  );
  const [duration, setDuration] = useState<number | null>(
    reflectDraft?.duration ?? null
  );
  const [isGuided, setIsGuided] = useState(reflectDraft?.isGuided ?? false);
  const [trackProgress, setTrackProgress] = useState(
    reflectDraft?.trackProgress ?? true
  );
  const [skillPracticed, setSkillPracticed] = useState(
    reflectDraft?.skillPracticed ?? '00'
  );
  const [entryDate, setEntryDate] = useState(
    reflectDraft?.entryDate ?? getTodayString()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSkillPicker, setShowSkillPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [nudgesLoading, setNudgesLoading] = useState(true);
  const [showNudgeOverlay, setShowNudgeOverlay] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPhases, setCelebrationPhases] = useState<SkillPhase[] | null>(null);
  const [celebrationFrontier, setCelebrationFrontier] = useState('00');

  // Hide overlay if there's already content in draft
  useEffect(() => {
    if (reflectDraft?.content && !isHtmlEmpty(reflectDraft.content)) {
      setShowNudgeOverlay(false);
    }
  }, []);

  // Fetch user's current skill on mount
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('users')
        .select('current_skill')
        .eq('id', user.id)
        .single();
      if (data?.current_skill) {
        setUserCurrentSkill(data.current_skill);
        if (!reflectDraft?.skillPracticed) {
          setSkillPracticed(data.current_skill);
        }
      }
    })();
  }, [user]);

  // Fetch nudges when skill is determined
  useEffect(() => {
    if (!(user && userCurrentSkill)) return;
    let cancelled = false;
    setNudgesLoading(true);

    generateNudges(user.id, userCurrentSkill)
      .then((personalized) => {
        if (!cancelled) setNudges(personalized);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setNudgesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, userCurrentSkill]);

  const handleContentChange = (html: string) => {
    setContent(html);
    setPlainTextContent(htmlToPlainText(html));
  };

  // Save draft whenever state changes
  useEffect(() => {
    setReflectDraft({
      content,
      showDetails,
      duration,
      isGuided,
      trackProgress,
      skillPracticed,
      entryDate,
    });
  }, [
    content,
    showDetails,
    duration,
    isGuided,
    trackProgress,
    skillPracticed,
    entryDate,
  ]);

  const handleSubmit = async () => {
    if (isHtmlEmpty(content) || !user) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSubmitting(true);

    // Determine frontier skill: use selected skill, or user's current if "unknown"
    const frontierSkill =
      skillPracticed === 'unknown'
        ? userCurrentSkill || '00'
        : skillPracticed;

    const entry = await createEntry(user.id, {
      type: 'reflect',
      raw_content: content,
      is_guided: isGuided,
      track_progress: trackProgress,
      duration_seconds: duration ?? undefined,
      skill_practiced: frontierSkill,
      frontier_skill: frontierSkill,
      entry_date: entryDate,
    });

    if (entry) {
      clearReflectDraft();
      setIsSubmitting(false);
      setIsProcessing(true);

      // Wait for processEntry to complete before showing celebration
      const signals = await processEntry(entry.id, content, frontierSkill);

      setCelebrationPhases(signals?.skill_phases ?? null);
      setCelebrationFrontier(signals?.frontier_skill_inferred ?? frontierSkill);
      setIsProcessing(false);
      setShowCelebration(true);
    } else {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    router.back();
  };

  const handleCelebrationComplete = () => {
    setShowCelebration(false);
    router.back();
  };

  // Skill display name for picker button
  const skillDisplayName =
    skillPracticed === 'unknown'
      ? "Don't know..."
      : `${skillPracticed} - ${SKILLS[skillPracticed]?.name || ''}`;

  // Show nudge overlay first, then editor
  if (showNudgeOverlay) {
    if (nudges.length > 0) {
      return (
        <View className="flex-1 bg-cream">
          <NudgeOverlay
            visible={true}
            nudges={nudges}
            onClose={() => setShowNudgeOverlay(false)}
            onComplete={() => setShowNudgeOverlay(false)}
          />
        </View>
      );
    }
    if (nudgesLoading) {
      return (
        <View className="flex-1 bg-cream items-center justify-center">
          <Text className="text-olive">Preparing your reflection...</Text>
        </View>
      );
    }
  }

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 py-4">
            <Pressable onPress={handleClose}>
              <Text className="text-terracotta text-base">Cancel</Text>
            </Pressable>
            <Text className="text-forest font-medium">Reflect</Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowNudgeOverlay(true);
              }}
              className="px-2 py-1"
            >
              <Text className="text-2xl">✨</Text>
            </Pressable>
          </View>

          <ScrollView className="flex-1 px-6" keyboardDismissMode="on-drag">
            {/* Main Card */}
            <View className="bg-white rounded-3xl p-6 shadow-sm">
              <Text className="text-xl font-serif text-forest mb-2">
                How was your practice?
              </Text>

              {/* Nudges */}
              {nudges.length > 0 && (
                <View className="mb-4">
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8 }}
                    className="-mx-6 px-6"
                  >
                    {nudges.map((nudge, i) => (
                      <View
                        key={i}
                        className="bg-cream rounded-xl px-3 py-2 border border-olive/20"
                        style={{ maxWidth: 220 }}
                      >
                        <Text
                          className="text-forest text-sm leading-5"
                          numberOfLines={3}
                        >
                          {nudge.text}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Rich Text Editor */}
              <View className="min-h-[200px] -mx-6 -mt-2">
                <RichTextEditor
                  initialContent={content}
                  placeholder="Write freely about your practice..."
                  onContentChange={handleContentChange}
                  showToolbar={false}
                  minHeight={200}
                  autoFocus={true}
                />
              </View>

              {/* Add Details Toggle */}
              <Pressable
                onPress={() => setShowDetails(!showDetails)}
                className="flex-row items-center mt-4 py-2"
              >
                <Text className="text-terracotta">
                  {showDetails ? '- Hide details' : '+ Add details'}
                </Text>
              </Pressable>

              {/* Details Section */}
              {showDetails && (
                <View className="mt-4 pt-4 border-t border-olive/10">
                  {/* Date */}
                  <Text className="text-olive mb-2">Date</Text>
                  <Pressable
                    onPress={() => setShowDatePicker(true)}
                    className="px-4 py-2 rounded-full bg-cream self-start mb-4"
                  >
                    <Text className="text-forest">
                      {formatDateDisplay(entryDate)}
                    </Text>
                  </Pressable>
                  {showDatePicker && (
                    <DateTimePicker
                      value={new Date(entryDate + 'T00:00:00')}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      maximumDate={new Date()}
                      onChange={(event, selectedDate) => {
                        setShowDatePicker(Platform.OS === 'ios');
                        if (selectedDate) {
                          setEntryDate(
                            selectedDate.toISOString().split('T')[0]
                          );
                        }
                      }}
                    />
                  )}
                  {Platform.OS === 'ios' && showDatePicker && (
                    <Pressable
                      onPress={() => setShowDatePicker(false)}
                      className="self-end mb-4"
                    >
                      <Text className="text-terracotta font-medium">Done</Text>
                    </Pressable>
                  )}

                  {/* Duration */}
                  <Text className="text-olive mb-2">Duration</Text>
                  <View className="flex-row flex-wrap gap-2 mb-4">
                    {DURATION_OPTIONS.map((opt) => (
                      <Pressable
                        key={opt.value}
                        onPress={() => setDuration(opt.value)}
                        className={`px-4 py-2 rounded-full ${
                          duration === opt.value ? 'bg-terracotta' : 'bg-cream'
                        }`}
                      >
                        <Text
                          className={
                            duration === opt.value
                              ? 'text-white'
                              : 'text-forest'
                          }
                        >
                          {opt.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {/* Guided Toggle */}
                  <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-olive">Guided session</Text>
                    <Switch
                      value={isGuided}
                      onValueChange={setIsGuided}
                      trackColor={{ false: '#d1d5db', true: '#de8649' }}
                    />
                  </View>

                  {/* Track Progress Toggle */}
                  <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-olive">Track my progress</Text>
                    <Switch
                      value={trackProgress}
                      onValueChange={setTrackProgress}
                      trackColor={{ false: '#d1d5db', true: '#de8649' }}
                    />
                  </View>

                  {/* Practiced up to */}
                  <Text className="text-olive mb-2">Practiced up to</Text>
                  <Pressable
                    onPress={() => setShowSkillPicker(true)}
                    className="px-4 py-3 rounded-xl bg-cream mb-4"
                  >
                    <Text className="text-forest">{skillDisplayName}</Text>
                    {userCurrentSkill &&
                      skillPracticed !== userCurrentSkill &&
                      skillPracticed !== 'unknown' && (
                        <Text className="text-olive text-xs mt-1">
                          Your current skill is {userCurrentSkill}
                        </Text>
                      )}
                  </Pressable>
                </View>
              )}

              {/* Submit Button */}
              <Pressable
                onPress={handleSubmit}
                disabled={isHtmlEmpty(content) || isSubmitting || isProcessing}
                className={`mt-6 py-4 rounded-2xl ${
                  !isHtmlEmpty(content) && !isSubmitting && !isProcessing
                    ? 'bg-terracotta'
                    : 'bg-olive/20'
                }`}
              >
                {isProcessing ? (
                  <View className="flex-row items-center justify-center gap-2">
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text className="text-white font-medium">
                      Analyzing your sit...
                    </Text>
                  </View>
                ) : (
                  <Text
                    className={`text-center font-medium ${
                      !isHtmlEmpty(content) && !isSubmitting
                        ? 'text-white'
                        : 'text-olive'
                    }`}
                  >
                    {isSubmitting
                      ? 'Saving your reflection...'
                      : 'Save & Get Insights'}
                  </Text>
                )}
              </Pressable>
            </View>
          </ScrollView>

          {/* Celebration Modal */}
          <Celebration
            visible={showCelebration}
            skillPhases={celebrationPhases}
            frontierSkill={celebrationFrontier}
            onComplete={handleCelebrationComplete}
          />

          {/* Skill Picker Modal */}
          <Modal visible={showSkillPicker} transparent animationType="slide">
            <View className="flex-1 bg-black/50 justify-end">
              <View className="bg-white rounded-t-3xl max-h-[70%]">
                <View className="flex-row justify-between items-center px-6 py-4 border-b border-olive/10">
                  <Text className="text-lg font-medium text-forest">
                    Practiced up to
                  </Text>
                  <Pressable onPress={() => setShowSkillPicker(false)}>
                    <Text className="text-terracotta font-medium">Done</Text>
                  </Pressable>
                </View>
                <ScrollView className="px-6 py-2">
                  {SKILL_OPTIONS.map((skill) => (
                    <Pressable
                      key={skill.id}
                      onPress={() => {
                        setSkillPracticed(skill.id);
                        setShowSkillPicker(false);
                      }}
                      className={`py-3 px-4 rounded-xl mb-2 ${
                        skillPracticed === skill.id
                          ? 'bg-terracotta'
                          : 'bg-cream'
                      }`}
                    >
                      <Text
                        className={
                          skillPracticed === skill.id
                            ? 'text-white font-medium'
                            : 'text-forest'
                        }
                      >
                        {skill.id === 'unknown'
                          ? skill.name
                          : `${skill.id} - ${skill.name}`}
                      </Text>
                      {skill.id === userCurrentSkill && (
                        <Text
                          className={`text-xs mt-0.5 ${
                            skillPracticed === skill.id
                              ? 'text-white/70'
                              : 'text-olive'
                          }`}
                        >
                          Current skill
                        </Text>
                      )}
                    </Pressable>
                  ))}
                  <View className="h-8" />
                </ScrollView>
              </View>
            </View>
          </Modal>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
