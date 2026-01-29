import { View, Text, Pressable, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';

// For Expo Go, use the proxy. For production builds, use the custom scheme.
const redirectUrl = makeRedirectUri({
  // This uses auth.expo.io proxy for Expo Go compatibility
  preferLocalhost: false,
});

console.log('Redirect URL:', redirectUrl); // Debug: see what URL is being used

export default function AuthScreen() {
  // Check if user completed onboarding and route accordingly
  const routeAfterAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('users')
      .select('onboarding_data')
      .eq('id', user.id)
      .single();

    if (data?.onboarding_data) {
      router.replace('/(main)/tracker');
    } else {
      router.replace('/onboarding/questions');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        Alert.alert('Sign-In Error', error.message);
        return;
      }

      if (data?.url) {
        // Open the OAuth URL in a web browser
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        if (result.type === 'success' && result.url) {
          // Extract the URL fragment and set the session
          const url = new URL(result.url);
          const params = new URLSearchParams(url.hash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              Alert.alert('Sign-In Error', sessionError.message);
            } else {
              await routeAfterAuth();
            }
          }
        }
      }
    } catch (e: any) {
      console.error('Google Sign-In Error:', e);
      Alert.alert('Sign-In Error', 'Something went wrong');
    }
  };

  const handleAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });

        if (error) {
          Alert.alert('Sign-In Error', error.message);
        } else {
          await routeAfterAuth();
        }
      }
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        console.error('Apple Sign-In Error:', e);
        Alert.alert('Sign-In Error', 'Something went wrong');
      }
    }
  };


  return (
    <LinearGradient
      colors={['#e6e0f5', '#fde8d7']}
      className="flex-1 justify-center items-center px-8"
    >
      <View className="items-center mb-16">
        <Text className="text-4xl font-serif text-gray-800 mb-2">
          MIDL Journal
        </Text>
        <Text className="text-lg text-gray-600 text-center">
          Your meditation companion
        </Text>
      </View>

      <View className="w-full gap-4">
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={12}
          style={{ width: '100%', height: 50 }}
          onPress={handleAppleSignIn}
        />

        <Pressable
          onPress={handleGoogleSignIn}
          className="bg-white rounded-xl py-4 flex-row justify-center items-center border border-gray-200"
        >
          <Text className="text-gray-800 font-medium text-base">
            Continue with Google
          </Text>
        </Pressable>
      </View>

      <Text className="text-gray-500 text-sm mt-8 text-center">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </Text>
    </LinearGradient>
  );
}
