import React, { useContext } from "react";
import { View, Text, StyleSheet } from "react-native";
import { NetworkContext } from "../hooks/networkProvider";

const NetworkAlert = () => {
  const { isConnected } = useContext(NetworkContext);

  if (isConnected) return null; 

  return (
    <View style={styles.container}>
      <Text style={styles.text}>⚠️ No internet connected</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0, 
    left: 0,
    right: 0,
    backgroundColor: "red",
    padding: 10,
    alignItems: "center",
    zIndex: 9999, 
  },
  text: {
    color: "white",
    fontWeight: "bold",
  },
});

export default NetworkAlert;
