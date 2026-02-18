import { View, Text, Pressable } from 'react-native';
import {
  SKILLS,
  CULTIVATIONS,
  isSkillCompleted,
  isCurrentSkill,
} from '../lib/midl-skills';
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
  onAdvance,
}: SkillMapProps) {
  const allSkills = CULTIVATIONS.flatMap((c) => c.skills);
  const frontierIndex = allSkills.indexOf(currentSkill);
  const completedCount = frontierIndex === -1 ? 0 : frontierIndex + 1;

  return (
    <View style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: 20 }}>
      {/* Section 1: Journey Overview */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: '600', color: '#707927', letterSpacing: 1 }}>
          YOUR JOURNEY
        </Text>
        <Text style={{ fontSize: 12, color: '#707927' }}>
          {completedCount} of {allSkills.length}
        </Text>
      </View>

      {CULTIVATIONS.map((cultivation) => {
        const currentSkillCultivation = SKILLS[currentSkill]?.cultivation;
        const isCurrentCultivation = cultivation.id === currentSkillCultivation;

        return (
          <View
            key={cultivation.id}
            style={{
              backgroundColor: isCurrentCultivation ? '#f8f4e9' : 'transparent',
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 8,
              marginBottom: 4,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                color: isCurrentCultivation ? '#3a5222' : '#707927',
                fontWeight: isCurrentCultivation ? '600' : '400',
                marginBottom: 6,
              }}
            >
              {cultivation.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {cultivation.skills.map((skillId) => {
                const completed = isSkillCompleted(skillId, currentSkill);
                const isFrontier = isCurrentSkill(skillId, currentSkill);

                if (isFrontier) {
                  // Frontier dot: terracotta, 14px, with ring
                  // Use a fixed 12px-wide slot so spacing matches other dots
                  return (
                    <View
                      key={skillId}
                      style={{
                        width: 12,
                        height: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <View
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 9,
                          backgroundColor: 'rgba(222,134,73,0.15)',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <View
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: 7,
                            backgroundColor: '#de8649',
                          }}
                        />
                      </View>
                    </View>
                  );
                }

                if (completed) {
                  // Practiced dot: olive filled, 12px
                  return (
                    <View
                      key={skillId}
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: '#707927',
                      }}
                    />
                  );
                }

                // Not yet reached: gray border, 12px
                return (
                  <View
                    key={skillId}
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      borderWidth: 1.5,
                      borderColor: '#e5e7eb',
                    }}
                  />
                );
              })}
            </View>
          </View>
        );
      })}

      {/* Section 2: Frontier Progression */}
      {progressionStats && (
        <View
          style={{
            marginTop: 16,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: 'rgba(112,121,39,0.1)',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 4,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '600',
                color: '#707927',
                letterSpacing: 1,
              }}
            >
              PROGRESSION
            </Text>
            {progressionStats.nextSkillId && (
              <Text style={{ fontSize: 11, color: '#707927', marginLeft: 4 }}>
                → SKILL {progressionStats.nextSkillId}
              </Text>
            )}
          </View>

          <Text style={{ fontSize: 13, color: '#3a5222', marginBottom: 10 }}>
            Skill {currentSkill}: {SKILLS[currentSkill]?.name}
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
          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: '#166534', fontSize: 12 }}>✓ </Text>
              <Text style={{ color: '#707927', fontSize: 12 }}>
                {progressionStats.markerCount}/3 marker sessions
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: '#166534', fontSize: 12 }}>☯ </Text>
              <Text style={{ color: '#707927', fontSize: 12 }}>
                {progressionStats.strongSamathaCount}/2 strong samatha
              </Text>
            </View>
          </View>

          {/* Advance button or status */}
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
              Final skill reached
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
