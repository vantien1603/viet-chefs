import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrapAsync = async () => {
      const refresh_token = await SecureStore.getItemAsync('refreshToken');
      if (refresh_token) {
        // try {
        //   const response = await axios.post('https://example.com/api/refresh', { refresh_token });
        //   setUser({ token: response.data.accessToken });
        // } catch (error) {
        //   console.log('Không thể refresh token:', error);
        // }
      }
      setLoading(false);
    };
    bootstrapAsync();
  }, []);

  const login = async (username, password) => {
    try {
      console.log("jjjjjj");
      const loginPayload = {
        usernameOrEmail: username,
        password: password,
      };
      const response = await axios.post('http://192.168.1.34:8080/no-auth/login', loginPayload);
      console.log(response.data);
      const { access_token, refresh_token } = response.data;
      console.log(access_token);
      console.log(refresh_token);
      await SecureStore.setItemAsync('refreshToken', refresh_token);
      setUser({ token: access_token });
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('refreshToken');
    setUser(null);
  };

  if (loading) {
    return null; // Hoặc hiển thị Splash Screen
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
