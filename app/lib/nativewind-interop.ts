import { cssInterop } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';

// Enable NativeWind className support for expo-linear-gradient
cssInterop(LinearGradient, {
  className: 'style',
});
