import React, { useContext, useEffect, useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Header from "../../components/header";
import { commonStyles } from "../../style";
import useAxios from "../../config/AXIOS_API";
import { AuthContext } from "../../config/AuthContext";
import { t } from "i18next";
import axios from "axios";
import { useRouter } from "expo-router";
import { FlatList } from "react-native";
import { useCommonNoification } from "../../context/commonNoti";

const FavoriteScreen = () => {
  const axiosInstance = useAxios();
  const [favorites, setFavorites] = useState([]);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const { showModal } = useCommonNoification();

  useEffect(() => {
    fetchFavorite(0, true);
  }, []);

  const fetchFavorite = async (pageNum, isRefresh = false) => {
    if (loading && !isRefresh) return;
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `/favorite-chefs/${user.userId}`, {
        params: {
          pageNo: pageNum,
          pageSize: 10,
          sortBy: 'createdAt',
          sortDir: 'desc',
        },
      });
      setTotalPages(response.data.totalPages);
      const favoriteChefs = response.data.content || [];
      setFavorites((prev) => {
        return isRefresh ? favoriteChefs : [...prev, ...favoriteChefs];
      });
    } catch (error) {
      if (axios.isCancel(error) || error.response?.status === 401) return;
      showModal("Error", error.response.data.message, "Failed");
    } finally {
      setLoading(false);
      setRefresh(false);
    }

  };

  const handleRemoveFavorite = async (chef) => {
    console.log("cc", chef);
    setFavoriteLoading(true);
    try {
      await axiosInstance.delete(
        `/favorite-chefs/${user.userId}/chefs/${chef.chefId}`
      );
      fetchFavorite(0, true);
      showModal(t("modal.success"), `${chef.chefName} ${t("removedFromFavorites")}`);
    } catch (error) {
      if (axios.isCancel(error) || error.response?.status === 401) return;
      showModal("Error", error.response.data.message, "Failed");
    } finally {
      setFavoriteLoading(false);
    }
  };

  const loadMoreData = async () => {
    if (!loading && page + 1 <= totalPages - 1) {
      const nextPage = page + 1;
      setPage(nextPage);
      await fetchFavorite(nextPage);
    }
  };

  const handleRefresh = async () => {
    setRefresh(true);
    setPage(0);
    await fetchFavorite(0, true);
  };

  const renderItem = ({ item: chef }) => (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.favoriteIcon}
        onPress={() => handleRemoveFavorite(chef)}
        disabled={favoriteLoading[chef.chefId]}
        hitSlop={10}
      >
        <Ionicons name="heart" size={24} color="#e74c3c" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.row}
        onPress={() => router.push({
          pathname: "/screen/chefDetail",
          params: { chefId: chef.chefId },
        })}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: chef?.chefAvatar }}
          style={styles.avatar}
          resizeMode="cover"
        />
        <View style={styles.infoContainer}>
          <Text style={styles.chefName}>{chef.chefName}</Text>
          <Text style={styles.specification}>{chef.chefSpecialization}</Text>
          <Text style={styles.address}>{chef.chefAddress}</Text>
          <Text style={styles.createdAt}>
            {t("addedOn")}: {new Date(chef.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    </View>


  );


  return (
    <SafeAreaView style={commonStyles.container}>
      <Header title={t("favoriteList")} />
      <FlatList
        data={favorites}
        onRefresh={handleRefresh}
        refreshing={refresh}
        onEndReached={loadMoreData}
        onEndReachedThreshold={0.2}
        keyExtractor={(item) => item.chefId.toString()}
        renderItem={renderItem}
        style={commonStyles.containerContent}
        contentContainerStyle={styles.scrollContainer}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    // paddingHorizontal: 16,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: "#F9F5F0",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fff",
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
    fontFamily: "nunito-bold",
    color: "#333",
  },
  specification: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
    fontFamily: "nunito-regular"
  },
  address: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
    fontFamily: "nunito-regular"
  },
  createdAt: {
    fontSize: 12,
    color: "#AAA",
    marginTop: 4,
    fontFamily: "nunito-regular"
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
    fontFamily: "nunito-regular"
  },
  favoriteIcon: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },

});

export default FavoriteScreen;
