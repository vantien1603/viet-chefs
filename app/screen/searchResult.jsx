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
import useAxios from "../../config/AXIOS_API";
import * as Location from "expo-location";
import { Modalize } from "react-native-modalize";
import { Dropdown } from "react-native-element-dropdown";
import Toast from "react-native-toast-message";
import axios from "axios";
import { API_GEO_KEY } from "@env";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const SearchResultScreen = () => {
  const {
    query,
    selectedAddress: selectedAddressParam,
    type,
  } = useLocalSearchParams();
  const router = useRouter();
  const axiosInstance = useAxios();
  const [searchQuery, setSearchQuery] = useState(query || "");
  const [isSelected, setIsSelected] = useState(type === "chef" ? 1 : 0);
  const [chefs, setChefs] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const textInputRef = useRef(null);
  const [location, setLocation] = useState(null);
  const [distance, setDistance] = useState(30);
  const [tempDistance, setTempDistance] = useState(30);
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
  const [lastParams, setLastParams] = useState(null); // Lưu tham số lần gọi trước
  const [lastDishResults, setLastDishResults] = useState([]); // Lưu kết quả món ăn
  const [lastChefResults, setLastChefResults] = useState([]); // Lưu kết quả đầu bếp

  const distanceOptions = [
    { label: "1 km", value: 1 },
    { label: "5 km", value: 5 },
    { label: "10 km", value: 10 },
    { label: "15 km", value: 15 },
    { label: "20 km", value: 20 },
    { label: "25 km", value: 25 },
    { label: "30 km", value: 30 },
  ];

  const priceRangeOptions = [
    { label: "Under $10", value: { min: 0, max: 10 } },
    { label: "$10 - $100", value: { min: 10, max: 100 } },
    { label: "$100 - $1000", value: { min: 100, max: 1000 } },
    { label: "Over $1000", value: { min: 1000, max: Infinity } },
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

      const addressesWithCoords = [];
      for (const addr of fetchedAddresses) {
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
            addressesWithCoords.push({
              ...addr,
              latitude: lat,
              longitude: lng,
            });
          } else {
            addressesWithCoords.push({
              ...addr,
              latitude: null,
              longitude: null,
            });
          }
        } catch (error) {
          console.error(`Error geocoding address ${addr.address}:`, error);
          addressesWithCoords.push({
            ...addr,
            latitude: null,
            longitude: null,
          });
        }
      }

      setAddresses(addressesWithCoords);
    } catch (error) {
      console.error("Error fetching addresses:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load address list",
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
          text1: "Permission Denied",
          text2: "Location services are required.",
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
          title: "Current Location",
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
        text1: "Error",
        text2: "Failed to get location",
      });
    } finally {
      setLoading(false);
    }
  };
  //   if (!keyword || keyword.trim().length < 2) {
  //     setSuggestions([]);
  //     setShowSuggestions(false);
  //     return;
  //   }

  //   const params = {
  //     keyword,
  //     customerLat: location?.latitude || 0,
  //     customerLng: location?.longitude || 0,
  //     distance,
  //   };

  //   // Kiểm tra tham số để sử dụng cache
  //   if (lastParams && JSON.stringify(params) === JSON.stringify(lastParams)) {
  //     setSuggestions(suggestions);
  //     setShowSuggestions(suggestions.length > 0);
  //     return;
  //   }

  //   try {
  //     const dishesResponse = await axiosInstance.get("/dishes/nearby/search", {
  //       params,
  //     });
  //     const chefsResponse = await axiosInstance.get("/chefs/nearby/search", {
  //       params,
  //     });

  //     const dishSuggestions = dishesResponse.data.content
  //       .map((dish) => ({
  //         type: "dish",
  //         id: dish.id,
  //         name: dish.name,
  //         imageUrl: dish.imageUrl,
  //       }))
  //       .slice(0, 5);

  //     const chefSuggestions = chefsResponse.data.content
  //       .map((chef) => ({
  //         type: "chef",
  //         id: chef.id,
  //         name: chef.user.fullName || chef.user.username,
  //         imageUrl: chef.user.avatarUrl,
  //       }))
  //       .slice(0, 5);

  //     const combinedSuggestions = [...dishSuggestions, ...chefSuggestions];
  //     setSuggestions(combinedSuggestions);
  //     setShowSuggestions(combinedSuggestions.length > 0);
  //     setLastParams(params); // Cập nhật tham số lần gọi
  //   } catch (error) {
  //     console.error("Error fetching suggestions:", error);
  //     setSuggestions([]);
  //     setShowSuggestions(false);
  //   }
  // };

  // useEffect(() => {
  //   const delayDebounceFn = setTimeout(() => {
  //     // fetchSuggestions(searchQuery);
  //   }, 500); // Tăng debounce lên 500ms

  //   return () => clearTimeout(delayDebounceFn);
  // }, [searchQuery, location, distance]);

  const fetchData = async (params) => {
    const {
      keyword = searchQuery || "",
      lat = location?.latitude,
      lng = location?.longitude,
      distance: dist = distance,
      isSearch = false,
    } = params;

    if (!lat || !lng) {
      setDishes([]);
      setChefs([]);
      return;
    }

    const apiParams = {
      keyword,
      customerLat: lat,
      customerLng: lng,
      distance: dist,
    };

    // Kiểm tra cache
    if (
      lastParams &&
      JSON.stringify({
        ...apiParams,
      }) === JSON.stringify(lastParams)
    ) {
      setDishes(lastDishResults);
      setChefs(lastChefResults);
      if (isSearch) {
        const isChefPriority =
          type === "chef" || keyword.toLowerCase().includes("chef");
        setIsSelected(isChefPriority && lastChefResults.length > 0 ? 1 : 0);
      }
      return;
    }

    try {
      setIsLoading(true);

      const dishesResponse = await axiosInstance.get("/dishes/nearby/search", {
        params: {
          ...apiParams,
        },
      });

      const chefsResponse = await axiosInstance.get("/chefs/nearby/search", {
        params: {
          ...apiParams,
        },
      });

      const dishesData = dishesResponse.data.content;
      const chefsData = chefsResponse.data.content;

      setDishes(dishesData);
      setChefs(chefsData);
      setLastDishResults(dishesData);
      setLastChefResults(chefsData);
      setLastParams({ ...apiParams });

      if (isSearch) {
        const isChefPriority =
          type === "chef" || keyword.toLowerCase().includes("chef");
        setIsSelected(isChefPriority && chefsData.length > 0 ? 1 : 0);
      } else if (type === "chef") {
        setIsSelected(1);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setDishes([]);
      setChefs([]);
      if (isSearch) {
        setIsSelected(1);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const getLocationAndFetchData = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Denied",
            "Location permission is required to search nearby chefs and dishes."
          );
          setLocation(null);
          setDishes([]);
          setChefs([]);
          return;
        }

        if (!location) {
          let userLocation = await Location.getCurrentPositionAsync({});
          setLocation({
            latitude: userLocation.coords.latitude,
            longitude: userLocation.coords.longitude,
          });
          await fetchData({
            lat: userLocation.coords.latitude,
            lng: userLocation.coords.longitude,
          });
        } else {
          await fetchData({ lat: location.latitude, lng: location.longitude });
        }
      } catch (error) {
        console.error("Error getting location:", error);
        Alert.alert(
          "Location Error",
          "Failed to fetch your location. Please ensure location services are enabled."
        );
        setLocation(null);
        setDishes([]);
        setChefs([]);
      }

      await fetchAddresses();

      if (textInputRef.current) {
        textInputRef.current.focus();
      }
    };

    getLocationAndFetchData();
  }, [location]);

  const handleSearch = async () => {
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery === "") return;

    if (!location) {
      Alert.alert(
        "Location Unavailable",
        "Location services are required for searches."
      );
      return;
    }

    await fetchData({
      keyword: trimmedQuery,
      lat: location.latitude,
      lng: location.longitude,
      isSearch: true,
    });
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
        text1: "Error",
        text2: "Cannot retrieve coordinates for this address",
      });
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
      await fetchData({
        lat: location.latitude,
        lng: location.longitude,
        distance: tempDistance,
      });
    }
    modalizeRef.current?.close();
  };

  const openAddressModal = () => {
    Keyboard.dismiss();
    addressModalizeRef.current?.open();
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
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/screen/search",
                params: {
                  query: searchQuery,
                  selectedAddress: selectedAddress
                    ? JSON.stringify(selectedAddress)
                    : null,
                },
              })
            }
          >
            <Icon
              name="search"
              size={24}
              color="#4EA0B7"
              style={styles.searchIcon}
            />
          </TouchableOpacity>
          <TextInput
            ref={textInputRef}
            placeholder="Search chefs or dishes"
            placeholderTextColor="#4EA0B7"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            onPressIn={() =>
              router.push({
                pathname: "/screen/search",
                params: {
                  query: searchQuery,
                  selectedAddress: selectedAddress
                    ? JSON.stringify(selectedAddress)
                    : null,
                },
              })
            }
            returnKeyType="search"
            autoFocus={true}
            editable={true} // Ngăn nhập văn bản, chỉ để hiển thị và nhấn
          />
        </View>
        <TouchableOpacity onPress={openFilterModal} style={styles.filterButton}>
          <Icon name="filter" size={24} color="#4EA0B7" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={openAddressModal}
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
          data={[
            { index: 0, name: "Recommended" },
            { index: 1, name: "Chefs" },
            { index: 2, name: "Ratings" },
          ]}
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
                {/* {item.rating && (
                  <Text style={styles.rating}>Rating: {item.rating} ⭐</Text>
                )} */}
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
                <Text style={styles.price}>Price: ${item.basePrice}</Text>
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
          <Text style={styles.emptyText}>No chefs found nearby</Text>
        </View>
      );
    }
    if (isSelected === 0 && dishes.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No dishes found</Text>
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
            You have no saved addresses. Add a new one!
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
          onPress={getCurrentLocation}
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
              Use Current Location
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
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4EA0B7" />
        </View>
      ) : (
        <FlatList
          data={getData()}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={renderEmptyMessage}
          contentContainerStyle={styles.flatListContainer}
          numColumns={2}
          columnWrapperStyle={styles.row}
        />
      )}
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
    flex: 1,
    flexWrap: "wrap",
  },
  card: {
    backgroundColor: "#A9411D",
    borderRadius: 16,
    padding: 10,
    margin: 5,
    flex: 1,
    width: screenWidth * 0.45,
    height: 300,
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
  price: {
    fontSize: 12,
    color: "#F8BF40",
  },
  rating: {
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
