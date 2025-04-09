import { View, Text, Image, TouchableOpacity } from 'react-native'
import React, { useContext, useEffect } from 'react'
import * as WebBrowser from 'expo-web-browser'
import { Redirect, router } from 'expo-router'
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../config/AuthContext';

export default function WelcomeScreen() {
  const navigation = useNavigation();

  const handleLogin = () => {
    router.push("screen/login");
    // router.push('screen/selectFood');
    // router.push('screen/Cart/cart');
    // router.push('screen/map')
    // router.push('screen/Chefs/menu');
  };

  const { user } = useContext(AuthContext);
  // console.log(user);
  // if (!user) {
  //   console.log("AuthContext is not provided");
  //   // return;
  // }


  useEffect(() => {
    console.log('User:', user);
    if (user) {
      // return <Redirect href="/home" />;
      navigation.navigate("(tabs)", { screen: "home" });
    }
  }, [user]);


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
      <TouchableOpacity onPress={() => navigation.navigate("(tabs)", { screen: "home" })} style={{ alignItems: 'center', marginTop: 10, position: 'absolute', bottom: 10, }}>
        <Text style={{ textDecorationLine: 'underline', }}>Continue as guest</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
