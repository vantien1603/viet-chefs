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
} from "react-native";
import { Calendar } from "react-native-calendars";
import { Dropdown } from "react-native-element-dropdown";
import Header from "../../components/header";
import AXIOS_API from "../../config/AXIOS_API";
import ProgressBar from "../../components/progressBar";

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
    } else if (Object.keys(newSelection).length < selectedPackage.durationDays) {
      newSelection[day.dateString] = {
        selected: true,
        selectedColor: "#6C63FF",
        isServing: false,
        showMenu: false,
        startTime: "08:30",
        endTime: "19:30",
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
      endTime: `${selectedDates[date].endTime}:00`,
      menuId: selectedDates[date].showMenu ? selectedDates[date].menuId : null,
      extraDishIds:
        selectedDates[date].showMenu && selectedDates[date].extraDishIds.length > 0
          ? selectedDates[date].extraDishIds
          : null,
      isDishSelected: selectedDates[date].showMenu,
      // menuDishNotes: selectedDates[date].menuDishNotes || {},
      // extraDishNotes: selectedDates[date].extraDishNotes || {},
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
      const response = await AXIOS_API.get(`/dishes/not-in-menu?menuId=${menuId}`);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title={"Long-term Booking"} />
      <ProgressBar title="Chọn lịch" currentStep={3} totalSteps={4} />
      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
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
                  return [dateString, { disabled: true, disableTouchEvent: true }];
                })
              ),
            }}
            onDayPress={onDayPress}
            style={{
              backgroundColor: "#EBE5DD",
              borderRadius: 8,
              borderWidth: 1,
              borderColor: "#ccc",
            }}
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
                <Text style={styles.label}>Muốn phục vụ:</Text>
                <Switch
                  value={selectedDates[date].isServing}
                  onValueChange={(value) => updateBookingDetail(date, "isServing", value)}
                  trackColor={{ false: "#767577", true: "#81b0ff" }}
                  thumbColor={selectedDates[date].isServing ? "#f5dd4b" : "#f4f3f4"}
                />
                <Text style={styles.switchText}>
                  {selectedDates[date].isServing ? "Có" : "Không"}
                </Text>
              </View>

              <Text style={styles.label}>Giờ bắt đầu:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {timeSlots.map((time) => (
                  <TouchableOpacity
                    key={`start-${time}`}
                    style={[
                      styles.timeButton,
                      selectedDates[date].startTime === time && styles.timeButtonSelected,
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

              <Text style={styles.label}>Giờ kết thúc:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {timeSlots.map((time) => {
                  const isBeforeStart =
                    new Date(`1970-01-01T${time}:00`) <=
                    new Date(`1970-01-01T${selectedDates[date].startTime}:00`);
                  return (
                    <TouchableOpacity
                      key={`end-${time}`}
                      style={[
                        styles.timeButton,
                        selectedDates[date].endTime === time
                          ? styles.timeButtonSelected
                          : isBeforeStart
                          ? styles.timeButtonDisabled
                          : styles.timeButton,
                      ]}
                      onPress={() => !isBeforeStart && updateBookingDetail(date, "endTime", time)}
                      disabled={isBeforeStart}
                    >
                      <Text
                        style={
                          selectedDates[date].endTime === time
                            ? styles.timeButtonTextSelected
                            : isBeforeStart
                            ? styles.timeButtonTextDisabled
                            : styles.timeButtonText
                        }
                      >
                        {time}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.switchContainer}>
                <Text style={styles.label}>Chọn món ăn:</Text>
                <Switch
                  value={selectedDates[date].showMenu}
                  onValueChange={(value) => updateBookingDetail(date, "showMenu", value)}
                  trackColor={{ false: "#767577", true: "#81b0ff" }}
                  thumbColor={selectedDates[date].showMenu ? "#f5dd4b" : "#f4f3f4"}
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
                    placeholder="Chọn menu"
                    value={selectedDates[date].menuId}
                    onChange={(item) => updateBookingDetail(date, "menuId", item.id)}
                    search
                    searchPlaceholder="Tìm kiếm menu..."
                  />
                  {selectedDates[date].menuId && menuItems.length > 0 && (
                    <View style={styles.menuDishesContainer}>
                      <Text style={styles.subLabel}>Món trong menu:</Text>
                      {menuItems
                        .find((item) => item.id === selectedDates[date].menuId)
                        ?.menuItems?.map((dish) => (
                          <View key={dish.dishId} style={styles.dishItem}>
                            <Text style={styles.dishText}>{dish.dishName}</Text>
                            <TextInput
                              style={styles.noteInput}
                              placeholder={`Ghi chú cho ${dish.dishName}`}
                              value={selectedDates[date].menuDishNotes[dish.dishId] || ""}
                              onChangeText={(text) =>
                                updateMenuDishNote(date, dish.dishId, text)
                              }
                            />
                          </View>
                        )) || <Text>Không có món nào trong menu này</Text>}
                    </View>
                  )}

                  <Text style={styles.label}>Chọn Món Thêm:</Text>
                  {extraDishes.length > 0 ? (
                    extraDishes.map((item) => (
                      <View key={item.id} style={styles.extraDishItem}>
                        <TouchableOpacity
                          onPress={() => {
                            const currentExtras = selectedDates[date].extraDishIds || [];
                            updateBookingDetail(
                              date,
                              "extraDishIds",
                              currentExtras.includes(item.id)
                                ? currentExtras.filter((id) => id !== item.id)
                                : [...currentExtras, item.id]
                            );
                          }}
                          style={{
                            ...styles.button,
                            backgroundColor: selectedDates[date].extraDishIds?.includes(item.id)
                              ? "#A64B2A"
                              : "#e0e0e0",
                          }}
                        >
                          <Text
                            style={{
                              color: selectedDates[date].extraDishIds?.includes(item.id)
                                ? "white"
                                : "black",
                              fontSize: 16,
                            }}
                          >
                            {item.name}
                          </Text>
                        </TouchableOpacity>
                        {selectedDates[date].extraDishIds?.includes(item.id) && (
                          <TextInput
                            style={styles.noteInput}
                            placeholder={`Ghi chú cho ${item.name}`}
                            value={selectedDates[date].extraDishNotes[item.id] || ""}
                            onChangeText={(text) => updateExtraDishNote(date, item.id, text)}
                          />
                        )}
                      </View>
                    ))
                  ) : (
                    <Text>Chọn menu để xem món thêm</Text>
                  )}
                </>
              )}
            </View>
          ))}

          {Object.keys(selectedDates).length > 0 && (
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Chi Tiết Đặt Chỗ:</Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={styles.tableHeaderText}>Ngày</Text>
                  <Text style={styles.tableHeaderText}>Giờ Bắt Đầu</Text>
                  <Text style={styles.tableHeaderText}>Giờ Kết Thúc</Text>
                  <Text style={styles.tableHeaderText}>Menu</Text>
                  <Text style={styles.tableHeaderText}>Món Thêm</Text>
                </View>
                {Object.keys(selectedDates).map((date) => (
                  <View key={date} style={styles.tableRow}>
                    <Text style={styles.tableCell}>{date}</Text>
                    <Text style={styles.tableCell}>{selectedDates[date].startTime}</Text>
                    <Text style={styles.tableCell}>{selectedDates[date].endTime}</Text>
                    <Text style={styles.tableCell}>
                      {selectedDates[date].showMenu && selectedDates[date].menuId
                        ? `${
                            menuItems.find((item) => item.id === selectedDates[date].menuId)?.name ||
                            "Unknown Menu"
                          }\n(${
                            menuItems
                              .find((item) => item.id === selectedDates[date].menuId)
                              ?.menuItems?.map(
                                (dish) =>
                                  `${dish.dishName}${
                                    selectedDates[date].menuDishNotes[dish.dishId]
                                      ? ` (${selectedDates[date].menuDishNotes[dish.dishId]})`
                                      : ""
                                  }`
                              )
                              .join(", ") || "No dishes"
                          })`
                        : "Không"}
                    </Text>
                    <Text style={styles.tableCell}>
                      {selectedDates[date].extraDishIds?.length > 0
                        ? selectedDates[date].extraDishIds
                            .map((id) => {
                              const dishName = extraDishes.find((dish) => dish.id === id)?.name;
                              const note = selectedDates[date].extraDishNotes[id];
                              return note ? `${dishName} (${note})` : dishName;
                            })
                            .filter(Boolean)
                            .join(", ")
                        : "Không"}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          <View style={styles.spacer} />
        </ScrollView>

        <View style={styles.buttonArea}>
          <TouchableOpacity style={styles.fixedButton} onPress={handleConfirm}>
            <Text style={styles.buttonText}>Xác Nhận Đặt Chỗ</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
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
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  dateCard: {
    marginTop: 20,
    backgroundColor: "#EBE5DD",
    padding: 15,
    borderRadius: 8,
    borderColor: "#ccc",
    borderWidth: 1,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    marginTop: 10,
  },
  subLabel: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 5,
  },
  switchText: {
    marginLeft: 10,
    fontSize: 16,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
    marginVertical: 8,
  },
  menuDishesContainer: {
    marginTop: 10,
  },
  dishItem: {
    marginVertical: 5,
  },
  dishText: {
    fontSize: 16,
    color: "#333",
  },
  extraDishItem: {
    marginVertical: 4,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 8,
    fontSize: 14,
    marginTop: 5,
    backgroundColor: "#fff",
  },
  button: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
    alignItems: "center",
  },
  timeButton: {
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: "#e0e0e0",
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
    backgroundColor: "#d3d3d3",
    opacity: 0.5,
  },
  timeButtonText: {
    color: "black",
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
  summaryContainer: {
    marginTop: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  table: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    marginBottom: 15,
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
    textAlign: "center",
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
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 18,
  },
  spacer: {
    height: 80,
  },
});

export default LongTermSelectBooking;