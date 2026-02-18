import { View, Text, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth-context';
import { supabase } from '../../lib/supabase';
import type { PreSitGuidanceData } from '../../../shared/types';

export default function GuidanceScreen() {
  const { user } = useAuth();
  const [guidance, setGuidance] = useState<PreSitGuidanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('users')
      .select('pre_sit_guidance')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setGuidance(data?.pre_sit_guidance as PreSitGuidanceData | null);
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <View className="flex-1 bg-cream justify-center items-center">
        <Text style={{ color: '#707927' }}>Loading...</Text>
      </View>
    );
  }

  if (!guidance) {
    return (
      <View className="flex-1 bg-cream">
        <SafeAreaView className="flex-1">
          <Header />
          <View className="flex-1 justify-center items-center px-6">
            <Text style={{ color: '#707927', fontSize: 15, textAlign: 'center' }}>
              No guidance available yet. Complete a reflection to get personalized reading material.
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView className="flex-1">
        <Header />
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
          {/* Frontier skill */}
          <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: '#3a5222',
              marginBottom: 24,
            }}
          >
            Skill {guidance.frontier_skill_id}: {guidance.frontier_skill_name}
          </Text>

          {/* Reading material */}
          {guidance.reading_material && guidance.reading_material.length > 0 && (
            <View style={{ marginBottom: 28 }}>
              <Text
                style={{
                  fontSize: 12,
                  color: '#707927',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 14,
                }}
              >
                From the skill literature
              </Text>
              {guidance.reading_material.map((item, i) => (
                <View
                  key={i}
                  style={{
                    backgroundColor: '#f8f4e9',
                    borderRadius: 14,
                    padding: 18,
                    marginBottom: 16,
                    borderLeftWidth: 3,
                    borderLeftColor: '#de8649',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: '#707927',
                      fontWeight: '500',
                      marginBottom: 8,
                    }}
                  >
                    Skill {item.skill_id}: {item.skill_name}
                  </Text>
                  <Text
                    style={{
                      fontSize: 15,
                      color: '#3a5222',
                      lineHeight: 24,
                      fontStyle: 'italic',
                    }}
                  >
                    {item.excerpt}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Recurring patterns */}
          {((guidance.recurring_hindrances?.length ?? 0) > 0 ||
            (guidance.recurring_markers?.length ?? 0) > 0) && (
            <View style={{ marginBottom: 28 }}>
              <Text
                style={{
                  fontSize: 12,
                  color: '#707927',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 14,
                }}
              >
                Ongoing patterns
              </Text>

              {(guidance.recurring_hindrances ?? []).map((h, i) => (
                <View
                  key={`h-${i}`}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 10,
                    paddingLeft: 4,
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
                      marginRight: 10,
                    }}
                  />
                  <Text style={{ fontSize: 15, color: '#3a5222', flex: 1, lineHeight: 22 }}>
                    {h.name}
                    <Text style={{ color: '#707927', fontSize: 13 }}>
                      {' '}({h.count}x)
                    </Text>
                    {h.conditions.length > 0 && (
                      <Text style={{ color: '#707927', fontSize: 13, fontStyle: 'italic' }}>
                        {' '} — {h.conditions.join(', ')}
                      </Text>
                    )}
                  </Text>
                </View>
              ))}

              {(guidance.recurring_markers ?? []).map((m, i) => (
                <View
                  key={`m-${i}`}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 10,
                    paddingLeft: 4,
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
                      marginRight: 10,
                    }}
                  />
                  <Text style={{ fontSize: 15, color: '#3a5222', flex: 1, lineHeight: 22 }}>
                    {m.name}
                    <Text style={{ color: '#707927', fontSize: 13 }}>
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
                borderRadius: 14,
                padding: 18,
                marginBottom: 32,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: '#1e40af',
                  fontWeight: '500',
                  marginBottom: 6,
                }}
              >
                Your note to self
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  color: '#1e40af',
                  lineHeight: 24,
                }}
              >
                {guidance.self_advice}
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Header() {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}
    >
      <Pressable onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }}>
        <Ionicons name="arrow-back" size={24} color="#3a5222" />
      </Pressable>
      <Text
        style={{
          fontSize: 11,
          color: '#707927',
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        For Your Next Sit
      </Text>
    </View>
  );
}
