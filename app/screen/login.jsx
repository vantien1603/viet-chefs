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
import { WebView } from "react-native-webview";
import { Modal } from "react-native";
import * as SecureStore from "expo-secure-store";



WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigation = useNavigation();
  const { user, login, loading, loginWithGoogle, handleGoogleRedirect } = useContext(AuthContext);
  const modalRef = useRef(null);
  const [loadingA, setLoadingA] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);
  const webViewRef = useRef(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [oauthUrl, setOauthUrl] = useState(null);

  useEffect(() => {
    if (user?.token !== undefined && !hasNavigated && !loading) {
      if (user?.roleName === "ROLE_CHEF") {
        console.log("????")
        navigation.navigate("(chef)", { screen: "home" })
      }
    } else if (user?.roleName === "ROLE_CUSTOMER") {
      navigation.navigate("(tabs)", { screen: "home" });
    }
    setHasNavigated(true);

  }, [user, hasNavigated, loading])

  const [expoToken, setExpoToken] = useState('');

  useEffect(() => {
    const getToken = async () => {
      const token = await AsyncStorage.getItem("expoPushToken");
      setExpoToken(token);
    };
    getToken();
  }, []);
  const handleLogin = async () => {
    // if (usernameOrEmail.trim().length === 0 || password.trim().length === 0) {
    //   modalRef.current.open();
    //   return;
    // }
    console.log('cc');
    setLoadingA(true);
    console.log("toi day ne")
    const token = await SecureStore.getItemAsync('expoPushToken');

    const result = await login(usernameOrEmail, password, token);
    if (result) {
      console.log("login roiiiii", result);
      if (result?.roleName === "ROLE_CHEF") {
        console.log("????")
        navigation.navigate("(chef)", { screen: "home" })
      }
    } else if (result?.roleName === "ROLE_CUSTOMER") {
      console.log("gi vay troi")
      navigation.navigate("(tabs)", { screen: "home" });
    }
    // }
    else {
      console.log("result", result)
      if (axios.isCancel(error)) {
        console.log("Yêu cầu đã bị huỷ do không có mạng.");
        return;
      }
      if (modalRef.current) {
        modalRef.current.open();
      }
      // console.log('Login Failed', 'Invalid username or password');
    }
    setLoadingA(false);
  };

  const signinWithGoogle = async () => {
    try {
      setGoogleLoading(true);
      const { oauthUrl } = await loginWithGoogle();
      setOauthUrl(oauthUrl);
      // setErrorMessage(null);
    } catch (error) {
      console.error("Google sign-in error:", error);
      // setErrorMessage(t("googleSignInFailed"));
    } finally {
      setGoogleLoading(false);
    }
  };

  // Hàm đóng WebView
  const closeWebView = () => {
    setOauthUrl(null);
    // setErrorMessage(null);
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
      // setErrorMessage(t("googleSignInFailed"));
      setOauthUrl(null);
    }
    webViewRef.current?.stopLoading();
  };

  return (
    <GestureHandlerRootView style={commonStyles.containerContent}>
      <SafeAreaView >
        <TouchableOpacity onPress={() => navigation.navigate('index')}>
          <View style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            justifyContent: "center",
            alignItems: "center",
          }}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </View>
        </TouchableOpacity>

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
            onPress={() => handleLogin()}
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

          <TouchableOpacity
            onPress={() => signinWithGoogle()}
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
              // setErrorMessage(t("webviewError"));
              setOauthUrl(null);
            }}
          />
        </View>
      </Modal>

    </GestureHandlerRootView>
  );
}
