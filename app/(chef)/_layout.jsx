import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

// Component ChefTabBar
function ChefTabBar({ state, descriptors, navigation }) {
    // Kiểm tra route hiện tại
  const currentRoute = state.routes[state.index].name;

  // Nếu route hiện tại là "add", không render tab bar
  if (currentRoute === "add") {
    return null;
  }
    return (
        <View style={styles.container}>
            <View style={styles.background} />

            {/* Tab Bar */}
            <View style={styles.tabBar}>
                {state.routes.map((route, index) => {
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
                            {index === 2 ? (
                                // Center Icon (+)
                                <TouchableOpacity
                                    style={styles.centerButton}
                                    onPress={() => navigation.navigate("add")}
                                >
                                    <Ionicons name="add" size={32} color="#FF6600" />
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity style={{ padding: 10 }} onPress={onPress}>
                                    <Ionicons
                                        name={
                                            route.name === "dashboard"
                                                ? "grid-outline"
                                                : route.name === "menu"
                                                ? "reorder-three-outline"
                                                : route.name === "notification"
                                                ? "notifications-outline"
                                                : "person-outline"
                                        }
                                        size={24}
                                        color={isFocused ? "#FF6600" : "#B0BEC5"}
                                    />
                                </TouchableOpacity>
                            )}
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

// Tabs Layout
import { Tabs } from "expo-router";

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
            }}
            tabBar={(props) => <ChefTabBar {...props} />}
        >
            <Tabs.Screen name="dashboard" />
            <Tabs.Screen name="menu" />
            <Tabs.Screen name="add" />
            <Tabs.Screen name="notification" />
            <Tabs.Screen name="profile" />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "transparent",
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
    },
    background: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        backgroundColor: "white",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    tabBar: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        height: 80,
        paddingHorizontal: 10,
    },
    tabItem: {
        justifyContent: "center",
        alignItems: "center",
        flex: 1,
    },
    centerButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "rgba(254, 104, 4, 0.41)",
        justifyContent: "center",
        alignItems: "center",
        marginTop: -20, // Nâng nút lên một chút để giống hình
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
});