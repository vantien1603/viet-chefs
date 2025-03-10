import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import Toast, { BaseToast } from "react-native-toast-message";
import { AuthProvider } from "../config/AuthContext";

// SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const toastConfig = {
    success: (props) => (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: "#4CAF50",
          backgroundColor: "#E8F5E9",
          height: 80,
          width: "90%",
          borderRadius: 10,
        }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          fontSize: 20,
          fontWeight: "bold",
          color: "#2E7D32",
        }}
        text2Style={{
          fontSize: 16,
          color: "#388E3C",
        }}
      />
    ),
    error: (props) => (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: "#D32F2F", // Màu đỏ cho error
          backgroundColor: "#FFEBEE",
          height: 80,
          width: "90%",
          borderRadius: 10,
        }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          fontSize: 20,
          fontWeight: "bold",
          color: "#C62828",
        }}
        text2Style={{
          fontSize: 16,
          color: "#D32F2F",
        }}
      />
    ),
  };

  return (
    <AuthProvider>
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
          name="screen/setPassword"
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
          name="screen/forgotPassword"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="screen/resetPassword"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="screen/booking"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="screen/confirmBooking"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="screen/historyBooking"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="screen/Cart/cart"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="screen/searchResult"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="screen/orderHistories"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="screen/setting"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="screen/editAddress"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="screen/calendar"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="screen/selectFood"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="screen/chefDetail"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="screen/allDish"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="screen/Chefs/menu"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="screen/Chefs/addFood"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="screen/Chefs/foodDetail"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="screen/Chefs/editFood"
          options={{
            headerShown: false,
          }}
        />
      </Stack>

      <Toast config={toastConfig} />
    </AuthProvider>
  );
}
