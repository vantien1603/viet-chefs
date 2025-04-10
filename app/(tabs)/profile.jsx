import React, { useContext, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { commonStyles } from "../../style";
import { useRouter } from "expo-router";
import { AuthContext } from "../../config/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AXIOS_API from "../../config/AXIOS_API";

const menuItems = [
  { id: "1", icon: "wallet", title: "VietPay" },
  // { id: '2', icon: 'gift', title: 'Ưu đãi của tôi', badge: 2 },
  // { id: '3', icon: 'ribbon', title: 'bRewards' },
  // { id: '4', icon: 'ticket', title: 'Gói Ưu Đãi' },
  // { id: '5', icon: 'heart', title: 'Tasker yêu thích' },
  // { id: '6', icon: 'ban', title: 'Danh sách chặn' },
  // { id: '7', icon: 'share-social', title: 'Săn quà giới thiệu' },
  // { id: '8', icon: 'help-circle', title: 'Trợ giúp' },
  { id: "2", icon: "briefcase", title: "Create chef account" },
  // { id: '3', icon: 'flag', title: 'Country' },
  // { id: '4', icon: 'language', title: 'Language' },
  { id: "3", icon: "lock-closed", title: "Change password" },
  { id: "4", icon: "settings", title: "Setting" },
];

const Profile = () => {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [fullName, setFullName] = useState("");
  const [avatar, setAvatar] = useState("");
  useEffect(() => {
    const getFullName = async () => {
      try {
        const storedFullName = await AsyncStorage.getItem("@fullName");
        if (storedFullName !== null) {
          setFullName(storedFullName);
        } else {
          setFullName("Guest");
        }
      } catch (error) {
        console.error("Error retrieving full name:", error);
      }
    };
    getFullName();
  }, []);

  const handleSetting = (id) => {
    switch (id) {
      case "1": {
        router.push("/screen/wallet");
        break;
      }
      case "2": {
        router.push("/screen/createChef");
        break;
      }
      case "3": {
        router.push("/screen/changePassword");
        break;
      }
      case "4": {
        router.push("/screen/setting");
        break;
      }
      default: {
        router.push("/screen/profileDetail");
        break;
      }
    }
  };

  const avatarUrl = async () => {
    try {
      const response = await AXIOS_API.get("/users/profile");
      setAvatar(response.data.avatarUrl);
      // console.log("Avatar URL:", response.data.avatarUrl);
    } catch (error) {
      console.log("Error", error);
    }
  };

  useEffect(() => {
    avatarUrl();
  }, []);

  return (
    <ScrollView style={commonStyles.containerContent}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 16,
          padding: 10,
        }}
      >
        <Image
          source={
            avatar && avatar.trim() !== ""
              ? {
                  uri: avatar,
                }
              : null
          }
          style={{ width: 50, height: 50, borderRadius: 25, marginRight: 12 }}
        />
        <View>
          <Text style={{ fontSize: 20, fontWeight: "bold" }}>{fullName}</Text>
          <TouchableOpacity onPress={() => handleSetting("viewProfile")}>
            <Text
              style={{ color: "#A9411D", fontWeight: "bold", fontSize: 16 }}
            >
              Xem hồ sơ {">"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {menuItems.map((item) => (
        <TouchableOpacity
          key={item.id}
          onPress={() => handleSetting(item.id)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: "#ddd",
          }}
        >
          <Ionicons
            name={item.icon}
            size={24}
            color="black"
            style={{ marginRight: 16 }}
          />
          <Text style={{ flex: 1, fontSize: 16 }}>{item.title}</Text>

          {item.badge && (
            <View
              style={{
                backgroundColor: "#FFA500",
                paddingHorizontal: 8,
                borderRadius: 12,
                marginRight: 8,
              }}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>
                {item.badge}
              </Text>
            </View>
          )}

          <Ionicons name="chevron-forward" size={20} color="gray" />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export default Profile;
