import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth-context';
import { OnboardingData, ONBOARDING_OPTIONS } from '../../lib/onboarding-types';

type Step = 'experience' | 'struggles' | 'context' | 'neuro' | 'goals' | 'summary';

export default function OnboardingQuestions() {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('experience');
  const [data, setData] = useState<Partial<OnboardingData>>({
    styles_tried: [],
    struggles: [],
    life_context: [],
    neurodivergence: [],
    goals: [],
  });

  const toggleArrayItem = (key: keyof OnboardingData, item: string) => {
    const current = (data[key] as string[]) || [];
    const updated = current.includes(item)
      ? current.filter((i) => i !== item)
      : [...current, item];
    setData({ ...data, [key]: updated });
  };

  const handleComplete = async () => {
    // Create user profile with onboarding data
    const { error } = await supabase.from('users').upsert({
      id: user!.id,
      email: user!.email!,
      onboarding_data: data,
      current_skill: '00',
    });

    if (!error) {
      router.replace('/(main)/tracker');
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'experience':
        return (
          <View className="gap-4">
            <Text className="text-xl font-medium text-gray-800 mb-2">
              Have you meditated before?
            </Text>
            {ONBOARDING_OPTIONS.meditation_experience.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => {
                  setData({ ...data, meditation_experience: opt.value as any });
                  setStep('struggles');
                }}
                className={`p-4 rounded-xl border ${
                  data.meditation_experience === opt.value
                    ? 'bg-muted-blue border-muted-blue'
                    : 'bg-white/80 border-gray-200'
                }`}
              >
                <Text
                  className={
                    data.meditation_experience === opt.value
                      ? 'text-white font-medium'
                      : 'text-gray-800'
                  }
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        );

      case 'struggles':
        return (
          <View className="gap-4">
            <Text className="text-xl font-medium text-gray-800 mb-2">
              What do you struggle with?
            </Text>
            <Text className="text-gray-600 mb-2">Select all that apply</Text>
            <View className="flex-row flex-wrap gap-2">
              {ONBOARDING_OPTIONS.struggles.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => toggleArrayItem('struggles', item)}
                  className={`px-4 py-2 rounded-full border ${
                    data.struggles?.includes(item)
                      ? 'bg-muted-blue border-muted-blue'
                      : 'bg-white/80 border-gray-200'
                  }`}
                >
                  <Text
                    className={
                      data.struggles?.includes(item)
                        ? 'text-white'
                        : 'text-gray-800'
                    }
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={() => setStep('context')}
              className="bg-muted-blue py-4 rounded-xl mt-4"
            >
              <Text className="text-white text-center font-medium">Continue</Text>
            </Pressable>
          </View>
        );

      case 'context':
        return (
          <View className="gap-4">
            <Text className="text-xl font-medium text-gray-800 mb-2">
              What's going on in your life right now?
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {ONBOARDING_OPTIONS.life_context.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => toggleArrayItem('life_context', item)}
                  className={`px-4 py-2 rounded-full border ${
                    data.life_context?.includes(item)
                      ? 'bg-muted-blue border-muted-blue'
                      : 'bg-white/80 border-gray-200'
                  }`}
                >
                  <Text
                    className={
                      data.life_context?.includes(item)
                        ? 'text-white'
                        : 'text-gray-800'
                    }
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              placeholder="What brings you here? (optional)"
              placeholderTextColor="#9ca3af"
              multiline
              className="bg-white/80 p-4 rounded-xl border border-gray-200 min-h-[100px] text-gray-800"
              value={data.what_brings_you}
              onChangeText={(text) => setData({ ...data, what_brings_you: text })}
            />
            <Pressable
              onPress={() => setStep('neuro')}
              className="bg-muted-blue py-4 rounded-xl"
            >
              <Text className="text-white text-center font-medium">Continue</Text>
            </Pressable>
          </View>
        );

      case 'neuro':
        return (
          <View className="gap-4">
            <Text className="text-xl font-medium text-gray-800 mb-2">
              Anything that affects how you learn or focus?
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {ONBOARDING_OPTIONS.neurodivergence.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => toggleArrayItem('neurodivergence', item)}
                  className={`px-4 py-2 rounded-full border ${
                    data.neurodivergence?.includes(item)
                      ? 'bg-muted-blue border-muted-blue'
                      : 'bg-white/80 border-gray-200'
                  }`}
                >
                  <Text
                    className={
                      data.neurodivergence?.includes(item)
                        ? 'text-white'
                        : 'text-gray-800'
                    }
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={() => setStep('goals')}
              className="bg-muted-blue py-4 rounded-xl mt-4"
            >
              <Text className="text-white text-center font-medium">Continue</Text>
            </Pressable>
          </View>
        );

      case 'goals':
        return (
          <View className="gap-4">
            <Text className="text-xl font-medium text-gray-800 mb-2">
              What does success look like in 6 months?
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {ONBOARDING_OPTIONS.goals.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => toggleArrayItem('goals', item)}
                  className={`px-4 py-2 rounded-full border ${
                    data.goals?.includes(item)
                      ? 'bg-muted-blue border-muted-blue'
                      : 'bg-white/80 border-gray-200'
                  }`}
                >
                  <Text
                    className={
                      data.goals?.includes(item) ? 'text-white' : 'text-gray-800'
                    }
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={() => setStep('summary')}
              className="bg-muted-blue py-4 rounded-xl mt-4"
            >
              <Text className="text-white text-center font-medium">Continue</Text>
            </Pressable>
          </View>
        );

      case 'summary':
        return (
          <View className="gap-6">
            <View className="bg-white/90 p-6 rounded-2xl">
              <Text className="text-lg text-gray-800 leading-relaxed">
                Based on what you shared, I'd suggest starting with{' '}
                <Text className="font-bold">Skill 00: Diaphragmatic Breathing</Text>
                . It's the foundation for everything else — simple but powerful.
              </Text>
            </View>
            <Pressable
              onPress={handleComplete}
              className="bg-muted-blue py-4 rounded-xl"
            >
              <Text className="text-white text-center font-medium text-lg">
                Let's Begin
              </Text>
            </Pressable>
          </View>
        );
    }
  };

  return (
    <LinearGradient colors={['#e6e0f5', '#fde8d7']} className="flex-1">
      <ScrollView
        className="flex-1 px-6 pt-16"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {step === 'experience' && (
          <View className="mb-8">
            <Text className="text-2xl font-serif text-gray-800 mb-2">
              Let's get to know each other
            </Text>
            <Text className="text-gray-600">
              So I can guide your practice better
            </Text>
          </View>
        )}
        {renderStep()}
      </ScrollView>
    </LinearGradient>
  );
}
