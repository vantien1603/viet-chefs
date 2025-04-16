import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Dimensions,
  Keyboard,
  ActivityIndicator,
  BackHandler,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { commonStyles } from "../../style";
import Icon from "react-native-vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AXIOS_API from "../../config/AXIOS_API";
import * as Location from "expo-location";
import { Modalize } from "react-native-modalize";
import { Dropdown } from "react-native-element-dropdown";
import Toast from "react-native-toast-message";
import axios from "axios";
import useAxios from "../../config/AXIOS_API";
import { API_GEO_KEY } from "@env";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const SearchResultScreen = () => {
  const { query, selectedAddress: selectedAddressParam } = useLocalSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(query || "");
  const [isSelected, setIsSelected] = useState(0);
  const [chefs, setChefs] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const textInputRef = useRef(null);
  const [location, setLocation] = useState(null);
  const [distance, setDistance] = useState(10);
  const [tempDistance, setTempDistance] = useState(10);
  const modalizeRef = useRef(null);
  const addressModalizeRef = useRef(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(() => {
    try {
      return selectedAddressParam ? JSON.parse(selectedAddressParam) : null;
    } catch (error) {
      console.error("Error parsing selectedAddress:", error);
      return null;
    }
  });
  const axiosInstance = useAxios();

  const distanceOptions = [
    { label: "1 km", value: 1 },
    { label: "5 km", value: 5 },
    { label: "10 km", value: 10 },
    { label: "15 km", value: 15 },
    { label: "20 km", value: 20 },
    { label: "25 km", value: 25 },
  ];

  useEffect(() => {
    const backAction = () => {
      router.push("/(tabs)/home");
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [router]);

  useEffect(() => {
    // Cập nhật location nếu selectedAddress có tọa độ
    if (selectedAddress?.latitude && selectedAddress?.longitude) {
      setLocation({
        latitude: selectedAddress.latitude,
        longitude: selectedAddress.longitude,
      });
    }
  }, [selectedAddress]);

  const fetchAddresses = async () => {
    try {
      const response = await axiosInstance.get("/address/my-addresses");
      const fetchedAddresses = response.data;

      const addressesWithCoords = await Promise.all(
        fetchedAddresses.map(async (addr) => {
          try {
            const geocodeResponse = await axios.get(
              `https://maps.googleapis.com/maps/api/geocode/json`,
              {
                params: {
                  address: addr.address,
                  key: API_GEO_KEY,
                  language: "vi",
                },
              }
            );
            if (geocodeResponse.data.status === "OK") {
              const { lat, lng } =
                geocodeResponse.data.results[0].geometry.location;
              return { ...addr, latitude: lat, longitude: lng };
            }
            return { ...addr, latitude: null, longitude: null };
          } catch (error) {
            console.error(`Error geocoding address ${addr.address}:`, error);
            return { ...addr, latitude: null, longitude: null };
          }
        })
      );

      setAddresses(addressesWithCoords);
    } catch (error) {
      console.error("Error fetching addresses:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể tải danh sách địa chỉ",
      });
    }
  };

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Toast.show({
          type: "error",
          text1: "Quyền bị từ chối",
          text2: "Bạn cần bật dịch vụ định vị.",
        });
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      let reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        let addr = reverseGeocode[0];
        let fullAddress = `${addr.name || ""}, ${addr.street || ""}, ${
          addr.city || ""
        }, ${addr.region || ""}, ${addr.country || ""}`;

        const newAddress = {
          id: Date.now().toString(),
          title: "Vị trí hiện tại",
          address: fullAddress,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        setAddresses((prev) => [...prev, newAddress]);
        selectAddress(newAddress);
      }
    } catch (error) {
      console.error("Error getting current location:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể lấy vị trí",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const getLocationAndFetchData = async () => {
      setIsLoading(true);
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Denied",
            "Location permission is required to search nearby chefs and dishes. Please enable location services in your settings."
          );
          setLocation(null);
          const dishesResponse = await axiosInstance.get("/dishes/search", {
            params: { keyword: "" },
          });
          setDishes(dishesResponse.data.content);
        } else if (!location) {
          // Chỉ lấy vị trí nếu chưa có từ selectedAddress
          let userLocation = await Location.getCurrentPositionAsync({});
          setLocation({
            latitude: userLocation.coords.latitude,
            longitude: userLocation.coords.longitude,
          });
          console.log("User Location:", userLocation.coords);
          await fetchInitialData(
            userLocation.coords.latitude,
            userLocation.coords.longitude
          );
        } else {
          // Sử dụng location từ selectedAddress
          await fetchInitialData(location.latitude, location.longitude);
        }
      } catch (error) {
        console.log("Error getting location or fetching data:", error);
        Alert.alert(
          "Location Error",
          "Failed to fetch your location. Please ensure location services are enabled and try again."
        );
        setLocation(null);
        const dishesResponse = await axiosInstance.get("/dishes/search", {
          params: { keyword: "" },
        });
        setDishes(dishesResponse.data.content);
      } finally {
        setIsLoading(false);
      }

      await fetchAddresses();

      if (textInputRef.current) {
        textInputRef.current.focus();
      }
    };

    getLocationAndFetchData();
  }, [location]);

  const fetchInitialData = async (lat, lng) => {
    try {
      const dishesResponse = await axiosInstance.get("/dishes/search", {
        params: { keyword: "" },
      });
      const chefsResponse = await axiosInstance.get("/chefs/nearby", {
        params: {
          customerLat: lat,
          customerLng: lng,
          distance,
        },
      });
      setDishes(dishesResponse.data.content);
      setChefs(chefsResponse.data.content);
    } catch (error) {
      console.log("Error fetching initial data:", error);
    }
  };

  const options = [
    { index: 0, name: "Recommended" },
    { index: 1, name: "Chefs" },
    { index: 2, name: "Ratings" },
  ];

  const handleSearch = async () => {
    const trimmedQuery = searchQuery.trim().toLowerCase();
    if (trimmedQuery === "") return;

    if (
      !location &&
      (trimmedQuery.includes("near") || trimmedQuery.includes("nearby"))
    ) {
      Alert.alert(
        "Location Unavailable",
        "Location services are required for nearby searches. Please enable location services in your settings."
      );
      return;
    }

    setIsLoading(true);
    try {
      const dishesSearchResponse = await axiosInstance.get("/dishes/search", {
        params: { keyword: trimmedQuery },
      });
      const matchingDish = dishesSearchResponse.data.content.find((dish) =>
        dish.name?.toLowerCase().includes(trimmedQuery)
      );

      if (matchingDish) {
        setIsSelected(0);
        if (trimmedQuery.includes("near") || trimmedQuery.includes("nearby")) {
          const nearbyDishesResponse = await axiosInstance.get(
            "/dishes/nearby/search",
            {
              params: {
                keyword: trimmedQuery,
                customerLat: location.latitude,
                customerLng: location.longitude,
                distance,
              },
            }
          );
          setDishes(nearbyDishesResponse.data.content);
          setIsSelected(0);
        } else {
          setDishes(dishesSearchResponse.data.content);
        }
      } else {
        if (!location) {
          Alert.alert(
            "Location Unavailable",
            "Location services are required to search for nearby chefs. Please enable location services in your settings."
          );
          return;
        }

        const chefsResponse = await axiosInstance.get("/chefs/nearby", {
          params: {
            customerLat: location.latitude,
            customerLng: location.longitude,
            distance,
          },
        });
        const matchingChef = chefsResponse.data.content.find(
          (chef) =>
            chef?.user.fullName?.toLowerCase().includes(trimmedQuery) ||
            chef?.user.username?.toLowerCase().includes(trimmedQuery)
        );

        if (matchingChef) {
          setIsSelected(1);
          setChefs(chefsResponse.data.content);
        } else {
          setChefs([]);
          setIsSelected(1);
        }
      }
    } catch (error) {
      console.log("Error during search:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openFilterModal = () => {
    Keyboard.dismiss();
    setTempDistance(distance);
    modalizeRef.current?.open();
  };

  const applyFilter = async () => {
    setDistance(tempDistance);
    if (location) {
      setIsLoading(true);
      try {
        const chefsResponse = await axiosInstance.get("/chefs/nearby", {
          params: {
            customerLat: location.latitude,
            customerLng: location.longitude,
            distance: tempDistance,
          },
        });
        setChefs(chefsResponse.data.content);
      } catch (error) {
        console.log("Error refetching chefs with new distance:", error);
      } finally {
        setIsLoading(false);
      }
    }
    modalizeRef.current?.close();
  };

  const openAddressModal = () => {
    Keyboard.dismiss();
    addressModalizeRef.current?.open();
  };

  const selectAddress = (address) => {
    if (address.latitude && address.longitude) {
      setLocation({
        latitude: address.latitude,
        longitude: address.longitude,
      });
      setSelectedAddress(address);
      addressModalizeRef.current?.close();
    } else {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể lấy tọa độ của địa chỉ này",
      });
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.searchContainer}>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/home")}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color="#4EA0B7" />
        </TouchableOpacity>
        <View style={styles.searchInputWrapper}>
          <Icon
            name="search"
            size={24}
            color="#4EA0B7"
            style={styles.searchIcon}
          />
          <TextInput
            ref={textInputRef}
            placeholder="Search chefs or dishes"
            placeholderTextColor="#4EA0B7"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => handleSearch()}
            returnKeyType="search"
            autoFocus={true}
          />
        </View>
        <TouchableOpacity
          onPress={() => openFilterModal()}
          style={styles.filterButton}
        >
          <Icon name="filter" size={24} color="#4EA0B7" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() => openAddressModal()}
        style={styles.locationContainer}
      >
        <Icon
          name="location-outline"
          size={20}
          color="#4EA0B7"
          style={styles.locationIcon}
        />
        <Text style={styles.locationText}>
          {selectedAddress?.address || "Current Location"}
        </Text>
      </TouchableOpacity>

      <View style={styles.rowNgayGui}>
        <FlatList
          data={options}
          keyExtractor={(item) => item.index.toString()}
          horizontal
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.dayContainer,
                isSelected === item.index && styles.selectedDay,
              ]}
              onPress={() => setIsSelected(item.index)}
            >
              <Text
                style={
                  isSelected === item.index
                    ? styles.selectedText
                    : styles.normalText
                }
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
        />
      </View>
    </View>
  );

  const truncateText = (text, maxLength = 40) => {
    if (!text || text.length <= maxLength) return text || "";
    return text.substring(0, maxLength) + "...";
  };

  const renderItem = ({ item }) => {
    switch (isSelected) {
      case 1: // Chefs
        return (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: "/screen/chefDetail",
                params: { chefId: item.id },
              })
            }
          >
            <View style={styles.chefContainer}>
              {item.user.avatarUrl && (
                <Image
                  source={{ uri: item.user.avatarUrl }}
                  style={styles.avatar}
                  resizeMode="cover"
                />
              )}
              <View style={styles.chefInfo}>
                <Text style={styles.title}>
                  {truncateText(item.user.fullName)}
                </Text>
                <Text style={styles.description}>
                  {truncateText(item.description)}
                </Text>
                <Text style={styles.address}>{truncateText(item.address)}</Text>
                <Text style={styles.serving}>
                  Max Serving: {item.maxServingSize}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      case 0: // Recommended (dishes)
      default:
        return (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: "/screen/dishDetails",
                params: { dishId: item.id },
              })
            }
          >
            <View style={styles.dishContainer}>
              {item.imageUrl && (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.dishImage}
                  resizeMode="cover"
                />
              )}
              <View style={styles.dishInfo}>
                <Text style={styles.title}>{truncateText(item.name)}</Text>
                <Text style={styles.subtitle}>
                  By: {truncateText(item.chef.user.fullName)}
                </Text>
                <Text style={styles.description}>
                  {truncateText(item.description)}
                </Text>
                <Text style={styles.cuisine}>
                  Cuisine: {truncateText(item.cuisineType)}
                </Text>
                <Text style={styles.cookTime}>
                  Cook Time: {item.cookTime} min
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        );
    }
  };

  const getData = () => {
    switch (isSelected) {
      case 1:
        return chefs;
      case 0:
      default:
        return dishes;
    }
  };

  const renderEmptyMessage = () => {
    if (isSelected === 1 && chefs.length === 0 && location) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Không có đầu bếp nào gần đây</Text>
        </View>
      );
    }
    return null;
  };

  const renderFilterModal = () => (
    <Modalize
      ref={modalizeRef}
      handlePosition="outside"
      modalStyle={styles.modal}
      handleStyle={styles.handle}
      adjustToContentHeight={true}
    >
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Filter Options</Text>
        <View style={styles.dropdownContainer}>
          <Text style={styles.dropdownLabel}>Distance</Text>
          <Dropdown
            style={styles.dropdown}
            data={distanceOptions}
            labelField="label"
            valueField="value"
            placeholder="Select distance"
            value={tempDistance}
            onChange={(item) => setTempDistance(item.value)}
            selectedTextStyle={styles.selectedTextStyle}
            placeholderStyle={styles.placeholderStyle}
            itemTextStyle={styles.itemTextStyle}
            containerStyle={styles.dropdownItemContainer}
          />
        </View>
        <View style={styles.modalButtons}>
          <TouchableOpacity
            onPress={() => modalizeRef.current?.close()}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={applyFilter} style={styles.applyButton}>
            <Text style={styles.applyButtonText}>Apply Filter</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modalize>
  );

  const renderAddressModal = () => (
    <Modalize
      ref={addressModalizeRef}
      handlePosition="outside"
      modalStyle={styles.modal}
      handleStyle={styles.handle}
      adjustToContentHeight={true}
    >
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Select Address</Text>
        {addresses.length === 0 ? (
          <Text style={styles.emptyText}>
            Bạn chưa có địa chỉ nào. Hãy thêm địa chỉ mới!
          </Text>
        ) : (
          addresses.map((item) => (
            <TouchableOpacity
              key={item.id.toString()}
              onPress={() => selectAddress(item)}
              style={styles.addressItem}
            >
              <View style={styles.addressInfo}>
                <Text style={styles.addressTitle}>{item.title}</Text>
                <Text style={styles.addressText}>{item.address}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
        <TouchableOpacity
          onPress={() => getCurrentLocation()}
          style={{
            backgroundColor: "#A64B2A",
            padding: 15,
            borderRadius: 10,
            alignItems: "center",
            marginVertical: 10,
          }}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
              Sử dụng vị trí hiện tại
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => addressModalizeRef.current?.close()}
          style={styles.cancelButton}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modalize>
  );

  return (
    <GestureHandlerRootView style={commonStyles.containerContent}>
      {renderHeader()}
      <FlatList
        data={getData()}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={renderEmptyMessage}
        contentContainerStyle={styles.flatListContainer}
        numColumns={2}
        columnWrapperStyle={styles.row}
      />

      {renderFilterModal()}
      {renderAddressModal()}
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: "#EBE5DD",
    paddingTop: 10,
    zIndex: 1,
  },
  flatListContainer: {
    paddingBottom: 10,
    paddingTop: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  backButton: {
    marginRight: 10,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EBE5DD",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#4EA0B7",
  },
  searchInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 10,
    fontSize: 16,
    color: "#4EA0B7",
  },
  searchIcon: {
    marginLeft: 15,
  },
  filterButton: {
    marginLeft: 10,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  locationIcon: {
    marginRight: 8,
  },
  locationText: {
    fontSize: 14,
    color: "#333",
    flex: 1, // Thay flexShrink để hiển thị đầy đủ địa chỉ
    flexWrap: "wrap",
  },
  card: {
    backgroundColor: "#A9411D",
    borderRadius: 16,
    padding: 10,
    margin: 5,
    flex: 1,
    width: screenWidth * 0.45,
    height: 280,
    maxWidth: "48%",
  },
  chefContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  avatar: {
    width: "100%",
    height: 120,
    borderRadius: 10,
    marginBottom: 8,
  },
  chefInfo: {
    alignItems: "flex-start",
  },
  dishContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  dishImage: {
    width: "100%",
    height: 120,
    borderRadius: 10,
    marginBottom: 8,
  },
  dishInfo: {
    alignItems: "flex-start",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: "#F8BF40",
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: "#FFF",
    marginBottom: 4,
  },
  address: {
    fontSize: 10,
    color: "#EBE5DD",
    marginBottom: 4,
  },
  cuisine: {
    fontSize: 12,
    color: "#EBE5DD",
    marginBottom: 4,
  },
  serving: {
    fontSize: 12,
    color: "#F8BF40",
  },
  cookTime: {
    fontSize: 12,
    color: "#F8BF40",
  },
  rowNgayGui: {
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  dayContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 10,
    alignItems: "center",
    backgroundColor: "#FFF8EF",
    borderRadius: 20,
  },
  selectedDay: {
    backgroundColor: "#4EA0B7",
  },
  normalText: {
    color: "#333",
  },
  selectedText: {
    color: "#FFF",
  },
  row: {
    justifyContent: "space-between",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
  },
  modal: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handle: {
    backgroundColor: "#4EA0B7",
  },
  modalContent: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  dropdownContainer: {
    marginBottom: 20,
  },
  dropdownLabel: {
    fontSize: 16,
    color: "#333",
    marginBottom: 10,
  },
  dropdown: {
    height: 50,
    borderColor: "#4EA0B7",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: "#EBE5DD",
  },
  selectedTextStyle: {
    fontSize: 16,
    color: "#333",
  },
  placeholderStyle: {
    fontSize: 16,
    color: "#4EA0B7",
  },
  itemTextStyle: {
    fontSize: 16,
    color: "#333",
  },
  dropdownItemContainer: {
    borderRadius: 8,
    borderColor: "#4EA0B7",
    borderWidth: 1,
    maxHeight: 300,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    backgroundColor: "#EBE5DD",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  cancelButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "bold",
  },
  applyButton: {
    backgroundColor: "#4EA0B7",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    flex: 1,
  },
  applyButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  addressItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  addressInfo: {
    flex: 1,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  addressText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
});

export default SearchResultScreen;