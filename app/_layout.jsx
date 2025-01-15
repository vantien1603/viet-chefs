import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

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
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
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
      <Stack.Screen
        name="screen/signup"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="screen/verify"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="screen/forgot"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="screen/Booking/booking"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="screen/Booking/confirmBooking"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="screen/Booking/historyBooking"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
