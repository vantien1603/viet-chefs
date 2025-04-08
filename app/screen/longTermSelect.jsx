import { router, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  SafeAreaView,
  StyleSheet,
  TextInput,
  Image,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { Dropdown } from "react-native-element-dropdown";
import Header from "../../components/header";
import AXIOS_API from "../../config/AXIOS_API";
import ProgressBar from "../../components/progressBar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MaterialIcons } from "@expo/vector-icons";

// Hàm tạo danh sách các khoảng thời gian
const generateTimeSlots = () => {
  const timeSlots = [];
  for (let hour = 8; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      timeSlots.push(time);
    }
  }
  return timeSlots;
};

const LongTermSelectBooking = () => {
  const params = useLocalSearchParams();
  const selectedPackage = JSON.parse(params.selectedPackage);
  const chefId = params.chefId;
  const numPeople = parseInt(params.numPeople);
  const location = params.address;
  const [selectedDates, setSelectedDates] = useState({});
  const [extraDishes, setExtraDishes] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [editingNote, setEditingNote] = useState(null);

  const today = new Date();
  const todayString = today.toISOString().split("T")[0];
  const timeSlots = generateTimeSlots();

  useEffect(() => {
    handleMenu();
  }, []);

  const onDayPress = (day) => {
    let newSelection = { ...selectedDates };
    if (day.dateString < todayString) {
      return;
    }
    if (newSelection[day.dateString]) {
      delete newSelection[day.dateString];
    } else if (
      Object.keys(newSelection).length < selectedPackage.durationDays
    ) {
      newSelection[day.dateString] = {
        selected: true,
        selectedColor: "#6C63FF",
        isServing: false,
        showMenu: false,
        startTime: "",
        menuId: null,
        extraDishIds: [],
        menuDishNotes: {},
        extraDishNotes: {},
      };
    }
    setSelectedDates(newSelection);
  };

  const updateBookingDetail = (date, key, value) => {
    setSelectedDates((prev) => {
      const updated = {
        ...prev,
        [date]: { ...prev[date], [key]: value },
      };
      if (key === "menuId" && value) {
        fetchDishesNotInMenu(value);
      }
      return updated;
    });
  };

  const updateMenuDishNote = (date, dishId, note) => {
    setSelectedDates((prev) => ({
      ...prev,
      [date]: {
        ...prev[date],
        menuDishNotes: {
          ...prev[date].menuDishNotes,
          [dishId]: note,
        },
      },
    }));
  };

  const updateExtraDishNote = (date, dishId, note) => {
    setSelectedDates((prev) => ({
      ...prev,
      [date]: {
        ...prev[date],
        extraDishNotes: {
          ...prev[date].extraDishNotes,
          [dishId]: note,
        },
      },
    }));
  };

  const handleConfirm = async () => {
    if (Object.keys(selectedDates).length !== selectedPackage.durationDays) {
      alert(
        `Vui lòng chọn đúng ${selectedPackage.durationDays} ngày cho gói ${selectedPackage.name}`
      );
      return;
    }
    const bookingDetails = Object.keys(selectedDates).map((date) => ({
      sessionDate: date,
      isServing: selectedDates[date].isServing,
      startTime: `${selectedDates[date].startTime}:00`,
      menuId: selectedDates[date].showMenu ? selectedDates[date].menuId : null,
      extraDishIds:
        selectedDates[date].showMenu &&
        selectedDates[date].extraDishIds.length > 0
          ? selectedDates[date].extraDishIds
          : null,
      isDishSelected: selectedDates[date].showMenu,
      menuDishNotes: selectedDates[date].menuDishNotes || {},
      extraDishNotes: selectedDates[date].extraDishNotes || {},
    }));

    const payload = {
      chefId: parseInt(chefId),
      packageId: selectedPackage.id,
      guestCount: numPeople,
      location,
      bookingDetails,
    };

    console.log("Payload to API:", JSON.stringify(payload, null, 2));

    try {
      const response = await AXIOS_API.post(
        "/bookings/calculate-long-term-booking",
        payload
      );
      console.log("API Response:", response.data);
      router.push({
        pathname: "/screen/reviewBooking",
        params: {
          bookingData: JSON.stringify(response.data),
          selectedPackage: JSON.stringify(selectedPackage),
          chefId: chefId,
          numPeople: numPeople,
          address: location,
          selectedDates: JSON.stringify(selectedDates),
        },
      });
    } catch (error) {
      console.log("Error calling calculate-long-term-booking:", error);
      alert("Có lỗi khi tính toán giá đặt chỗ dài hạn.");
    }
  };

  const handleMenu = async () => {
    try {
      const response = await AXIOS_API.get(`/menus?chefId=${chefId}`);
      console.log("Raw API Response:", response.data);
      if (response.status === 200) {
        const fetchedMenus = response.data.content || response.data || [];
        setMenuItems(fetchedMenus);
        console.log("Menus fetched:", JSON.stringify(fetchedMenus, null, 2));
      }
    } catch (error) {
      console.log("Error fetching menus:", error);
      alert("Không thể lấy danh sách menu.");
      setMenuItems([]);
    }
  };

  const fetchDishesNotInMenu = async (menuId) => {
    try {
      const response = await AXIOS_API.get(
        `/dishes/not-in-menu?menuId=${menuId}`
      );
      if (response.status === 200) {
        const fetchedDishes = response.data.content || response.data || [];
        setExtraDishes(fetchedDishes);
        console.log("Dishes not in menu:", fetchedDishes);
      }
    } catch (error) {
      console.log("Error fetching dishes not in menu:", error);
      alert("Không thể lấy danh sách món ăn ngoài menu.");
      setExtraDishes([]);
    }
  };

  const toggleEditNote = (date, dishId, type) => {
    const key = `${date}-${dishId}-${type}`;
    setEditingNote(editingNote === key ? null : key);
  };

  const saveNote = (date, dishId, type, note) => {
    if (type === "menu") {
      updateMenuDishNote(date, dishId, note);
    } else {
      updateExtraDishNote(date, dishId, note);
    }
    setEditingNote(null);
  };

  return (
    <GestureHandlerRootView style={styles.safeArea}>
      <Header title={"Long-term Booking"} />
      <ProgressBar title="Chọn lịch" currentStep={3} totalSteps={4} />
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
        >
          <Text style={styles.title}>
            Chọn Ngày (Cần chọn đúng {selectedPackage.durationDays} ngày):
          </Text>
          <Calendar
            markedDates={{
              ...selectedDates,
              ...Object.fromEntries(
                Array.from({ length: 30 }, (_, i) => {
                  const pastDate = new Date(today);
                  pastDate.setDate(today.getDate() - i - 1);
                  const dateString = pastDate.toISOString().split("T")[0];
                  return [
                    dateString,
                    { disabled: true, disableTouchEvent: true },
                  ];
                })
              ),
            }}
            onDayPress={onDayPress}
            style={styles.calendar}
            theme={{
              backgroundColor: "#EBE5DD",
              calendarBackground: "#EBE5DD",
              textDisabledColor: "#888888",
            }}
            minDate={todayString}
          />

          {Object.keys(selectedDates).map((date) => (
            <View key={date} style={styles.dateCard}>
              <Text style={styles.dateTitle}>{date}</Text>

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
                <Text style={styles.switchText}>
                  {selectedDates[date].showMenu ? "Có" : "Không"}
                </Text>
              </View>

              {selectedDates[date].showMenu && (
                <>
                  <Text style={styles.label}>Chọn Menu:</Text>
                  <Dropdown
                    style={styles.dropdown}
                    data={menuItems}
                    labelField="name"
                    valueField="id"
                    placeholder="Select Menu"
                    placeholderStyle={styles.dropdownPlaceholder}
                    selectedTextStyle={styles.dropdownSelectedText}
                    value={selectedDates[date].menuId}
                    onChange={(item) =>
                      updateBookingDetail(date, "menuId", item.id)
                    }
                    search
                    searchPlaceholder="Tìm kiếm menu..."
                    containerStyle={styles.dropdownContainer}
                    itemTextStyle={styles.dropdownItemText}
                  />

                  {selectedDates[date].menuId && menuItems.length > 0 && (
                    <View style={styles.menuDishesContainer}>
                      <Text style={styles.subLabel}>Món trong menu:</Text>
                      {menuItems
                        .find((item) => item.id === selectedDates[date].menuId)
                        ?.menuItems?.map((dish) => {
                          const noteKey = `${date}-${dish.dishId}-menu`;
                          const isEditing = editingNote === noteKey;
                          return (
                            <View key={dish.dishId} style={styles.dishCard}>
                              <Image
                                source={require("../../assets/images/1.jpg")} // Placeholder image
                                style={styles.dishImage}
                              />
                              <View style={styles.dishContent}>
                                <Text style={styles.dishText}>
                                  {dish.dishName}
                                </Text>
                                {selectedDates[date].menuDishNotes[
                                  dish.dishId
                                ] &&
                                  !isEditing && (
                                    <Text style={styles.noteText}>
                                      Note:{" "}
                                      {
                                        selectedDates[date].menuDishNotes[
                                          dish.dishId
                                        ]
                                      }
                                    </Text>
                                  )}
                                {isEditing ? (
                                  <View style={styles.noteInputContainer}>
                                    <TextInput
                                      style={styles.noteInput}
                                      placeholder="Add your request here..."
                                      value={
                                        selectedDates[date].menuDishNotes[
                                          dish.dishId
                                        ] || ""
                                      }
                                      onChangeText={(text) =>
                                        updateMenuDishNote(
                                          date,
                                          dish.dishId,
                                          text
                                        )
                                      }
                                      multiline
                                    />
                                    <TouchableOpacity
                                      style={styles.saveNoteButton}
                                      onPress={() =>
                                        saveNote(
                                          date,
                                          dish.dishId,
                                          "menu",
                                          selectedDates[date].menuDishNotes[
                                            dish.dishId
                                          ]
                                        )
                                      }
                                    >
                                      <Text style={styles.saveNoteButtonText}>
                                        Save
                                      </Text>
                                    </TouchableOpacity>
                                  </View>
                                ) : (
                                  <TouchableOpacity
                                    style={styles.editNoteButton}
                                    onPress={() =>
                                      toggleEditNote(date, dish.dishId, "menu")
                                    }
                                  >
                                    <Text style={styles.editNoteButtonText}>
                                      Edit Note
                                    </Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                            </View>
                          );
                        }) || (
                        <Text style={styles.noItemsText}>
                          Không có món nào trong menu này
                        </Text>
                      )}
                    </View>
                  )}

                  <Text style={styles.label}>Chọn Món Thêm:</Text>
                  {extraDishes.length > 0 ? (
                    extraDishes.map((item) => {
                      const noteKey = `${date}-${item.id}-extra`;
                      const isEditing = editingNote === noteKey;
                      const isSelected = selectedDates[
                        date
                      ].extraDishIds?.includes(item.id);
                      return (
                        <View key={item.id} style={styles.dishCard}>
                          <Image
                            source={require("../../assets/images/1.jpg")} // Placeholder image
                            style={styles.dishImage}
                          />
                          <View style={styles.dishContent}>
                            <TouchableOpacity
                              onPress={() => {
                                const currentExtras =
                                  selectedDates[date].extraDishIds || [];
                                updateBookingDetail(
                                  date,
                                  "extraDishIds",
                                  currentExtras.includes(item.id)
                                    ? currentExtras.filter(
                                        (id) => id !== item.id
                                      )
                                    : [...currentExtras, item.id]
                                );
                              }}
                              style={styles.dishNameContainer}
                            >
                              <View style={styles.dishNameWithCheck}>
                                <Text style={styles.dishText}>{item.name}</Text>
                                {isSelected && (
                                  <MaterialIcons
                                    name="check-circle"
                                    size={20}
                                    color="#A64B2A"
                                    style={styles.checkIcon}
                                  />
                                )}
                              </View>
                            </TouchableOpacity>
                            {isSelected && (
                              <>
                                {selectedDates[date].extraDishNotes[item.id] &&
                                  !isEditing && (
                                    <Text style={styles.noteText}>
                                      Note:{" "}
                                      {
                                        selectedDates[date].extraDishNotes[
                                          item.id
                                        ]
                                      }
                                    </Text>
                                  )}
                                {isEditing ? (
                                  <View style={styles.noteInputContainer}>
                                    <TextInput
                                      style={styles.noteInput}
                                      placeholder="Add your request here..."
                                      value={
                                        selectedDates[date].extraDishNotes[
                                          item.id
                                        ] || ""
                                      }
                                      onChangeText={(text) =>
                                        updateExtraDishNote(date, item.id, text)
                                      }
                                      multiline
                                    />
                                    <TouchableOpacity
                                      style={styles.saveNoteButton}
                                      onPress={() =>
                                        saveNote(
                                          date,
                                          item.id,
                                          "extra",
                                          selectedDates[date].extraDishNotes[
                                            item.id
                                          ]
                                        )
                                      }
                                    >
                                      <Text style={styles.saveNoteButtonText}>
                                        Save
                                      </Text>
                                    </TouchableOpacity>
                                  </View>
                                ) : (
                                  <TouchableOpacity
                                    style={styles.editNoteButton}
                                    onPress={() =>
                                      toggleEditNote(date, item.id, "extra")
                                    }
                                  >
                                    <Text style={styles.editNoteButtonText}>
                                      Edit Note
                                    </Text>
                                  </TouchableOpacity>
                                )}
                              </>
                            )}
                          </View>
                        </View>
                      );
                    })
                  ) : (
                    <Text style={styles.noItemsText}>
                      Chọn menu để xem món thêm
                    </Text>
                  )}
                </>
              )}

              <Text style={styles.label}>Giờ bắt đầu:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {timeSlots.map((time) => (
                  <TouchableOpacity
                    key={`start-${time}`}
                    style={[
                      styles.timeButton,
                      selectedDates[date].startTime === time &&
                        styles.timeButtonSelected,
                    ]}
                    onPress={() => updateBookingDetail(date, "startTime", time)}
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
                ))}
              </ScrollView>
            </View>
          ))}
        </ScrollView>
        <View style={styles.buttonArea}>
          <TouchableOpacity style={styles.fixedButton} onPress={handleConfirm}>
            <Text style={styles.buttonText}>Xác Nhận Đặt Chỗ</Text>
          </TouchableOpacity>
        </View>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#EBE5DD",
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  scrollViewContent: {
    paddingBottom: 100, // Ensure enough padding to scroll past the fixed button
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  calendar: {
    backgroundColor: "#EBE5DD",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D1D1",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dateCard: {
    marginTop: 20,
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 12,
    borderColor: "#D1D1D1",
    borderWidth: 1,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginTop: 15,
    marginBottom: 5,
  },
  subLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    marginTop: 15,
    marginBottom: 10,
  },
  switchText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#555",
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#D1D1D1",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#FFF",
    marginVertical: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: "#888",
  },
  dropdownSelectedText: {
    fontSize: 16,
    color: "#333",
  },
  dropdownContainer: {
    borderRadius: 12,
    borderColor: "#D1D1D1",
    borderWidth: 1,
    backgroundColor: "#FFF",
    elevation: 2,
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#333",
  },
  menuDishesContainer: {
    marginTop: 10,
  },
  dishCard: {
    flexDirection: "row",
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    padding: 10,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  dishImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },
  dishContent: {
    flex: 1,
    justifyContent: "center",
  },
  dishNameContainer: {
    marginBottom: 5,
  },
  dishNameWithCheck: {
    flexDirection: "row",
    alignItems: "center",
  },
  dishText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  checkIcon: {
    marginLeft: 8,
  },
  noteText: {
    fontSize: 14,
    color: "#777",
    marginTop: 2,
    marginBottom: 5,
  },
  editNoteButton: {
    backgroundColor: "#1E90FF",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  editNoteButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  noteInputContainer: {
    marginTop: 5,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: "#D1D1D1",
    borderRadius: 8,
    padding: 10,
    minHeight: 60,
    textAlignVertical: "top",
    backgroundColor: "#FFF",
    marginBottom: 5,
  },
  saveNoteButton: {
    backgroundColor: "#A64B2A",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  saveNoteButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  noItemsText: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    marginVertical: 10,
  },
  timeButton: {
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: "#E5E5E5",
  },
  timeButtonSelected: {
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: "#A64B2A",
  },
  timeButtonDisabled: {
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: "#D3D3D3",
    opacity: 0.5,
  },
  timeButtonText: {
    color: "#333",
    fontSize: 14,
  },
  timeButtonTextSelected: {
    color: "white",
    fontSize: 14,
  },
  timeButtonTextDisabled: {
    color: "#888",
    fontSize: 14,
  },
  buttonArea: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#D3C8B5",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
  },
  fixedButton: {
    backgroundColor: "#A64B2A",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 18,
  },
});

export default LongTermSelectBooking;
