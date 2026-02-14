import { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  Dimensions,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Nudge } from '../lib/nudges';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type Props = {
  visible: boolean;
  nudges: Nudge[];
  onClose: () => void;
  onComplete: () => void;
};

export function NudgeOverlay({ visible, nudges, onClose, onComplete }: Props) {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<Nudge>>(null);

  const contentHeight = SCREEN_HEIGHT - insets.top - insets.bottom - 200; // header + dots + button

  const goToNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < nudges.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToOffset({
        offset: nextIndex * SCREEN_WIDTH,
        animated: true,
      });
      setCurrentIndex(nextIndex);
    } else {
      handleBeginWriting();
    }
  }, [currentIndex, nudges.length]);

  const handleBeginWriting = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentIndex(0);
    onComplete();
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentIndex(0);
    onClose();
  }, [onClose]);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const newIndex = Math.round(offsetX / SCREEN_WIDTH);
      if (
        newIndex !== currentIndex &&
        newIndex >= 0 &&
        newIndex < nudges.length
      ) {
        setCurrentIndex(newIndex);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    [currentIndex, nudges.length]
  );

  if (!visible || nudges.length === 0) return null;

  const isLastNudge = currentIndex === nudges.length - 1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleSkip}
    >
      <Animated.View
        entering={FadeIn.duration(250)}
        exiting={FadeOut.duration(200)}
        className="flex-1 bg-cream"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        {/* Header */}
        <View className="px-6 py-4 flex-row justify-between items-center">
          <View style={{ width: 50 }} />
          <Text className="text-olive text-sm">
            {currentIndex + 1} of {nudges.length}
          </Text>
          <Pressable onPress={handleSkip} hitSlop={12}>
            <Text className="text-olive text-base">Skip</Text>
          </Pressable>
        </View>

        {/* Carousel */}
        <FlatList
          ref={flatListRef}
          data={nudges}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          keyExtractor={(_, index) => index.toString()}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          renderItem={({ item }) => (
            <View
              style={{
                width: SCREEN_WIDTH,
                height: contentHeight,
                paddingHorizontal: 32,
                justifyContent: 'center',
              }}
            >
              <Text className="text-forest text-2xl font-serif text-center leading-relaxed">
                {item.text}
              </Text>
            </View>
          )}
        />

        {/* Progress dots */}
        <View className="flex-row justify-center gap-2 mb-6">
          {nudges.map((_, index) => (
            <View
              key={index}
              className={`w-2 h-2 rounded-full ${
                index === currentIndex ? 'bg-terracotta' : 'bg-olive/30'
              }`}
            />
          ))}
        </View>

        {/* Bottom CTA */}
        <View className="px-6 pb-4">
          <Pressable
            onPress={goToNext}
            className="bg-terracotta py-4 rounded-2xl items-center"
          >
            <Text className="text-white text-base font-medium">
              {isLastNudge ? 'Begin writing' : 'Next'}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}
