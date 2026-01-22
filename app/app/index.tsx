import { Redirect } from 'expo-router';

export default function Index() {
  // TODO: Check auth state and onboarding status
  return <Redirect href="/onboarding" />;
}
