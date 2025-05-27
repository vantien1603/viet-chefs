import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/header";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import useAxios from "../../config/AXIOS_API";
import { router } from "expo-router";
import { commonStyles } from "../../style";
import { t } from "i18next";
import { useCommonNoification } from "../../context/commonNoti";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AllDishScreen = () => {
  const [dishes, setDishes] = useState([]);
  const [filteredDishes, setFilteredDishes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);
  const axiosInstance = useAxios();
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [refresh, setRefresh] = useState(false);
  const { showModal } = useCommonNoification();
  useEffect(() => {
    loadLocation();
  }, [])
  useEffect(() => {
    if (location)
      fetchDishes(0, true);
  }, [location]);

  const fetchDishes = async (page, isRefresh = false) => {
    setLoading(true);
    try {
      let response;
      response = await axiosInstance.get("/dishes/nearby", {
        params: {
          customerLat: location.latitude,
          customerLng: location.longitude,
          distance: 30,
          pageNo: page,
          pageSize: 10,
        }
      });
      const newDishes = response.data?.content || [];

      setDishes((prev) => {
        return isRefresh ? newDishes : [...prev, ...newDishes];
      });
      setTotalPages(response.data.totalPages);
      // setDishes(response.data.content);
      // setFilteredDishes(response.data.content);
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        console.log('Request was cancelled');
        return;
      }
      showModal(t("modal.error"), "Có lỗi khi tải danh sách món ăn", t("modal.failed"), fetchDishes());
    } finally {
      setLoading(false);
      if (isRefresh) setRefresh(false);
    }
  };

  const loadLocation = async () => {
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
      showModal(t("modal.error"), "Có lỗi khi tải địa chỉ.", t("modal.failed"));
    } finally {
      setLoading(false);
    }
  };

  const loadMoreData = async () => {
    if (!loading && page + 1 <= totalPages - 1) {
      const nextPage = page + 1;
      setPage(nextPage);
      await fetchDishes(nextPage);
    }
  };

  const handleRefresh = async () => {
    setRefresh(true);
    setPage(0);
    await fetchDishes(0, true);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      setFilteredDishes(dishes);
    } else {
      const filtered = dishes.filter((item) =>
        item.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredDishes(filtered);
    }
  };

  const toggleSearch = () => {
    setIsSearching(!isSearching);
    if (isSearching) {
      setSearchQuery("");
      setFilteredDishes(dishes);
    }
  };

  const groupedDishes = [];
  for (let i = 0; i < filteredDishes.length; i += 2) {
    groupedDishes.push(filteredDishes.slice(i, i + 2));
  }

  if (loading) {
    return (
      <SafeAreaView style={commonStyles.containerContent}>
        <Header
          title={t("allDishes")}
          rightIcon={"search"}
          onRightPress={toggleSearch}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A9411D" />
          <Text style={styles.loadingText}>{t("loadingDishes")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={commonStyles.containerContent}>
        <Header
          title={t("allDishes")}
          rightIcon={"search"}
          onRightPress={toggleSearch}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setLoading(true);
              loadLocation();
            }}
          >
            <Text style={styles.retryButtonText}>{t("tryAgain")}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.container}>
      <Header
        title={t("allDishes")}
        rightIcon={"search"}
        onRightPress={toggleSearch}
      />

      {isSearching && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={t("search")}
            value={searchQuery}
            onChangeText={handleSearch}
            autoFocus={true}
          />
          <TouchableOpacity onPress={toggleSearch} style={styles.closeSearch}>
            <MaterialIcons name="close" size={24} color="#4EA0B7" />
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={dishes}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between", marginBottom: 15 }}
        contentContainerStyle={{ padding: 10, gap: 20, paddingVertical: 30 }}
        initialNumToRender={10}
        refreshing={refresh}
        onRefresh={handleRefresh}
        maxToRenderPerBatch={10}
        removeClippedSubviews={true}
        onEndReached={() => {
          loadMoreData();
        }}
        onEndReachedThreshold={0.2}
        renderItem={({ item: dish }) => (
          <TouchableOpacity
            style={[
              styles.cardContainer,
            ]}
            onPress={() =>
              router.push({
                pathname: "/screen/dishDetails",
                params: { dishId: dish.id },
              })
            }
          >
            <View style={styles.card}>
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: dish.imageUrl }}
                  style={styles.image}
                  defaultSource={require("../../assets/images/1.jpg")}
                />
              </View>
              <Text style={styles.title}>{dish.name}</Text>
              <Text style={styles.description}>{dish.description}</Text>
              <Text style={{ color: "#FFF", fontSize: 12 }}>
                {t("timeCook")}: ~{dish.cookTime} {t("minutes")}
              </Text>
              <Text style={{ color: "#fff", fontSize: 12 }}>
                {t("distance")}: {dish.chef.distance.toFixed(2)} km
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{t("noDishesFound")}</Text>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDFBF6",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    fontFamily: "nunito-regular",
  },
  closeSearch: {
    marginLeft: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  cardContainer: {
    width: "48%",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#A9411D",
    borderRadius: 16,
    padding: 16,
    paddingTop: 50,
    alignItems: "center",
    width: "100%",
    //   height:'100%',
    height: 220,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    //   elevation: 5,
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFF",
    overflow: "hidden",
    position: "absolute",
    top: -30,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  title: {
    fontSize: 16,
    fontFamily: "nunito-bold",
    color: "#FFF",
    marginTop: 60,
    textAlign: "center",
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: "#F8BF40",
    textAlign: "center",
    marginBottom: 6,
    fontFamily: "nunito-regular",
  },
  cookTime: {
    fontSize: 13,
    color: "#FFFFFFAA",
    textAlign: "center",
    fontFamily: "nunito-regular",
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
    fontFamily: "nunito-regular",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: "#A9411D",
    marginBottom: 16,
    textAlign: "center",
    fontFamily: "nunito-regular",
  },
  retryButton: {
    backgroundColor: "#A9411D",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    color: "#FFF",
    fontFamily: "nunito-bold",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
    fontFamily: "nunito-regular",
  },
});

export default AllDishScreen;
