import { View, Text, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import RenderHtml from 'react-native-render-html';
import { supabase } from '../../../lib/supabase';
import { Entry, SamathaTendency } from '../../../lib/entries';
import { SKILLS } from '../../../lib/midl-skills';

// Mood score to emoji/label
const MOOD_DISPLAY: Record<number, { emoji: string; label: string }> = {
  1: { emoji: '😔', label: 'Very low' },
  2: { emoji: '😕', label: 'Low' },
  3: { emoji: '😐', label: 'Neutral' },
  4: { emoji: '🙂', label: 'Good' },
  5: { emoji: '😊', label: 'Great' },
};

// Samatha tendency display
const SAMATHA_DISPLAY: Record<SamathaTendency, { label: string; color: string; bg: string }> = {
  strong: { label: 'Strong tendency toward calm', color: '#166534', bg: '#dcfce7' },
  moderate: { label: 'Moderate tendency toward calm', color: '#166534', bg: '#d1fae5' },
  weak: { label: 'Weak tendency toward calm', color: '#92400e', bg: '#fef3c7' },
  none: { label: 'Little tendency toward calm', color: '#991b1b', bg: '#fee2e2' },
};

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntry();
  }, [id]);

  const loadEntry = async () => {
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('id', id)
      .single();

    if (!error && data) {
      setEntry(data);
    }
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f8f4e9', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#707927' }}>Loading...</Text>
      </View>
    );
  }

  if (!entry) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f8f4e9', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#707927' }}>Entry not found</Text>
      </View>
    );
  }

  const skillName = entry.skill_practiced ? SKILLS[entry.skill_practiced]?.name : null;
  const moodInfo = entry.mood_score ? MOOD_DISPLAY[entry.mood_score] : null;
  const samathInfo = entry.samatha_tendency ? SAMATHA_DISPLAY[entry.samatha_tendency] : null;

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f4e9' }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16 }}>
          <Pressable onPress={() => router.back()}>
            <Text style={{ color: '#de8649', fontSize: 16 }}>← Back</Text>
          </Pressable>
          <Text style={{ color: '#707927', fontSize: 14, textTransform: 'capitalize' }}>{entry.type}</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView style={{ flex: 1, paddingHorizontal: 24 }} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Entry Card */}
          <View style={{ backgroundColor: '#ffffff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 }}>
            {/* Date & Meta */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <View>
                <Text style={{ color: '#707927', fontSize: 14 }}>
                  {formatDate(entry.created_at)}
                </Text>
                {entry.duration_seconds && (
                  <Text style={{ color: '#707927', fontSize: 13, marginTop: 2, opacity: 0.7 }}>
                    {Math.round(entry.duration_seconds / 60)} minutes
                  </Text>
                )}
              </View>
              {moodInfo && (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 24 }}>{moodInfo.emoji}</Text>
                  <Text style={{ color: '#707927', fontSize: 11 }}>{moodInfo.label}</Text>
                </View>
              )}
            </View>

            {/* Skill practiced */}
            {skillName && (
              <View style={{ backgroundColor: '#f8f4e9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 16 }}>
                <Text style={{ color: '#3a5222', fontSize: 13 }}>
                  Skill {entry.skill_practiced}: {skillName}
                </Text>
              </View>
            )}

            {/* Rendered HTML Content */}
            <RenderHtml
              contentWidth={width - 96}
              source={{ html: entry.raw_content }}
              tagsStyles={{
                body: { color: '#3a5222', fontSize: 16, lineHeight: 24 },
                p: { marginBottom: 12 },
                ul: { marginLeft: 16 },
                ol: { marginLeft: 16 },
                li: { marginBottom: 4 },
                strong: { fontWeight: '600' },
                em: { fontStyle: 'italic' },
              }}
            />

            {/* === Stephen's Framework Insights === */}
            {(samathInfo || entry.marker_present || entry.hindrance_present || entry.key_understanding) && (
              <View style={{ marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(112,121,39,0.1)' }}>
                <Text style={{ color: '#707927', fontSize: 14, marginBottom: 12, fontWeight: '500' }}>
                  Practice Insights
                </Text>

                {/* Samatha Tendency - "What was your mind's tendency toward relaxation?" */}
                {samathInfo && (
                  <View style={{ backgroundColor: samathInfo.bg, padding: 12, borderRadius: 12, marginBottom: 8 }}>
                    <Text style={{ color: samathInfo.color, fontSize: 13, fontWeight: '500' }}>
                      {samathInfo.label}
                    </Text>
                    {entry.marker_notes && (
                      <Text style={{ color: samathInfo.color, fontSize: 13, opacity: 0.9, marginTop: 4 }}>
                        {entry.marker_notes}
                      </Text>
                    )}
                  </View>
                )}

                {/* Hindrance - "What was the dominant hindrance?" */}
                {entry.hindrance_present && (
                  <View style={{ backgroundColor: '#fef3c7', padding: 12, borderRadius: 12, marginBottom: 8 }}>
                    <Text style={{ color: '#92400e', fontSize: 13, fontWeight: '500' }}>
                      Hindrance arose
                    </Text>
                    {entry.hindrance_notes && (
                      <Text style={{ color: '#92400e', fontSize: 13, opacity: 0.9, marginTop: 4 }}>
                        {entry.hindrance_notes}
                      </Text>
                    )}
                  </View>
                )}

                {/* Hindrance Conditions - "What conditions led to it?" */}
                {entry.hindrance_conditions && entry.hindrance_conditions.length > 0 && (
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ color: '#707927', fontSize: 12, marginBottom: 4 }}>Conditions that led to hindrance:</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {entry.hindrance_conditions.map((condition, i) => (
                        <View key={i} style={{ backgroundColor: '#fee2e2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
                          <Text style={{ color: '#991b1b', fontSize: 12 }}>{condition}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Balance Approach - "How did you work with it?" */}
                {entry.balance_approach && (
                  <View style={{ backgroundColor: '#dbeafe', padding: 12, borderRadius: 12, marginBottom: 8 }}>
                    <Text style={{ color: '#1e40af', fontSize: 12, fontWeight: '500', marginBottom: 2 }}>
                      How you worked with it
                    </Text>
                    <Text style={{ color: '#1e40af', fontSize: 13 }}>
                      {entry.balance_approach}
                    </Text>
                  </View>
                )}

                {/* Key Understanding - "What did you understand?" */}
                {entry.key_understanding && (
                  <View style={{ backgroundColor: '#e0e7ff', padding: 12, borderRadius: 12, marginBottom: 8 }}>
                    <Text style={{ color: '#3730a3', fontSize: 12, fontWeight: '500', marginBottom: 2 }}>
                      Understanding gained
                    </Text>
                    <Text style={{ color: '#3730a3', fontSize: 13 }}>
                      {entry.key_understanding}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Techniques mentioned */}
            {entry.techniques_mentioned && entry.techniques_mentioned.length > 0 && (
              <View style={{ marginTop: 16 }}>
                <Text style={{ color: '#707927', fontSize: 13, marginBottom: 8 }}>Techniques used</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {entry.techniques_mentioned.map((tech, i) => (
                    <View key={i} style={{ backgroundColor: '#dbeafe', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
                      <Text style={{ color: '#1e40af', fontSize: 13 }}>{tech}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Progression signals */}
            {entry.progression_signals && entry.progression_signals.length > 0 && (
              <View style={{ marginTop: 16, backgroundColor: '#f0fdf4', padding: 12, borderRadius: 12 }}>
                <Text style={{ color: '#166534', fontSize: 13, fontWeight: '500', marginBottom: 6 }}>
                  Signs of progression
                </Text>
                {entry.progression_signals.map((signal, i) => (
                  <Text key={i} style={{ color: '#166534', fontSize: 13, marginTop: 2 }}>• {signal}</Text>
                ))}
              </View>
            )}

            {/* AI Summary */}
            {entry.summary && (
              <View style={{ marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(112,121,39,0.1)' }}>
                <Text style={{ color: '#707927', fontSize: 14, marginBottom: 8 }}>Summary</Text>
                <Text style={{ color: '#3a5222', fontSize: 15, lineHeight: 22 }}>{entry.summary}</Text>
              </View>
            )}

            {/* Mood tags */}
            {entry.mood_tags && entry.mood_tags.length > 0 && (
              <View style={{ marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {entry.mood_tags.map((tag, i) => (
                  <View key={i} style={{ backgroundColor: '#fce7f3', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
                    <Text style={{ color: '#9d174d', fontSize: 13 }}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* General themes */}
            {entry.themes && entry.themes.length > 0 && (
              <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {entry.themes.map((theme, i) => (
                  <View key={i} style={{ backgroundColor: '#f8f4e9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
                    <Text style={{ color: '#3a5222', fontSize: 13 }}>{theme}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Breakthrough/Struggle badges */}
            {(entry.has_breakthrough || entry.has_struggle) && (
              <View style={{ marginTop: 16, flexDirection: 'row', gap: 8 }}>
                {entry.has_breakthrough && (
                  <View style={{ backgroundColor: '#fef3c7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
                    <Text style={{ color: '#92400e', fontSize: 13 }}>⭐ Breakthrough</Text>
                  </View>
                )}
                {entry.has_struggle && (
                  <View style={{ backgroundColor: '#fee2e2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
                    <Text style={{ color: '#991b1b', fontSize: 13 }}>💪 Struggle</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
