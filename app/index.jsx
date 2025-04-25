import { View, Text, Image, TouchableOpacity, Alert, Platform } from 'react-native';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../config/AuthContext';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

// Hàm đăng ký thông báo đẩy
async function registerForPushNotificationsAsync() {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert('Failed to get push token for push notification!');
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

export default function WelcomeScreen() {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);

  // State và ref cho thông báo
  const [expoPushToken, setExpoPushToken] = useState('');
  const [channels, setChannels] = useState([]);
  const [notification, setNotification] = useState();
  const notificationListener = useRef();
  const responseListener = useRef();

  // Hàm thiết lập thông báo
  const setupNotifications = async () => {
    try {
      // Đăng ký và lấy token
      const token = await registerForPushNotificationsAsync();
      if (token) {
        setExpoPushToken(token);
        await AsyncStorage.setItem('expoPushToken', token);
        console.log('Expo Push Token:', token);
      }

      // Lấy kênh thông báo cho Android
      if (Platform.OS === 'android') {
        const value = await Notifications.getNotificationChannelsAsync();
        setChannels(value ?? []);
      }

      // Cấu hình xử lý thông báo
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      // Làm sạch các subscription cũ
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }

      // Lắng nghe thông báo khi app ở foreground
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        setNotification(notification);
        Alert.alert(
          'Thông báo nhận được!',
          notification.request.content.body || 'Có thông báo mới'
        );
      });

      // Lắng nghe khi người dùng tương tác với thông báo
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification clicked:', response);
      });
    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  };

  // Hàm thiết lập quyền vị trí
  const setupLocationPermissions = async () => {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      Alert.alert(
        'Quyền truy cập vị trí bị từ chối',
        'Ứng dụng cần quyền truy cập vị trí để hoạt động chính xác.'
      );
      return;
    }
    console.log('Location permissions granted');
  };

  // Thiết lập permissions khi ứng dụng khởi động
  useEffect(() => {
    const setupPermissions = async () => {
      const hasRequestedPermissions = await AsyncStorage.getItem('hasRequestedPermissions');
      if (hasRequestedPermissions !== 'true') {
        await setupNotifications();
        await setupLocationPermissions();
        await AsyncStorage.setItem('hasRequestedPermissions', 'true');
      }
    };

    setupPermissions();

    // Cleanup khi component unmount
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Làm mới thông báo khi user thay đổi
  useEffect(() => {
    if (user) {
      setupNotifications(); // Làm mới token và subscription
      navigation.navigate('(tabs)', { screen: 'home' });
    }
  }, [user]);

  const handleLogin = () => {
    router.push('screen/login');
  };

  return (
    <SafeAreaView
      style={{
        height: '100%',
        alignItems: 'center',
        backgroundColor: '#EBE5DD',
        justifyContent: 'center',
      }}
    >
      <View style={{ alignItems: 'center' }}>
        <Image
          source={require('../assets/images/logo.png')}
          style={{ width: 400, height: 250 }}
          resizeMode='cover'
        />
        <Text
          style={{
            marginTop: 25,
            fontSize: 35,
            fontWeight: 'bold',
            textAlign: 'center',
            color: '#A9411D',
            fontFamily: 'nunito-bold',
          }}
        >
          VIỆT CHEFS
        </Text>
      </View>

      <View>
        <TouchableOpacity
          onPress={() => router.push('screen/signup')}
          style={{
            padding: 13,
            marginTop: 40,
            backgroundColor: '#383737',
            borderRadius: 50,
            borderWidth: 2,
            borderColor: '#383737',
            width: 300,
          }}
        >
          <Text
            style={{
              textAlign: 'center',
              fontSize: 18,
              color: '#fff',
              fontFamily: 'nunito-bold',
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
            borderColor: '#383737',
            borderRadius: 50,
            width: 300,
          }}
        >
          <Text
            style={{
              textAlign: 'center',
              fontSize: 18,
              color: '#383737',
              fontFamily: 'nunito-bold',
            }}
          >
            LOGIN
          </Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        onPress={() => navigation.navigate('(tabs)', { screen: 'home' })}
        style={{ alignItems: 'center', marginTop: 10, position: 'absolute', bottom: 10 }}
      >
        <Text style={{ textDecorationLine: 'underline' }}>Continue as guest</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}