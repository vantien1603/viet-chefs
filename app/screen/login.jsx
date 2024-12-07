import { View, Text, TextInput, Image, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { useRouter, useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PasswordInput } from '../../components/PasswordInput/passwordInput'; // Đảm bảo đúng đường dẫn
import { commonStyles } from '../../style';
export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  // const router = useRouter();
  const navigation = useNavigation();

  const handleLogin = () => {
    // router.push('/screen/login'); // Sửa đường dẫn
    navigation.navigate('(tabs)', { screen: 'home' })
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
  };

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Text style={commonStyles.subTitleText}>Login to your account to use...</Text>
      <Image
        source={require('../../assets/images/logo.png')}
        style={{ width: 400, height: 250 }}
        resizeMode="cover"
      />
      <Text style={commonStyles.titleText}>
        VIET CHEFS
      </Text>
      <TextInput
        style={commonStyles.input}
        placeholder="Phone number"
        placeholderTextColor="#968B7B"
        keyboardType="numeric"
        value={phone}
        onChangeText={setPhone}
      />

      <PasswordInput
        placeholder="Password"
        onPasswordChange={handlePasswordChange}
      />
      <View style={{ marginBottom: 10, marginTop: -5, alignItems: 'flex-end' }}>
        <TouchableOpacity onPress={() => navigation.navigate('screen/forgot')}>
          <Text style={{ color: '#968B7B' }}>Forgot password ?</Text>
        </TouchableOpacity>
      </View>
 
      <View style={{ flex: 1, alignItems: 'center' }}>

        <TouchableOpacity onPress={handleLogin} style={{
          padding: 13,
          marginTop: 10,
          borderWidth: 1,
          backgroundColor: '#383737',
          borderColor: '#383737',
          borderRadius: 50,
          width: 300,
        }}>
          <Text style={{
            textAlign: 'center',
            fontSize: 18,
            color: '#fff',
            fontFamily: 'nunito-bold',
          }}>Đăng nhập</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
