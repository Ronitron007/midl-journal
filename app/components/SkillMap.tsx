import {
  View,
  Text,
  ScrollView,
  Pressable,
  LayoutChangeEvent,
} from 'react-native';
import {
  SKILLS,
  CULTIVATIONS,
  isSkillCompleted,
  isCurrentSkill,
} from '../lib/midl-skills';
import { useState, useEffect, useRef } from 'react';
import {
  ProgressionStats,
  getProgressPercentage,
  getProgressDescription,
} from '../lib/progression';

type SkillMapProps = {
  currentSkill: string;
  progressionStats?: ProgressionStats | null;
  onSkillPress?: (skillId: string) => void;
  onAdvance?: () => void;
};

export default function SkillMap({
  currentSkill,
  progressionStats,
  onSkillPress,
  onAdvance,
}: SkillMapProps) {
  // Default to showing current skill info
  const [selectedSkill, setSelectedSkill] = useState<string | null>(
    currentSkill
  );
  const scrollViewRef = useRef<ScrollView>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Get skills in correct order from CULTIVATIONS
  const allSkills = CULTIVATIONS.flatMap((c) => c.skills);

  // Sync selectedSkill when currentSkill changes
  useEffect(() => {
    setSelectedSkill(currentSkill);
  }, [currentSkill]);

  // Auto-scroll to current skill
  useEffect(() => {
    if (!containerWidth || !currentSkill) return;

    const currentIndex = allSkills.indexOf(currentSkill);
    if (currentIndex === -1) return;

    // Calculate position: each node ~48px + 16px line = 64px per slot
    // Add extra for cultivation markers (roughly 17px each)
    let cultivationMarkers = 0;
    for (let i = 1; i <= currentIndex; i++) {
      const prevCult = SKILLS[allSkills[i - 1]]?.cultivation;
      const currCult = SKILLS[allSkills[i]]?.cultivation;
      if (prevCult !== currCult) cultivationMarkers++;
    }

    const nodeWidth = 48; // 40px node + 8px margins
    const lineWidth = 16;
    const markerWidth = 17;
    const position =
      currentIndex * (nodeWidth + lineWidth) + cultivationMarkers * markerWidth;

    // Center the current skill in view
    const scrollX = Math.max(0, position - containerWidth / 2 + nodeWidth / 2);
    scrollViewRef.current?.scrollTo({ x: scrollX, animated: false });
  }, [currentSkill, containerWidth]);

  const handleContainerLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  const handleSkillPress = (skillId: string) => {
    // Always allow selecting, tap again to go back to current skill
    setSelectedSkill(skillId === selectedSkill ? currentSkill : skillId);
    onSkillPress?.(skillId);
  };

  return (
    <View className="bg-white rounded-2xl p-4" onLayout={handleContainerLayout}>
      {/* Timeline */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        <View className="flex-row items-center py-2">
          {allSkills.map((skillId, index) => {
            const skill = SKILLS[skillId];
            const isCompleted = isSkillCompleted(skillId, currentSkill);
            const isCurrent = isCurrentSkill(skillId, currentSkill);
            const isSelected = skillId === selectedSkill && !isCurrent;

            // Check if this is the start of a new cultivation
            const prevSkill = index > 0 ? SKILLS[allSkills[index - 1]] : null;
            const isNewCultivation =
              !prevSkill || prevSkill.cultivation !== skill.cultivation;

            // Determine colors based on state - using new palette
            const getBackgroundColor = () => {
              if (isCurrent) return '#de8649'; // terracotta
              if (isSelected) return '#f8f4e9'; // cream for selected
              if (isCompleted) return '#707927'; // olive
              return '#ffffff';
            };

            const getBorderColor = () => {
              if (isCurrent) return '#de8649'; // terracotta
              if (isSelected) return '#de8649'; // terracotta border for selected
              if (isCompleted) return '#707927'; // olive
              return '#e5e7eb';
            };

            const getTextColor = () => {
              if (isCurrent || isCompleted) return '#ffffff';
              if (isSelected) return '#de8649'; // terracotta
              return '#707927'; // olive
            };

            return (
              <View key={skillId} className="flex-row items-center">
                {/* Cultivation marker */}
                {isNewCultivation && index > 0 && (
                  <View
                    style={{
                      width: 1,
                      height: 32,
                      backgroundColor: 'rgba(112,121,39,0.2)',
                      marginHorizontal: 8,
                    }}
                  />
                )}

                {/* Skill node */}
                <Pressable
                  onPress={() => handleSkillPress(skillId)}
                  style={{ alignItems: 'center', marginHorizontal: 4 }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 2,
                      backgroundColor: getBackgroundColor(),
                      borderColor: getBorderColor(),
                    }}
                  >
                    <Text
                      style={{
                        fontWeight: '500',
                        fontSize: 14,
                        color: getTextColor(),
                      }}
                    >
                      {skillId}
                    </Text>
                  </View>
                  {isCurrent && (
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: '#de8649', // terracotta
                        marginTop: 4,
                      }}
                    />
                  )}
                </Pressable>

                {/* Connecting line */}
                {index < allSkills.length - 1 && (
                  <View
                    style={{
                      width: 16,
                      height: 2,
                      backgroundColor: isCompleted
                        ? '#707927'
                        : 'rgba(112,121,39,0.2)',
                    }}
                  />
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Skill details - always shown */}
      {selectedSkill && SKILLS[selectedSkill] && (
        <View
          style={{
            marginTop: 16,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: 'rgba(112,121,39,0.1)',
          }}
        >
          <Text style={{ fontWeight: '500', color: '#3a5222' }}>
            Skill {selectedSkill}: {SKILLS[selectedSkill].name}
          </Text>
          <Text style={{ color: '#707927', fontSize: 14, marginTop: 4 }}>
            Marker: {SKILLS[selectedSkill].marker}
          </Text>
          <Text style={{ color: '#707927', fontSize: 14 }}>
            Works with: {SKILLS[selectedSkill].hindrance}
          </Text>
        </View>
      )}

      {/* Progression section - only for current skill */}
      {progressionStats && selectedSkill === currentSkill && (
        <View
          style={{
            marginTop: 16,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: 'rgba(112,121,39,0.1)',
          }}
        >
          <Text
            style={{ fontWeight: '500', color: '#3a5222', marginBottom: 8 }}
          >
            Progression
          </Text>

          {/* Progress bar */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <View
              style={{
                flex: 1,
                height: 8,
                backgroundColor: 'rgba(112,121,39,0.1)',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${getProgressPercentage(progressionStats)}%`,
                  height: '100%',
                  backgroundColor: progressionStats.readyToAdvance
                    ? '#707927'
                    : '#de8649',
                  borderRadius: 4,
                }}
              />
            </View>
            <Text style={{ marginLeft: 8, color: '#707927', fontSize: 12 }}>
              {getProgressPercentage(progressionStats)}%
            </Text>
          </View>

          {/* Stats row */}
          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: '#166534', fontSize: 12 }}>✓ </Text>
              <Text style={{ color: '#707927', fontSize: 12 }}>
                {progressionStats.markerCount} marker sessions
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: '#166534', fontSize: 12 }}>☯ </Text>
              <Text style={{ color: '#707927', fontSize: 12 }}>
                {progressionStats.strongSamathaCount} strong samatha
              </Text>
            </View>
          </View>

          {/* Status or advance button */}
          {progressionStats.readyToAdvance && progressionStats.nextSkillId ? (
            <Pressable
              onPress={onAdvance}
              style={{
                backgroundColor: '#707927',
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#ffffff', fontWeight: '500' }}>
                Advance to Skill {progressionStats.nextSkillId}:{' '}
                {SKILLS[progressionStats.nextSkillId]?.name}
              </Text>
            </Pressable>
          ) : progressionStats.nextSkillId ? (
            <Text style={{ color: '#707927', fontSize: 13 }}>
              {getProgressDescription(progressionStats)}
            </Text>
          ) : (
            <Text
              style={{ color: '#707927', fontSize: 13, fontStyle: 'italic' }}
            >
              You've reached the final skill
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
