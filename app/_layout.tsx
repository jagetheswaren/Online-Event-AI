import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Text, TextInput } from "react-native";
import {
  useFonts,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import { EventProvider } from '@/providers/EventProvider';
import { UserProvider } from '@/providers/UserProvider';
import { ChatHistoryProvider } from '@/providers/ChatHistoryProvider';
import { AdminProvider } from '@/providers/AdminProvider';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const applyDefaultFonts = () => {
  const baseStyle = { fontFamily: "SpaceGrotesk_400Regular" };

  Text.defaultProps = Text.defaultProps || {};
  Text.defaultProps.style = [Text.defaultProps.style, baseStyle];

  TextInput.defaultProps = TextInput.defaultProps || {};
  TextInput.defaultProps.style = [TextInput.defaultProps.style, baseStyle];
};

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="events" options={{ headerShown: false }} />
      <Stack.Screen name="event-detail" options={{ headerShown: false }} />
      <Stack.Screen name="ai-chat" options={{ headerShown: false }} />
      <Stack.Screen name="ai-transform" options={{ headerShown: false }} />
      <Stack.Screen name="budget-engine" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="vendors" options={{ headerShown: false }} />
      <Stack.Screen name="vendor-detail" options={{ headerShown: false }} />
      <Stack.Screen name="booking" options={{ presentation: "modal" }} />
      <Stack.Screen name="my-events" options={{ headerShown: false }} />
      <Stack.Screen name="admin-login" options={{ headerShown: false }} />
      <Stack.Screen name="admin-signup" options={{ headerShown: false }} />
      <Stack.Screen name="admin-dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="admin-settings" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      applyDefaultFonts();
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <UserProvider>
          <AdminProvider>
            <EventProvider>
              <ChatHistoryProvider>
                <RootLayoutNav />
              </ChatHistoryProvider>
            </EventProvider>
          </AdminProvider>
        </UserProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
