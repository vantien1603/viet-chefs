import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";

const Header = ({ title, subtitle, onRightPress, rightIcon, rightText, onLeftPress }) => {
  const router = useRouter();

  const handleLeftPress = onLeftPress || (() => router.back());

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleLeftPress}>
        <View style={styles.iconContainer}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </View>
      </TouchableOpacity>
      <View style={[styles.textContainer, { flexDirection: !subtitle ? "row" : "column" }]}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <TouchableOpacity onPress={onRightPress} disabled={!onRightPress}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: rightIcon || rightText ? "" : "transparent",
              flexDirection: "row",
              alignItems: "center",
            },
          ]}
        >
          {rightIcon ? <Ionicons name={rightIcon} size={24} color="black" /> : null}
          {rightText ? <Text style={styles.rightText}>{rightText}</Text> : null}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    paddingLeft: 0,
    borderBottomWidth: 1.5,
    borderBottomColor: "#e0e0e0",
    paddingBottom: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  title: {
    color: "#A9411D",
    fontSize: 22,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 14,
    color: "#888",
  },
  rightText: {
    fontSize: 16,
    color: "#A9411D",
    marginLeft: 8 // This could still reference rightIcon; fix below
  },
});

export default Header;