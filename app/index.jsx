import { View, Text, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import * as WebBrowser from 'expo-web-browser'
import { Redirect, router } from 'expo-router'
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../config/AuthContext';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import * as SecureStore from "expo-secure-store";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCommonNoification } from '../context/commonNoti';
import { t } from "i18next";
import useAxios from '../config/AXIOS_API';
import axios from 'axios';

async function registerForPushNotificationsAsync() {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      // Alert.alert('Failed to get push token for push notification!');
      return null;
    }

    // const token = (await Notifications.getExpoPushTokenAsync()).data;
    const token = (await Notifications.getDevicePushTokenAsync()).data;
    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}


export default function WelcomeScreen() {
  const navigation = useNavigation();
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState('');
  const [channels, setChannels] = useState([]);
  const [notification, setNotification] = useState();
  const notificationListener = useRef();
  const responseListener = useRef();
  const { user, chef, setChef } = useContext(AuthContext);
  const { showModal } = useCommonNoification();
  const axiosInstance = useAxios();
  const setupNotifications = async () => {
    try {
      const token = await registerForPushNotificationsAsync();
      console.log("token o index", token);
      if (token) {
        setExpoPushToken(token);
        SecureStore.setItemAsync('expoPushToken', token);
        // AsyncStorage.setItem('expoPushToken', token);
        console.log('Expo Push Token:', token);
      }

      const value = await Notifications.getNotificationChannelsAsync();
      setChannels(value ?? []);

      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }

      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        setNotification(notification);

      });

      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification clicked:', response);
      });
    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  };

  const setupLocationPermissions = async () => {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      Alert.alert(
        'Quyền truy cập vị trí bị từ chối',
        'Ứng dụng cần quyền truy cập vị trí để hoạt động chính xác. Vui lòng cấp quyền trong cài đặt.'
      );

      return;
    }

    console.log('Location permissions granted');
  };

  const handleLogin = () => {
    router.push("screen/login");
  };

  // const fetchChef = async (id) => {
  //   try {
  //     const response = await axiosInstance.get(`/chefs/${id}`);
  //     if (response.status === 200) setChef(response.data);
  //   } catch (error) {
  //     if (axios.isCancel(error)) return;
  //   }
  // }

  useFocusEffect(
    useCallback(() => {
      setupNotifications();
      setupLocationPermissions();
      setIsCheckingUser(true);
      const timeout = setTimeout(() => {
        if (user) {
          if (user.roleName === "ROLE_CHEF") {
            // fetchChef(user.chefId);
            navigation.navigate("(chef)", { screen: "home" });
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
            fontFamily: "nunito-bold",
            textAlign: "center",
            color: "#A9411D",
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
              {t('signup')}
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
              {t('login')}
            </Text>
          )}

        </TouchableOpacity>
      </View>
      <TouchableOpacity disabled={isCheckingUser} onPress={() => navigation.navigate("(tabs)", { screen: "home" })} style={{ alignItems: 'center', marginTop: 10, position: 'absolute', bottom: 10, }}>
        <Text style={{ textDecorationLine: 'underline', }}>{t('continueAsGuest')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
