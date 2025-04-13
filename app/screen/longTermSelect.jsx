import { router, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  SafeAreaView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  BackHandler,
} from "react-native";
import { Calendar } from "react-native-calendars";
import Header from "../../components/header";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Modalize } from "react-native-modalize";
import useAxios from "../../config/AXIOS_API";
import Toast from "react-native-toast-message";
import moment from "moment";
import { commonStyles } from "../../style";
import { MaterialIcons } from "@expo/vector-icons"; // Added for icons

// Utility Functions
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

// New Utility: Group dates by week
const groupDatesByWeek = (dates, todayString) => {
  const weeks = [];
  const sortedDates = Object.keys(dates).sort();
  let currentWeek = [];
  let weekStart = null;

  sortedDates.forEach((date, index) => {
    const momentDate = moment(date);
    if (!weekStart) {
      weekStart = momentDate.clone().startOf("week");
      currentWeek = [date];
    } else if (momentDate.isSameOrBefore(weekStart.clone().endOf("week"))) {
      currentWeek.push(date);
    } else {
      weeks.push({
        start: weekStart.format("MMM D"),
        end: weekStart.endOf("week").format("MMM D"),
        dates: currentWeek,
      });
      weekStart = momentDate.clone().startOf("week");
      currentWeek = [date];
    }

    if (index === sortedDates.length - 1) {
      weeks.push({
        start: weekStart.format("MMM D"),
        end: weekStart.endOf("week").format("MMM D"),
        dates: currentWeek,
      });
    }
  });

  return weeks;
};

