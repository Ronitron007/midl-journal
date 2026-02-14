import { useEffect } from 'react';
import { View, Text, Modal, Pressable, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
  runOnJS,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CELEBRATION_EMOJIS = ['✨', '🌟', '💫', '🎉', '🌈', '🦋', '🌸', '💖'];

const ENCOURAGING_MESSAGES = [
  'Beautiful reflection',
  'You showed up today',
  'That took courage',
  'Well done, friend',
  'Progress, not perfection',
  'Your future self thanks you',
  'Small steps, big journey',
];

type Props = {
  visible: boolean;
  onComplete: () => void;
  message?: string | null;
};

export function Celebration({ visible, onComplete, message }: Props) {
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Haptic celebration
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Animate in
      scale.value = withSequence(
        withSpring(1.2, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 12 })
      );

      rotation.value = withSequence(
        withTiming(-5, { duration: 100 }),
        withTiming(5, { duration: 100 }),
        withTiming(0, { duration: 100 })
      );
    } else {
      scale.value = 0;
    }
  }, [visible]);

  const mainIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
  }));

  if (!visible) return null;

  const randomMessage =
    ENCOURAGING_MESSAGES[
      Math.floor(Math.random() * ENCOURAGING_MESSAGES.length)
    ];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/40 justify-center items-center px-8">
        {/* Floating emojis */}
        {CELEBRATION_EMOJIS.slice(0, 6).map((emoji, i) => (
          <FloatingEmoji key={i} emoji={emoji} index={i} />
        ))}

        {/* Main celebration card */}
        <Animated.View
          entering={FadeIn.duration(300)}
          className="bg-white rounded-3xl p-8 items-center w-full max-w-sm shadow-xl"
        >
          <Animated.Text style={mainIconStyle} className="text-6xl mb-4">
            🌟
          </Animated.Text>

          <Text className="text-forest text-xl font-serif text-center mb-2">
            {randomMessage}
          </Text>

          {message && (
            <Text className="text-olive text-base text-center leading-relaxed mt-2 mb-4">
              {message}
            </Text>
          )}

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onComplete();
            }}
            className="bg-terracotta mt-4 py-4 px-8 rounded-2xl w-full"
          >
            <Text className="text-white text-center font-medium text-base">
              Done
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

function FloatingEmoji({ emoji, index }: { emoji: string; index: number }) {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    const startX = (Math.random() - 0.5) * SCREEN_WIDTH * 0.8;
    translateX.value = startX;

    translateY.value = withDelay(
      index * 100,
      withTiming(-SCREEN_HEIGHT * 0.2, {
        duration: 2000 + Math.random() * 1000,
        easing: Easing.out(Easing.cubic),
      })
    );

    opacity.value = withDelay(
      index * 100,
      withSequence(
        withTiming(1, { duration: 300 }),
        withDelay(1200, withTiming(0, { duration: 500 }))
      )
    );

    scale.value = withDelay(
      index * 100,
      withSpring(1 + Math.random() * 0.5, { damping: 15 })
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={style} className="text-3xl">
      {emoji}
    </Animated.Text>
  );
}
