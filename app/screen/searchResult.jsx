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
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useContext,
} from "react";
import { commonStyles } from "../../style";
import Icon from "react-native-vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import useAxios from "../../config/AXIOS_API";
import * as Location from "expo-location";
import { Modalize } from "react-native-modalize";
import axios from "axios";
import { AuthContext } from "../../config/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCommonNoification } from "../../context/commonNoti";
import { t } from "i18next";

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
  const [isSelected, setIsSelected] = useState(type === "chef" ? 1 : 0 ? 2 : 0);
  const [chefs, setChefs] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [menus, setMenus] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const textInputRef = useRef(null);
  const [location, setLocation] = useState(null);
  const [distance, setDistance] = useState(30);
  const [tempDistance, setTempDistance] = useState(null);
  const [dishPriceRange, setDishPriceRange] = useState(null);
  const [chefPriceRange, setChefPriceRange] = useState(null);
  const [tempDishPriceRange, setTempDishPriceRange] = useState(null);
  const [tempChefPriceRange, setTempChefPriceRange] = useState(null);

  const [rateRange, setRateRange] = useState(null);
  const [tempRateRange, setTempRateRange] = useState(null);
  const modalizeRef = useRef(null);
  const addressModalizeRef = useRef(null);
  const [addresses, setAddresses] = useState([]);
  const { isGuest } = useContext(AuthContext);
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
  const [lastMenuResults, setLastMenuResults] = useState([]);

  const distanceOptions = useMemo(
    () => t("filterOptions.distance", { returnObjects: true }),
    []
  );
  const dishPriceRangeOptions = useMemo(
    () => t("filterOptions.dishPriceRange", { returnObjects: true }),
    []
  );
  const chefPriceRangeOptions = useMemo(
    () => t("filterOptions.chefPriceRange", { returnObjects: true }),
    []
  );
  const rateRangeOptions = useMemo(
    () => t("filterOptions.rateRange", { returnObjects: true }),
    []
  );

  const filterFields = useMemo(
    () => [
      {
        index: 0,
        name: t("distance"),
        value: distance ? `${distance} km` : t("all"),
      },
      {
        index: 1,
        name: t("dishPrice"),
        value: dishPriceRange
          ? dishPriceRange.label
          : t("all"),
      },
      {
        index: 2,
        name: t("chefPrice"),
        value: chefPriceRange
          ? chefPriceRange.label
          : t("all"),
      },
      {
        index: 3,
        name: t("chefRating"),
        value: rateRange ? rateRange.label : t("all"),
      },
    ],
    [distance, dishPriceRange, chefPriceRange, rateRange]
  );

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
      if (isGuest) return;
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
                key: process.env.API_GEO_KEY,
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
    }
  };

  const fetchData = async (params) => {
    const {
      keyword = searchQuery || "",
      lat = location?.latitude,
      lng = location?.longitude,
      distance: dist = distance,
      dishPriceRange: dpr = dishPriceRange,
      chefPriceRange: cpr = chefPriceRange,
      rateRange: ra = rateRange,
      isSearch = false,
    } = params;

    // Params for dish API call
    const dishApiParams = {
      keyword,
      customerLat: lat,
      customerLng: lng,
      distance: dist,
      ...(dpr && { minPrice: dpr.value.min, maxPrice: dpr.value.max }), // Chỉ áp dụng dpr cho món ăn
    };

    // Params for chef API call
    const chefApiParams = {
      keyword,
      customerLat: lat,
      customerLng: lng,
      distance: dist,
      // Nếu API của bạn hỗ trợ lọc giá đầu bếp, bạn có thể thêm vào đây
      ...(ra && { minRate: ra.value.min, maxRate: ra.value.max }),
    };

    //Params for menu API call
    const menuApiParams = {
      keyword,
      customerLat: lat,
      customerLng: lng,
      distance: dist,
    };

    if (
      lastParams &&
      JSON.stringify({
        ...dishApiParams,
        ...chefApiParams,
        ...menuApiParams,
        chefPriceRange: cpr, // Thêm vào để phản ánh trạng thái lọc giá đầu bếp
      }) === JSON.stringify(lastParams)
    ) {
      setDishes(lastDishResults);
      setChefs(lastChefResults);
      setMenus(lastMenuResults);
      if (isSearch) {
        const isChefPriority =
          type === "chef" || keyword.toLowerCase().includes("chef");
        setIsSelected(isChefPriority && lastChefResults.length > 0 ? 1 : 0);
      }
      return;
    }

    try {
      setLoading(true);

      const dishesResponse = await axiosInstance.get("/dishes/nearby/search", {
        params: dishApiParams,
      });

      const chefsResponse = await axiosInstance.get("/chefs/nearby/search", {
        params: chefApiParams,
      });

      const menusResponse = await axiosInstance.get("/menus/nearby/search", {
        params: menuApiParams,
      });
      console.log("dish", dishesResponse.data);
      console.log("menu", menusResponse.data);

      let chefsData = chefsResponse.data.content;
      let dishesData = dishesResponse.data.content;
      const menusData = menusResponse.data;

      // Áp dụng lọc giá đầu bếp phía client
      if (cpr) {
        chefsData = chefsData.filter(
          (chef) => chef.price >= cpr.value.min && chef.price <= cpr.value.max
        );
      }

      // Áp dụng lọc giá món ăn phía client nếu cần
      if (dpr) {
        dishesData = dishesData.filter(
          (dish) =>
            dish.basePrice >= dpr.value.min && dish.basePrice <= dpr.value.max
        );
      }

      if (ra) {
        chefsData = chefsData.filter(
          (chef) =>
            chef.averageRating >= ra.value.min &&
            chef.averageRating <= ra.value.max
        );
      }

      chefsData = chefsData.sort((a, b) => b.averageRating - a.averageRating);

      setDishes(dishesData);
      setChefs(chefsData);
      setMenus(menusData);
      setLastDishResults(dishesData);
      setLastChefResults(chefsData);
      setLastMenuResults(menusData);
      setLastParams({
        ...dishApiParams,
        ...chefApiParams,
        ...menuApiParams,
        chefPriceRange: cpr, // Thêm vào để phản ánh trạng thái lọc giá đầu bếp
      });

      if (isSearch) {
        const isChefPriority =
          type === "chef" || keyword.toLowerCase().includes("chef");
        setIsSelected(isChefPriority && chefsData.length > 0 ? 1 : 0);
      } else if (type === "chef") {
        setIsSelected(1);
      } else if (type === "menu") {
        setIsSelected(2);
      }
    } catch (error) {
      console.log("Error fetching data:", error);
      setDishes([]);
      setChefs([]);
      setMenus([]);
      if (isSearch) {
        setIsSelected(1);
      }
      if (axios.isCancel(error)) {
        return;
      }
      showModal(
        t("modal.error"),
        error.response?.data?.message || t("errors.fetchDataFailed"),
        t("modal.failed")
      );
    } finally {
      setLoading(false);
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
    }
  };

  const openFilterModal = () => {
    Keyboard.dismiss();
    setTempDistance(distance);
    setTempDishPriceRange(dishPriceRange);
    setTempChefPriceRange(chefPriceRange);
    setTempRateRange(rateRange);
    modalizeRef.current?.open();
  };

  const applyFilter = async () => {
    setDistance(tempDistance);
    setDishPriceRange(tempDishPriceRange);
    setChefPriceRange(tempChefPriceRange);
    setRateRange(tempRateRange);

    if (location) {
      await fetchData({
        lat: location.latitude,
        lng: location.longitude,
        distance: tempDistance,
        dishPriceRange: tempDishPriceRange,
        chefPriceRange: tempChefPriceRange,
        rateRange: tempRateRange,
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
            placeholder={t("searchPlaceholder")}
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
        <TouchableOpacity onPress={openFilterModal} style={{ marginRight: 10 }}>
          <Icon name="filter" size={24} color="#4EA0B7" />
        </TouchableOpacity>
        <FlatList
          data={filterFields}
          keyExtractor={(item) => item.index.toString()}
          horizontal
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.filterItem}
              onPress={openFilterModal}
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
            { index: 0, name: t("recommendedDishes") },
            { index: 1, name: t("chefs") },
            { index: 2, name: t("menus") },
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

  const RenderItem = ({ item }) => {
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
            <View style={styles.container}>
              {item.user.avatarUrl && (
                <Image
                  source={{ uri: item.user.avatarUrl }}
                  style={styles.image}
                  resizeMode="cover"
                />
              )}
              <View style={styles.info}>
                <Text style={styles.title}>
                  {truncateText(item.user.fullName)}
                </Text>
                <Text
                  style={styles.description}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {truncateText(item.description)}
                </Text>
                <Text
                  style={styles.address}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {truncateText(item.address)}
                </Text>
                <Text style={styles.description}>
                  {t("maxServing")}: {item.maxServingSize}
                </Text>
                <Text style={styles.description}>{t("pricePerHour")}: {item.price}</Text>
              </View>
              <Text style={styles.rating}>
                ⭐{item.averageRating.toFixed(1)}
              </Text>
            </View>
          </TouchableOpacity>
        );
      case 2:
        return (
          <TouchableOpacity style={styles.card}>
            <View style={styles.container}>
              {item.imageUrl && (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.image}
                  resizeMode="cover"
                />
              )}
              <View style={styles.info}>
                <Text style={styles.title}>{truncateText(item.name)}</Text>
                <Text style={styles.subtitle}>
                  {t("chef")}: {truncateText(item.chef.user.fullName)}
                </Text>
                <Text style={styles.description}>
                  {truncateText(item.description)}
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
            <View style={styles.container}>
              {item.imageUrl && (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.image}
                  resizeMode="cover"
                />
              )}
              <View style={styles.info}>
                <Text style={styles.title}>{truncateText(item.name)}</Text>
                <Text style={styles.subtitle}>
                  {t("chef")}: {truncateText(item.chef.user.fullName)}
                </Text>
                <Text style={styles.description}>
                  {truncateText(item.description)}
                </Text>
                <Text style={styles.cuisine}>
                  {t("Ccuisine")}: {truncateText(item.cuisineType)}
                </Text>
                <Text style={styles.label}>{t("cookTime")}: {item.cookTime} {t("minutes")}</Text>
                <Text style={styles.label}>{t("price")}: ${item.basePrice}</Text>
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
      case 2:
        return menus;
      case 0:
      default:
        return dishes;
    }
  };

  const renderEmptyMessage = () => {
    if (isSelected === 1 && chefs.length === 0 && location) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t("noChefsFound")}</Text>
        </View>
      );
    }
    if (isSelected === 0 && dishes.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t("noDishesFound")}</Text>
        </View>
      );
    }
    if (isSelected === 2 && menus?.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t("noMenusFound")}</Text>
        </View>
      );
    }
    return null;
  };

  const renderFilterModal = () => {
    const handleDistanceChange = useCallback((value) => {
      setTempDistance((prev) => (prev === value ? null : value));
    }, []);

    const handleRateChange = useCallback((value) => {
      setTempRateRange((prev) =>
        prev?.value.min === value.value.min &&
        prev?.value.max === value.value.max
          ? null
          : value
      );
    }, []);

    return (
      <Modalize
        ref={modalizeRef}
        handlePosition="outside"
        modalStyle={styles.modal}
        handleStyle={styles.handle}
        adjustToContentHeight={true}
        useNativeDriver={true}
        animationConfig={{ timing: { duration: 150 } }}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t("filterOption")}</Text>

          {/* Distance Filter */}
          <View style={styles.dropdownContainer}>
            <Text style={styles.dropdownLabel}>{t("distance")}</Text>
            <View style={styles.buttonGroup}>
              {distanceOptions.map((option) => (
                <TouchableOpacity
                  key={option.label}
                  style={[
                    styles.optionButton,
                    tempDistance === option.value &&
                      styles.optionButtonSelected,
                  ]}
                  onPress={() => handleDistanceChange(option.value)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      tempDistance === option.value &&
                        styles.optionButtonTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Dish Price Filter */}
          <View style={styles.dropdownContainer}>
            <Text style={styles.dropdownLabel}>{t("dishPrice")}</Text>
            <View style={styles.buttonGroup}>
              {dishPriceRangeOptions.map((option) => (
                <TouchableOpacity
                  key={option.label}
                  style={[
                    styles.optionButton,
                    tempDishPriceRange?.value.min === option.value.min &&
                      tempDishPriceRange?.value.max === option.value.max &&
                      styles.optionButtonSelected,
                  ]}
                  onPress={() => {
                    setTempDishPriceRange((prev) =>
                      prev?.value.min === option.value.min &&
                      prev?.value.max === option.value.max
                        ? null
                        : option
                    );
                  }}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      tempDishPriceRange?.value.min === option.value.min &&
                        tempDishPriceRange?.value.max === option.value.max &&
                        styles.optionButtonTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Chef Price Filter */}
          <View style={styles.dropdownContainer}>
            <Text style={styles.dropdownLabel}>
              {t("chefPrice")}/h
            </Text>
            <View style={styles.buttonGroup}>
              {chefPriceRangeOptions.map((option) => (
                <TouchableOpacity
                  key={option.label}
                  style={[
                    styles.optionButton,
                    tempChefPriceRange?.value.min === option.value.min &&
                      tempChefPriceRange?.value.max === option.value.max &&
                      styles.optionButtonSelected,
                  ]}
                  onPress={() => {
                    setTempChefPriceRange((prev) =>
                      prev?.value.min === option.value.min &&
                      prev?.value.max === option.value.max
                        ? null
                        : option
                    );
                  }}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      tempChefPriceRange?.value.min === option.value.min &&
                        tempChefPriceRange?.value.max === option.value.max &&
                        styles.optionButtonTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Rating Filter */}
          <View style={styles.dropdownContainer}>
            <Text style={styles.dropdownLabel}>{t("chefRating")}</Text>
            <View style={styles.buttonGroup}>
              {rateRangeOptions.map((option) => (
                <TouchableOpacity
                  key={option.label}
                  style={[
                    styles.optionButton,
                    tempRateRange?.value.min === option.value.min &&
                      tempRateRange?.value.max === option.value.max &&
                      styles.optionButtonSelected,
                  ]}
                  onPress={() => handleRateChange(option)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      tempRateRange?.value.min === option.value.min &&
                        tempRateRange?.value.max === option.value.max &&
                        styles.optionButtonTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              onPress={() => modalizeRef.current?.close()}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>{t("cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={applyFilter} style={styles.applyButton}>
              <Text style={styles.applyButtonText}>{t("applyFilter")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modalize>
    );
  };

  const renderAddressModal = () => (
    <Modalize
      ref={addressModalizeRef}
      handlePosition="outside"
      modalStyle={styles.modal}
      handleStyle={styles.handle}
      adjustToContentHeight={true}
    >
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>{t("selectAddress")}</Text>
        {addresses.length === 0 ? (
          <Text style={styles.emptyText}>
            {t("noAddresses")}
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
                  title: t("currentLocation"),
                  address: `${location.coords.latitude}, ${location.coords.longitude}`,
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                };
                setAddresses((prev) => [...prev, newAddress]);
                selectAddress(newAddress);
              })
              .catch((error) => {
                console.error("Error getting current location:", error);
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
              {t("useCurrentLocation")}
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => addressModalizeRef.current?.close()}
          style={styles.cancelButton}
        >
          <Text style={styles.cancelButtonText}>{t("cancel")}</Text>
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
          renderItem={RenderItem}
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
    alignItems: "center",
  },
  filterList: {
    flexGrow: 0,
  },

  ilterItem: {
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
  filterItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    backgroundColor: "#FFF8EF",
    borderRadius: 20,
  },
  filterIcon: {
    marginLeft: 5,
  },
  card: {
    backgroundColor: "#A9411D",
    borderRadius: 16,
    padding: 10,
    // paddingTop: 50,
    // alignItems: "center",
    // ,

    width: 200,
    marginTop: 20,
  },
  container: {
    // flexDirection: "column",
    // alignItems: "flex-start",
  },
  info: {
    alignItems: "flex-start",
  },
  image: {
    width: "100%",
    height: 120,
    borderRadius: 10,
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 4,
    alignSelf: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#EBE5DD",
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: "#EBE5DD",
    marginBottom: 4,
  },
  rating: {
    fontSize: 14,
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
  label: {
    fontSize: 12,
    color: "#EBE5DD",
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
  buttonGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    gap: 8,
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  optionButtonSelected: {
    backgroundColor: "#00C2FF",
  },
  optionButtonText: {
    color: "#555",
    fontWeight: "500",
  },
  optionButtonTextSelected: {
    color: "white",
    fontWeight: "bold",
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
