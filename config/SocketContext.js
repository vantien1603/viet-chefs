// context/SocketContext.js
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
// import Toast from 'react-native-toast-message';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const WEB_SOCKET_ENDPOINT = 'https://vietchef-api.ddns.net/ws';
  const [client, setClient] = useState(null);
  const { user } = useContext(AuthContext);
  const [notificationCallbacks, setNotificationCallbacks] = useState([]);
  const callbackRef = useRef([]);

  const registerNotificationCallback = (callback) => {
  callbackRef.current.push(callback);

  return () => {
    callbackRef.current = callbackRef.current.filter((cb) => cb !== callback);
  };
};


  useEffect(() => {
    if (!user || !user.sub) {
      console.log('No user, skipping STOMP connection');
      return;
    }

    console.log('User:', user);
    console.log('Subscribing to queue:', `/user/${user.sub}/queue/notifications`);

    const socket = new SockJS(WEB_SOCKET_ENDPOINT);
    const stompClient = Stomp.over(socket);

    stompClient.reconnectDelay = 5000;

    stompClient.connect(
      {}, // Add Authorization header if needed
      () => {
        console.log('STOMP connected');

        const subscription = stompClient.subscribe(
          `/user/${user.sub}/queue/notifications`,
          (message) => {
            try {
              const data = JSON.parse(message.body);
              console.log("data", data);
              callbackRef.current.forEach((cb) => cb(data));
            } catch (error) {
              console.error('Error parsing message:', error);
            }
          }
        );

        stompClient.subscription = subscription;
      },
      (error) => {
        console.error('STOMP connection error:', error);
      }
    );

    setClient(stompClient);

    return () => {
      if (stompClient && stompClient.connected) {
        if (stompClient.subscription) {
          stompClient.subscription.unsubscribe();
        }
        stompClient.disconnect(() => {
          console.log('STOMP disconnected');
        });
      }
      setNotificationCallbacks([]);
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ client, registerNotificationCallback }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);