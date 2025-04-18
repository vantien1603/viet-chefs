import React, { createContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { doc, setDoc } from "firebase/firestore";
import { database } from "../config/firebase";
import { useRouter } from "expo-router";
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(true);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  useEffect(() => {
    const bootstrapAsync = async () => {
      const refresh_token = await SecureStore.getItemAsync("refreshToken");
      console.log("refresh token", refresh_token);

      if (refresh_token) {
        try {
          console.log("refresh token1", refresh_token);

          const response = await axios.post(
            "http://35.240.147.10/no-auth/refresh-token",
            {},
            {
              headers: {
                Authorization: `Bearer ${refresh_token}`,
              },
            }
          );

          if (response.status === 200) {
            console.log("Duoc roif neennnnn");
            const { access_token } = response.data;
            const decoded = jwtDecode(access_token);
            setUser({
              fullName: response.data.fullName,
              token: access_token,
              ...decoded,
            });
            setIsGuest(false);
          }
        } catch (error) {
          console.log(
            "Cannot refresh token:",
            error?.response?.data || error.message
          );
        }
      }
      setLoading(false);
    };

    bootstrapAsync();
  }, []);

  const login = async (username, password, expoToken) => {
    try {
      console.log("expo", expoToken);
      const loginPayload = {
        usernameOrEmail: username,
        password: password,
        expoToken: expoToken,
      };
      // const response = await axios.post('http://35.240.147.10/no-auth/login', loginPayload);
      const response = await axios.post(
        "http://35.240.147.10/no-auth/login",
        loginPayload
      );
      console.log(response);
      if (response.status === 200) {
        console.log("auth", response.data);
        const { access_token, refresh_token } = response.data;
        await SecureStore.setItemAsync("refreshToken", refresh_token);
        const decoded = jwtDecode(access_token);
        console.log("decode", decoded);
        console.log("userID", decoded.userId);
        setUser({
          fullName: response.data.fullName,
          token: access_token,
          ...decoded,
        });
        setIsGuest(false);
        if (decoded) {
          const userDocRef = doc(database, "users", decoded.userId);
          await setDoc(userDocRef, {
            _id: decoded.userId,
            name: response.data.fullName,
            avatar: "https://i.pravatar.cc/300",
          });
        }
        return true;
      }
      // const response = await axios.post('http://192.168.1.52:8080/no-auth/login', loginPayload);
    } catch (error) {
      // if (error.response) {
      //   console.error(`Lỗi ${error.response.status}:`, error.response.data);
      // }
      // else {
      //   console.error(error.message);
      // }
      return false;
    }
  };

  const loginWithGoogle = async () => {
    try {
      // Gọi API /oauth-url để lấy URL OAuth
      const response = await axios.get("http://vietchef.ddns.net/no-auth/oauth-url", {
        params: { provider: "google" },
      });

      const oauthUrl = response.data.url;
      if (!oauthUrl) {
        throw new Error("Failed to get OAuth URL");
      }

      return { oauthUrl }; // Trả về URL để LoginScreen hiển thị WebView
    } catch (error) {
      console.error("Error fetching Google OAuth URL:", error?.response?.data || error.message);
      throw error; // Ném lỗi để LoginScreen xử lý
    }
  };

  const handleGoogleRedirect = async (url) => {
    try {
      if (!url.startsWith("http://vietchef.ddns.net/no-auth/oauth-redirect")) {
        return { success: false };
      }

      const params = new URLSearchParams(url.split("?")[1]);
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      const fullName = params.get("full_name");

      console.log("Access Token:", access_token);
      console.log("Refresh Token:", refresh_token);
      console.log("Full Name:", fullName);

      if (!access_token || !refresh_token) {
        throw new Error("Missing access_token or refresh_token");
      }

      // Lưu token vào AsyncStorage và SecureStore
      // await AsyncStorage.setItem("access_token", access_token);
      // await AsyncStorage.setItem("refresh_token", refresh_token);
      // await AsyncStorage.setItem("fullName", fullName || "");
      setUser({
        fullName,
        token: access_token,
      });
      await SecureStore.setItemAsync("refreshToken", refresh_token);

      // Cập nhật user state
      const decoded = jwtDecode(access_token);
      setUser({
        fullName: fullName || "",
        token: access_token,
        ...decoded,
      });
      setIsGuest(false);

      // Lưu thông tin user vào Firestore
      if (decoded) {
        const userDocRef = doc(database, "users", decoded.userId);
        await setDoc(userDocRef, {
          _id: decoded.userId,
          name: fullName || "",
          avatar: "https://i.pravatar.cc/300",
        });
      }

      return { success: true };
    } catch (error) {
      console.error("Error handling Google redirect:", error?.response?.data || error.message);
      throw error;
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("refreshToken");
    setUser(null);
    setIsGuest(true);
    router.push("/");
  };

  if (loading) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, isGuest, login, loginWithGoogle, handleGoogleRedirect, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
