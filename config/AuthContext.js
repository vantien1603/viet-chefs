import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import { doc, setDoc } from 'firebase/firestore';
import { database } from '../config/firebase';
import { useRouter } from 'expo-router';
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(true);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  useEffect(() => {
    const bootstrapAsync = async () => {
      const refresh_token = await SecureStore.getItemAsync('refreshToken');
      console.log("refresh token", refresh_token);
      
      if (refresh_token) {
        try {
          console.log("refresh token1", refresh_token);

          const response = await axios.post(
            'http://192.168.146.195:8080/no-auth/refresh-token',
            {},
            {
              headers: {
                'Authorization': `Bearer ${refresh_token}`
              }
            }
          );

          if (response.status === 200) {

            console.log("Duoc roif neennnnn")
            const { accessToken } = response.data;
            const decoded = jwtDecode(accessToken);
            setUser({ token: accessToken, ...decoded });
            setIsGuest(false);
          }
        } catch (error) {
          console.log('Cannot refresh token:', error?.response?.data || error.message);
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
      // const response = await axios.post('http://192.168.146.195:8080/no-auth/login', loginPayload);
      const response = await axios.post('http://192.168.146.195:8080/no-auth/login', loginPayload);
      if (response.status === 200) {
        console.log("auth", response.data);
        const { access_token, refresh_token } = response.data;
        await SecureStore.setItemAsync('refreshToken', refresh_token);
        const decoded = jwtDecode(access_token);
        console.log("decode", decoded);
        console.log("userID", decoded.userId);
        setUser({ fullName: response.data.fullName, token: access_token, ...decoded });
        setIsGuest(false);
        if (decoded) {
          const userDocRef = doc(database, 'users', decoded.userId);
          await setDoc(userDocRef, {
            _id: decoded.userId,
            name: response.data.fullName,
            avatar: 'https://i.pravatar.cc/300',
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

  const logout = async () => {
    await SecureStore.deleteItemAsync('refreshToken');
    setUser(null);
    setIsGuest(true);
    router.push("/");
  };

  if (loading) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, isGuest, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
