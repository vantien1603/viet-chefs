import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';


// SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  

  return (
    <Stack
      screenOptions={{
        headerTitleAlign: "center",
        headerTitleStyle: {
          fontFamily: "nunito-bold",
          color: "#4EA0B7",
          fontSize: 28,
        },
        headerStyle: {
          backgroundColor: "#FDFBF6",
        },
      }}
    >
      <Stack.Screen name="index"
        options={{
          headerShown: false,
        }} />
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="screen/login"
        options={{
          headerShown: false,
        }}
      />
      
    </Stack>
  );
}
