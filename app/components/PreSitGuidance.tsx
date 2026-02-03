import { View, Text } from 'react-native';

export type PreSitGuidanceData = {
  skill_id: string;
  skill_name: string;
  patterns: string[];
  suggestion: string;
  check_in: string;
  generated_at: string;
};

type Props = {
  guidance: PreSitGuidanceData | null;
};

export default function PreSitGuidance({ guidance }: Props) {
  // Empty state - no entries yet
  if (!guidance) {
    return (
      <View
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
        }}
      >
        <Text
          style={{
            fontSize: 11,
            color: '#707927',
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 12,
          }}
        >
          For Your Next Sit
        </Text>
        <Text
          style={{
            color: '#707927',
            fontSize: 14,
            textAlign: 'center',
            paddingVertical: 16,
          }}
        >
          Complete your first reflection to get personalized guidance for your
          sits.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
      }}
    >
      {/* Header */}
      <Text
        style={{
          fontSize: 11,
          color: '#707927',
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 8,
        }}
      >
        For Your Next Sit
      </Text>

      {/* Current skill */}
      <Text
        style={{
          fontSize: 17,
          fontWeight: '600',
          color: '#3a5222',
          marginBottom: 16,
        }}
      >
        Skill {guidance.skill_id}: {guidance.skill_name}
      </Text>

      {/* Patterns from recent entries */}
      {guidance.patterns && guidance.patterns.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 12,
              color: '#707927',
              marginBottom: 6,
            }}
          >
            Observations from your recent sits:
          </Text>
          {guidance.patterns.map((pattern, i) => (
            <Text
              key={i}
              style={{
                fontSize: 14,
                color: '#3a5222',
                textTransform: 'capitalize',
                marginBottom: 4,
                paddingLeft: 8,
              }}
            >
              • {pattern}
            </Text>
          ))}
        </View>
      )}

      {/* Suggestion from skill literature */}
      <View
        style={{
          backgroundColor: '#f8f4e9',
          borderRadius: 12,
          padding: 14,
          marginBottom: 16,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            color: '#3a5222',
            lineHeight: 20,
            fontStyle: 'italic',
          }}
        >
          {guidance.suggestion}
        </Text>
      </View>

      {/* Daily check-in question */}
      <Text
        style={{
          fontSize: 15,
          fontWeight: 'bold',
          color: '#3a5222',
          marginBottom: 4,
        }}
      >
        Skill Check-In
      </Text>
      <Text
        style={{
          fontSize: 13,
          color: '#707927',
          fontStyle: 'italic',
        }}
      >
        "{guidance.check_in}"
      </Text>
    </View>
  );
}
