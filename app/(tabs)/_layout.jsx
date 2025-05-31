import React, { useCallback, useContext, useEffect, useState } from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";

function CustomTabBar({ state, descriptors, navigation }) {
  const { showModalLogin } = useModalLogin();
  const { isGuest, user } = useContext(AuthContext);
  const { showModal } = useGlobalModal();
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const axiosInstance = useAxios();
  const { lastMessage } = useContext(SocketContext);

  useEffect(() => {
    if (!isGuest) {
      fetchUnreadMessageCount();
    }
  }, [lastMessage]);

  const fetchUnreadMessageCount = async () => {
    try {
      const response = await axiosInstance.get("/notifications/my/count");
      const count = response.data.chatNoti ?? 0;
      setUnreadMessageCount(count);
    } catch (error) {
      console.log("Error fetching unread message count:", error);
    }
  };

  const handleUpdate = async () => {
    if (isGuest) return;
    try {
      await axiosInstance.put("/notifications/my-chat");
      fetchUnreadMessageCount(); // gọi lại sau khi cập nhật
    } catch (error) {
      console.log("Error updating notifications:", error);
    }
  };

  useEffect(() => {
    const restrictedScreens = ["chat", "schedule"];
    const currentScreen = state.routes[state.index].name;

    if (isGuest && restrictedScreens.includes(currentScreen)) {
      showModalLogin(
        "Yêu cầu đăng nhập",
        "Bạn cần đăng nhập để tiếp tục.",
        true
      );
    }
  }, [state.index, isGuest]);
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["rgba(24, 24, 24, 1)", "rgba(42, 42, 40, 1)"]}
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
        locations={[0, 0.8]}
        style={styles.gradientBackground}
      />
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
            if (route.name === "chat") {
              handleUpdate();
            }
          };

          return (
            <View key={route.key} style={styles.tabItem}>
              <TouchableOpacity style={{ padding: 10 }} onPress={onPress}>
                <Ionicons
                  name={
                    route.name === "home"
                      ? "home"
                      : route.name === "chat"
                        ? "chatbubble-outline"
                        : route.name === "schedule"
                          ? "calendar-outline"
                          : route.name === "bag"
                            ? "briefcase-outline"
                            : "person-outline"
                  }
                  size={24}
                  color={isFocused ? "white" : "#B0BEC5"}
                />
                {route.name === "chat" && unreadMessageCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
}
import { Tabs } from "expo-router";
import { AuthContext } from "../../config/AuthContext";
import { useGlobalModal } from "../../context/modalContext";
import { useModalLogin } from "../../context/modalLoginContext";
import useAxios from "../../config/AXIOS_API";
import { SocketContext } from "../../config/SocketContext";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="schedule" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    // justifyContent: "flex-end",
    // backgroundColor: "#EBE5DD",
    backgroundColor: "transparent",
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
    overflow: "hidden",
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
  badge: {
    position: "absolute",
    right: -8,
    top: -8,
    backgroundColor: "#A9411D",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "nunito-bold",
  },
});
