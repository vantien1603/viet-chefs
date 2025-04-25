import React, { useState, useEffect } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";

const AllChefs = () => {
  const [chefs, setChefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const axiosInstance = useAxios();

  // Lấy danh sách yêu thích từ AsyncStorage khi khởi động
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const storedFavorites = await AsyncStorage.getItem("favorites");
        if (storedFavorites) {
          setFavorites(JSON.parse(storedFavorites));
        }
      } catch (err) {
        console.error("Lỗi khi tải danh sách yêu thích:", err);
      }
    };
    loadFavorites();
  }, []);

  // Lấy danh sách đầu bếp từ API
  const fetchChefs = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/chefs");
      setChefs(response.data.content);
      setLoading(false);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        "Không thể tải danh sách đầu bếp. Vui lòng thử lại.";
      setError(errorMessage);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChefs();
  }, []);

  // Hàm xử lý thêm/xóa khỏi danh sách yêu thích
  const toggleFavorite = async (chefId) => {
    let updatedFavorites;
    if (favorites.includes(chefId)) {
      updatedFavorites = favorites.filter((id) => id !== chefId);
      Alert.alert("Thông báo", "Đã xóa đầu bếp khỏi danh sách yêu thích!");
    } else {
      updatedFavorites = [...favorites, chefId];
      Alert.alert("Thông báo", "Đã thêm đầu bếp vào danh sách yêu thích!");
    }
    setFavorites(updatedFavorites);
    try {
      await AsyncStorage.setItem("favorites", JSON.stringify(updatedFavorites));
    } catch (err) {
      console.error("Lỗi khi lưu danh sách yêu thích:", err);
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
      <Image
        source={{
          uri:
            item.user.avatarUrl === "default"
              ? "https://via.placeholder.com/80"
              : item.user.avatarUrl,
        }}
        style={styles.chefAvatar}
      />
      <View style={styles.chefInfo}>
        <Text style={styles.chefName}>{item.user.fullName}</Text>
        <Text style={styles.chefSpecialization}>
          {item?.specialization}
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
      {/* Biểu tượng yêu thích ở góc dưới bên trái */}
      <TouchableOpacity
        style={styles.favoriteIcon}
        onPress={() => toggleFavorite(item.id)}
      >
        <Ionicons
          name={favorites.includes(item.id) ? "heart" : "heart-outline"}
          size={24}
          color={favorites.includes(item.id) ? "#e74c3c" : "#888"}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e74c3c" />
          <Text style={styles.loadingText}>Đang tải danh sách đầu bếp...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchChefs}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title={t("allChefs")} />
      <FlatList
        data={chefs}
        renderItem={renderChefItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  chefCard: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: "relative", // Để sử dụng position absolute cho biểu tượng
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
    bottom: 16, // Khoảng cách từ dưới lên
    left: 16, // Khoảng cách từ bên trái
    padding: 4, // Khu vực nhấn lớn hơn
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