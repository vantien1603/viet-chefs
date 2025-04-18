import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from "react-native";
import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigation } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { PasswordInput } from "../../components/PasswordInput/passwordInput";
import { commonStyles } from "../../style";
import * as WebBrowser from "expo-web-browser";
import { AuthContext } from "../../config/AuthContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import useActionCheckNetwork from "../../hooks/useAction";
import { t } from "i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WebView } from "react-native-webview";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [oauthUrl, setOauthUrl] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const navigation = useNavigation();
  const { user, login, loginWithGoogle, handleGoogleRedirect } = useContext(AuthContext);
  const requireNetwork = useActionCheckNetwork();
  const [expoToken, setExpoToken] = useState(null);
  const webViewRef = useRef(null);

  // Lấy token từ AsyncStorage
  useEffect(() => {
    const getToken = async () => {
      const token = await AsyncStorage.getItem("expoPushToken");
      console.log("✅ Token lấy từ AsyncStorage:", token);
      setExpoToken(token);
    };
    getToken();
  }, []);

  // Chuyển hướng nếu đã đăng nhập
  useEffect(() => {
    if (user?.token) {
      console.log("Đã đăng nhập:", user);
      navigation.navigate("(tabs)", { screen: "home" });
    }
  }, [user]);

  // Hàm đăng nhập thông thường
  const handleLogin = async () => {
    if (usernameOrEmail.trim().length === 0 || password.trim().length === 0) {
      setErrorMessage(t("checkAccountOrPassword"));
      return;
    }
    setLoading(true);
    const result = await login(usernameOrEmail, password, expoToken);
    if (result === true) {
      navigation.navigate("(tabs)", { screen: "home" });
    } else {
      setErrorMessage(t("checkAccountOrPassword"));
    }
    setLoading(false);
  };

  // Hàm đăng nhập bằng Google
  const signinWithGoogle = async () => {
    try {
      setGoogleLoading(true);
      const { oauthUrl } = await loginWithGoogle();
      setOauthUrl(oauthUrl);
      setErrorMessage(null);
    } catch (error) {
      console.error("Google sign-in error:", error);
      setErrorMessage(t("googleSignInFailed"));
    } finally {
      setGoogleLoading(false);
    }
  };

  // Hàm đóng WebView
  const closeWebView = () => {
    setOauthUrl(null);
    setErrorMessage(null);
  };

  const handleNavigationStateChange = async (navState) => {
    const url = navState.url;
    try {
      const result = await handleGoogleRedirect(url);
      if (result.success) {
        setOauthUrl(null);
        navigation.navigate("(tabs)", { screen: "home" });
      }
    } catch (error) {
      setErrorMessage(t("googleSignInFailed"));
      setOauthUrl(null);
    }
    webViewRef.current?.stopLoading();
  };

  return (
    <GestureHandlerRootView style={commonStyles.containerContent}>
      <SafeAreaView style={{ flex: 1 }}>
        <Text style={commonStyles.subTitleText}>{t("loginToUse")}</Text>
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
        <View
          style={{
            marginBottom: 10,
            marginTop: -5,
            alignItems: "flex-end",
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.navigate("screen/forgot")}
          >
            <Text style={{ color: "#968B7B" }}>{t("forgot")}</Text>
          </TouchableOpacity>
        </View>
        {errorMessage && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginVertical: 10,
            }}
          >
            <Ionicons name="close-circle" size={30} color="red" />
            <Text
              style={{
                fontSize: 16,
                color: "red",
                marginLeft: 10,
                textAlign: "center",
              }}
            >
              {errorMessage}
            </Text>
          </View>
        )}
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
            disabled={loading || googleLoading}
          >
            {loading ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <Text
                style={{
                  textAlign: "center",
                  fontSize: 18,
                  color: "#fff",
                  fontFamily: "nunito-bold",
                }}
              >
                {t("login")}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => requireNetwork(() => signinWithGoogle())}
            style={{
              padding: 13,
              marginTop: 10,
              borderWidth: 1,
              backgroundColor: "#fff",
              borderColor: "#383737",
              borderRadius: 50,
              width: 300,
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
            disabled={loading || googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator size="large" color="#000" />
            ) : (
              <>
                <Image
                  source={{
                    uri: "https://developers.google.com/identity/images/g-logo.png",
                  }}
                  style={{ width: 24, height: 24, marginRight: 10 }}
                />
                <Text
                  style={{
                    textAlign: "center",
                    fontSize: 18,
                    color: "#000",
                    fontFamily: "nunito-bold",
                  }}
                >
                  Sign in With Google
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      <Modal
        visible={!!oauthUrl}
        animationType="slide"
        onRequestClose={closeWebView}
      >
        <View style={{ flex: 1, backgroundColor: "#fff" }}>
          <TouchableOpacity
            onPress={closeWebView}
            style={{
              padding: 10,
              alignItems: "flex-end",
            }}
          >
            <Ionicons name="close" size={24} color="#A9411D" />
          </TouchableOpacity>
          <WebView
            ref={webViewRef}
            source={{ uri: oauthUrl }}
            style={{ flex: 1 }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
            startInLoadingState={true}
            renderLoading={() => (
              <ActivityIndicator size="large" color="#000" />
            )}
            onNavigationStateChange={handleNavigationStateChange}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn("WebView error: ", nativeEvent);
              setErrorMessage(t("webviewError"));
              setOauthUrl(null);
            }}
          />
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
}