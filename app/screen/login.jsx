import { View, Text, TextInput, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigation } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { PasswordInput } from "../../components/PasswordInput/passwordInput"; // Ensure correct path
import { commonStyles } from "../../style";
import * as WebBrowser from "expo-web-browser";
import { AuthContext } from "../../config/AuthContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Modalize } from "react-native-modalize";
import { Ionicons } from '@expo/vector-icons';
import useActionCheckNetwork from "../../hooks/useAction";



WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigation = useNavigation();
  const { user, login, loading } = useContext(AuthContext);
  const modalRef = useRef(null);
  const [loadingA, setLoadingA] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);

  const requireNetwork = useActionCheckNetwork();

  useEffect(() => {
    if (user?.token !== undefined && !hasNavigated && !loading) {
      // console.log("login roiiiii", user);
      if (user?.roleName === "ROLE_CHEF") {
        console.log("????")
        navigation.navigate("(chef)", { screen: "dashboard" })
      }
    } else if (user?.roleName === "ROLE_CUSTOMER") {
      // console.log("gi vay troi")
      navigation.navigate("(tabs)", { screen: "home" });
    }
    setHasNavigated(true);

    // navigation.navigate("(tabs)", { screen: "home" });
  }, [user, hasNavigated, loading])

  const [expoToken, setExpoToken] = useState(null);

  useEffect(() => {
    const getToken = async () => {
      const token = await AsyncStorage.getItem("expoPushToken");
      setExpoToken(token);
    };
    getToken();
  }, []);
  const handleLogin = async () => {
    if (usernameOrEmail.trim().length === 0 || password.trim().length === 0) {
      modalRef.current.open();
      return;
    }
    console.log('cc');
    setLoadingA(true);
    console.log("toi day ne")
    const result = await login(usernameOrEmail, password, expoToken);
    // if (result === true) {
    // navigation.navigate("(tabs)", { screen: "home" });
    if (result ) {
      console.log("login roiiiii", result);
      if (result?.roleName === "ROLE_CHEF") {
        console.log("????")
        navigation.navigate("(chef)", { screen: "dashboard" })
      }
    } else if (result?.roleName === "ROLE_CUSTOMER") {
      console.log("gi vay troi")
      navigation.navigate("(tabs)", { screen: "home" });
    }
    // }
    else {console.log(result)
      if (modalRef.current) {
        modalRef.current.open();
      }
      // console.log('Login Failed', 'Invalid username or password');
    }
    setLoadingA(false);
  };

  return (
    <GestureHandlerRootView style={commonStyles.containerContent}>
      <SafeAreaView >
        <Text style={commonStyles.subTitleText}>
          Login to your account to use...
        </Text>
        <Image
          source={require("../../assets/images/logo.png")}
          style={{ width: 400, height: 250 }}
          resizeMode="cover"
        />
        <Text style={commonStyles.titleText}>VIET CHEFS</Text>
        <TextInput
          style={commonStyles.input}
          placeholder="Username or Email"
          placeholderTextColor="#968B7B"
          value={usernameOrEmail}
          onChangeText={setUsernameOrEmail}
        />
        <PasswordInput placeholder="Password" onPasswordChange={setPassword} />
        <View style={{ marginBottom: 10, marginTop: -5, alignItems: "flex-end" }}>
          <TouchableOpacity onPress={() => navigation.navigate("screen/forgot")}>
            <Text style={{ color: "#968B7B" }}>Forgot password?</Text>
          </TouchableOpacity>
        </View>
        <View style={{ alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => requireNetwork(() => handleLogin())}
            style={{
              padding: 13,
              marginTop: 10,
              borderWidth: 1,
              backgroundColor: "#383737",
              borderColor: "#383737",
              borderRadius: 50,
              width: 300,
            }}
          >
            {loadingA ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <Text style={{ textAlign: "center", fontSize: 18, color: "#fff", fontFamily: "nunito-bold" }}>
                Login
              </Text>
            )}

          </TouchableOpacity>
        </View>
      </SafeAreaView>
      <Modalize ref={modalRef} adjustToContentHeight>
        <View style={{ paddingVertical: 20, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 18, marginBottom: 10, fontWeight: "bold", textAlign: 'center' }}>Login failed</Text>
          <Ionicons name="close-circle" size={60} color="red" />
          <Text style={{ fontSize: 16, marginBottom: 10, textAlign: 'center' }}>Please check your account or password again.</Text>
          <TouchableOpacity
            style={{
              padding: 5,
              marginTop: 10,
              borderWidth: 1,
              backgroundColor: "#383737",
              borderColor: "#383737",
              borderRadius: 50,
              width: '50%',
            }}
            onPress={() => modalRef.current?.close()}
          >
            <Text style={{ textAlign: "center", fontSize: 16, color: "#fff" }}>
              Try again
            </Text>
          </TouchableOpacity>
        </View>
      </Modalize>

    </GestureHandlerRootView>
  );
}
