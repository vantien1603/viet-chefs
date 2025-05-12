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
import { useFocusEffect, useRouter } from "expo-router";
import { AuthContext } from "../../config/AuthContext";
import useAxios from "../../config/AXIOS_API";
import { t } from "i18next";

const menuItems = [
  { id: "1", icon: "wallet", title: "vietPay" },
  { id: "2", icon: "lock-closed", title: "changePassword" },
  { id: "3", icon: "heart", title: "favoriteChef" },
  { id: "4", icon: "briefcase", title: "createChefAccount" },
  { id: "5", icon: "settings", title: "settings" },
];

const Profile = () => {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [avatar, setAvatar] = useState("");
  const [loading, setLoading] = useState(true);
  const axiosInstance = useAxios();

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/users/profile");
      setAvatar(response.data.avatarUrl || "");
    } catch (error) {
      console.log("Error fetching avatar:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchProfile();
    }, [])
  );

  useEffect(() => {
    // Redirect to login if user is null after loading
    if (!loading && !user) {
      router.push("/screen/login");
    }
  }, [user, loading]);

  const handleSetting = (id) => {
    switch (id) {
      case "1":
        router.push("/screen/wallet");
        break;
      case "2":
        router.push("/screen/changePassword");
        break;
      case "3":
        router.push("/screen/favorite");
        break;
      case "4":
        router.push("/screen/createChef");
        break;
      case "5":
        router.push("/screen/setting");
        break;
      default:
        router.push("/screen/profileDetail");
        break;
    }
  };

  if (loading) {
    return (
      <View style={[commonStyles.containerContent, styles.centered]}>
        <ActivityIndicator size="large" color="#A9411D" />
      </View>
    );
  }

  if (!user) {
    // Fallback UI while redirecting
    return (
      <View style={[commonStyles.containerContent, styles.centered]}>
        <Text style={styles.errorText}>Redirecting to login...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={commonStyles.containerContent}>
      <View style={styles.profileHeader}>
        <Image
          source={
            avatar && avatar.trim() !== ""
              ? { uri: avatar }
              : require("../../assets/images/avatar.png") // Add a default avatar
          }
          style={styles.avatar}
        />
        <View>
          <Text style={styles.fullName}>{user.fullName || "Guest"}</Text>
          <TouchableOpacity onPress={() => handleSetting("viewProfile")}>
            <Text style={styles.viewProfileText}>
              {t("viewProfile")} {">"}
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
          <Text style={styles.menuTitle}>{t(item.title)}</Text>
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
