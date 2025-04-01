import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import { doc, setDoc } from 'firebase/firestore';
import { database } from '../config/firebase';
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrapAsync = async () => {
      const refresh_token = await SecureStore.getItemAsync('refreshToken');
      if (refresh_token) {
        try {
          // const response = await axios.post('http://192.168.1.11:8080/no-auth/refresh', { refresh_token });
          // setUser({ token: response.data.accessToken });
        } catch (error) {
          console.log('Không thể refresh token:', error);
        }
      }
      setLoading(false);
    };
    bootstrapAsync();
  }, []);

  const login = async (username, password) => {
    try {
      const loginPayload = {
        usernameOrEmail: username,
        password: password,
      };
      const response = await axios.post('http://192.168.100.10:8080/no-auth/login', loginPayload);
      if (response.status === 200) {
        console.log("auth", response.data);
        const { access_token, refresh_token } = response.data;
        await SecureStore.setItemAsync('refreshToken', refresh_token);
        const decoded = jwtDecode(access_token);
        console.log("decode", decoded);
        console.log("userID", decoded.userId);
        setUser({ fullName: response.data.fullName, token: access_token, ...decoded });
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
  };

  if (loading) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
