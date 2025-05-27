import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from "../config/AuthContext";
import { NetworkProvider } from "../hooks/networkProvider";
import NetworkAlert from "../components/networkNoti";
import { ModalProvider } from "../context/modalContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ModalNotiProvider } from "../context/commonNoti";
import { ConfirmModalProvider } from "../context/commonConfirm";
import { ModalLoginProvider } from "../context/modalLoginContext";
import { SelectedItemsProvider } from "../context/itemContext";
import { SocketProvider } from "../config/SocketContext";
import { useEffect, useState } from "react";
import i18n from "../i18n";
import { useFonts } from "expo-font";

SplashScreen.preventAutoHideAsync();
export default function RootLayout() {
  const [i18nReady, setI18nReady] = useState(i18n.isInitialized);

  useEffect(() => {
    if (!i18n.isInitialized) {
      i18n.on('initialized', () => {
        setI18nReady(true);
      });
    }
  }, []);

  if (!i18nReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  const [loaded, error] = useFonts({
    'nunito-bold': require("../assets/fonts/Nunito-Bold.ttf"),
    'nunito-regular': require("../assets/fonts/Nunito-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }
  return (
    <GestureHandlerRootView>
      {i18nReady && (
        <NetworkProvider>
          <ModalProvider>
            <AuthProvider>
              <SocketProvider>
                <ModalLoginProvider>
                  <NetworkAlert />
                  <ModalNotiProvider>
                    <ConfirmModalProvider>
                      <SelectedItemsProvider>
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
                            name="screen/searchResult"
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
                            name="screen/dashboard"
                            options={{
                              headerShown: false,
                            }}
                          />
                          <Stack.Screen
                            name="screen/detailsBooking"
                            options={{
                              headerShown: false,
                            }}
                          />
                          <Stack.Screen
                            name="screen/detailsScheduleBooking"
                            options={{
                              headerShown: false,
                            }}
                          />
                          <Stack.Screen
                            name="screen/menu"
                            options={{
                              headerShown: false,
                            }}
                          />
                          <Stack.Screen
                            name="screen/chefDishes"
                            options={{
                              headerShown: false,
                            }}
                          />
                          <Stack.Screen
                            name="screen/addFood"
                            options={{
                              headerShown: false,
                            }}
                          />
                          <Stack.Screen
                            name="screen/packages"
                            options={{
                              headerShown: false,
                            }}
                          />
                          <Stack.Screen
                            name="screen/notificationChef"
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
                            name="screen/search"
                            options={{
                              headerShown: false,
                            }}
                          />
                          <Stack.Screen
                            name="screen/completeBooking"
                            options={{
                              headerShown: false,
                            }}
                          />
                          <Stack.Screen
                            name="screen/menuDetails"
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
                            name="screen/statistic"
                            options={{
                              headerShown: false,
                            }}
                          />
                          <Stack.Screen
                            name="screen/addMenu"
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
                            name="screen/history"
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
                          <Stack.Screen
                            name="screen/chefReviews"
                            options={{
                              headerShown: false,
                            }}
                          />
                        </Stack>
                      </SelectedItemsProvider>
                    </ConfirmModalProvider>
                  </ModalNotiProvider>
                </ModalLoginProvider>
              </SocketProvider>
            </AuthProvider>
          </ModalProvider>
        </NetworkProvider>
      )}
    </GestureHandlerRootView>
  );
}
