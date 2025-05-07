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
  const [priceRange, setPriceRange] = useState(null);
  const [tempPriceRange, setTempPriceRange] = useState(null);
  const [rateRange, setRateRange] = useState(null);
  const [tempRateRange, setTempRateRange] = useState(null); // Sửa từ tempRateRang
  const [activeFilter, setActiveFilter] = useState(null);
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
  const [lastParams, setLastParams] = useState(null);
  const [lastDishResults, setLastDishResults] = useState([]);
  const [lastChefResults, setLastChefResults] = useState([]);

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

  const rateRangeOptions = [
    { label: "1 sao trở lên", value: { min: 1, max: 5 } },
    { label: "2 sao trở lên", value: { min: 2, max: 5 } },
    { label: "3 sao trở lên", value: { min: 3, max: 5 } },
    { label: "4 sao trở lên", value: { min: 4, max: 5 } },
    { label: "5 sao", value: { min: 5, max: 5 } },
  ];

  const filterFields = [
    { index: 0, name: "Distance", value: distance ? `${distance} km` : "All" },
    { index: 1, name: "Price", value: priceRange ? priceRange.label : "All" },
    { index: 2, name: "Rating", value: rateRange ? rateRange.label : "All" },
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

  const fetchData = async (params) => {
    const {
      keyword = searchQuery || "",
      lat = location?.latitude,
      lng = location?.longitude,
      distance: dist = distance,
      priceRange: pr = priceRange,
      rateRange: ra = rateRange,
      isSearch = false,
    } = params;

    const apiParams = {
      keyword,
      customerLat: lat,
      customerLng: lng,
      distance: dist,
      ...(pr && { minPrice: pr.value.min, maxPrice: pr.value.max }),
      ...(ra && { minRate: ra.value.min, maxRate: ra.value.max }),
    };

    console.log("API Params:", apiParams);

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

      let chefsData = chefsResponse.data.content;
      const dishesData = dishesResponse.data.content;

      console.log("Raw Chefs Data:", chefsData);

      // Lọc chefs theo averageRating tại client-side (nếu API không lọc)
      if (ra) {
        chefsData = chefsData.filter(
          (chef) =>
            chef.averageRating >= ra.value.min &&
            chef.averageRating <= ra.value.max
        );
      }

      // Sắp xếp chefs theo averageRating (giảm dần)
      chefsData = chefsData.sort((a, b) => b.averageRating - a.averageRating);

      console.log("Filtered and Sorted Chefs:", chefsData);

      setDishes(dishesData);
      setChefs(chefsData);
      setLastDishResults(dishesData);
      setLastChefResults(chefsData);
      setLastParams({ ...apiParams });

      if (chefsData.length === 0 && ra) {
        Toast.show({
          type: "info",
          text1: "No Results",
          text2: "No chefs found with the selected rating filter",
        });
      }

      if (isSearch) {
        const isChefPriority =
          type === "chef" || keyword.toLowerCase().includes("chef");
        setIsSelected(isChefPriority && chefsData.length > 0 ? 1 : 0);
      } else if (type === "chef") {
        setIsSelected(1);
      }
    } catch (error) {
      console.log("Error fetching data:", error);
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
      if (selectedAddress?.latitude && selectedAddress?.longitude) {
        setLocation({
          latitude: selectedAddress.latitude,
          longitude: selectedAddress.longitude,
        });
        await fetchData({
          keyword: query || "",
          lat: selectedAddress.latitude,
          lng: selectedAddress.longitude,
          isSearch: !!query,
        });
      } else {
        let userLocation = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
        });
        await fetchData({
          keyword: query || "",
          lat: userLocation.coords.latitude,
          lng: userLocation.coords.longitude,
          isSearch: !!query,
        });
      }

      await fetchAddresses();

      if (textInputRef.current) {
        textInputRef.current.focus();
      }
    };

    getLocationAndFetchData();
  }, [selectedAddress]);

  const handleSearch = async () => {
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery === "") return;

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

  const openFilterModal = (filterName) => {
    Keyboard.dismiss();
    setActiveFilter(filterName);
    setTempDistance(distance);
    setTempPriceRange(priceRange);
    setTempRateRange(rateRange); // Sửa từ tempRateRang
    modalizeRef.current?.open();
  };

  const applyFilter = async () => {
    if (activeFilter === "Distance") {
      setDistance(tempDistance);
    } else if (activeFilter === "Price") {
      setPriceRange(tempPriceRange);
    } else if (activeFilter === "Rating") {
      setRateRange(tempRateRange); // Sửa từ tempRateRang
    }

    if (location) {
      await fetchData({
        lat: location.latitude,
        lng: location.longitude,
        distance: activeFilter === "Distance" ? tempDistance : distance,
        priceRange: activeFilter === "Price" ? tempPriceRange : priceRange,
        rateRange: activeFilter === "Rating" ? tempRateRange : rateRange,
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
            editable={true}
          />
        </View>
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

      <View style={styles.filterContainer}>
        <TouchableOpacity style={{ marginRight: 10 }}>
          <Icon name="filter" size={24} color="#4EA0B7" />
        </TouchableOpacity>
        <FlatList
          data={filterFields}
          keyExtractor={(item) => item.index.toString()}
          horizontal
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.filterItem}
              onPress={() => openFilterModal(item.name)}
            >
              <Text style={styles.filterText}>
                {item.name}: {item.value}
              </Text>
              <Icon
                name="chevron-down"
                size={16}
                color="#4EA0B7"
                style={styles.filterIcon}
              />
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
          style={styles.filterList}
        />
      </View>

      <View style={styles.rowNgayGui}>
        <FlatList
          data={[
            { index: 0, name: "Recommended" },
            { index: 1, name: "Chefs" },
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
                <View style={{ flexDirection: "row" }}>
                  <Text style={styles.title}>
                    {truncateText(item.user.fullName)}
                  </Text>
                  <Text style={styles.rating}>
                    {item.averageRating.toFixed(1)} ⭐
                  </Text>
                </View>
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
                params: { dishId: item.id, chefId: item.chef.id.toString() },
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

        {activeFilter === "Distance" && (
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
        )}

        {activeFilter === "Price" && (
          <View style={styles.dropdownContainer}>
            <Text style={styles.dropdownLabel}>Price Range</Text>
            <Dropdown
              style={styles.dropdown}
              data={priceRangeOptions}
              labelField="label"
              valueField="value"
              placeholder="Select price range"
              value={tempPriceRange}
              onChange={(item) => setTempPriceRange(item)}
              selectedTextStyle={styles.selectedTextStyle}
              placeholderStyle={styles.placeholderStyle}
              itemTextStyle={styles.itemTextStyle}
              containerStyle={styles.dropdownItemContainer}
            />
          </View>
        )}

        {activeFilter === "Rating" && (
          <View style={styles.dropdownContainer}>
            <Text style={styles.dropdownLabel}>Rating Range</Text>
            <Dropdown
              style={styles.dropdown}
              data={rateRangeOptions}
              labelField="label"
              valueField="value"
              placeholder="Select rating range"
              value={tempRateRange}
              onChange={(item) => setTempRateRange(item)}
              selectedTextStyle={styles.selectedTextStyle}
              placeholderStyle={styles.placeholderStyle}
              itemTextStyle={styles.itemTextStyle}
              containerStyle={styles.dropdownItemContainer}
            />
          </View>
        )}

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
          onPress={() => {
            setLoading(true);
            Location.getCurrentPositionAsync({})
              .then((location) => {
                const newAddress = {
                  id: Date.now().toString(),
                  title: "Current Location",
                  address: `${location.coords.latitude}, ${location.coords.longitude}`,
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                };
                setAddresses((prev) => [...prev, newAddress]);
                selectAddress(newAddress);
              })
              .catch((error) => {
                console.error("Error getting current location:", error);
                Toast.show({
                  type: "error",
                  text1: "Error",
                  text2: "Failed to get current location",
                });
              })
              .finally(() => setLoading(false));
          }}
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
  filterContainer: {
    marginBottom: 10,
    paddingHorizontal: 10,
    flexDirection: "row",
  },
  filterList: {
    flexGrow: 0,
  },
  filterItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    backgroundColor: "#FFF8EF",
    borderRadius: 20,
  },
  filterText: {
    fontSize: 14,
    color: "#333",
    marginRight: 5,
  },
  filterIcon: {
    marginLeft: 5,
  },
  card: {
    backgroundColor: "#A9411D",
    borderRadius: 16,
    padding: 10,
    margin: 5,
    flex: 1,
    width: screenWidth * 0.45,
    height: 270,
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
  rating: {
    fontSize: 14,
    color: "#FFF",
    marginBottom: 4,
    marginLeft: 20,
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