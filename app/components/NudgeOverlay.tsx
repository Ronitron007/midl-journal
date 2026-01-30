import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  Dimensions,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  FadeIn,
  FadeOut,
  SlideInDown,
} from 'react-native-reanimated';
import { Nudge, NudgeType } from '../lib/nudges';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Warm colors matching app's lavender/peach/sage palette
const NUDGE_COLORS: Record<NudgeType, { bg: string; text: string; emoji: string }> = {
  samatha: { bg: '#dcfce7', text: '#166534', emoji: '🌿' },
  understanding: { bg: '#e0e7ff', text: '#3730a3', emoji: '💡' },
  hindrance: { bg: '#fef3c7', text: '#92400e', emoji: '🌊' },
  conditions: { bg: '#fee2e2', text: '#991b1b', emoji: '🔍' },
  balance: { bg: '#dbeafe', text: '#1e40af', emoji: '⚖️' },
  curiosity: { bg: '#f3e8ff', text: '#6b21a8', emoji: '✨' },
  pattern: { bg: '#fde8d7', text: '#7c2d12', emoji: '🔄' },
};

const WARM_GREETINGS = [
  "Before you write...",
  "A gentle nudge...",
  "Something to sit with...",
  "A thought to hold...",
  "Consider this...",
];

type Props = {
  visible: boolean;
  nudges: Nudge[];
  onClose: () => void;
  onSelectNudge: (nudge: Nudge) => void;
  onSkip: () => void;
};

export function NudgeOverlay({ visible, nudges, onClose, onSelectNudge, onSkip }: Props) {
  const [greeting] = useState(() =>
    WARM_GREETINGS[Math.floor(Math.random() * WARM_GREETINGS.length)]
  );

  const handleSelectNudge = (nudge: Nudge) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectNudge(nudge);
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSkip();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={20} tint="light" className="flex-1">
        <Pressable onPress={onClose} className="flex-1 justify-end">
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Animated.View
              entering={SlideInDown.springify().damping(18)}
              exiting={FadeOut.duration(200)}
              className="bg-white rounded-t-3xl px-6 pt-6 pb-10 shadow-2xl"
              style={{ maxHeight: SCREEN_HEIGHT * 0.7 }}
            >
              {/* Header */}
              <Animated.View entering={FadeIn.delay(100)} className="items-center mb-6">
                <Text className="text-3xl mb-2">🧘</Text>
                <Text className="text-gray-800 text-xl font-serif text-center">
                  {greeting}
                </Text>
                <Text className="text-gray-500 text-sm mt-1 text-center">
                  Pick one to guide your reflection
                </Text>
              </Animated.View>

              {/* Nudge Cards */}
              <ScrollView
                className="max-h-80"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 16 }}
              >
                {nudges.map((nudge, index) => {
                  const colors = NUDGE_COLORS[nudge.type] || NUDGE_COLORS.samatha;
                  return (
                    <NudgeCard
                      key={index}
                      nudge={nudge}
                      colors={colors}
                      index={index}
                      onPress={() => handleSelectNudge(nudge)}
                    />
                  );
                })}
              </ScrollView>

              {/* Skip Button */}
              <Animated.View entering={FadeIn.delay(400)}>
                <Pressable
                  onPress={handleSkip}
                  className="mt-4 py-3 items-center"
                >
                  <Text className="text-gray-400 text-base">
                    I'll find my own way
                  </Text>
                </Pressable>
              </Animated.View>
            </Animated.View>
          </Pressable>
        </Pressable>
      </BlurView>
    </Modal>
  );
}

function NudgeCard({
  nudge,
  colors,
  index,
  onPress,
}: {
  nudge: Nudge;
  colors: { bg: string; text: string; emoji: string };
  index: number;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  return (
    <Animated.View
      entering={SlideInDown.delay(100 + index * 80).springify().damping(16)}
      style={animatedStyle}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className="mb-3 rounded-2xl p-4 flex-row items-start"
        style={{ backgroundColor: colors.bg }}
      >
        <Text className="text-2xl mr-3">{colors.emoji}</Text>
        <View className="flex-1">
          <Text
            className="text-base leading-6"
            style={{ color: colors.text }}
          >
            {nudge.text}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
