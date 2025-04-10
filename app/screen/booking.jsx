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
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { commonStyles } from "../../style";
import Header from "../../components/header";
import moment from "moment";
import Toast from "react-native-toast-message";
import ProgressBar from "../../components/progressBar";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Modalize } from "react-native-modalize";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useAxios from "../../config/AXIOS_API";

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
    }),
    [params.chefId, params.selectedMenu, params.selectedDishes, params.dishNotes, params.updatedDishId, params.updatedNote]
  );

  const { chefId, selectedMenu: parsedSelectedMenu, selectedDishes: parsedSelectedDishes, dishNotes: initialDishNotes, updatedDishId, updatedNote } = parsedParams;

  const [month, setMonth] = useState(moment().format("MM"));
  const [year, setYear] = useState(moment().format("YYYY"));
  const [selectedDay, setSelectedDay] = useState(null);
  const [specialRequest, setSpecialRequest] = useState("");
  const [address, setAddress] = useState("");
  const [numPeople, setNumPeople] = useState(1);
  const today = moment();
  const days = getDaysInMonth(month, year);

  const [startTime, setStartTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dishNotes, setDishNotes] = useState(initialDishNotes);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [tempDishNotes, setTempDishNotes] = useState(initialDishNotes);
  const axiosInstance = useAxios();
  const [availability, setAvailability] = useState([]);
  const [dishIds, setDishIds] = useState([]);
  const [addresses, setAddresses] = useState([]); // Added for address list

  const modalizeRef = useRef(null);
  const addressModalizeRef = useRef(null); // Added for address modal

  useEffect(() => {
    const loadSelectedAddress = async () => {
      try {
        const savedAddress = await AsyncStorage.getItem("selectedAddress");
        if (savedAddress) {
          const parsedAddress = JSON.parse(savedAddress);
          setAddress(parsedAddress.address);
          console.log("Loaded selected address:", parsedAddress.address);
        }
      } catch (error) {
        console.error("Error loading selected address:", error);
      }
    };
    loadSelectedAddress();
  }, []);

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
    console.log("Calculated dishIds:", allDishIds);
    setDishIds(allDishIds);
  }, [parsedSelectedMenu, parsedSelectedDishes]);

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!selectedDay || !address) {
        console.log("Skipping fetchAvailability: missing selectedDay or address");
        return;
      }

      try {
        const date = selectedDay.format("YYYY-MM-DD");
        const menuId = parsedSelectedMenu ? parsedSelectedMenu.id : null;
        console.log("Fetching availability with params:", {
          chefId,
          date,
          customerLocation: address,
          guestCount: numPeople,
          menuId,
          dishIds,
        });
        const response = await axiosInstance.get(
          `/availability/chef/${chefId}/location-constraints`,
          {
            params: {
              date,
              customerLocation: address,
              guestCount: numPeople,
              menuId: menuId || undefined,
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
        setAvailability(response.data);
        console.log("Availability data:", response.data);
      } catch (error) {
        console.error("Error fetching availability:", error.response?.data || error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.response?.data?.message || "Unable to fetch chef availability. Please try again.",
        });
        setAvailability([]);
      }
    };

    fetchAvailability();
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
        },
      });
      console.log("Booking response:", JSON.stringify(response.data));
    } catch (error) {
      console.error("Error calling calculate-single-booking:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.response?.data?.message || "Failed to calculate booking. Please try again.",
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
      id: item.dishId || item.id,
      name: item.dishName || item.name || "Unnamed Dish",
    })),
    ...parsedSelectedDishes.map((dish) => ({
      id: dish.id,
      name: dish.name || "Unnamed Dish",
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
          onPress={() => addressModalizeRef.current?.close()}
          style={styles.cancelButton}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modalize>
  );

  console.log("Rendering BookingScreen");
  return (
    <GestureHandlerRootView style={commonStyles.containerContent}>
      <Header title="Booking" />
      <ProgressBar title="Chọn ngày" currentStep={3} totalSteps={4} />
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 20 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Number of People</Text>
          <View style={styles.numberPicker}>
            <TouchableOpacity style={styles.numberButton} onPress={decrementPeople} disabled={numPeople <= 1}>
              <Text style={styles.numberButtonText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.numberText}>{numPeople}</Text>
            <TouchableOpacity style={styles.numberButton} onPress={incrementPeople}>
              <Text style={styles.numberButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address</Text>
          <TouchableOpacity onPress={() => openAddressModal()} style={styles.locationContainer}>
            <MaterialIcons name="location-on" size={20} color="#4EA0B7" style={styles.locationIcon} />
            <Text style={styles.locationText}>
              {address || "Select an address"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <FlatList
            data={days}
            keyExtractor={(item) => item.day.toString()}
            horizontal
            initialScrollIndex={days.findIndex((item) => isToday(item.date))}
            showsHorizontalScrollIndicator={false}
            getItemLayout={(data, index) => ({ length: 80, offset: 80 * index, index })}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.dayContainer,
                  isBeforeToday(item.date) && styles.disabledDay,
                  isSelectedDay(item.date) && styles.selectedDay,
                ]}
                disabled={isBeforeToday(item.date)}
                onPress={() => {
                  setSelectedDay(item.date);
                  setStartTime(null);
                }}
              >
                <Text style={[styles.dayOfWeek, isSelectedDay(item.date) && styles.selectedText]}>
                  {item.dayOfWeek}
                </Text>
                <Text style={[styles.day, isSelectedDay(item.date) && styles.selectedText]}>
                  {item.day}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {selectedDay && availableTimeSlots.length > 0 && (
          <View style={styles.timeContainer}>
            <Text style={styles.label}>Start time</Text>
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
          </View>
        )}

        {selectedDay && availableTimeSlots.length === 0 && (
          <View style={styles.timeContainer}>
            <Text style={styles.noTimeText}>No available time slots for this day.</Text>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.menuHeader}>
            <TouchableOpacity
              style={styles.menuHeaderContent}
              onPress={() => setIsMenuExpanded(!isMenuExpanded)}
            >
              <Text style={styles.sectionTitle}>
                {parsedSelectedMenu ? parsedSelectedMenu.name : "Order"}
              </Text>
              <MaterialIcons
                name={isMenuExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                size={24}
                color="#333"
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAddItems}>
              <Text style={styles.addItemsText}>Add items</Text>
            </TouchableOpacity>
          </View>

          {isMenuExpanded && (
            <View style={styles.menuContent}>
              {parsedSelectedMenu && (parsedSelectedMenu.menuItems || []).length > 0 ? (
                parsedSelectedMenu.menuItems.map((item, idx) => (
                  <View key={idx} style={styles.dishRow}>
                    <View style={styles.dishInfo}>
                      <Image
                        source={
                          item.imageUrl
                            ? { uri: item.imageUrl }
                            : require("../../assets/images/1.jpg")
                        }
                        style={styles.dishImage}
                        resizeMode="cover"
                      />
                      <View style={styles.dishText}>
                        <Text style={styles.dishName}>
                          {item.dishName || item.name || "Unnamed Dish"}
                        </Text>
                        {dishNotes[item.dishId || item.id] && (
                          <Text style={styles.noteText}>
                            Note: {dishNotes[item.dishId || item.id]}
                          </Text>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity onPress={openModal}>
                      <Text style={styles.editText}>Edit Notes</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : null}

              {parsedSelectedDishes.length > 0 && (
                parsedSelectedDishes.map((dish, idx) => (
                  <View key={idx} style={styles.dishRow}>
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
                          <Text style={styles.noteText}>Note: {dishNotes[dish.id]}</Text>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity onPress={openModal}>
                      <Text style={styles.editText}>Edit Notes</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}

              {!parsedSelectedMenu && parsedSelectedDishes.length === 0 && (
                <Text style={styles.noItemsText}>No menus or dishes selected.</Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special request</Text>
          <TextInput
            style={styles.specialRequestInput}
            placeholder="Enter your request"
            value={specialRequest}
            onChangeText={setSpecialRequest}
            multiline
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmBooking} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.confirmButtonText}>Confirm booking</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modalize
        ref={modalizeRef}
        adjustToContentHeight
        handlePosition="outside"
        modalStyle={styles.modalStyle}
        handleStyle={styles.handleStyle}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Edit Notes for Dishes</Text>
          {allDishes.length > 0 ? (
            allDishes.map((dish) => (
              <View key={dish.id} style={styles.dishNoteContainer}>
                <Text style={styles.dishNoteLabel}>{dish.name}</Text>
                <TextInput
                  style={styles.dishNoteInput}
                  placeholder="Add your request here..."
                  value={tempDishNotes[dish.id] || ""}
                  onChangeText={(text) =>
                    setTempDishNotes((prev) => ({ ...prev, [dish.id]: text }))
                  }
                  multiline
                />
              </View>
            ))
          ) : (
            <Text style={styles.noDishesText}>No dishes to add notes for.</Text>
          )}
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={cancelNotes}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={saveNotes}>
              <Text style={styles.saveButtonText}>Save Notes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modalize>

      {renderAddressModal()}
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  section: {
    borderTopColor: "#D1D1D1",
    borderTopWidth: 0.5,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  numberPicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  numberButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#A64B2A",
    justifyContent: "center",
    alignItems: "center",
  },
  numberButtonText: {
    fontSize: 24,
    color: "white",
    fontWeight: "bold",
  },
  numberText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginHorizontal: 20,
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
    color: "#1E90FF",
    fontWeight: "bold",
  },
  menuContent: {
    marginTop: 10,
  },
  dishRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
  },
  dishInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dishImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 10,
  },
  dishText: {
    flex: 1,
  },
  dishName: {
    fontSize: 16,
    color: "#333",
  },
  noteText: {
    fontSize: 14,
    color: "#777",
    marginTop: 2,
  },
  editText: {
    fontSize: 14,
    color: "#1E90FF",
    fontWeight: "bold",
  },
  noItemsText: {
    fontSize: 16,
    color: "#777",
  },
  dayContainer: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginRight: 10,
    alignItems: "center",
    backgroundColor: "#519254",
    borderRadius: 20,
  },
  disabledDay: {
    backgroundColor: "#BAB8B8",
  },
  selectedDay: {
    backgroundColor: "#A9411D",
  },
  selectedText: {
    color: "white",
    fontWeight: "bold",
  },
  timeContainer: {
    paddingVertical: 10,
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  timeButton: {
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: "#e0e0e0",
  },
  timeButtonSelected: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 6,
    backgroundColor: "#A64B2A",
  },
  timeButtonText: {
    fontSize: 16,
    color: "#333",
  },
  timeButtonTextSelected: {
    fontSize: 16,
    color: "white",
    fontWeight: "bold",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderWidth: 1,
    borderColor: "#D1D1D1",
    borderRadius: 10,
    backgroundColor: "#FFF",
  },
  locationIcon: {
    marginRight: 8,
  },
  locationText: {
    fontSize: 16,
    color: "#333",
    flexShrink: 1,
    flexWrap: "wrap",
  },
  specialRequestInput: {
    borderWidth: 1,
    borderColor: "#D1D1D1",
    borderRadius: 10,
    padding: 10,
    height: 100,
    textAlignVertical: "top",
    backgroundColor: "#FFF",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#EBE5DD",
    padding: 20,
    alignItems: "center",
  },
  confirmButton: {
    width: "100%",
    backgroundColor: "#A64B2A",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
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
    borderColor: "#D1D1D1",
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

export default BookingScreen;