import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import * as WebBrowser from 'expo-web-browser'
import { Redirect, router } from 'expo-router'
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../config/AuthContext';
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import AsyncStorage from "@react-native-async-storage/async-storage";
export default function WelcomeScreen() {
  const navigation = useNavigation();
  const [isCheckingUser, setIsCheckingUser] = useState(false);

  useEffect(() => {
    const setupNotifications = async () => {
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
      console.log("expo index", token);
      console.log('🔥 Device token:', token);

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
  const [hasNavigated, setHasNavigated] = useState(false);

  const { user, loading } = useContext(AuthContext);
  // console.log('userr truoc ne', user);


  useFocusEffect(
    useCallback(() => {
      setIsCheckingUser(true);
      const timeout = setTimeout(() => {
        if (user) {
          if (user.roleName === "ROLE_CHEF") {
            navigation.navigate("(chef)", { screen: "dashboard" });
          } else if (user.roleName === "ROLE_CUSTOMER") {
            navigation.navigate("(tabs)", { screen: "home" });
          }
        } else {
          setIsCheckingUser(false);
        }
      }, 1000);

      return () => {
        clearTimeout(timeout);
        setIsCheckingUser(false)
      }
    }, [user])
  );



  // // useEffect(() => {
  //   if (user) {
  //     // if (user && !hasNavigated && !loading) {
  //     console.log("login roiiiii", user);
  //     if (user?.roleName === "ROLE_CHEF") {
  //       navigation.navigate("(chef)", { screen: "dashboard" })
  //     }
  //   } else if (user?.roleName === "ROLE_CUSTOMER") {
  //     navigation.navigate("(tabs)", { screen: "home" });
  //   }
  //   // setHasNavigated(true);

  //   // navigation.navigate("(tabs)", { screen: "home" });
  // // }, [user])

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
          disabled={isCheckingUser}
        >
          {isCheckingUser ? (<ActivityIndicator size="small" color="#0000ff" />
          ) : (
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
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleLogin}
          disabled={isCheckingUser}
          style={{
            padding: 13,
            marginTop: 10,
            borderWidth: 2,
            borderColor: "#383737",
            borderRadius: 50,
            width: 300,
          }}
        >
          {isCheckingUser ? (<ActivityIndicator size="small" color="#0000ff" />
          ) : (
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
          )}

        </TouchableOpacity>
      </View>
      <TouchableOpacity disabled={isCheckingUser} onPress={() => navigation.navigate("(tabs)", { screen: "home" })} style={{ alignItems: 'center', marginTop: 10, position: 'absolute', bottom: 10, }}>
        <Text style={{ textDecorationLine: 'underline', }}>Continue as guest</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
