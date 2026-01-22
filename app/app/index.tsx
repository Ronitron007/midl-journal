import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../lib/auth-context';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Index() {
  const { session, loading } = useAuth();
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    if (session?.user) {
      checkOnboardingStatus();
    }
  }, [session]);

  const checkOnboardingStatus = async () => {
    const { data } = await supabase
      .from('users')
      .select('onboarding_data')
      .eq('id', session!.user.id)
      .single();

    setHasOnboarded(!!data?.onboarding_data);
  };

  if (loading || (session && hasOnboarded === null)) {
    return (
      <View className="flex-1 justify-center items-center bg-lavender">
        <ActivityIndicator size="large" color="#5c9eb7" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/onboarding" />;
  }

  if (!hasOnboarded) {
    return <Redirect href="/onboarding/questions" />;
  }

  return <Redirect href="/(main)/tracker" />;
}
