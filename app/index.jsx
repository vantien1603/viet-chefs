import { View, Text, Image, TouchableOpacity } from "react-native";
import React, { useContext, useEffect } from "react";
import * as WebBrowser from "expo-web-browser";
import { Redirect, router } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../config/AuthContext";
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import AsyncStorage from "@react-native-async-storage/async-storage";


export default function WelcomeScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    const setupNotifications = async () => {
      // // Kiểm tra xem có phải thiết bị thật không
      // if (!Device.isDevice) {
      //   console.log('Must use physical device for Push Notifications')
      //   return
      // }

      // Yêu cầu quyền thông báo
      const { status: existingStatus } = await Notifications.getPermissionsAsync()
      let finalStatus = existingStatus

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }

      if (finalStatus !== 'granted') {
        Alert.alert('Failed to get push token for push notification!')
        return
      }

      // Lấy token
      const token = (await Notifications.getExpoPushTokenAsync()).data
      console.log('🔥 Device token:', token);
      const expotoken = await AsyncStorage.setItem("expoPushToken", token);

      // Cấu hình xử lý thông báo khi app đang chạy
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      })

      // Lắng nghe thông báo khi app ở foreground
      const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
        Alert.alert(
          'Thông báo nhận được!',
          notification.request.content.body || 'Có thông báo mới'
        )
      })

      // Lắng nghe khi người dùng tương tác với thông báo
      const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification clicked:', response)
      })

      // Cleanup
      return () => {
        foregroundSubscription.remove()
        responseSubscription.remove()
      }
    }

    setupNotifications()
  }, [])

  const handleLogin = () => {
    router.push("screen/login");
  };

  const auth = useContext(AuthContext);

  if (!auth) {
    console.log("AuthContext is not provided");
    return null;
  }

  const { user } = auth;

  useEffect(() => {
    console.log("User:", user);
  }, [user]);

  if (user) {
    return <Redirect href="/home" />;
  }
  return (
    <SafeAreaView
      style={{
        height: "100%",
        alignItems: "center",
        backgroundColor: "#EBE5DD",
        justifyContent: "center",
      }}
    >
      <View style={{ alignItems: "center" }}>
        <Image
          source={require("../assets/images/logo.png")}
          style={{ width: 400, height: 250 }}
          resizeMode="cover"
        />
        <Text
          style={{
            marginTop: 25,
            fontSize: 35,
            fontWeight: "bold",
            textAlign: "center",
            color: "#A9411D",
            fontFamily: "nunito-bold",
          }}
        >
          VIỆT CHEFS
        </Text>
      </View>

      <View>
        <TouchableOpacity
          onPress={() => router.push("screen/signup")}
          style={{
            padding: 13,
            marginTop: 40,
            backgroundColor: "#383737",
            borderRadius: 50,
            borderWidth: 2,
            borderColor: "#383737",
            width: 300,
          }}
        >
          <Text
            style={{
              textAlign: "center",
              fontSize: 18,
              color: "#fff",
              fontFamily: "nunito-bold",
            }}
          >
            SIGN UP
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleLogin}
          style={{
            padding: 13,
            marginTop: 10,
            borderWidth: 2,
            borderColor: "#383737",
            borderRadius: 50,
            width: 300,
          }}
        >
          <Text
            style={{
              textAlign: "center",
              fontSize: 18,
              color: "#383737",
              fontFamily: "nunito-bold",
            }}
          >
            LOGIN
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
