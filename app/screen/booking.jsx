import React, { useRef, useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Image,
  BackHandler,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { commonStyles } from "../../style";
import moment from "moment";
import Toast from "react-native-toast-message";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Modalize } from "react-native-modalize";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useAxios from "../../config/AXIOS_API";
import Header from "../../components/header";
import { t } from "i18next";

// Utility Functions
const getDaysInMonth = (month, year) => {
  const daysInMonth = moment(`${year}-${month}`, "YYYY-MM").daysInMonth();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const date = moment(`${year}-${month}-${i + 1}`, "YYYY-MM-DD");
    return {
      day: i + 1,
      dayOfWeek: date.format("ddd"),
      date,
    };
  });
};

const generateTimeSlots = () => {
  const timeSlots = [];
  for (let hour = 8; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const time = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      timeSlots.push(time);
    }
  }
  return timeSlots;
};

const timeSlots = generateTimeSlots();

const BookingScreen = () => {
  const params = useLocalSearchParams();

  const parsedParams = useMemo(
    () => ({
      chefId: params.chefId,
      selectedMenu: params.selectedMenu ? JSON.parse(params.selectedMenu) : null,
      selectedDishes: params.selectedDishes ? JSON.parse(params.selectedDishes) : [],
      dishNotes: params.dishNotes ? JSON.parse(params.dishNotes) : {},
      updatedDishId: params.updatedDishId,
      updatedNote: params.updatedNote,
      latestDishId: params.latestDishId,
      sessionDate: params.sessionDate || null,
      startTime: params.startTime || null,
      address: params.address || null,
      numPeople: params.numPeople ? parseInt(params.numPeople) : 1,
      requestDetails: params.requestDetails || "",
      menuId: params.menuId || null,
      dishIds: params.dishIds,
    }),
    [
      params.chefId,
      params.selectedMenu,
      params.selectedDishes,
      params.dishNotes,
      params.updatedDishId,
      params.updatedNote,
      params.latestDishId,
      params.sessionDate,
      params.startTime,
      params.address,
      params.numPeople,
      params.requestDetails,
      params.menuId,
      params.dishIds
    ]
  );

  const {
    chefId,
    selectedMenu: parsedSelectedMenu,
    selectedDishes: parsedSelectedDishes,
    dishNotes: initialDishNotes,
    updatedDishId,
    updatedNote,
    latestDishId,
    sessionDate,
    startTime: paramStartTime,
    address: paramAddress,
    numPeople: paramNumPeople,
    requestDetails: paramRequestDetails,
    menuId,
    chefBringIngredients,
  } = parsedParams;

  const [month, setMonth] = useState(moment().format("MM"));
  const [year, setYear] = useState(moment().format("YYYY"));
  const [selectedDay, setSelectedDay] = useState(null);
  const [specialRequest, setSpecialRequest] = useState(paramRequestDetails);
  const [address, setAddress] = useState(paramAddress);
  const [numPeople, setNumPeople] = useState(paramNumPeople);
  const today = moment();
  const days = getDaysInMonth(month, year);

  const [startTime, setStartTime] = useState(paramStartTime);
  const [loading, setLoading] = useState(false);
  const [dishNotes, setDishNotes] = useState(initialDishNotes);
  const [isMenuExpanded, setIsMenuExpanded] = useState(true);
  const [tempDishNotes, setTempDishNotes] = useState(initialDishNotes);
  const axiosInstance = useAxios();
  const [availability, setAvailability] = useState([]);
  const [dishIds, setDishIds] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [isFetchingAvailability, setIsFetchingAvailability] = useState(false);
  const [ingredientPrep, setIngredientPrep] = useState("customer");
  const [unavailableDates, setUnavailableDates] = useState([]); // Thêm state cho ngày không khả dụng

  const modalizeRef = useRef(null);
  const addressModalizeRef = useRef(null);

  // Restore sessionDate and startTime
  useEffect(() => {
    if (sessionDate && moment(sessionDate, "YYYY-MM-DD").isValid()) {
      setSelectedDay(moment(sessionDate));
      setMonth(moment(sessionDate).format("MM"));
      setYear(moment(sessionDate).format("YYYY"));
    }
  }, [sessionDate]);

  useEffect(() => {
    if (paramStartTime) {
      setStartTime(paramStartTime);
    }
  }, [paramStartTime]);

  // Fetch unavailable dates
  useEffect(() => {
    let isMounted = true;

    const fetchUnavailableDates = async () => {
      try {
        const response = await axiosInstance.get(`/bookings/unavailable-dates?chefId=${chefId}`);
        if (isMounted) {
          setUnavailableDates(response.data);
        }
      } catch (error) {
        console.error("Error fetching unavailable dates:", error?.response?.data || error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Unable to fetch unavailable dates.",
        });
      }
    };

    fetchUnavailableDates();

    return () => {
      isMounted = false;
    };
  }, [chefId]);

  useEffect(() => {
    const backAction = () => {
      router.push({
        pathname: "/screen/selectFood",
        params: {
          chefId,
          selectedMenu: parsedSelectedMenu ? JSON.stringify(parsedSelectedMenu) : null,
          selectedDishes: parsedSelectedDishes.length > 0 ? JSON.stringify(parsedSelectedDishes) : null,
          dishNotes: JSON.stringify(dishNotes),
        },
      });
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [chefId, parsedSelectedMenu, parsedSelectedDishes, dishNotes]);

  useEffect(() => {
    let isMounted = true;

    const loadSelectedAddress = async () => {
      try {
        const savedAddress = await AsyncStorage.getItem("selectedAddress");
        if (savedAddress && isMounted && !paramAddress) {
          const parsedAddress = JSON.parse(savedAddress);
          setAddress(parsedAddress.address);
          console.log("Loaded selected address:", parsedAddress.address);
        }
      } catch (error) {
        console.error("Error loading selected address:", error);
      }
    };
    loadSelectedAddress();

    return () => {
      isMounted = false;
    };
  }, [paramAddress]);

  useEffect(() => {
    if (updatedDishId && updatedNote !== undefined) {
      setDishNotes((prev) => ({
        ...prev,
        [updatedDishId]: updatedNote,
      }));
    }
  }, [updatedDishId, updatedNote]);

  useEffect(() => {
    const menuDishIds = parsedSelectedMenu?.menuItems?.map((item) => item.dishId || item.id) || [];
    const extraDishIds = parsedSelectedDishes.map((dish) => dish.id);
    const allDishIds = [...new Set([...menuDishIds, ...extraDishIds])];
    setDishIds(allDishIds);

    if (latestDishId) {
      console.log("Latest dish added:", latestDishId);
    }
  }, [parsedSelectedMenu, parsedSelectedDishes, latestDishId]);

  useEffect(() => {
    let isMounted = true;

    const fetchAvailability = async () => {
      if (!selectedDay || !address) {
        return;
      }

      setIsFetchingAvailability(true);
      try {
        const date = selectedDay.format("YYYY-MM-DD");
        const menuIdParam = parsedSelectedMenu ? parsedSelectedMenu.id : null;
        // console.log("Fetching availability with params:", {
        //   chefId,
        //   date,
        //   customerLocation: address,
        //   guestCount: numPeople,
        //   menuId: menuIdParam,
        //   dishIds,
        // });
        const response = await axiosInstance.get(
          `/availability/chef/${chefId}/single-date`,
          {
            params: {
              date,
              customerLocation: address,
              guestCount: numPeople,
              menuId: menuIdParam || undefined,
              dishIds: dishIds.length > 0 ? dishIds : undefined,
              maxDishesPerMeal: 6,
            },
            paramsSerializer: (params) => {
              const searchParams = new URLSearchParams();
              for (const [key, value] of Object.entries(params)) {
                if (Array.isArray(value)) {
                  value.forEach((item) => searchParams.append(key, item));
                } else if (value !== undefined) {
                  searchParams.append(key, value);
                }
              }
              return searchParams.toString();
            },
          }
        );
        if (isMounted) {
          setAvailability(response.data);
        }
      } catch (error) {
        console.error("Error fetching availability:", error.response?.data || error);
        if (isMounted) {
          Toast.show({
            type: "error",
            text1: "Error",
            text2: error.response?.data?.message || "Unable to fetch chef availability.",
          });
          setAvailability([]);
        }
      } finally {
        if (isMounted) {
          setIsFetchingAvailability(false);
        }
      }
    };

    fetchAvailability();

    return () => {
      isMounted = false;
    };
  }, [chefId, selectedDay, address, numPeople, dishIds]);

  const getAvailableTimeSlots = () => {
    if (!selectedDay) return [];

    const dayAvailabilities = availability.filter((avail) =>
      moment(avail.date).isSame(selectedDay, "day")
    );

    if (!dayAvailabilities.length) return [];

    const availableSlots = new Set();
    dayAvailabilities.forEach(({ startTime: availStart, endTime: availEnd }) => {
      const [startHour, startMinute] = availStart.split(":").map(Number);
      const [endHour, endMinute] = availEnd.split(":").map(Number);
      const startTimeInMinutes = startHour * 60 + startMinute;
      const endTimeInMinutes = endHour * 60 + endMinute;

      timeSlots.forEach((slot) => {
        const [slotHour, slotMinute] = slot.split(":").map(Number);
        const slotTimeInMinutes = slotHour * 60 + slotMinute;

        const isToday = selectedDay.isSame(moment(), "day");
        if (isToday) {
          const now = moment();
          const currentHour = now.hour();
          const currentMinute = now.minute();
          const currentTimeInMinutes = currentHour * 60 + currentMinute;
          if (slotTimeInMinutes <= currentTimeInMinutes) {
            return;
          }
        }

        if (slotTimeInMinutes >= startTimeInMinutes && slotTimeInMinutes <= endTimeInMinutes) {
          availableSlots.add(slot);
        }
      });
    });

    return Array.from(availableSlots).sort();
  };

  const availableTimeSlots = getAvailableTimeSlots();

  const isBeforeToday = (date) => date.isBefore(today, "day");
  const isSelectedDay = (day) => selectedDay && selectedDay.isSame(day, "day");
  const isToday = (date) => moment(date).isSame(today, "day");

  const isTodayOrBefore = (date) => date.isSameOrBefore(today, "day");

  const incrementPeople = () => setNumPeople((prev) => (prev < 10 ? prev + 1 : prev));
  const decrementPeople = () => setNumPeople((prev) => (prev > 1 ? prev - 1 : 1));

  const fetchAddresses = async () => {
    try {
      const response = await axiosInstance.get("/address/my-addresses");
      setAddresses(response.data);
      console.log("Fetched addresses:", response.data);
    } catch (error) {
      console.error("Error fetching addresses:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể tải danh sách địa chỉ",
      });
    }
  };

  const openAddressModal = () => {
    fetchAddresses();
    addressModalizeRef.current?.open();
  };

  const selectAddress = async (selectedAddress) => {
    setAddress(selectedAddress.address);
    try {
      await AsyncStorage.setItem("selectedAddress", JSON.stringify(selectedAddress));
      console.log("Saved selected address:", selectedAddress.address);
    } catch (error) {
      console.error("Error saving selected address:", error);
    }
    addressModalizeRef.current?.close();
  };

  const handleAddItems = () => {
    router.push({
      pathname: "/screen/selectFood",
      params: {
        chefId,
        selectedMenu: parsedSelectedMenu ? JSON.stringify(parsedSelectedMenu) : null,
        selectedDishes: parsedSelectedDishes.length > 0 ? JSON.stringify(parsedSelectedDishes) : null,
        dishNotes: JSON.stringify(dishNotes),
      },
    });
  };

  const handleBack = () => {
    router.push({
      pathname: "/screen/selectFood",
      params: {
        chefId,
        selectedMenu: parsedSelectedMenu ? JSON.stringify(parsedSelectedMenu) : null,
        selectedDishes: parsedSelectedDishes.length > 0 ? JSON.stringify(parsedSelectedDishes) : null,
        dishNotes: JSON.stringify(dishNotes),
      },
    });
  };

  const handleConfirmBooking = async () => {
    if (!selectedDay) {
      Toast.show({ type: "error", text1: "Error", text2: "Please select a date." });
      return;
    }
    if (!startTime) {
      Toast.show({ type: "error", text1: "Error", text2: "Please select a start time." });
      return;
    }
    if (!address) {
      Toast.show({ type: "error", text1: "Error", text2: "Please select an address." });
      return;
    }

    setLoading(true);
    const payload = {
      chefId: parseInt(chefId),
      guestCount: numPeople,
      bookingDetail: {
        sessionDate: selectedDay.format("YYYY-MM-DD"),
        startTime: `${startTime}:00`,
        location: address,
        menuId: parsedSelectedMenu ? parsedSelectedMenu.id : null,
        extraDishIds: parsedSelectedDishes.length > 0 ? parsedSelectedDishes.map((dish) => dish.id) : null,
        dishes: dishIds.map((dishId) => ({
          dishId,
          notes: dishNotes[dishId] || "",
        })),
        chefBringIngredients: ingredientPrep === "chef",
      },
    };

    console.log("Payload to API:", JSON.stringify(payload, null, 2));
    try {
      const response = await axiosInstance.post(
        "/bookings/calculate-single-booking",
        payload
      );
      router.push({
        pathname: "screen/confirmBooking",
        params: {
          bookingData: JSON.stringify(response.data),
          chefId,
          selectedMenu: parsedSelectedMenu ? JSON.stringify(parsedSelectedMenu) : null,
          selectedDishes: parsedSelectedDishes.length > 0 ? JSON.stringify(parsedSelectedDishes) : null,
          address,
          sessionDate: selectedDay.format("YYYY-MM-DD"),
          startTime,
          requestDetails: specialRequest,
          dishNotes: JSON.stringify(dishNotes),
          numPeople: numPeople.toString(),
          menuId: parsedSelectedMenu ? parsedSelectedMenu.id : null,
          chefBringIngredients: ingredientPrep === "chef"
        },
      });
      // console.log("Booking response:", JSON.stringify(response.data));
    } catch (error) {
      console.error("Error calling calculate-single-booking:", error.response?.data);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.response?.data?.message || "Failed to calculate booking.",
      });
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    console.log("Opening modal");
    setTempDishNotes(dishNotes);
    modalizeRef.current?.open();
  };

  const saveNotes = () => {
    setDishNotes(tempDishNotes);
    modalizeRef.current?.close();
  };

  const cancelNotes = () => modalizeRef.current?.close();

  const allDishes = [
    ...(parsedSelectedMenu?.menuItems || []).map((item) => ({
      id: item.dishId,
      name: item.dishName,
      image: item.dishImageUrl
    })),
    ...parsedSelectedDishes.map((dish) => ({
      id: dish.id,
      name: dish.name,
    })),
  ];

  const renderAddressModal = () => (
    <Modalize
      ref={addressModalizeRef}
      handlePosition="outside"
      modalStyle={styles.modalStyle}
      handleStyle={styles.handleStyle}
      adjustToContentHeight={true}
    >
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Select Address</Text>
        {addresses.length === 0 ? (
          <Text style={styles.noAddressesText}>
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
          onPress={() => addressModalizeRef.current?.close()}
          style={styles.cancelButton}
        >
          <Text style={styles.cancelButtonText}>{t("cancel")}</Text>
        </TouchableOpacity>
      </View>
    </Modalize>
  );

  const initialIndex = days.findIndex((item) => isToday(item.date));
  const safeInitialIndex = initialIndex >= 0 ? initialIndex : 0;
  return (
    <GestureHandlerRootView style={commonStyles.containerContent}>
      <Header title="Booking" onLeftPress={handleBack} />
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 10 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("numberOfPeople")}</Text>
          <View style={styles.numberPicker}>
            <TouchableOpacity
              style={[styles.numberButton, numPeople <= 1 && styles.disabledButton]}
              onPress={decrementPeople}
              disabled={numPeople <= 1}
            >
              <Text style={styles.numberButtonText}>−</Text>
            </TouchableOpacity>
            <View style={styles.numberDisplay}>
              <Text style={styles.numberText}>{numPeople}</Text>
            </View>
            <TouchableOpacity
              style={[styles.numberButton, numPeople >= 10 && styles.disabledButton]}
              onPress={incrementPeople}
              disabled={numPeople >= 10}
            >
              <Text style={styles.numberButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("address")}</Text>
          <TouchableOpacity onPress={openAddressModal} style={styles.locationContainer}>
            <MaterialIcons name="location-on" size={20} color="#A64B2A" style={styles.locationIcon} />
            <Text style={styles.locationText}>
              {address || "Select an address"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("selectDate")}</Text>
          <FlatList
            data={days}
            keyExtractor={(item) => item.day.toString()}
            horizontal
            initialScrollIndex={safeInitialIndex}
            showsHorizontalScrollIndicator={false}
            getItemLayout={(data, index) => ({ length: 80, offset: 80 * index, index })}
            renderItem={({ item }) => {
              const isUnavailable = unavailableDates.includes(
                item.date.format("YYYY-MM-DD")
              );
              const isTodayOrPast = isTodayOrBefore(item.date);
              return (
                <TouchableOpacity
                  style={[
                    styles.dayContainer,
                    isTodayOrPast && styles.disabledDay,
                    isSelectedDay(item.date) && styles.selectedDay,
                    isUnavailable && styles.unavailableDay,
                  ]}
                  disabled={isTodayOrPast || isUnavailable}
                  onPress={() => {
                    if (!isUnavailable && !isTodayOrPast) {
                      setSelectedDay(item.date);
                      setStartTime(null);
                    } else if(isUnavailable){
                      Toast.show({
                        type: "error",
                        text1: "Unavailable",
                        text2: "This date is fully booked.",
                      });
                    } else {
                      Toast.show({
                        type: "error",
                        text1: "Invalid Date",
                        text2: "Cannot select today or past dates.",
                      });
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.dayOfWeek,
                      isSelectedDay(item.date) && styles.selectedText,
                      (isUnavailable || isTodayOrPast) && styles.unavailableText,
                    ]}
                  >
                    {item.dayOfWeek}
                  </Text>
                  <Text
                    style={[
                      styles.day,
                      isSelectedDay(item.date) && styles.selectedText,
                      (isUnavailable || isTodayOrPast) && styles.unavailableText,
                    ]}
                  >
                    {item.day}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {selectedDay && (
          <View style={styles.timeContainer}>
            <Text style={styles.sectionTitle}>{t("startTime")}</Text>
            {isFetchingAvailability ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#A64B2A" />
                <Text style={styles.loadingText}>Fetching available time slots...</Text>
              </View>
            ) : availableTimeSlots.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {availableTimeSlots.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[styles.timeButton, startTime === time && styles.timeButtonSelected]}
                    onPress={() => setStartTime(time)}
                  >
                    <Text
                      style={[styles.timeButtonText, startTime === time && styles.timeButtonTextSelected]}
                    >
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.noTimeText}>{t("noSlotsAvailable")}</Text>
            )}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.menuHeader}>
            <TouchableOpacity
              style={styles.menuHeaderContent}
              onPress={() => setIsMenuExpanded(!isMenuExpanded)}
            >
              <Text style={styles.sectionTitle}>
                {parsedSelectedMenu ? parsedSelectedMenu.name : t("order")}
              </Text>
              <MaterialIcons
                name={isMenuExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                size={24}
                color="#A64B2A"
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAddItems}>
              <Text style={styles.addItemsText}>{t("addItems")}</Text>
            </TouchableOpacity>
          </View>

          {isMenuExpanded && (
            <View style={styles.menuContent}>
              {parsedSelectedMenu && (parsedSelectedMenu.menuItems || []).length > 0 ? (
                parsedSelectedMenu.menuItems.map((item, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.dishRow,
                      latestDishId && (item.dishId) === parseInt(latestDishId),
                    ]}
                  >
                    <View style={styles.dishInfo}>
                      <Image
                        source={
                          item.dishImageUrl
                            ? { uri: item.dishImageUrl }
                            : require("../../assets/images/1.jpg")
                        }
                        style={styles.dishImage}
                        resizeMode="cover"
                      />
                      <View style={styles.dishText}>
                        <Text style={styles.dishName}>
                          {item.dishName}
                        </Text>
                        {dishNotes[item.dishId || item.id] && (
                          <Text style={styles.noteText}>
                            {t("note")}: {dishNotes[item.dishId]}
                          </Text>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity onPress={openModal}>
                      <Text style={styles.editText}>{t("editNotes")}</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : null}

              {parsedSelectedDishes.length > 0 && (
                parsedSelectedDishes.map((dish, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.dishRow,
                      latestDishId && dish.id === parseInt(latestDishId) && styles.latestDish,
                    ]}
                  >
                    <View style={styles.dishInfo}>
                      <Image
                        source={
                          dish.imageUrl
                            ? { uri: dish.imageUrl }
                            : require("../../assets/images/1.jpg")
                        }
                        style={styles.dishImage}
                        resizeMode="cover"
                      />
                      <View style={styles.dishText}>
                        <Text style={styles.dishName}>{dish.name || "Unnamed Dish"}</Text>
                        {dishNotes[dish.id] && (
                          <Text style={styles.noteText}>{t("note")}: {dishNotes[dish.id]}</Text>
                        )}
                        {/* {latestDishId && dish.id === parseInt(latestDishId) && (
                          <Text style={styles.latestTag}>Mới thêm</Text>
                        )} */}
                      </View>
                    </View>
                    <TouchableOpacity onPress={openModal}>
                      <Text style={styles.editText}>{t("editNotes")}</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}

              {!parsedSelectedMenu && parsedSelectedDishes.length === 0 && (
                <Text style={styles.noItemsText}>{t("noMenus")}</Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("specialRequest")}</Text>
          <TextInput
            style={styles.specialRequestInput}
            placeholder={t("enterYourRequest")}
            value={specialRequest}
            onChangeText={setSpecialRequest}
            multiline
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("ingredientPreparation")}</Text>
          <View style={styles.ingredientPrepContainer}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setIngredientPrep("customer")}
            >
              <MaterialIcons
                name={ingredientPrep === "customer" ? "check-box" : "check-box-outline-blank"}
                size={24}
                color={ingredientPrep === "customer" ? "#A64B2A" : "#333"}
              />
              <Text style={styles.checkboxText}>{t("IWillPrepareIngredients")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setIngredientPrep("chef")}
            >
              <MaterialIcons
                name={ingredientPrep === "chef" ? "check-box" : "check-box-outline-blank"}
                size={24}
                color={ingredientPrep === "chef" ? "#A64B2A" : "#333"}
              />
              <Text style={styles.checkboxText}>{t("chefWillPrepareIngredients")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmBooking} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.confirmButtonText}>{t("confirmBooking")}</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modalize
        ref={modalizeRef}
        adjustToContentHeight={true}
        handlePosition="outside"
        modalStyle={styles.modalStyle}
        handleStyle={styles.handleStyle}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t("editNotesForDishes")}</Text>
          {allDishes.length > 0 ? (
            allDishes.map((dish) => (
              <View key={dish.id} style={styles.dishNoteContainer}>
                <Text style={styles.dishNoteLabel}>{dish.name}</Text>
                <TextInput
                  style={styles.dishNoteInput}
                  placeholder={t("addYourRequestHere")}
                  value={tempDishNotes[dish.id] || ""}
                  onChangeText={(text) =>
                    setTempDishNotes((prev) => ({ ...prev, [dish.id]: text }))
                  }
                  multiline
                />
                {/* {dish.isLatest && (
                  <Text style={styles.latestTag}>Mới thêm</Text>
                )} */}
              </View>
            ))
          ) : (
            <Text style={styles.noDishesText}>{t("noDishesToAddNotesFor")}</Text>
          )}
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={cancelNotes}>
              <Text style={styles.cancelButtonText}>{t("cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={saveNotes}>
              <Text style={styles.saveButtonText}>{t("save")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modalize>

      {renderAddressModal()}
      <Toast />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F8BF40",
    backgroundColor: "#FDFBF6",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#A9411D",
    marginLeft: 10,
  },
  section: {
    borderTopColor: "#E5E5E5",
    borderTopWidth: 1,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  numberPicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CCCCCC",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  numberButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#A64B2A",
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#D1D1D1",
  },
  numberButtonText: {
    fontSize: 24,
    color: "white",
    fontWeight: "bold",
  },
  numberDisplay: {
    flex: 1,
    alignItems: "center",
  },
  numberText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  menuHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  addItemsText: {
    fontSize: 16,
    color: "#A64B2A",
    fontWeight: "bold",
  },
  menuContent: {
    marginTop: 15,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dishRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
    padding: 5,
    borderRadius: 8,
  },
  dishInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dishImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 15,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  dishText: {
    flex: 1,
  },
  dishName: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },
  noteText: {
    fontSize: 14,
    color: "#777",
    marginTop: 5,
  },
  latestTag: {
    fontSize: 12,
    color: "#A64B2A",
    fontWeight: "bold",
    marginTop: 5,
  },
  editText: {
    fontSize: 14,
    color: "#A64B2A",
    fontWeight: "bold",
  },
  noItemsText: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
  },
  dayContainer: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginRight: 10,
    alignItems: "center",
    backgroundColor: "#519254",
    borderRadius: 12,
    width: 80,
  },
  disabledDay: {
    backgroundColor: "#D1D1D1",
  },
  selectedDay: {
    backgroundColor: "#A9411D",
    borderWidth: 2,
    borderColor: "#F8BF40",
  },
  unavailableDay: {
    backgroundColor: "#FF4D4D",
    opacity: 0.7,
  },
  selectedText: {
    color: "white",
    fontWeight: "bold",
  },
  unavailableText: {
    color: "white",
  },
  timeContainer: {
    paddingVertical: 10,
  },
  timeButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  timeButtonSelected: {
    backgroundColor: "#A9411D",
    borderColor: "#A9411D",
  },
  timeButtonText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },
  timeButtonTextSelected: {
    color: "white",
    fontWeight: "bold",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationIcon: {
    marginRight: 10,
  },
  locationText: {
    fontSize: 16,
    color: "#333",
    flexShrink: 1,
    flexWrap: "wrap",
  },
  specialRequestInput: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    padding: 15,
    height: 120,
    textAlignVertical: "top",
    backgroundColor: "#FFF",
    fontSize: 16,
    color: "#333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#EBE5DD",
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  confirmButton: {
    width: "100%",
    backgroundColor: "#A64B2A",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },
  modalStyle: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleStyle: {
    backgroundColor: "#A64B2A",
    width: 40,
    height: 5,
    borderRadius: 5,
  },
  modalContent: {
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  dishNoteContainer: {
    marginBottom: 20,
  },
  dishNoteLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  dishNoteInput: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 10,
    padding: 10,
    minHeight: 60,
    textAlignVertical: "top",
    backgroundColor: "#FFF",
  },
  noDishesText: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
    marginVertical: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#D1D1D1",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginRight: 10,
  },
  cancelButtonText: {
    color: "#333",
    fontWeight: "bold",
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#A64B2A",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginLeft: 10,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  noTimeText: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
    marginVertical: 10,
  },
  noAddressesText: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
    marginVertical: 20,
  },
  addressItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
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
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    marginHorizontal: 5,
  },
  checkboxText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 10,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#777",
  },
  ingredientPrepContainer: {
    marginTop: 10,
  },
});

export default BookingScreen;