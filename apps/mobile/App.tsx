import React, { useEffect, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold
} from '@expo-google-fonts/inter';
import { AppNavigator } from './src/navigation/AppNavigator';
import { wsService } from './src/services/websocket';
import { Colors } from './src/theme';
import { Feather } from '@expo/vector-icons';


// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

/**
 * BLITZR — Campus Social-Equity Exchange
 */
function App(): React.JSX.Element | null {
  const [fontsLoaded, fontLoadError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    ...Feather.font,
  });

  const [fontError, setFontError] = React.useState<Error | null>(null);
  const [useFallback, setUseFallback] = React.useState(false);

  // Capture any font load error so error boundary / fallback can react
  useEffect(() => {
    if (fontLoadError) {
      setFontError(fontLoadError);
    }
  }, [fontLoadError]);

  useEffect(() => {
    wsService.connect();

    // Safety check: if fonts take too long, force fallback rendering
    const timer = setTimeout(() => {
      if (!fontsLoaded) {
        console.warn('Font loading delayed; switching to fallback theme.');
        setUseFallback(true);
      }
    }, 3000);

    return () => {
      wsService.disconnect();
      clearTimeout(timer);
    };
  }, [fontsLoaded]);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || useFallback || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, useFallback, fontError]);

  // If fontsLoaded is true, hit the fallback timeout, or font errored — render the app
  if (!fontsLoaded && !useFallback && !fontError) {
    return null; // Still waiting initially
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <NavigationContainer>
        <StatusBar
          barStyle="light-content"
          backgroundColor={Colors.obsidianBase}
          translucent={false}
        />
        <AppNavigator />
      </NavigationContainer>
    </View>
  );
}

export default App;
