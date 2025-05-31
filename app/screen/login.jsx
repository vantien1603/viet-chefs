import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigation } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { PasswordInput } from "../../components/PasswordInput/passwordInput"; // Ensure correct path
import { commonStyles } from "../../style";
import * as WebBrowser from "expo-web-browser";
import { AuthContext } from "../../config/AuthContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Modalize } from "react-native-modalize";
import { Ionicons } from "@expo/vector-icons";
import { t } from "i18next";
import { WebView } from "react-native-webview";
import { Modal } from "react-native";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import * as SecureStore from "expo-secure-store";
import useActionCheckNetwork from "../../hooks/useAction";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useAxios from "../../config/AXIOS_API";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigation = useNavigation();
  const { user, login, loading, setUser, setIsGuest, setChef } = useContext(AuthContext);
  const modalRef = useRef(null);
  const [loadingA, setLoadingA] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);
  const webViewRef = useRef(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [oauthUrl, setOauthUrl] = useState(null);
  const requireNetwork = useActionCheckNetwork();
  const [errorMessage, setErrorMessage] = useState("");
  const [modayKey, setModalKey] = useState(0);
  const axiosInstance = useAxios();


  useEffect(() => {
    if (user?.token !== undefined && !hasNavigated && !loading) {
      if (user?.roleName === "ROLE_CHEF") {
        console.log("????");
        navigation.navigate("(chef)", { screen: "home" });
      }
    } else if (user?.roleName === "ROLE_CUSTOMER") {
      navigation.navigate("(tabs)", { screen: "home" });
    }
    setHasNavigated(true);
  }, [user, hasNavigated, loading]);

  const saveDeviceToken = async (email, token) => {
    if (!email || !token) return;
    try {
      const encodedToken = encodeURIComponent(token);
      await axios.put(
        "https://vietchef-api.myddns.me/no-auth/save-device-token",
        null,
        {
          params: {
            email,
            token: encodedToken,
          },
        }
      );
      console.log("Device token saved successfully");
    } catch (error) {
      showModal(
        t("modal.error"),
        t("errors.saveDeviceTokenFailed"),
        "Failed"
      );
    }
  };

  const handleLogin = async () => {
    if (usernameOrEmail.trim().length === 0 || password.trim().length === 0) {
      modalRef.current.open();
      setErrorMessage(t('errors.loginFailedMessage'));
      return;
    }
    setLoadingA(true);
    setErrorMessage("");
    const token = await SecureStore.getItemAsync("expoPushToken");
    console.log("token luc login", token);
    const result = await login(usernameOrEmail, password, token);
    console.log("reas asd", result);
    if (result != null && result.error === undefined) {
      if (result?.roleName === "ROLE_CHEF") {
        // await fetchChef(result.chefId);
        navigation.navigate("(chef)", { screen: "home" });
      } else if (result?.roleName === "ROLE_CUSTOMER") {
        navigation.navigate("(tabs)", { screen: "home" });
      }
    } else {
      setErrorMessage(result?.error || t('loginFailedMessage'));
      setModalKey(pre => pre + 1);
      setTimeout(() => {
        if (modalRef.current) {
          modalRef.current.open();
        }
      }, 100)

    }
    setLoadingA(false);
  };


  // const fetchChef = async (id) => {
  //   try {
  //     const response = await axiosInstance.get(`/chefs/${id}`);
  //     if (response.status === 200) setChef(response.data);
  //   } catch (error) {
  //     if (axios.isCancel(error)) return;
  //   }
  // }



  const signinWithGoogle = async () => {
    try {
      setGoogleLoading(true);
      const response = await axios.get(
        "https://vietchef-api.myddns.me/no-auth/oauth-url",
        {
          params: { provider: "google" },
        }
      );

      const url = response.data.url;
      if (url) {
        setOauthUrl(url);
      }
    } catch (error) {
      console.error("Lỗi khi gọi API OAuth:", error?.response);
      showModal(
        t("modal.error"),
        t("errors.googleLoginFailed"),
        "Failed"
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const closeWebView = () => {
    setOauthUrl(null);
  };

  const handleNavigationStateChange = async (navState) => {
    const url = navState.url;

    if (
      // url.startsWith("https://vietchef-api.myddns.me/no-auth/oauth-redirect")
      url.startsWith("https://vietchef-api.ddns.net/no-auth/oauth-redirect")
    ) {
      const params = new URLSearchParams(url.split("?")[1]);
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      const fullName = params.get("full_name");
      if (access_token && refresh_token) {
        SecureStore.setItemAsync("refreshToken", refresh_token);
        const decoded = jwtDecode(access_token);
        const decodedFullName = fullName
          ? decodeURIComponent(fullName)
          : "Unknown";
        setUser({
          fullName: decodedFullName,
          token: access_token,
          ...decoded,
        });
        const token = await SecureStore.getItemAsync("expoPushToken");
        await saveDeviceToken(decoded?.sub, token);
        setOauthUrl(null);
        setIsGuest(false);
        navigation.navigate("(tabs)", { screen: "home" });
      }

      webViewRef.current?.stopLoading();
    }
  };

  const handleOauthRedirect = async (url) => {
    try {
      const params = new URLSearchParams(url.split("?")[1]);
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      const fullName = params.get("full_name");

      if (access_token && refresh_token) {
        await SecureStore.setItemAsync("refreshToken", refresh_token);
        const decoded = jwtDecode(access_token);
        const decodedFullName = fullName
          ? decodeURIComponent(fullName)
          : "Unknown";

        setUser({
          fullName: decodedFullName,
          token: access_token,
          ...decoded,
        });

        const expoPushToken = await SecureStore.getItemAsync("expoPushToken");
        await saveDeviceToken(decoded?.sub, expoPushToken);

        setOauthUrl(null); // đóng WebView
        setIsGuest(false);
        navigation.navigate("(tabs)", { screen: "home" });
      }
    } catch (err) {
      console.error("OAuth redirect error:", err);
    }
  };

  const handleNavigationRequest = (request) => {
    const url = request.url;

    if (url.startsWith("https://vietchef-api.ddns.net/no-auth/oauth-redirect")) {
      // ✅ xử lý ngoài hàm này
      setTimeout(() => {
        handleOauthRedirect(url);
      }, 0);

      return false; // ❗ Quan trọng: chặn WebView load URL này
    }

    return true;
  };




  return (
    <GestureHandlerRootView style={commonStyles.container}>
      <ScrollView
        style={commonStyles.containerContent}
        contentContainerStyle={{ paddingBottom: 50 }}
      >
        <TouchableOpacity onPress={() => navigation.navigate("index")}>
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="arrow-back" size={24} color="black" />
          </View>
        </TouchableOpacity>

        <Text style={commonStyles.subTitleText}>{t("loginToAccount")} </Text>
        <Image
          source={require("../../assets/images/logo.png")}
          style={{ width: 400, height: 250 }}
          resizeMode="cover"
        />
        <Text style={commonStyles.titleText}>VIET CHEF</Text>
        <TextInput
          style={commonStyles.input}
          placeholder={t("usernameOrEmail")}
          placeholderTextColor="#968B7B"
          value={usernameOrEmail}
          onChangeText={setUsernameOrEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <PasswordInput placeholder={t('password')} onPasswordChange={setPassword} />
        <View
          style={{ marginBottom: 10, marginTop: -5, alignItems: "flex-end" }}
        >
          <TouchableOpacity
            onPress={() => navigation.navigate("screen/forgot")}
          >
            <Text style={{ color: "#968B7B", fontFamily: "nunito-regular" }}>{t('forgot')}</Text>
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
            disabled={loadingA}
          >
            {loadingA ? (
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
                  {t("signInWithGoogle")}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modalize ref={modalRef} adjustToContentHeight key={modayKey}>
        <View
          style={{
            paddingVertical: 20,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontSize: 18,
              marginBottom: 10,
              textAlign: "center",
              fontFamily: "nunito-bold",
            }}
          >
            {t("loginFailed")}
          </Text>
          <Ionicons name="close-circle" size={60} color="red" />
          <Text style={{ fontSize: 16, marginBottom: 10, textAlign: "center" }}>
            {/* {t('loginFailedMessage')} */}
            {errorMessage}
          </Text>
          <TouchableOpacity
            style={{
              padding: 5,
              marginTop: 10,
              borderWidth: 1,
              backgroundColor: "#383737",
              borderColor: "#383737",
              borderRadius: 50,
              width: "50%",
            }}
            onPress={() => modalRef.current?.close()}
          >
            <Text style={{ textAlign: "center", fontSize: 16, color: "#fff", fontFamily: "nunito-regular" }}>
              {t("tryAgain")}
            </Text>
          </TouchableOpacity>
        </View>
      </Modalize>

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
            // onNavigationStateChange={handleNavigationStateChange}
            onShouldStartLoadWithRequest={handleNavigationRequest}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn("WebView error: ", nativeEvent);
              setOauthUrl(null);
            }}
          />
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
}
