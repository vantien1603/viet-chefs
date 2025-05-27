import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import useAxios from "../../config/AXIOS_API";
import Header from "../../components/header";
import { commonStyles } from "../../style";
import { t } from "i18next";
import { useCommonNoification } from "../../context/commonNoti";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../../config/AuthContext";
import Icon from "react-native-vector-icons/Ionicons";

const AllChefs = () => {
  const [chefs, setChefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const axiosInstance = useAxios();
  const [location, setLocation] = useState(null);
  const { showModal } = useCommonNoification();
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [refresh, setRefresh] = useState(false);
  const { user, isGuest } = useContext(AuthContext);
  const [favorite, setFavorite] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      if (!isGuest) {
        loadFavorites();
      }
    }, [isGuest])
  );

  useEffect(() => {
    if (location) {
      fetchChefs(0, true);
    }
  }, [location]);



  const loadData = async () => {
    setLoading(true);
    try {
      const savedAddress = await AsyncStorage.getItem("selectedAddress");
      let newLocation = null;

      if (savedAddress) {
        const parsedAddress = JSON.parse(savedAddress);
        if (parsedAddress.latitude && parsedAddress.longitude) {
          newLocation = {
            latitude: parsedAddress.latitude,
            longitude: parsedAddress.longitude,
          };
        }
      }
      setLocation(newLocation);
    } catch (error) {
      showModal(t("modal.error"), "Có lỗi khi tải địa chỉ.", "Failed");
    } finally {
      setLoading(false);
    }
  };


  const loadFavorites = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/favorite-chefs/${user.userId}`);
      if (response.status === 200) setFavorite(response.data.content);
    } catch (error) {
      showModal(t("modal.error"), "Có lỗi khi tải danh sách đầu bếp yêu thích", "Failed");
    } finally {
      setLoading(false);
    }
  };

  const fetchChefs = async (page, isRefresh = false) => {
    if (loading && !isRefresh) return;
    if (!location) return;
    setLoading(true);
    try {
      const response = await axiosInstance.get("/chefs/nearby", {
        params: {
          customerLat: location.latitude,
          customerLng: location.longitude,
          distance: 30,
          pageNo: page,
          pageSize: 10,
          sortBy: "distance",
          sortDir: "asc",
        },
      });

      const newChefs = response.data?.content || [];

      setChefs((prevChefs) => {
        return isRefresh ? newChefs : [...prevChefs, ...newChefs];
      });
      setTotalPages(response.data.totalPages);

    } catch (error) {
      if (!axios.isCancel(error)) return;
      showModal(t("modal.error"), "Có lỗi khi tải danh sách đầu bếp gần bạn.", "Failed");
    } finally {
      setLoading(false);
      if (isRefresh) setRefresh(false);
    }
  };

  const loadMoreData = async () => {
    if (!loading && page + 1 <= totalPages - 1) {
      const nextPage = page + 1;
      setPage(nextPage);
      await fetchChefs(nextPage);
    }
  };

  const handleRefresh = async () => {
    setRefresh(true);
    setPage(0);
    await fetchChefs(0, true);
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
      <View>
        <Image
          source={
            item.user?.avatarUrl === "default"
              ? require("../../assets/images/avatar.png")
              : { uri: item.user?.avatarUrl }
          }
          style={styles.chefAvatar}
        />
        <View style={styles.chefMeta}>
          {Array(5).fill().map((_, i) => {
            const rating = item?.averageRating || 0;
            let iconName = "star";
            let color = "#ccc";

            if (i < Math.floor(rating)) {
              color = "#f5a623";
            } else if (i < rating) {
              iconName = "star-half";
              color = "#f5a623";
            }

            return (
              <Icon
                key={i}
                name={iconName}
                size={15}
                color={color}
              />
            );
          })}
        </View>
        <View style={styles.chefMeta}>
          <Ionicons name="cash-outline" size={16} color="#888" />
          <Text style={styles.chefPrice}>
            {item.price ? `${item.price} $/giờ` : "N/A"}
          </Text>
        </View>
      </View>

      <View style={styles.chefInfo}>
        <Text style={styles.chefName}>{item.user.fullName}</Text>
        <Text style={styles.chefSpecialization}>
          {item.specialization || "Đầu bếp"}
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
          <MaterialIcons name="social-distance" size={16} color="#888" />
          <Text style={styles.chefPrice}>
            {item.distance.toFixed(2)} km
          </Text>
        </View>
      </View>
      <Ionicons
        name={favorite.some(fav => fav.chefId === item.id) ? "heart" : "heart-outline"}
        size={24}
        color={
          favorite.some(fav => fav.chefId === item.id) ? "#e74c3c" : "#888"
        }
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={commonStyles.container}>
      <Header title={t("allChefs")} />
      <FlatList
        data={chefs}
        renderItem={renderChefItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={styles.emptyText}>{t("noChefFound")}</Text>}
        initialNumToRender={10}
        refreshing={refresh}
        onRefresh={handleRefresh}
        maxToRenderPerBatch={10}
        removeClippedSubviews={true}
        onEndReached={() => {
          loadMoreData();
        }}
        onEndReachedThreshold={0.2}
      />
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
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
  },
});

export default AllChefs;