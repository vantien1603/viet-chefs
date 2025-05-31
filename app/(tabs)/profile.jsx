import { useContext } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { commonStyles } from "../../style";
import { useRouter } from "expo-router";
import { AuthContext } from "../../config/AuthContext";
import { t } from "i18next";

const Profile = () => {
  const router = useRouter();
  const { user, isGuest } = useContext(AuthContext);
  const handleSetting = (id) => {
    if (isGuest) {
      if (id === "viewProfile") router.replace("/");
      if (id === "1") router.push("/screen/setting");
      return;
    }
    switch (id) {
      case "1":
        router.push("/screen/wallet");
        break;
      case "4":
        router.push("/screen/changePassword");
        break;
      case "3":
        router.push("/screen/favorite");
        break;
      case "2":
        router.push("/screen/createChef");
        break;
      case "7":
        router.push("/screen/setting");
        break;
      case "5":
        router.push("/screen/allReview");
        break;
      case "6":
        router.push("/screen/helpCentre");
        break;
      default:
        router.push("/screen/profileDetail");
        break;
    }
  };

  const menuItems = isGuest
    ? [{ id: "1", icon: "settings", title: t("settings") }]
    : [
      { id: "1", icon: "wallet", title: t("myWallet") },
      { id: "2", icon: "briefcase", title: t("createChefAccount") },
      { id: "3", icon: "heart", title: t("favoriteChef") },
      { id: "4", icon: "lock-closed", title: t("changePassword") },
      { id: "5", icon: "star", title: t("allReview") },
      { id: "6", icon: "help-circle", title: t("helpCentre") },
      { id: "7", icon: "settings", title: t("settings") },
    ];
  return (
    <ScrollView style={[commonStyles.container]}>
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
            <Text style={styles.userName}>{user?.fullName || t("guestT")}</Text>
            <TouchableOpacity onPress={() => handleSetting("viewProfile")}>
              <Text style={styles.viewProfile}>
                {" "}
                {isGuest ? t("loginSignup") : t("viewProfile")}
              </Text>
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
    fontFamily: "nunito-regular",
  },
});

export default Profile;
