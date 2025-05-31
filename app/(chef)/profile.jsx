import React, { useContext } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AuthContext } from "../../config/AuthContext";
import { commonStyles } from "../../style";
import { t } from "i18next";



const Profile = () => {
  const menuItems = [
    { id: "1", icon: "wallet-outline", title: t("myWallet") },
    { id: "2", icon: "wallet-outline", title: t('payFineHeader') },
    { id: "3", icon: "settings-outline", title: t("settings") },
  ];
  const router = useRouter();
  const { user } = useContext(AuthContext);

  const handleSetting = (id) => {
    switch (id) {
      case "1":
        router.push("/screen/wallet");
        break;
      case "2":
        router.push("/screen/penatyFee");
        break;
      case "3":
        router.push("/screen/setting");
        break;
      default:
        router.push("/screen/profileDetail");
        break;
    }
  };

  return (
    <ScrollView style={[commonStyles.container,]}>
      <View style={styles.card}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image
            source={{
              uri:
                user?.avatarUrl ||
                "https://cosmic.vn/wp-content/uploads/2023/06/tt-1.png",
            }}
            style={styles.avatar}
          />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.userName}>{user?.fullName || "Guest"}</Text>
            <TouchableOpacity onPress={() => handleSetting("viewProfile")}>
              <Text style={styles.viewProfile}>{t("viewProfile")}{" >"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.menuCard}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => handleSetting(item.id)}
            style={[
              styles.menuItem,
              index === menuItems.length - 1 && { borderBottomWidth: 0 },
            ]}
          >
            <View style={styles.iconWrapper}>
              <Ionicons name={item.icon} size={22} color="#A9411D" />
            </View>
            <Text style={styles.menuText}>{item.title}</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F9F5F0",
    padding: 16,
    margin: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ddd",
  },
  userName: {
    fontSize: 18,
    fontFamily: "nunito-bold",
  },
  viewProfile: {
    color: "#A9411D",
    marginTop: 4,
    fontFamily: "nunito-bold",
  },
  menuCard: {
    backgroundColor: "#F9F5F0",
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  iconWrapper: {
    width: 32,
    alignItems: "center",
    marginRight: 12,
  },
  menuText: {
    fontSize: 16,
    flex: 1,
    color: "#333",
    fontFamily: "nunito-regular"
  },
});

export default Profile;
