import React, { createContext, useState, useEffect } from "react";
import * as Network from "expo-network";

export const NetworkContext = createContext();

export const NetworkProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const checkNetwork = async () => {
      const networkState = await Network.getNetworkStateAsync();
      setIsConnected(networkState.isInternetReachable);
    };

    checkNetwork(); 

    const interval = setInterval(checkNetwork, 5000);

    return () => clearInterval(interval); 
  }, []);

  return (
    <NetworkContext.Provider value={{ isConnected }}>
      {children}
    </NetworkContext.Provider>
  );
};
