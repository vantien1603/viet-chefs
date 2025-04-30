import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import useAxios from "../../config/AXIOS_API";
import Header from "../../components/header";
import { commonStyles } from "../../style";
import { t } from "i18next";
import { useCommonNoification } from "../../context/commonNoti";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../../config/AuthContext";
import useRequireAuthAndNetwork from "../../hooks/useRequireAuthAndNetwork";

const AllChefs = () => {
  const [chefs, setChefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [favoriteLoading, setFavoriteLoading] = useState({});
  const axiosInstance = useAxios();
  const { showModal } = useCommonNoification();
  const { user } = useContext(AuthContext);
  const requireAuthAndNetwork = useRequireAuthAndNetwork();

  useEffect(() => {
    fetchChefs();
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const storedFavorites = await AsyncStorage.getItem("favorites");
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    } catch (err) {
      showModal("Error", "Có lỗi khi tải danh sách đầu bếp yêu thích", "Failed");
    }
  };

  const fetchChefs = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/chefs");
      setChefs(response.data.content);
      console.log(response.data.content)
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        console.log('Request was cancelled');
        return;
      }
      showModal("Error", "Có lỗi khi tải danh sách đầu bếp", "Failed");
    }
    finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (chefId) => {
    setFavoriteLoading((prev) => ({ ...prev, [chefId]: true }));
    try {
      const isFavoriteResponse = await axiosInstance.get(
        `/favorite-chefs/${user.userId}/chefs/${chefId}`
      );
      const isFavorite = isFavoriteResponse.data;
      console.log("cac", isFavorite);

      if (isFavorite) {
        await axiosInstance.delete(
          `/favorite-chefs/${user.userId}/chefs/${chefId}`
        );
        const updatedFavorites = favorites.filter((id) => id !== chefId);
        setFavorites(updatedFavorites);
        await AsyncStorage.setItem(
          "favorites",
          JSON.stringify(updatedFavorites)
        );
      } else {
        await axiosInstance.post(
          `/favorite-chefs/${user.userId}/chefs/${chefId}`
        );
        const updatedFavorites = [...favorites, chefId];
        setFavorites(updatedFavorites);
        await AsyncStorage.setItem(
          "favorites",
          JSON.stringify(updatedFavorites)
        );
      }
    } catch (err) {
      let errorMessage =
        err.response?.data?.message ||
        `Lỗi khi ${favorites.includes(chefId) ? "xóa" : "thêm"
        } đầu bếp vào danh sách yêu thích.`;
      console.log("Error toggling favorite:", errorMessage);
    } finally {
      setFavoriteLoading((prev) => ({ ...prev, [chefId]: false }));
    }
  };

  const renderChefItem = ({ item }) => (
    <TouchableOpacity
      style={styles.chefCard}
      onPress={() =>
        router.push({
          pathname: "/screen/chefDetail",
          params: { chefId: item.id },
        })
      }
    >
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Image
          source={{
            uri:
              item.user.avatarUrl === "default"
                ? "https://via.placeholder.com/80"
                : item.user.avatarUrl,
          }}
          style={styles.chefAvatar}
        />
        <Text>{item.averageRating}</Text>

      </View>

      <View style={styles.chefInfo}>
        <Text style={styles.chefName}>{item.user.fullName}</Text>
        <Text style={styles.chefSpecialization}>
          {item.specialization || "Đầu bếp"}{" "}
        </Text>
        <Text style={styles.chefBio} numberOfLines={2}>
          {item?.bio}
        </Text>
        <View style={styles.chefMeta}>
          <Ionicons name="location-outline" size={16} color="#888" />
          <Text style={styles.chefAddress} numberOfLines={1}>
            {item?.address}
          </Text>
        </View>
        <View style={styles.chefMeta}>
          <Ionicons name="cash-outline" size={16} color="#888" />
          <Text style={styles.chefPrice}>
            {item.price ? `${item.price} $/giờ` : "N/A"}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.favoriteIcon}
        onPress={() => requireAuthAndNetwork(() => toggleFavorite(item.id))}
        disabled={favoriteLoading[item.id]}
      >
        {favoriteLoading[item.id] ? (
          <ActivityIndicator size="small" color="#e74c3c" />
        ) : (
          <Ionicons
            name={favorites.includes(item.id) ? "heart" : "heart-outline"}
            size={24}
            color={favorites.includes(item.id) ? "#e74c3c" : "#888"}
          />
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={commonStyles.container}>
      <Header title={t("allChefs")} />
      {loading ? (
        <ActivityIndicator size="large" color="#A64B2A" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={chefs}
          renderItem={renderChefItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !loading ? (
              <Text style={{ textAlign: 'center', marginTop: 20 }}>No data available</Text>
            ) : null
          }
        />
      )}

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  chefCard: {
    flexDirection: "row",
    backgroundColor: "#F9F5F0",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: "relative",
  },
  chefAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  chefInfo: {
    flex: 1,
    justifyContent: "center",
  },
  chefName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  chefSpecialization: {
    fontSize: 16,
    fontWeight: "600",
    color: "#e74c3c",
    marginBottom: 4,
  },
  chefBio: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    lineHeight: 20,
  },
  chefMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  chefAddress: {
    fontSize: 14,
    color: "#888",
    marginLeft: 6,
    flex: 1,
  },
  chefPrice: {
    fontSize: 14,
    color: "#888",
    marginLeft: 6,
  },
  favoriteIcon: {
    position: "absolute",
    bottom: 16,
    left: 16,
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: "#e74c3c",
    marginBottom: 16,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#e74c3c",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
});

export default AllChefs;
