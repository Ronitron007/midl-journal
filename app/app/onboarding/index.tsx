import { View, Text, Pressable, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';

// Required for web browser auth to complete
WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

export default function AuthScreen() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_WEB_CLIENT_ID, // Use web client ID for Expo Go
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleToken(id_token);
    }
  }, [response]);

  const handleGoogleToken = async (idToken: string) => {
    try {
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) {
        Alert.alert('Sign-In Error', error.message);
      } else {
        router.replace('/onboarding/questions');
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
          router.replace('/onboarding/questions');
        }
      }
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        console.error('Apple Sign-In Error:', e);
        Alert.alert('Sign-In Error', 'Something went wrong');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    if (!GOOGLE_WEB_CLIENT_ID) {
      Alert.alert('Config Error', 'Google Client ID not configured');
      return;
    }
    promptAsync();
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
          disabled={!request}
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
