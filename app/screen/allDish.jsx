import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import React, { useEffect, useState, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/header";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import useAxios from "../../config/AXIOS_API";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { commonStyles } from "../../style";
import { t } from "i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";

const AllDishScreen = () => {
  const [dishes, setDishes] = useState([]);
  const [filteredDishes, setFilteredDishes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);
  const axiosInstance = useAxios();
  const { chefId } = useLocalSearchParams();

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Quyền truy cập vị trí bị từ chối",
          "Vui lòng cấp quyền để tìm kiếm món ăn gần bạn."
        );
        return null;
      }
      let currentLocation = await Location.getCurrentPositionAsync({});
      return {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };
    } catch (error) {
      console.error("Lỗi khi lấy vị trí:", error);
      Alert.alert("Lỗi", "Không thể lấy vị trí hiện tại.");
      return null;
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

      if (!newLocation) {
        newLocation = await getCurrentLocation();
      }

      setLocation(newLocation);
    } catch (error) {
      console.error("Error loading address from AsyncStorage:", error);
      setError("Không thể tải vị trí.");
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadLocation();
    }, [])
  );

  useEffect(() => {
    const fetchDishes = async () => {
      if (!chefId && !location) {
        setLoading(false);
        return;
      }
      try {
        let response;
        if (chefId) {
          response = await axiosInstance.get(`/dishes?chefId=${chefId}`);
        } else {
          response = await axiosInstance.get("/dishes/nearby", {
            params: {
              customerLat: location.latitude,
              customerLng: location.longitude,
              distance: 30, // Adjust as needed
            },
          });
        }
        setDishes(response.data.content);
        setFilteredDishes(response.data.content);
      } catch (error) {
        console.error(
          "Error fetching dishes:",
          error?.response?.data || error.message
        );
        setError("Không thể tải danh sách món ăn.");
      } finally {
        setLoading(false);
      }
    };

    if (chefId || location) {
      fetchDishes();
    }
  }, [chefId, location]);

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
    <SafeAreaView style={commonStyles.containerContent}>
      <Header
        title={t("allDishes")}
        rightIcon={"search"}
        onRightPress={toggleSearch}
      />

      {isSearching && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm món ăn..."
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
        data={groupedDishes}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.row}>
            {item.map((dish) => (
              <View key={dish.id} style={styles.cardContainer}>
                <TouchableOpacity
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
                        resizeMode="cover"
                      />
                    </View>
                    <Text style={styles.title}>{dish.name}</Text>
                    <Text style={{ color: "#F8BF40" }}>{dish.description}</Text>
                    <Text style={{ color: "#FFF", fontSize: 12 }}>
                      {t("timeCook")}: ~{dish.cookTime} {t("minutes")}
                    </Text>
                    <Text style={{ color: "#fff", fontSize: 12 }}>
                      {t("distance")}: {dish.chef.distance.toFixed(2)} km
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            ))}
            {item.length === 1 && <View style={styles.cardContainer} />}
          </View>
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
  },
  card: {
    backgroundColor: "#A9411D",
    borderRadius: 16,
    paddingTop: 90,
    paddingBottom: 20,
    paddingHorizontal: 12,
    alignItems: "center",
    width: "100%",
    position: "relative",
    minHeight: 200,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginTop: 30,
  },
  imageContainer: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#FFF",
    overflow: "hidden",
    position: "absolute",
    top: -30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#EAEAEA",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  title: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#FFF",
    marginTop: 12,
    textAlign: "center",
    marginBottom: 6,
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
    color: "#A9411D",
    marginBottom: 16,
    textAlign: "center",
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
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
  },
});

export default AllDishScreen;
