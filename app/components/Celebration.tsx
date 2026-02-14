import { useEffect } from 'react';
import { View, Text, Modal, Pressable, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';
import type { SkillPhase } from '../../shared/types';
import { SKILLS } from '../lib/midl-skills';

// Hindrance/Marker name lookups for display
const HINDRANCE_NAMES: Record<string, string> = {
  H00: 'Stress Breathing', H01: 'Physical Restlessness', H02: 'Mental Restlessness',
  H03: 'Sleepiness & Dullness', H04: 'Habitual Forgetting', H05: 'Habitual Control',
  H06: 'Mind Wandering', H07: 'Gross Dullness', H08: 'Subtle Dullness',
  H09: 'Subtle Wandering', H10: 'Sensory Stimulation', H11: 'Anticipation of Pleasure',
  H12: 'Fear of Letting Go', H13: 'Doubt',
};

const MARKER_NAMES: Record<string, string> = {
  M00: 'Diaphragm Breathing', M01: 'Body Relaxation', M02: 'Mind Relaxation',
  M03: 'Mindful Presence', M04: 'Content Presence', M05: 'Natural Breathing',
  M06: 'Whole of Each Breath', M07: 'Breath Sensations', M08: 'One Point of Sensation',
  M09: 'Sustained Attention', M10: 'Whole-Body Breathing', M11: 'Sustained Awareness',
  M12: 'Access Concentration',
};

type Props = {
  visible: boolean;
  onComplete: () => void;
  skillPhases: SkillPhase[] | null;
  frontierSkill: string;
};

type NodeColor = 'green' | 'amber' | 'split' | 'gray';

function getNodeColor(
  skillId: string,
  phases: SkillPhase[] | null
): NodeColor {
  if (!phases) return 'gray';
  const phase = phases.find((p) => p.skill_id === skillId);
  if (!phase) return 'gray';

  const hasMarker = phase.markers_observed.length > 0;
  const hasHindrance = phase.hindrances_observed.length > 0;

  if (hasMarker && hasHindrance) return 'split';
  if (hasMarker) return 'green';
  if (hasHindrance) return 'amber';
  return 'gray';
}

const NODE_COLORS = {
  green: { bg: '#dcfce7', border: '#16a34a' },
  amber: { bg: '#fef3c7', border: '#d97706' },
  split: { bg: '#fef3c7', border: '#16a34a' },
  gray: { bg: '#f3f4f6', border: '#d1d5db' },
};

export function Celebration({ visible, onComplete, skillPhases, frontierSkill }: Props) {
  const scale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      scale.value = withSpring(1, { damping: 12, stiffness: 200 });
    } else {
      scale.value = 0;
    }
  }, [visible]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!visible) return null;

  // Build skill nodes from 00 through frontier
  const frontierNum = parseInt(frontierSkill, 10);
  const skillIds = Array.from({ length: frontierNum + 1 }, (_, i) =>
    String(i).padStart(2, '0')
  );

  // Collect notes from notable phases
  const phaseNotes = (skillPhases || [])
    .filter((p) => p.notes)
    .map((p) => {
      const skillName = SKILLS[p.skill_id]?.name || `Skill ${p.skill_id}`;
      return `${skillName}: ${p.notes}`;
    });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/40 justify-center items-center px-6">
        <Animated.View
          entering={FadeIn.duration(300)}
          style={cardStyle}
          className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl"
        >
          {/* Header */}
          <Text className="text-forest text-lg font-serif text-center mb-1">
            Sit Complete
          </Text>
          <Text className="text-olive text-sm text-center mb-5">
            Practiced up to Skill {frontierSkill}: {SKILLS[frontierSkill]?.name || ''}
          </Text>

          {/* Heatmap row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: 6,
              paddingHorizontal: 4,
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '100%',
            }}
            className="mb-4"
          >
            {skillIds.map((id) => {
              const color = getNodeColor(id, skillPhases);
              const colors = NODE_COLORS[color];
              const isFrontier = id === frontierSkill;

              return (
                <View key={id} style={{ alignItems: 'center' }}>
                  <View
                    style={{
                      width: isFrontier ? 28 : 22,
                      height: isFrontier ? 28 : 22,
                      borderRadius: 14,
                      backgroundColor: colors.bg,
                      borderWidth: isFrontier ? 2.5 : 1.5,
                      borderColor: colors.border,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    {color === 'split' && (
                      <View
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: '50%',
                          backgroundColor: '#dcfce7',
                          borderTopLeftRadius: 14,
                          borderTopRightRadius: 14,
                        }}
                      />
                    )}
                  </View>
                  <Text
                    style={{
                      fontSize: 9,
                      color: isFrontier ? '#3a5222' : '#9ca3af',
                      marginTop: 2,
                      fontWeight: isFrontier ? '600' : '400',
                    }}
                  >
                    {id}
                  </Text>
                </View>
              );
            })}
          </ScrollView>

          {/* Legend */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 12,
              marginBottom: 12,
            }}
          >
            <LegendItem color="#dcfce7" borderColor="#16a34a" label="Marker" />
            <LegendItem color="#fef3c7" borderColor="#d97706" label="Hindrance" />
            <LegendItem color="#f3f4f6" borderColor="#d1d5db" label="Quiet" />
          </View>

          {/* Phase notes */}
          {phaseNotes.length > 0 && (
            <View
              style={{
                backgroundColor: '#f8f4e9',
                borderRadius: 12,
                padding: 12,
                marginBottom: 12,
              }}
            >
              {phaseNotes.map((note, i) => (
                <Text
                  key={i}
                  style={{
                    color: '#3a5222',
                    fontSize: 13,
                    lineHeight: 18,
                    marginBottom: i < phaseNotes.length - 1 ? 6 : 0,
                  }}
                >
                  {note}
                </Text>
              ))}
            </View>
          )}

          {/* No phases fallback */}
          {!skillPhases && (
            <Text
              style={{
                color: '#707927',
                fontSize: 13,
                textAlign: 'center',
                marginBottom: 12,
              }}
            >
              Entry processed — no specific skill phases identified.
            </Text>
          )}

          {/* Done button */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onComplete();
            }}
            className="bg-terracotta py-4 px-8 rounded-2xl w-full"
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

function LegendItem({
  color,
  borderColor,
  label,
}: {
  color: string;
  borderColor: string;
  label: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: color,
          borderWidth: 1.5,
          borderColor,
        }}
      />
      <Text style={{ fontSize: 11, color: '#707927' }}>{label}</Text>
    </View>
  );
}
