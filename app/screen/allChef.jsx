import React, { useState, useEffect, useContext, useCallback } from "react";
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
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import useAxios from "../../config/AXIOS_API";
import Header from "../../components/header";
import { commonStyles } from "../../style";
import { t } from "i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../../config/AuthContext";
import * as Location from "expo-location";

const AllChefs = () => {
  const [chefs, setChefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const axiosInstance = useAxios();
  const [location, setLocation] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Quyền truy cập vị trí bị từ chối",
          "Vui lòng cấp quyền để tìm kiếm đầu bếp gần bạn."
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

  const loadData = async () => {
    setLoading(true);
    try {
      const savedAddress = await AsyncStorage.getItem("selectedAddress");
      let newLocation = null;

      if (savedAddress) {
        const parsedAddress = JSON.parse(savedAddress);
        setSelectedAddress(parsedAddress);
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
      setError("Không thể tải địa chỉ.");
    }
  };

  const fetchChefs = async () => {
    if (!location) {
      setLoading(false);
      return;
    }
    try {
      const response = await axiosInstance.get("/chefs/nearby", {
        params: {
          customerLat: location.latitude,
          customerLng: location.longitude,
          distance: 30,
          sortBy: "distance",
          sortDir: "asc",
        },
      });
      setChefs(response.data.content);
      console.log("Fetched chefs:", response.data.content);
    } catch (error) {
      console.error(
        "Error fetching chefs:",
        error?.response?.data || error.message
      );
      setError("Không thể tải danh sách đầu bếp.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    fetchChefs();
  }, [location]);


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
          uri: item.user?.avatarUrl || "https://via.placeholder.com/80",
        }}
        style={styles.chefAvatar}
      />
      <View style={styles.chefInfo}>
        <Text style={styles.chefName}>{item.user.fullName}</Text>
        <Text style={styles.chefSpecialization}>{item?.specialization}</Text>
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
        <View style={styles.chefMeta}>
          <MaterialIcons name="social-distance" size={16} color="#888" />
          <Text style={styles.chefPrice}>
            {item.distance.toFixed(2)} km
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title={t("allChefs")} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e74c3c" />
          <Text style={styles.loadingText}>{t("loadingChef")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title={t("allChefs")} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setLoading(true);
              loadData();
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
      <Header title={t("allChefs")} />
      <FlatList
        data={chefs}
        renderItem={renderChefItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{t("noChefFound")}</Text>
        }
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
    backgroundColor: "#f9f9f9",
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