const LongTermSelectBooking = () => {
  const axiosInstance = useAxios();
  const params = useLocalSearchParams();
  const selectedPackage = params.selectedPackage
    ? JSON.parse(params.selectedPackage)
    : null;
  const chefId = params.chefId;
  const numPeople = params.numPeople ? parseInt(params.numPeople) : null;
  const address = params.address || "";

  const [selectedDates, setSelectedDates] = useState(
    params.selectedDates ? JSON.parse(params.selectedDates) : {}
  );
  const [menuItems, setMenuItems] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [currentDishId, setCurrentDishId] = useState(null);
  const [currentDate, setCurrentDate] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [availability, setAvailability] = useState({});
  const [isFetchingAvailability, setIsFetchingAvailability] = useState(false);
  const [isRepeatEnabled, setIsRepeatEnabled] = useState(false);
  const [selectedWeekdays, setSelectedWeekdays] = useState([]);
  const [expandedWeeks, setExpandedWeeks] = useState({});
  const modalizeRef = useRef(null);
  const infoModalizeRef = useRef(null);
  const lastProcessedParams = useRef(null);

  const todayString = moment().format("YYYY-MM-DD");

  useEffect(() => {
    const backAction = () => {
      router.push({
        pathname: "/screen/longTermBooking",
        params: { selectedPackage, numPeople, address, chefId },
      });
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    handleMenu();
    fetchDishes();
  }, []);

  useEffect(() => {
    if (Object.keys(selectedDates).length > 0 && address && numPeople) {
      fetchAvailability();
    }
  }, [selectedDates, address, numPeople]);

  useEffect(() => {
    const paramsString = JSON.stringify(params);
    if (
      params.date &&
      (params.selectedMenu || params.selectedDishes) &&
      paramsString !== lastProcessedParams.current
    ) {
      const date = params.date;
      const selectedMenuData =
        typeof params.selectedMenu === "string" &&
        params.selectedMenu !== "null" &&
        params.selectedMenu !== ""
          ? JSON.parse(params.selectedMenu)
          : {};
      const selectedDishesData =
        typeof params.selectedDishes === "string" &&
        params.selectedDishes !== "null" &&
        params.selectedDishes !== ""
          ? JSON.parse(params.selectedDishes)
          : [];
      const newDishNotes =
        typeof params.dishNotes === "string" &&
        params.dishNotes !== "null" &&
        params.dishNotes !== ""
          ? JSON.parse(params.dishNotes)
          : {};

      setSelectedDates((prev) => {
        const existingDate = prev[date] || {
          selected: true,
          selectedColor: "#6C63FF",
          showMenu: true,
          startTime: "",
          menuId: null,
          extraDishIds: [],
          menuDishNotes: {},
          extraDishNotes: {},
        };

        return {
          ...prev,
          [date]: {
            ...existingDate,
            menuId: selectedMenuData?.id || null,
            extraDishIds: selectedDishesData.map((dish) => dish.id),
            menuDishNotes: Object.fromEntries(
              Object.entries(newDishNotes).filter(([dishId]) =>
                selectedMenuData?.menuItems?.some(
                  (item) => item.dishId === parseInt(dishId)
                )
              )
            ),
            extraDishNotes: Object.fromEntries(
              Object.entries(newDishNotes).filter(([dishId]) =>
                selectedDishesData.some((dish) => dish.id === parseInt(dishId))
              )
            ),
          },
        };
      });

      lastProcessedParams.current = paramsString;
    }
  }, [params]);

  const handleRepeatSelection = () => {
    if (!isRepeatEnabled || selectedWeekdays.length === 0) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Vui lòng chọn ít nhất một ngày trong tuần.",
      });
      return;
    }

    const maxDays = selectedPackage.durationDays;
    let newDates = {};
    let currentDate = moment(todayString);
    let selectedCount = 0;

    while (selectedCount < maxDays) {
      const dayOfWeek = currentDate.day();
      if (selectedWeekdays.includes(dayOfWeek)) {
        const dateString = currentDate.format("YYYY-MM-DD");
        newDates[dateString] = {
          selected: true,
          selectedColor: "#FF9800",
          showMenu: false,
          startTime: "",
          menuId: null,
          extraDishIds: [],
          menuDishNotes: {},
          extraDishNotes: {},
        };
        selectedCount++;
      }
      currentDate.add(1, "day");

      if (currentDate.isAfter(moment(todayString).add(1, "year"))) {
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: "Không thể chọn đủ ngày với các ngày trong tuần đã chọn.",
        });
        return;
      }
    }

    setSelectedDates(newDates);
    Toast.show({
      type: "success",
      text1: "Đã chọn ngày",
      text2: `Đã chọn ${selectedCount} ngày theo lịch lặp lại.`,
    });
  };

  const toggleWeekday = (day) => {
    setSelectedWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const toggleWeek = (weekIndex) => {
    setExpandedWeeks((prev) => ({
      ...prev,
      [weekIndex]: !prev[weekIndex],
    }));
  };

  const showRepeatInfo = () => {
    setInfoModalVisible(true);
    infoModalizeRef.current?.open();
  };

  const removeMenu = (date) => {
    setSelectedDates((prev) => ({
      ...prev,
      [date]: {
        ...prev[date],
        menuId: null,
        menuDishNotes: {},
      },
    }));
  };

  const removeExtraDish = (date, dishId) => {
    setSelectedDates((prev) => {
      const updatedExtraDishIds = prev[date].extraDishIds.filter(
        (id) => id !== dishId
      );
      const updatedExtraDishNotes = { ...prev[date].extraDishNotes };
      delete updatedExtraDishNotes[dishId];
      return {
        ...prev,
        [date]: {
          ...prev[date],
          extraDishIds: updatedExtraDishIds,
          extraDishNotes: updatedExtraDishNotes,
        },
      };
    });
  };

  const fetchDishes = async () => {
    try {
      const response = await axiosInstance.get(`/dishes?chefId=${chefId}`);
      setDishes(response.data.content || []);
    } catch (error) {
      console.log("Error fetching dishes:", error);
    }
  };

  const fetchAvailability = async () => {
    setIsFetchingAvailability(true);
    try {
      const requestBody = Object.keys(selectedDates).map((date) => {
        const menuId = selectedDates[date].menuId;
        const menu = menuItems.find((m) => m.id === menuId);
        const menuDishIds = menu
          ? menu.menuItems.map((item) => item.dishId)
          : [];
        const extraDishIds = selectedDates[date].extraDishIds || [];
        const dishIds = [...new Set([...menuDishIds, ...extraDishIds])];

        return {
          sessionDate: date,
          ...(menuId && { menuId }),
          ...(dishIds.length > 0 && { dishIds }),
        };
      });
      const response = await axiosInstance.post(
        `/availability/chef/${chefId}/multiple-dates`,
        requestBody,
        {
          params: {
            customerLocation: address,
            guestCount: numPeople,
            maxDishesPerMeal: 6,
          },
          paramsSerializer: (params) => {
            const searchParams = new URLSearchParams();
            for (const [key, value] of Object.entries(params)) {
              if (Array.isArray(value)) {
                value.forEach((item) => searchParams.append(key, item));
              } else if (value !== undefined && value !== null) {
                searchParams.append(key, value);
              }
            }
            return searchParams.toString();
          },
        }
      );

      let availabilityMap = {};
      if (Array.isArray(response.data)) {
        availabilityMap = response.data.reduce((acc, item) => {
          const dateKey = item.date;
          if (dateKey) {
            acc[dateKey] = acc[dateKey] || [];
            acc[dateKey].push({
              startTime: item.startTime,
              endTime: item.endTime,
              chefId: item.chefId,
              chefName: item.chefName,
              durationMinutes: item.durationMinutes,
              note: item.note,
            });
          } else {
            console.warn("Missing date in response item:", item);
          }
          return acc;
        }, {});
      } else {
        console.error("Unexpected response format:", response.data);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Unexpected availability response format.",
        });
      }
      setAvailability(availabilityMap);
    } catch (error) {
      console.error(
        "Error fetching availability:",
        error?.response?.data || error.message
      );
      Toast.show({
        type: "error",
        text1: "Error",
        text2:
          error.response?.data?.message ||
          "Unable to fetch chef availability.",
      });
      setAvailability({});
    } finally {
      setIsFetchingAvailability(false);
    }
  };

  const getAvailableTimeSlots = (date) => {
    const dayAvailability = Array.isArray(availability[date])
      ? availability[date]
      : [];

    if (!dayAvailability.length) {
      return [];
    }

    const availableSlots = new Set();
    dayAvailability.forEach(({ startTime: availStart, endTime: availEnd }) => {
      if (!availStart || !availEnd) {
        return;
      }

      const startTimeClean = availStart.slice(0, 5);
      const endTimeClean = availEnd.slice(0, 5);
      const [startHour, startMinute] = startTimeClean.split(":").map(Number);
      const [endHour, endMinute] = endTimeClean.split(":").map(Number);
      const startTimeInMinutes = startHour * 60 + startMinute;
      const endTimeInMinutes = endHour * 60 + endMinute;

      timeSlots.forEach((slot) => {
        const [slotHour, slotMinute] = slot.split(":").map(Number);
        const slotTimeInMinutes = slotHour * 60 + slotMinute;

        const isToday = date === todayString;
        if (isToday) {
          const now = moment();
          const currentTimeInMinutes = now.hour() * 60 + now.minute();
          if (slotTimeInMinutes <= currentTimeInMinutes) {
            return;
          }
        }

        if (
          slotTimeInMinutes >= startTimeInMinutes &&
          slotTimeInMinutes <= endTimeInMinutes
        ) {
          availableSlots.add(slot);
        }
      });
    });

    return Array.from(availableSlots).sort();
  };

  const onDayPress = (day) => {
    const dateString = day.dateString;
    if (moment(dateString).isBefore(todayString, "day")) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Cannot select past dates.",
      });
      return;
    }

    if (isRepeatEnabled) {
      Toast.show({
        type: "info",
        text1: "Repeat Mode",
        text2: "Please use the repeat settings to select days.",
      });
      return;
    }

    let newSelection = { ...selectedDates };
    if (newSelection[dateString]) {
      delete newSelection[dateString];
    } else if (
      Object.keys(newSelection).length < selectedPackage.durationDays
    ) {
      newSelection[dateString] = {
        selected: true,
        selectedColor: "#6C63FF",
        showMenu: false,
        startTime: "",
        menuId: null,
        extraDishIds: [],
        menuDishNotes: {},
        extraDishNotes: {},
      };
    } else {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: `You can only select ${selectedPackage.durationDays} days.`,
      });
      return;
    }
    setSelectedDates(newSelection);
  };

  const removeDate = (date) => {
    setSelectedDates((prev) => {
      const newDates = { ...prev };
      delete newDates[date];
      return newDates;
    });
  };

  const updateBookingDetail = (date, key, value) => {
    setSelectedDates((prev) => ({
      ...prev,
      [date]: {
        ...prev[date],
        [key]: value,
      },
    }));
  };

  const handleEditNote = (date, dishId, isMenuDish) => {
    setCurrentDate(date);
    setCurrentDishId(dishId);
    const notes = isMenuDish
      ? selectedDates[date].menuDishNotes[dishId]
      : selectedDates[date].extraDishNotes[dishId];
    setNoteText(notes || "");
    setModalVisible(true);
    modalizeRef.current?.open();
  };

  const saveNote = () => {
    if (!currentDate || !currentDishId) return;

    setSelectedDates((prev) => {
      const isMenuDish =
        prev[currentDate].menuId &&
        menuItems
          .find((m) => m.id === prev[currentDate].menuId)
          ?.menuItems.some((item) => item.dishId === currentDishId);

      return {
        ...prev,
        [currentDate]: {
          ...prev[currentDate],
          menuDishNotes: isMenuDish
            ? { ...prev[currentDate].menuDishNotes, [currentDishId]: noteText }
            : prev[currentDate].menuDishNotes,
          extraDishNotes: !isMenuDish
            ? { ...prev[currentDate].extraDishNotes, [currentDishId]: noteText }
            : prev[currentDate].extraDishNotes,
        },
      };
    });
    modalizeRef.current?.close();
    setModalVisible(false);
    setNoteText("");
    setCurrentDishId(null);
    setCurrentDate(null);
  };

  const handleConfirm = async () => {
    if (Object.keys(selectedDates).length !== selectedPackage.durationDays) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: `Please select exactly ${selectedPackage.durationDays} days.`,
      });
      return;
    }

    if (!numPeople || !address) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Guest count or address is invalid.",
      });
      return;
    }

    for (const date of Object.keys(selectedDates)) {
      const selectedTime = selectedDates[date].startTime;
      if (!selectedTime) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: `Please select a start time for ${date}.`,
        });
        return;
      }
      const availableSlots = getAvailableTimeSlots(date);
      if (!availableSlots.includes(selectedTime)) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: `Selected time ${selectedTime} for ${date} is not available.`,
        });
        return;
      }
    }

    const bookingDetails = Object.keys(selectedDates).map((date) => {
      const menuDishes = Object.entries(
        selectedDates[date].menuDishNotes || {}
      ).map(([dishId, notes]) => ({
        dishId: parseInt(dishId),
        notes,
      }));
      const extraDishesNotes = Object.entries(
        selectedDates[date].extraDishNotes || {}
      ).map(([dishId, notes]) => ({
        dishId: parseInt(dishId),
        notes,
      }));
      const allDishes = [...menuDishes, ...extraDishesNotes];

      return {
        sessionDate: date,
        startTime: `${selectedDates[date].startTime}:00`,
        menuId: selectedDates[date].showMenu
          ? selectedDates[date].menuId
          : null,
        extraDishIds:
          selectedDates[date].showMenu &&
          selectedDates[date].extraDishIds?.length > 0
            ? selectedDates[date].extraDishIds
            : null,
        isDishSelected: selectedDates[date].showMenu,
        dishes: allDishes.length > 0 ? allDishes : null,
      };
    });

    const payload = {
      chefId: parseInt(chefId),
      packageId: selectedPackage.id,
      guestCount: numPeople,
      location: address,
      bookingDetails,
    };

    try {
      const response = await axiosInstance.post(
        "/bookings/calculate-long-term-booking",
        payload
      );
      router.push({
        pathname: "/screen/reviewBooking",
        params: {
          bookingData: JSON.stringify(response.data),
          selectedPackage: JSON.stringify(selectedPackage),
          chefId,
          numPeople,
          address,
          selectedDates: JSON.stringify(selectedDates),
        },
      });
    } catch (error) {
      console.log("Error:", error.response?.data || error.message);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to calculate long-term booking.",
      });
    }
  };

  const handleMenu = async () => {
    try {
      const response = await axiosInstance.get(`/menus?chefId=${chefId}`);
      if (response.status === 200) {
        setMenuItems(response.data.content || response.data || []);
      }
    } catch (error) {
      console.log("Error fetching menus:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Unable to fetch menus.",
      });
      setMenuItems([]);
    }
  };

  const handleBack = () => {
    router.push({
      pathname: "/screen/longTermBooking",
      params: {
        selectedPackage: JSON.stringify(selectedPackage),
        chefId,
        numPeople,
        address,
        selectedDates: JSON.stringify(selectedDates),
      },
    });
  };

  const navigateToSelectFood = (date) => {
    router.push({
      pathname: "/screen/chooseFoodForLongterm",
      params: {
        chefId,
        date,
        selectedPackage: JSON.stringify(selectedPackage),
        selectedDates: JSON.stringify(selectedDates),
        selectedMenu: selectedDates[date].menuId
          ? JSON.stringify(
              menuItems.find((item) => item.id === selectedDates[date].menuId)
            )
          : "",
        selectedDishes:
          selectedDates[date].extraDishIds?.length > 0
            ? JSON.stringify(
                selectedDates[date].extraDishIds.map((id) => ({ id }))
              )
            : "",
        dishNotes: JSON.stringify({
          ...selectedDates[date].menuDishNotes,
          ...selectedDates[date].extraDishNotes,
        }),
        numPeople: numPeople || "",
        address: address || "",
      },
    });
  };

  return (
    <GestureHandlerRootView style={commonStyles.containerContent}>
      <Header title={"Long-term Booking"} onLeftPress={handleBack} />
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
        >
          <Text style={styles.title}>
            Chọn Ngày (Cần chọn đúng {selectedPackage?.durationDays || 0} ngày):
          </Text>
          <Text style={styles.summary}>
            Đã chọn: {Object.keys(selectedDates).length}/
            {selectedPackage?.durationDays || 0} ngày
          </Text>

          {selectedPackage?.durationDays >= 10 && (
            <View style={styles.repeatContainer}>
              <View style={styles.switchContainer}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={styles.label}>Lặp lại lịch: </Text>
                  <TouchableOpacity
                    style={styles.infoButton}
                    onPress={showRepeatInfo}
                  >
                    <Text style={styles.infoButtonText}>?</Text>
                  </TouchableOpacity>
                </View>

                <Switch
                  value={isRepeatEnabled}
                  onValueChange={(value) => {
                    setIsRepeatEnabled(value);
                    if (!value) {
                      setSelectedWeekdays([]);
                      setSelectedDates({});
                    }
                  }}
                  trackColor={{ false: "#767577", true: "#A64B2A" }}
                  thumbColor={isRepeatEnabled ? "#A64B2A" : "#f4f3f4"}
                />
              </View>
              {isRepeatEnabled && (
                <View>
                  <View style={styles.weekdayContainer}>
                    {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map(
                      (day, index) => (
                        <TouchableOpacity
                          key={day}
                          style={[
                            styles.weekdayButton,
                            selectedWeekdays.includes(index) &&
                              styles.weekdayButtonSelected,
                          ]}
                          onPress={() => toggleWeekday(index)}
                        >
                          <Text
                            style={[
                              styles.weekdayText,
                              selectedWeekdays.includes(index) &&
                                styles.weekdayTextSelected,
                            ]}
                          >
                            {day}
                          </Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.applyButton,
                      selectedWeekdays.length === 0 && styles.disabledButton,
                    ]}
                    onPress={handleRepeatSelection}
                    disabled={selectedWeekdays.length === 0}
                  >
                    <Text style={styles.applyButtonText}>Áp dụng</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          <Calendar
            markedDates={selectedDates}
            onDayPress={onDayPress}
            style={styles.calendar}
            theme={{
              backgroundColor: "#F5F5F5",
              calendarBackground: "#F5F5F5",
              textDisabledColor: "#888888",
              selectedDayBackgroundColor: "#6C63FF",
              selectedDayTextColor: "#FFFFFF",
            }}
            minDate={todayString}
            maxDate={moment().add(1, "year").format("YYYY-MM-DD")}
          />

          {groupDatesByWeek(selectedDates, todayString).map((week, index) => (
            <View key={index} style={styles.weekCard}>
              <TouchableOpacity
                style={styles.weekHeader}
                onPress={() => toggleWeek(index)}
              >
                <Text style={styles.weekTitle}>
                  {week.start} – {week.end}
                </Text>
                <MaterialIcons
                  name={expandedWeeks[index] ? "expand-less" : "expand-more"}
                  size={24}
                  color="#555"
                />
              </TouchableOpacity>
              {expandedWeeks[index] !== false && (
                <View style={styles.weekContent}>
                  {week.dates.map((date) => (
                    <View
                      key={date}
                      style={[
                        styles.dateCard,
                        !selectedDates[date].startTime && styles.incompleteCard,
                      ]}
                    >
                      <View style={styles.dateHeader}>
                        <Text style={styles.dateTitle}>{date}</Text>
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => removeDate(date)}
                        >
                          <MaterialIcons
                            name="close"
                            size={16}
                            color="#FFFFFF"
                          />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.switchContainer}>
                        <Text style={styles.label}>Chọn món ăn:</Text>
                        <Switch
                          value={selectedDates[date].showMenu}
                          onValueChange={(value) =>
                            updateBookingDetail(date, "showMenu", value)
                          }
                          trackColor={{ false: "#767577", true: "#81b0ff" }}
                          thumbColor={
                            selectedDates[date].showMenu ? "#f5dd4b" : "#f4f3f4"
                          }
                        />
                      </View>

                      {selectedDates[date].showMenu && (
                        <>
                          <TouchableOpacity
                            onPress={() => navigateToSelectFood(date)}
                          >
                            <Text style={styles.addItemsText}>
                              {(selectedDates[date].menuId ||
                                selectedDates[date].extraDishIds?.length > 0)
                                ? "Add items"
                                : "Add menu or food"}
                            </Text>
                          </TouchableOpacity>

                          {selectedDates[date].menuId && (
                            <>
                              <View style={styles.menuHeader}>
                                <Text style={styles.summaryText}>
                                  Menu:{" "}
                                  {
                                    menuItems.find(
                                      (m) => m.id === selectedDates[date].menuId
                                    )?.name
                                  }
                                </Text>
                                <TouchableOpacity
                                  style={styles.removeItemButton}
                                  onPress={() => removeMenu(date)}
                                >
                                  <MaterialIcons
                                    name="close"
                                    size={16}
                                    color="#FFFFFF"
                                  />
                                </TouchableOpacity>
                              </View>
                              <Text style={styles.subTitle}>
                                Món trong menu:
                              </Text>
                              {menuItems
                                .find(
                                  (m) => m.id === selectedDates[date].menuId
                                )
                                ?.menuItems.map((item) => (
                                  <View
                                    key={item.dishId}
                                    style={styles.dishItem}
                                  >
                                    <Text style={styles.dishText}>
                                      {item.dishName}{" "}
                                      {selectedDates[date].menuDishNotes[
                                        item.dishId
                                      ] &&
                                        `(Ghi chú: ${
                                          selectedDates[date].menuDishNotes[
                                            item.dishId
                                          ]
                                        })`}
                                    </Text>
                                    <TouchableOpacity
                                      style={styles.editButton}
                                      onPress={() =>
                                        handleEditNote(date, item.dishId, true)
                                      }
                                    >
                                      <Text style={styles.editButtonText}>
                                        Ghi chú
                                      </Text>
                                    </TouchableOpacity>
                                  </View>
                                ))}
                            </>
                          )}
                          {selectedDates[date].extraDishIds?.length > 0 && (
                            <>
                              <Text style={styles.subTitle}>
                                {selectedDates[date].menuId
                                  ? "Món thêm:"
                                  : "Món ăn:"}
                              </Text>
                              {selectedDates[date].extraDishIds.map(
                                (dishId) => (
                                  <View key={dishId} style={styles.dishItem}>
                                    <Text style={styles.dishText}>
                                      {dishes.find((d) => d.id === dishId)
                                        ?.name || "Unknown Dish"}{" "}
                                      {selectedDates[date].extraDishNotes[
                                        dishId
                                      ] &&
                                        `(Ghi chú: ${selectedDates[date].extraDishNotes[dishId]})`}
                                    </Text>
                                    <View style={styles.dishActions}>
                                      <TouchableOpacity
                                        style={styles.editButton}
                                        onPress={() =>
                                          handleEditNote(date, dishId, false)
                                        }
                                      >
                                        <Text style={styles.editButtonText}>
                                          Ghi chú
                                        </Text>
                                      </TouchableOpacity>
                                      <TouchableOpacity
                                        style={styles.removeItemButton}
                                        onPress={() =>
                                          removeExtraDish(date, dishId)
                                        }
                                      >
                                        <MaterialIcons
                                          name="close"
                                          size={16}
                                          color="#FFFFFF"
                                        />
                                      </TouchableOpacity>
                                    </View>
                                  </View>
                                )
                              )}
                            </>
                          )}
                        </>
                      )}

                      <Text style={styles.label}>Giờ bắt đầu:</Text>
                      {isFetchingAvailability ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="small" color="#A64B2A" />
                          <Text style={styles.loadingText}>
                            Đang tải giờ khả dụng...
                          </Text>
                        </View>
                      ) : (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                        >
                          {getAvailableTimeSlots(date).length > 0 ? (
                            getAvailableTimeSlots(date).map((time) => (
                              <TouchableOpacity
                                key={`start-${time}`}
                                style={[
                                  styles.timeButton,
                                  selectedDates[date].startTime === time &&
                                    styles.timeButtonSelected,
                                ]}
                                onPress={() =>
                                  updateBookingDetail(date, "startTime", time)
                                }
                              >
                                <Text
                                  style={
                                    selectedDates[date].startTime === time
                                      ? styles.timeButtonTextSelected
                                      : styles.timeButtonText
                                  }
                                >
                                  {time}
                                </Text>
                              </TouchableOpacity>
                            ))
                          ) : (
                            <Text style={styles.noTimeText}>
                              Không có giờ khả dụng cho ngày này.
                            </Text>
                          )}
                        </ScrollView>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </ScrollView>
        <View style={styles.buttonArea}>
          <TouchableOpacity
            style={[
              styles.fixedButton,
              Object.keys(selectedDates).length !==
                selectedPackage?.durationDays && styles.disabledButton,
            ]}
            onPress={handleConfirm}
            disabled={
              Object.keys(selectedDates).length !==
              selectedPackage?.durationDays
            }
          >
            <Text style={styles.buttonText}>Xác Nhận Đặt Chỗ</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Note Modal */}
      <Modalize
        ref={modalizeRef}
        adjustToContentHeight={true}
        handlePosition="outside"
        modalStyle={styles.modalContent}
        onClose={() => setModalVisible(false)}
      >
        <View style={styles.modalInner}>
          <Text style={styles.modalTitle}>Ghi chú</Text>
          <TextInput
            style={styles.modalInput}
            value={noteText}
            onChangeText={setNoteText}
            placeholder="Nhập ghi chú cho món ăn"
            multiline
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => modalizeRef.current?.close()}
            >
              <Text style={styles.modalButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={saveNote}>
              <Text style={styles.modalButtonText}>Lưu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modalize>

      {/* Repeat Info Modal */}
      <Modalize
        ref={infoModalizeRef}
        adjustToContentHeight={true}
        handlePosition="outside"
        modalStyle={styles.modalContent}
        onClose={() => setInfoModalVisible(false)}
      >
        <View style={styles.modalInner}>
          <Text style={styles.modalTitle}>Hướng Dẫn Lặp Lại Lịch</Text>
          <Text style={styles.modalText}>
            Tính năng "Lặp lại lịch" giúp bạn tự động chọn các ngày đặt chỗ theo lịch lặp lại (ví dụ: mỗi Thứ Hai, Thứ Ba) cho gói từ 10 ngày trở lên, nhằm tiết kiệm thời gian chọn từng ngày trên lịch.
          </Text>
          <Text style={styles.modalText}>
            - Bật công tắc "Lặp lại lịch".{"\n"}
            - Chọn các ngày trong tuần (CN, T2, T3,...) mà bạn muốn đặt chỗ định kỳ.{"\n"}
            - Nhấn "Áp dụng" để tự động chọn các ngày phù hợp, bắt đầu từ hôm nay và tiếp tục cho đến khi đủ số ngày của gói ({selectedPackage?.durationDays} ngày).{"\n"}
            - Bạn có thể tắt tính năng này để chọn ngày thủ công trên lịch.
          </Text>
          <TouchableOpacity
            style={[styles.modalButton, { alignSelf: "center", width: "50%" }]}
            onPress={() => infoModalizeRef.current?.close()}
          >
            <Text style={styles.modalButtonText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </Modalize>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollViewContent: { padding: 16, paddingBottom: 100 },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  summary: {
    fontSize: 16,
    color: "#555",
    marginBottom: 16,
  },
  repeatContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  weekdayContainer: {
    flexDirection: "row",
    marginTop: 8,
    justifyContent: "space-between",
  },
  weekdayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E5E5E5",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 2,
  },
  weekdayButtonSelected: {
    backgroundColor: "#A64B2A",
  },
  weekdayText: {
    fontSize: 14,
    color: "#333",
  },
  weekdayTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  applyButton: {
    backgroundColor: "#A64B2A",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: "center",
  },
  applyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  infoButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#555",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  infoButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  calendar: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: 16,
  },
  weekCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  weekTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#A64B2A",
  },
  weekContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  dateCard: {
    backgroundColor: "#F9F9F9",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  incompleteCard: {
    borderColor: "#FF9800",
    borderWidth: 2,
  },
  dateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dateTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FF4D4D",
    justifyContent: "center",
    alignItems: "center",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    justifyContent: "space-between",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginRight: 8,
  },
  addItemsText: {
    color: "#1E90FF",
    fontSize: 14,
    fontWeight: "600",
    marginVertical: 8,
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 4,
  },
  summaryText: {
    fontSize: 14,
    color: "#333",
    marginVertical: 4,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginTop: 8,
  },
  dishItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  dishText: {
    fontSize: 14,
    color: "#555",
    flex: 1,
  },
  dishActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  editButton: {
    backgroundColor: "#FF9800",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  editButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  removeItemButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FF4D4D",
    justifyContent: "center",
    alignItems: "center",
  },
  timeButton: {
    padding: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: "#E5E5E5",
  },
  timeButtonSelected: {
    backgroundColor: "#A64B2A",
  },
  timeButtonText: {
    color: "#333",
    fontSize: 14,
  },
  timeButtonTextSelected: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  buttonArea: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#EBE5DD",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  fixedButton: {
    backgroundColor: "#A64B2A",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#B0B0B0",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalInner: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  modalText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 16,
    lineHeight: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    backgroundColor: "#A64B2A",
    padding: 12,
    borderRadius: 8,
    width: "48%",
    alignItems: "center",
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#777",
  },
  noTimeText: {
    fontSize: 14,
    color: "#777",
    marginVertical: 8,
  },
});

export default LongTermSelectBooking;