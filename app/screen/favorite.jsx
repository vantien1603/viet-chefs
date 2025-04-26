import React, { useContext, useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Header from "../../components/header";
import { commonStyles } from "../../style";
import useAxios from "../../config/AXIOS_API";
import { AuthContext } from "../../config/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { t } from "i18next";

const FavoriteScreen = () => {
  const axiosInstance = useAxios();
  const [favorites, setFavorites] = useState([]);
  const [favoriteLoading, setFavoriteLoading] = useState({});
  const { user } = useContext(AuthContext);

  // Fetch favorite chefs
  const fetchFavorite = async () => {
    try {
      if (!user?.userId) {
        setFavorites([]);
        await AsyncStorage.removeItem("favorites");
        return;
      }
      console.log("Fetching favorites for userId:", user.userId);
      const response = await axiosInstance.get(
        `/favorite-chefs/${user.userId}`
      );
      const favoriteChefs = response.data.content;
      setFavorites(favoriteChefs);
      const chefIds = favoriteChefs.map((chef) => chef.chefId.toString());
      await AsyncStorage.setItem("favorites", JSON.stringify(chefIds));
    } catch (error) {
      console.log("Error fetching favorites:", error.response?.data || error);
    }
  };

  const handleRemoveFavorite = async (chefId) => {
    if (!user?.userId) {
      return;
    }

    const updatedFavorites = favorites.filter((chef) => chef.chefId !== chefId);
    setFavorites(updatedFavorites);

    setFavoriteLoading((prev) => ({ ...prev, [chefId]: true }));

    try {
      await axiosInstance.delete(
        `/favorite-chefs/${user.userId}/chefs/${chefId}`
      );

      const storedFavorites = await AsyncStorage.getItem("favorites");
      let favoriteIds = storedFavorites ? JSON.parse(storedFavorites) : [];
      favoriteIds = favoriteIds.filter((id) => id !== chefId.toString());
      await AsyncStorage.setItem("favorites", JSON.stringify(favoriteIds));

      Alert.alert(t("success"), t("removedFromFavorites"));
    } catch (error) {
      console.log(
        "Error removing favorite:",
        error.response?.data?.message || error
      );

      // 4. Nếu lỗi -> rollback UI (thêm chef vừa xóa lại vào favorites)
      setFavorites((prevFavorites) =>
        [...prevFavorites, favorites.find((c) => c.chefId === chefId)].filter(
          Boolean
        )
      );

    } finally {
      setFavoriteLoading((prev) => ({ ...prev, [chefId]: false }));
    }
  };

  useEffect(() => {
    fetchFavorite();
  }, []);

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title={t("favoriteList")} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {favorites.length > 0 ? (
          favorites.map((chef) => (
            <View key={chef.chefId} style={styles.card}>
              <TouchableOpacity
                style={styles.favoriteIcon}
                onPress={() => handleRemoveFavorite(chef.chefId)}
                disabled={favoriteLoading[chef.chefId]}
              >
                <Ionicons name="heart" size={24} color="#e74c3c" />
              </TouchableOpacity>

              <View style={styles.row}>
                <Image
                  source={{ uri: chef?.chefAvatar }}
                  style={styles.avatar}
                  resizeMode="cover"
                />
                <View style={styles.infoContainer}>
                  <Text style={styles.chefName}>{chef.chefName}</Text>
                  <Text style={styles.specification}>
                    {chef.chefSpecialization}
                  </Text>
                  <Text style={styles.address}>{chef.chefAddress}</Text>
                  <Text style={styles.createdAt}>
                    {t("addedOn")}:{" "}
                    {new Date(chef.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>{t("noFavoriteChefs")}</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    padding: 16,
    marginBottom: 16,
    position: "relative",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: "#CCCCCC",
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
  },
  chefName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  specification: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  address: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  createdAt: {
    fontSize: 12,
    color: "#AAA",
    marginTop: 4,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
  },
  favoriteIcon: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 4,
  },
});

export default FavoriteScreen;
