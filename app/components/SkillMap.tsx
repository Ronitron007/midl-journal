import { View, Text, ScrollView, Pressable } from 'react-native';
import { SKILLS, CULTIVATIONS, isSkillCompleted, isCurrentSkill } from '../lib/midl-skills';
import { useState, useEffect } from 'react';

type SkillMapProps = {
  currentSkill: string;
  onSkillPress?: (skillId: string) => void;
};

export default function SkillMap({ currentSkill, onSkillPress }: SkillMapProps) {
  // Default to showing current skill info
  const [selectedSkill, setSelectedSkill] = useState<string | null>(currentSkill);

  // Sync selectedSkill when currentSkill changes
  useEffect(() => {
    setSelectedSkill(currentSkill);
  }, [currentSkill]);

  const handleSkillPress = (skillId: string) => {
    // Always allow selecting, tap again to go back to current skill
    setSelectedSkill(skillId === selectedSkill ? currentSkill : skillId);
    onSkillPress?.(skillId);
  };

  // Get skills in correct order from CULTIVATIONS
  const allSkills = CULTIVATIONS.flatMap((c) => c.skills);

  return (
    <View className="bg-white/80 rounded-2xl p-4">
      {/* Timeline */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row items-center py-2">
          {allSkills.map((skillId, index) => {
            const skill = SKILLS[skillId];
            const isCompleted = isSkillCompleted(skillId, currentSkill);
            const isCurrent = isCurrentSkill(skillId, currentSkill);
            const isSelected = skillId === selectedSkill && !isCurrent;

            // Check if this is the start of a new cultivation
            const prevSkill = index > 0 ? SKILLS[allSkills[index - 1]] : null;
            const isNewCultivation = !prevSkill || prevSkill.cultivation !== skill.cultivation;

            // Determine colors based on state
            const getBackgroundColor = () => {
              if (isCurrent) return '#5c9eb7';
              if (isSelected) return '#d4e8ef'; // light muted-blue for selected
              if (isCompleted) return '#7c9082';
              return '#ffffff';
            };

            const getBorderColor = () => {
              if (isCurrent) return '#5c9eb7';
              if (isSelected) return '#5c9eb7'; // muted-blue border for selected
              if (isCompleted) return '#7c9082';
              return '#e5e7eb';
            };

            const getTextColor = () => {
              if (isCurrent || isCompleted) return '#ffffff';
              if (isSelected) return '#5c9eb7';
              return '#9ca3af';
            };

            return (
              <View key={skillId} className="flex-row items-center">
                {/* Cultivation marker */}
                {isNewCultivation && index > 0 && (
                  <View
                    style={{
                      width: 1,
                      height: 32,
                      backgroundColor: '#e5e7eb',
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
                        backgroundColor: '#5c9eb7',
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
                      backgroundColor: isCompleted ? '#7c9082' : '#e5e7eb',
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
            borderTopColor: '#f3f4f6',
          }}
        >
          <Text style={{ fontWeight: '500', color: '#1f2937' }}>
            Skill {selectedSkill}: {SKILLS[selectedSkill].name}
          </Text>
          <Text style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
            Marker: {SKILLS[selectedSkill].marker}
          </Text>
          <Text style={{ color: '#6b7280', fontSize: 14 }}>
            Works with: {SKILLS[selectedSkill].hindrance}
          </Text>
          <Text style={{ color: '#5c9eb7', fontSize: 14, marginTop: 8 }}>
            Learn more at midlmeditation.com
          </Text>
        </View>
      )}
    </View>
  );
}
