import { View, Text, TextInput, Image, TouchableOpacity } from "react-native";
import React, { useContext, useEffect, useState } from "react";
import { useNavigation } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { PasswordInput } from "../../components/PasswordInput/passwordInput"; // Đảm bảo đúng đường dẫn
import { commonStyles } from "../../style";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AXIOS_BASE from "../../config/AXIOS_BASE";
import { jwtDecode } from "jwt-decode";
import { AuthContext } from "../../config/AuthContext";

const webClientId = "522049129852-f9fc597s3c9tqbs9djr5sd94vcdpugmr.apps.googleusercontent.com";
const iosClientId = "522049129852-21i7b2j5hlf06unknf0i6q5qpk4enln4.apps.googleusercontent.com";
const androidClientId = "522049129852-dkq8qejqaao9o73hble1e1pv5m43at5g.apps.googleusercontent.com";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [token, setToken] = useState("");
  const [userInfo, setUserInfo] = useState(null);
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigation = useNavigation();
  const { user, login } = useContext(AuthContext);

  const config = { webClientId, iosClientId, androidClientId };
  const [request, response, promptAsync] = Google.useAuthRequest(config);

  if (user) {
    console.log("Đã đăng nhập");
  }

  useEffect(() => {
    checkLoginStatus();
  }, []);

  useEffect(() => {
    handleSignInWithGoogle();
  }, [response, token]);

  async function checkLoginStatus() {
    const storedToken = await AsyncStorage.getItem("@token");
    const expiresAt = await AsyncStorage.getItem("@expiresAt");

    if (!storedToken || !expiresAt || new Date().getTime() > parseInt(expiresAt)) {
      // Token hết hạn -> Đăng xuất
      await AsyncStorage.removeItem("@token");
      await AsyncStorage.removeItem("@userId");
      await AsyncStorage.removeItem("@fullName");
      await AsyncStorage.removeItem("@expiresAt");
      navigation.navigate("screen/login");
    }
  }

  async function handleSignInWithGoogle() {
    const user = await getLocalUser();
    if (!user) {
      if (response?.type === "success") {
        await getUserInfo(response?.authentication?.accessToken);
      }
    } else {
      setUserInfo(user);
      console.log("Loaded locally");
    }
  }

  const getLocalUser = async () => {
    const data = await AsyncStorage.getItem("@user");
    if (!data) return null;
    return JSON.parse(data);
  };

  const getUserInfo = async () => {
    if (!token) return;
    try {
      const response = await fetch("https://www.googleapis.com/oauth2/v1/userinfo?alt=json", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const user = await response.json();
      await AsyncStorage.setItem("@user", JSON.stringify(user));
      setUserInfo(user);
    } catch (error) {
      console.log("Lỗi khi lấy thông tin người dùng", error);
    }
  };

  const handleLogin = async () => {
    const loginPayload = { usernameOrEmail, password };

    try {
      const response = await AXIOS_BASE.post("/login", loginPayload);
      if (response.status === 200) {
        const token = response.data.access_token;
        const decodedToken = jwtDecode(token);
        const userId = decodedToken.userId;
        const fullName = response.data.fullName;

        // Lưu token với thời gian hết hạn 10 ngày
        const expiresAt = new Date().getTime() + 10 * 24 * 60 * 60 * 1000; // 10 ngày

        await AsyncStorage.setItem("@token", token);
        await AsyncStorage.setItem("@userId", userId);
        await AsyncStorage.setItem("@fullName", fullName);
        await AsyncStorage.setItem("@expiresAt", expiresAt.toString());

        console.log("User:", fullName);
        console.log("Access token:", token);
        navigation.navigate("(tabs)", { screen: "home" });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      console.log("Login failed", errorMessage);
    }
  };

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Text style={commonStyles.subTitleText}>Login to your account to use...</Text>
      <Image source={require("../../assets/images/logo.png")} style={{ width: 400, height: 250 }} resizeMode="cover" />
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
      <View style={{ flex: 1, alignItems: "center" }}>
        <TouchableOpacity
          onPress={handleLogin}
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
          <Text style={{ textAlign: "center", fontSize: 18, color: "#fff", fontFamily: "nunito-bold" }}>
            Đăng nhập
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
