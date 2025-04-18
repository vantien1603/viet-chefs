import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { commonStyles } from "../../style";
import { useRouter } from "expo-router";
import { AuthContext } from "../../config/AuthContext";
import useAxios from "../../config/AXIOS_API";

const menuItems = [
  { id: "1", icon: "wallet", title: "VietPay" },
  { id: "2", icon: "briefcase", title: "Create chef account" },
  { id: "3", icon: "lock-closed", title: "Change password" },
  { id: "4", icon: "settings", title: "Setting" },
];

const Profile = () => {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const handleSetting = (id) => {
    switch (id) {
      case "1":
        router.push("/screen/wallet");
        break;
      case "2":
        router.push("/screen/createChef");
        break;
      case "3":
        router.push("/screen/changePassword");
        break;
      case "4":
        router.push("/screen/setting");
        break;
      default:
        router.push("/screen/profileDetail");
        break;
    }
  };


  return (
    <ScrollView style={commonStyles.containerContent}>
      <View style={styles.profileHeader}>
        <Image
          source={
            user?.avatarUrl && user?.avatarUrl.trim() !== ""
              ? { uri: user?.avatarUrl }
              : require("../../assets/images/avatar.png")
          }
          style={styles.avatar}
        />
        <View>
          <Text style={styles.fullName}>{user?.fullName || "Guest"}</Text>
          <TouchableOpacity onPress={() => user ? handleSetting("viewProfile") : router.replace('/')}>
            <Text style={styles.viewProfileText}>
              {user ? `Xem hồ sơ` : "Login/Register "}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {menuItems.map((item) => (
        <TouchableOpacity
          key={item.id}
          onPress={() => handleSetting(item.id)}
          style={styles.menuItem}
        >
          <Ionicons
            name={item.icon}
            size={24}
            color="black"
            style={styles.menuIcon}
          />
          <Text style={styles.menuTitle}>{item.title}</Text>
          <Ionicons name="chevron-forward" size={20} color="gray" />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#A9411D",
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    padding: 10,
    borderBottomColor: "#ddd",
    borderBottomWidth: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  fullName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  viewProfileText: {
    color: "#A9411D",
    fontWeight: "bold",
    fontSize: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  menuIcon: {
    marginRight: 16,
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
});

export default Profile;