import { View, Text, Image, TouchableOpacity } from 'react-native'
import React from 'react'
import * as WebBrowser from 'expo-web-browser'
import { router } from 'expo-router'
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';


export const useWarmUpBrowser = () => {
  React.useEffect(() => {

    void WebBrowser.warmUpAsync()
    return () => {
      void WebBrowser.coolDownAsync()
    }
  }, [])
}

WebBrowser.maybeCompleteAuthSession()

export default function WelcomeScreen() {
  const navigation = useNavigation();

  const handleLogin = () => {
    // router.push('screen/login');
    router.push('screen/Booking/booking');
    // router.push('screen/Cart/cart');
  }




  return (
    <SafeAreaView style={
      {
        height: '100%',
        alignItems: 'center',
        backgroundColor: '#EBE5DD',
        justifyContent: 'center',
      }
    }>

      <Text style={{
        fontSize: 30,
        fontWeight: 'bold',
        marginLeft: 15,
        marginRight: 15,
        fontFamily: 'nunito',
        color: '#A9411D',
        textAlign: 'center',
      }}>Welome</Text>
      <View style={{ alignItems: 'center' }}>
        <Image
          source={require('../assets/images/logo.png')}
          style={{ width: 400, height: 250 }}
          resizeMode="cover"
        />
        <Text style={{
          marginTop: 25,
          fontSize: 35,
          fontWeight: 'bold',
          textAlign: 'center',
          color: '#A9411D',
          fontFamily: 'nunito-bold',
        }}>
          VIỆT CHEFS
        </Text>

      </View>


      <View >
        <TouchableOpacity onPress={() => router.push('screen/signup')} style={{
          padding: 13,
          marginTop: 40,
          backgroundColor: '#383737',
          borderRadius: 50,
          borderWidth: 2,
          borderColor: '#383737',
          width: 300,
        }}>
          <Text style={{
            textAlign: 'center',
            fontSize: 18,
            color: '#fff',
            fontFamily: 'nunito-bold',
          }}>SIGN UP</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogin} style={{
          padding: 13,
          marginTop: 10,
          borderWidth: 2,
          borderColor: '#383737',
          borderRadius: 50,
          width: 300,
        }}>
          <Text style={{
            textAlign: 'center',
            fontSize: 18,
            color: '#383737',
            fontFamily: 'nunito-bold',
          }}>LOGIN</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  )
}