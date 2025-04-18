import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import React, { useContext, useEffect } from 'react';
import { Redirect, router } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../config/AuthContext';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location'; // Import Expo Location

export default function WelcomeScreen() {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const setupPermissions = async () => {
      // Step 1: Check if permissions have already been requested
      const hasRequestedPermissions = await AsyncStorage.getItem('hasRequestedPermissions');
      if (hasRequestedPermissions === 'true') {
        console.log('Permissions already requested, skipping prompts.');
        return;
      }

      // Step 2: Setup Notifications
      await setupNotifications();

      // Step 3: Setup Location Permissions after Notifications
      await setupLocationPermissions();

      // Step 4: Set flag to avoid future prompts
      await AsyncStorage.setItem('hasRequestedPermissions', 'true');
    };

    setupPermissions();
  }, []);

  const setupNotifications = async () => {
    // Kiểm tra xem có phải thiết bị thật không
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return;
    }

    // Yêu cầu quyền thông báo
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert('Failed to get push token for push notification!');
      return;
    }

    // Lấy token
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Expo Push Token:', token);
    await AsyncStorage.setItem('expoPushToken', token);

    // Cấu hình xử lý thông báo khi app đang chạy
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    // Lắng nghe thông báo khi app ở foreground
    const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
      Alert.alert(
        'Thông báo nhận được!',
        notification.request.content.body || 'Có thông báo mới'
      );
    });

    // Lắng nghe khi người dùng tương tác với thông báo
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification clicked:', response);
    });

    // Cleanup
    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  };

  const setupLocationPermissions = async () => {
    // Yêu cầu quyền truy cập vị trí
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      Alert.alert(
        'Quyền truy cập vị trí bị từ chối',
        'Ứng dụng cần quyền truy cập vị trí để hoạt động chính xác. Vui lòng cấp quyền trong cài đặt.'
      );
      return;
    }

    // Optionally, request background location permissions if needed
    // const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    // if (backgroundStatus !== 'granted') {
    //   Alert.alert(
    //     'Quyền truy cập vị trí nền bị từ chối',
    //     'Ứng dụng có thể cần quyền truy cập vị trí nền để cung cấp các tính năng tốt hơn.'
    //   );
    //   return;
    // }

    console.log('Location permissions granted');
    // Optionally, you can get the current location here if needed
    // const location = await Location.getCurrentPositionAsync({});
    // console.log('Current location:', location);
  };

  const handleLogin = () => {
    router.push('screen/login');
  };

  useEffect(() => {
    console.log('User:', user);
    if (user) {
      navigation.navigate('(tabs)', { screen: 'home' });
    }
  }, [user]);

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