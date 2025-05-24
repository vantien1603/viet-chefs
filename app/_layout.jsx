import { Stack } from "expo-router";
import Toast, { BaseToast } from "react-native-toast-message";
import { AuthProvider } from "../config/AuthContext";
import { NetworkProvider } from "../hooks/networkProvider";
import NetworkAlert from "../components/networkNoti";
import { ModalProvider } from "../context/modalContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ModalNotiProvider } from "../context/commonNoti";
import { SocketProvider } from "../config/SocketContext";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
          fontSize: 15,
          fontWeight: "bold",
          color: "#2E7D32",
        }}
        text2Style={{
          fontSize: 13,
          color: "#388E3C",
        }}
      />
    ),
    error: (props) => (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: "#D32F2F",
          backgroundColor: "#FFEBEE",
          height: 80,
          width: "90%",
          borderRadius: 10,
        }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          fontSize: 15,
          fontWeight: "bold",
          color: "#C62828",
        }}
        text2Style={{
          fontSize: 13,
          color: "#D32F2F",
        }}
      />
    ),
    CHAT_NOTIFY: ({ text1, text2 }) => (
      <View
        style={{
          backgroundColor: "#4CAF50",
          padding: 15,
          borderRadius: 10,
          marginHorizontal: 20,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <View style={{ marginRight: 10 }}>
          <Ionicons name="chatbubble" size={24} color="#fff" />
        </View>
        <View>
          <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
            {text1}
          </Text>
          <Text style={{ color: "#fff", fontSize: 14 }}>{text2}</Text>
        </View>
      </View>
    ),
  };

  return (
    <GestureHandlerRootView>
      <NetworkProvider>
        <AuthProvider>
          <SocketProvider>
            <NetworkAlert />
            <ModalProvider>
              <ModalNotiProvider>
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
                    name="(chef)"
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
                    name="screen/search"
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
                    name="screen/history"
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
                    name="screen/chooseAddress"
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
                    name="screen/chooseFoodForLongterm"
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
                  <Stack.Screen
                    name="screen/createChef"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="screen/wallet"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="screen/profileDetail"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="screen/editProfile"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="screen/reviewsChef"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="screen/longTermBooking"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="screen/longTermSelect"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="screen/reviewBooking"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="screen/changePassword"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="screen/message"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="screen/chefSchedule"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="screen/menuDetail"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="screen/dishDetails"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="screen/longTermDetails"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="screen/deposit"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="screen/withdrawal"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="screen/updateBookingDetail"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="screen/paymentBooking"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="screen/paymentLongterm"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="screen/review"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="screen/scheduleBlocked"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="screen/bookingDetails"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="screen/allChef"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="screen/viewBookingDetails"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="screen/viewDetailBookingDetails"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="screen/notification"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="screen/statistic"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="screen/favorite"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="screen/viewReview"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="screen/allReview"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="screen/helpCentre"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="screen/walletRequest"
                    options={{
                      headerShown: false,
                    }}
                  />
                </Stack>
              </ModalNotiProvider>
            </ModalProvider>
            <Toast config={toastConfig} />
          </SocketProvider>
        </AuthProvider>
      </NetworkProvider>
    </GestureHandlerRootView>
  );
}
