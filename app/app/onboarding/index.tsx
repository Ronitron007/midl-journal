import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';

export default function AuthScreen() {
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

        if (!error) {
          router.replace('/onboarding/questions');
        }
      }
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        console.error('Apple Sign-In Error:', e);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    // TODO: Implement Google Sign-In
    // Requires additional native configuration
    console.log('Google Sign-In not yet configured');
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
