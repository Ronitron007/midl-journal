import { View, Text, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import RenderHtml from 'react-native-render-html';
import { supabase } from '../../../lib/supabase';
import { Entry } from '../../../lib/entries';

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
      <LinearGradient colors={['#e6e0f5', '#fde8d7']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#6b7280' }}>Loading...</Text>
      </LinearGradient>
    );
  }

  if (!entry) {
    return (
      <LinearGradient colors={['#e6e0f5', '#fde8d7']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#6b7280' }}>Entry not found</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#e6e0f5', '#fde8d7']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16 }}>
          <Pressable onPress={() => router.back()}>
            <Text style={{ color: '#5c9eb7', fontSize: 16 }}>← Back</Text>
          </Pressable>
          <Text style={{ color: '#6b7280', fontSize: 14, textTransform: 'capitalize' }}>{entry.type}</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView style={{ flex: 1, paddingHorizontal: 24 }}>
          {/* Entry Card */}
          <View style={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 }}>
            <Text style={{ color: '#6b7280', fontSize: 14, marginBottom: 8 }}>
              {formatDate(entry.created_at)}
            </Text>

            {entry.duration_seconds && (
              <Text style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>
                {Math.round(entry.duration_seconds / 60)} minutes
              </Text>
            )}

            {/* Rendered HTML Content */}
            <RenderHtml
              contentWidth={width - 96}
              source={{ html: entry.raw_content }}
              tagsStyles={{
                body: { color: '#1f2937', fontSize: 16, lineHeight: 24 },
                p: { marginBottom: 12 },
                ul: { marginLeft: 16 },
                ol: { marginLeft: 16 },
                li: { marginBottom: 4 },
                strong: { fontWeight: '600' },
                em: { fontStyle: 'italic' },
              }}
            />

            {/* AI Summary if available */}
            {entry.summary && (
              <View style={{ marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
                <Text style={{ color: '#6b7280', fontSize: 14, marginBottom: 8 }}>AI Summary</Text>
                <Text style={{ color: '#374151', fontSize: 15, lineHeight: 22 }}>{entry.summary}</Text>
              </View>
            )}

            {/* Themes/Tags */}
            {entry.themes && entry.themes.length > 0 && (
              <View style={{ marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {entry.themes.map((theme, i) => (
                  <View key={i} style={{ backgroundColor: '#e6e0f5', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
                    <Text style={{ color: '#4b5563', fontSize: 14 }}>{theme}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
