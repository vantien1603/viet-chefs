import React, { useContext, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import Icon from "react-native-vector-icons/Ionicons";
import useAxios from "../../config/AXIOS_API";
import { AuthContext } from "../../config/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { commonStyles } from "../../style";
import * as Location from "expo-location";
import { t } from "i18next";

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [chef, setChef] = useState([]);
  const [dishes, setDishes] = useState([]);
  const axiosInstance = useAxios();
  const { user } = useContext(AuthContext);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [location, setLocation] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        return true;
      }
    );
    return () => backHandler.remove();
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await axiosInstance.get("/notifications/my");
      if (response.status === 200) {
        const unread = response.data.content.filter(
          (notification) => !notification.read
        ).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.log("Error fetching unread count", error?.response?.data);
    }
  };
  useEffect(() => {
    fetchUnreadCount();
  }, []);

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Quyền truy cập vị trí bị từ chối",
          "Vui lòng cấp quyền để tìm kiếm đầu bếp và món ăn gần bạn."
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
    let mounted = true;
    try {
      const savedAddress = await AsyncStorage.getItem("selectedAddress");

      if (!mounted) {
        console.log("Component unmounted, aborting loadData state update.");
        return;
      }

      if (savedAddress) {
        const parsedAddress = JSON.parse(savedAddress);
        // console.log("Địa chỉ đã lưu:", parsedAddress);
        setSelectedAddress(parsedAddress);

        if (parsedAddress.latitude && parsedAddress.longitude) {
          setLocation({
            latitude: parsedAddress.latitude,
            longitude: parsedAddress.longitude,
          });
        } else {
          const currentCoords = await getCurrentLocation();
          if (currentCoords) {
            setLocation(currentCoords);
          }
        }
      } else {
        const currentCoords = await getCurrentLocation();
        if (currentCoords) {
          setLocation(currentCoords);
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
    return () => {
      mounted = false;
    };
  };

  const fetchChef = async () => {
    let mounted = true;
    try {
      if (!location) {
        console.log("Chưa có vị trí, bỏ qua fetchChef.");
        return;
      }
      const response = await axiosInstance.get("/chefs/nearby", {
        params: {
          customerLat: location.latitude,
          customerLng: location.longitude,
          distance: 30,
          pageNo: 0,
          pageSize: 30,
          sortBy: "id",
          sortDir: "asc",
        },
      });
      if (!mounted) {
        console.log("Component unmounted, aborting chef state update.");
        return;
      }
      setChef(response.data.content.slice(0, 7));
    } catch (error) {
      if (error.response) {
        console.error(`Lỗi ${error.response.status}:`, error.response.data);
      } else {
        console.error(error.message);
      }
    }
    return () => {
      mounted = false;
    };
  };

  const fetchDishes = async () => {
    let mounted = true;
    try {
      if (!location) {
        console.log("Chưa có vị trí, bỏ qua fetchDishes.");
        return;
      }
      const response = await axiosInstance.get("/dishes/nearby", {
        params: {
          customerLat: location.latitude,
          customerLng: location.longitude,
          distance: 30,
          pageNo: 0,
          pageSize: 30,
          sortBy: "id",
          sortDir: "asc",
        },
      });
      if (!mounted) {
        console.log("Component unmounted, aborting dishes state update.");
        return;
      }
      setDishes(response.data.content.slice(0, 7));
    } catch (error) {
      if (error.response) {
        console.error(`Lỗi ${error.response.status}:`, error.response.data);
      } else {
        console.error(error.message);
      }
    }
    return () => {
      mounted = false;
    };
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (location) {
      fetchChef();
      fetchDishes();
    }
  }, [location]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const renderDishItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: "/screen/dishDetails",
          params: { dishId: item.id },
        })
      }
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.image}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.title}>{item.name}</Text>
      <Text style={{ color: "#F8BF40" }}>{item.description}</Text>
    </TouchableOpacity>
  );

  const renderChefItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: "/screen/chefDetail",
          params: { chefId: item.id },
        })
      }
    >
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri:
              item.user.avatarUrl === "default"
                ? "https://via.placeholder.com/120"
                : item.user.avatarUrl,
          }}
          style={styles.image}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.title}>{item.user.fullName}</Text>
      <Text style={{ color: "#F8BF40" }}>
        {item.specialization || "Đầu bếp"}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("screen/editAddress")}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={{ width: 50, height: 50 }}
              resizeMode="cover"
            />
            <View style={{ marginLeft: 10, maxWidth: 200 }}>
              <Text style={{ fontSize: 18, color: "#383838" }}>
                Hello, {user?.fullName || "Guest"}
              </Text>
              <Text
                style={{ fontSize: 12, color: "#968B7B" }}
                numberOfLines={2}
              >
                {selectedAddress
                  ? selectedAddress.address
                  : "Please select an address"}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/screen/notification")}>
          <View style={styles.notificationIconContainer}>
            <Ionicons name="notifications" size={30} color="#4EA0B7" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        // keyboardVerticalOffset={80}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 10 }}
        >
          <View style={{ marginBottom: 20, paddingHorizontal: 16 }}>
            <Image
              source={require("../../assets/images/promo.png")}
              style={{ width: "100%", height: 150, borderRadius: 30 }}
              resizeMode="cover"
            />
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              placeholder="Search..."
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => {
                const searchQuery = String(query || "").trim();
                router.push({
                  pathname: "/screen/searchResult",
                  params: {
                    query: searchQuery,
                    selectedAddress: selectedAddress
                      ? JSON.stringify(selectedAddress)
                      : null,
                  },
                });
              }}
              returnKeyType="search"
            />
            <Icon
              name="search"
              size={24}
              color="#4EA0B7"
              style={styles.searchIcon}
            />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("nearbyDishes")}</Text>
            <TouchableOpacity onPress={() => router.push("/screen/allDish")}>
              <Text style={{ color: "#4EA0B7", fontSize: 14 }}>
                {t("seeAll")}
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 30 }}
          >
            {dishes.map((item, index) => (
              <View
                key={index}
                style={{
                  width: 200,
                  alignItems: "center",
                  marginRight: 20,
                  marginLeft: index === 0 ? 16 : 0,
                }}
              >
                {renderDishItem({ item })}
              </View>
            ))}
          </ScrollView>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("nearbyChefs")}</Text>
            <TouchableOpacity onPress={() => router.push("/screen/allChef")}>
              <Text style={{ color: "#4EA0B7", fontSize: 14 }}>
                {t("seeAll")}
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 30 }}
          >
            {chef.map((item, index) => (
              <View
                key={index}
                style={{
                  width: 200,
                  alignItems: "center",
                  marginRight: 20,
                  marginLeft: index === 0 ? 16 : 0,
                }}
              >
                {renderChefItem({ item })}
              </View>
            ))}
          </ScrollView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  searchContainer: {
    position: "relative",
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  searchInput: {
    backgroundColor: "#FFF8EF",
    borderColor: "#ddd",
    borderWidth: 2,
    height: 60,
    borderRadius: 100,
    padding: 20,
    fontSize: 16,
    paddingRight: 50,
  },
  searchIcon: {
    position: "absolute",
    right: 26,
    top: "50%",
    transform: [{ translateY: -12 }],
  },
  card: {
    backgroundColor: "#A9411D",
    borderRadius: 16,
    padding: 16,
    paddingTop: 50,
    alignItems: "center",
    width: 200,
    position: "relative",
    marginTop: 20,
  },
  imageContainer: {
    width: 130,
    height: 130,
    borderRadius: 70,
    backgroundColor: "#FFF",
    overflow: "hidden",
    marginBottom: 8,
    position: "absolute",
    top: -20,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
    marginTop: 70,
    textAlign: "center",
    marginBottom: 5,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  notificationIconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    right: -8,
    top: -8,
    backgroundColor: '#A9411D',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
