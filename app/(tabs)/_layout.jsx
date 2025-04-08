import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";

// Custom Tab Bar Component
function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.container}>
      {/* Gradient Background */}
      <LinearGradient
        colors={["rgba(24, 24, 24, 1)", "rgba(42, 42, 40, 1)"]}
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
        locations={[0, 0.8]} // Điều chỉnh tỷ lệ phân chia giữa các màu sắc
        style={styles.gradientBackground}
      />

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <View key={route.key} style={styles.tabItem}>
              {/* {index === 2 ? (
                                // Center Icon
                                <View style={styles.centerIcon}>
                                    <Ionicons
                                        name="grid"
                                        size={28}
                                        color="white"
                                        onPress={onPress}
                                    />
                                </View>
                            ) :  */}
              {/* ( */}
              <TouchableOpacity style={{ padding: 10 }} onPress={onPress}>
                <Ionicons
                  name={
                    route.name === "home"
                      ? "home"
                      : route.name === "chat"
                      ? "chatbubble-outline"
                      : route.name === "history"
                      ? "time-outline"
                      : route.name === "bag"
                      ? "briefcase-outline"
                      : "person-outline"
                  }
                  size={24}
                  color={isFocused ? "white" : "#B0BEC5"}
                />
              </TouchableOpacity>

              {/* ) */}
              {/* } */}
            </View>
          );
        })}
      </View>
    </View>
  );
}

// Tabs Layout (use expo-router Tabs here instead)
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="history" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    // justifyContent: "flex-end",
    backgroundColor: "#EBE5DD",
  },
  gradientBackground: {
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 80,
    backgroundColor: "transparent",
  },
  tabItem: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  centerIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "center",
    marginTop: -30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  screen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
});
