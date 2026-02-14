import { View, Text, ScrollView } from 'react-native';
import type { PreSitGuidanceData } from '../../shared/types';

export { PreSitGuidanceData };

type Props = {
  guidance: PreSitGuidanceData | null;
};

export default function PreSitGuidance({ guidance }: Props) {
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

      <Text
        style={{
          fontSize: 17,
          fontWeight: '600',
          color: '#3a5222',
          marginBottom: 16,
        }}
      >
        Skill {guidance.frontier_skill_id}: {guidance.frontier_skill_name}
      </Text>

      {/* Reading Material — verbatim excerpts */}
      {guidance.reading_material && guidance.reading_material.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 12,
              color: '#707927',
              marginBottom: 8,
            }}
          >
            From the skill literature:
          </Text>
          {guidance.reading_material.map((item, i) => (
            <View
              key={i}
              style={{
                backgroundColor: '#f8f4e9',
                borderRadius: 12,
                padding: 14,
                marginBottom: 8,
                borderLeftWidth: 3,
                borderLeftColor: '#de8649',
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  color: '#707927',
                  marginBottom: 4,
                }}
              >
                Skill {item.skill_id}: {item.skill_name}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: '#3a5222',
                  lineHeight: 20,
                  fontStyle: 'italic',
                }}
              >
                {item.excerpt}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Recurring Patterns */}
      {((guidance.recurring_hindrances?.length ?? 0) > 0 ||
        (guidance.recurring_markers?.length ?? 0) > 0) && (
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 12,
              color: '#707927',
              marginBottom: 8,
            }}
          >
            Ongoing patterns:
          </Text>

          {/* Recurring hindrances */}
          {(guidance.recurring_hindrances ?? []).map((h, i) => (
            <View
              key={`h-${i}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 6,
                paddingLeft: 8,
              }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#fef3c7',
                  borderWidth: 1.5,
                  borderColor: '#d97706',
                  marginRight: 8,
                }}
              />
              <Text style={{ fontSize: 14, color: '#3a5222', flex: 1 }}>
                {h.name}
                <Text style={{ color: '#707927', fontSize: 12 }}>
                  {' '}({h.count}x)
                </Text>
                {h.conditions.length > 0 && (
                  <Text style={{ color: '#707927', fontSize: 12, fontStyle: 'italic' }}>
                    {' '} — {h.conditions.join(', ')}
                  </Text>
                )}
              </Text>
            </View>
          ))}

          {/* Recurring markers */}
          {(guidance.recurring_markers ?? []).map((m, i) => (
            <View
              key={`m-${i}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 6,
                paddingLeft: 8,
              }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#dcfce7',
                  borderWidth: 1.5,
                  borderColor: '#16a34a',
                  marginRight: 8,
                }}
              />
              <Text style={{ fontSize: 14, color: '#3a5222', flex: 1 }}>
                {m.name}
                <Text style={{ color: '#707927', fontSize: 12 }}>
                  {' '}({m.count}x)
                </Text>
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Self-advice */}
      {guidance.self_advice && (
        <View
          style={{
            backgroundColor: '#dbeafe',
            borderRadius: 12,
            padding: 14,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color: '#1e40af',
              fontWeight: '500',
              marginBottom: 4,
            }}
          >
            Your note to self
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: '#1e40af',
              lineHeight: 20,
            }}
          >
            {guidance.self_advice}
          </Text>
        </View>
      )}
    </View>
  );
}
