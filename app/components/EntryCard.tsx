import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Entry } from '../lib/entries';
import { SKILLS } from '../lib/midl-skills';
import HtmlRenderer from './HtmlRenderer';

type EntryCardProps = {
  entry: Entry;
  onDelete: (id: string) => void;
};

// Mood score to emoji
const MOOD_EMOJI: Record<number, string> = {
  1: '😔',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😊',
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function EntryCard({ entry, onDelete }: EntryCardProps) {
  const skillName = entry.skill_practiced ? SKILLS[entry.skill_practiced]?.name : null;
  const moodEmoji = entry.mood_score ? MOOD_EMOJI[entry.mood_score] : null;

  // Get first 2 techniques or mood tags for display
  const chips = [
    ...(entry.techniques_mentioned?.slice(0, 2) || []),
    ...(entry.mood_tags?.slice(0, 2) || []),
  ].slice(0, 3);

  const renderRightActions = () => (
    <Pressable
      onPress={() => onDelete(entry.id)}
      style={{
        backgroundColor: '#ef4444',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
      }}
    >
      <Ionicons name="trash-outline" size={24} color="white" />
    </Pressable>
  );

  return (
    <View style={{ borderRadius: 16, overflow: 'hidden' }}>
      <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
        <Pressable
          onPress={() => router.push(`/(main)/entry/${entry.id}`)}
          style={{ backgroundColor: '#ffffff', padding: 16 }}
        >
          {/* Top row: date, type, skill, indicators, mood */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <Text style={{ color: '#707927', fontSize: 13 }}>
                {formatDate(entry.created_at)}
              </Text>
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 4,
                  backgroundColor: entry.type === 'reflect' ? '#f8f4e9' : '#f8f4e9',
                }}
              >
                <Text style={{ fontSize: 11, color: '#3a5222', textTransform: 'capitalize' }}>
                  {entry.type}
                </Text>
              </View>
              {skillName && (
                <Text style={{ color: '#707927', fontSize: 11 }} numberOfLines={1}>
                  {entry.skill_practiced}
                </Text>
              )}
            </View>

            {/* Signal indicators + mood */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {entry.marker_present && (
                <View style={{ backgroundColor: '#dcfce7', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 10, color: '#166534' }}>✓</Text>
                </View>
              )}
              {entry.hindrance_present && (
                <View style={{ backgroundColor: '#fef3c7', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 10 }}>⚡</Text>
                </View>
              )}
              {entry.has_breakthrough && (
                <View style={{ backgroundColor: '#fef3c7', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 10 }}>⭐</Text>
                </View>
              )}
              {moodEmoji && (
                <Text style={{ fontSize: 16 }}>{moodEmoji}</Text>
              )}
            </View>
          </View>

          {/* Summary/content */}
          <View style={{ marginTop: 8 }}>
            {entry.summary ? (
              <Text style={{ color: '#3a5222', fontSize: 14, lineHeight: 20 }} numberOfLines={2}>
                {entry.summary}
              </Text>
            ) : (
              <HtmlRenderer html={entry.raw_content} maxLength={100} />
            )}
          </View>

          {/* Bottom chips: techniques + mood tags */}
          {chips.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {chips.map((chip, i) => (
                <View
                  key={i}
                  style={{
                    backgroundColor: i < (entry.techniques_mentioned?.length || 0) ? '#dbeafe' : '#fce7f3',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      color: i < (entry.techniques_mentioned?.length || 0) ? '#1e40af' : '#9d174d',
                    }}
                  >
                    {chip}
                  </Text>
                </View>
              ))}
              {(entry.techniques_mentioned?.length || 0) + (entry.mood_tags?.length || 0) > 3 && (
                <Text style={{ fontSize: 11, color: '#707927', alignSelf: 'center' }}>
                  +{(entry.techniques_mentioned?.length || 0) + (entry.mood_tags?.length || 0) - 3}
                </Text>
              )}
            </View>
          )}

          {/* Progression indicator */}
          {entry.progression_signals && entry.progression_signals.length > 0 && (
            <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                <Text style={{ fontSize: 11, color: '#166534' }}>
                  📈 Progression signs
                </Text>
              </View>
            </View>
          )}
        </Pressable>
      </Swipeable>
    </View>
  );
}
