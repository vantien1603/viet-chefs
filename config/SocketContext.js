// context/SocketContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const WEB_SOCKET_ENDPOINT = 'https://vietchef-api.myddns.me/ws';
  const { user } = useContext(AuthContext);
  const [client, setClient] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    if (!user || !user?.sub) {
      console.log('No user, skipping STOMP connection');
      return;
    }

    const socket = new SockJS(WEB_SOCKET_ENDPOINT);
    const stompClient = Stomp.over(socket);

    stompClient.reconnectDelay = 5000;
    stompClient.debug = () => { };

    stompClient.connect(
      {
        Authorization: `Bearer ${user?.token}`
      },
      () => {
        console.log('STOMP connected');

        const destination = `/user/${user?.sub}/queue/notifications`;
        const subscription = stompClient.subscribe(destination, (message) => {
          try {
            const data = JSON.parse(message.body);
            console.log("Received WS data:", data);
            setLastMessage(data);
          } catch (err) {
            console.error('Message parse error:', err);
          }
        });

        stompClient.subscription = subscription;
      },
      (err) => {
        console.error('STOMP error:', err);
      }
    );

    setClient(stompClient);

    return () => {
      if (stompClient && stompClient.connected) {
        if (stompClient.subscription) {
          stompClient.subscription.unsubscribe();
        }
        stompClient.disconnect(() => console.log('STOMP disconnected'));
      }
      setClient(null);
      setLastMessage(null);
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ client, lastMessage }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
