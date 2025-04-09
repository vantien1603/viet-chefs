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
} from "react-native";
import { Calendar } from "react-native-calendars";
import Header from "../../components/header";
import AXIOS_API from "../../config/AXIOS_API";
import ProgressBar from "../../components/progressBar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Modalize } from "react-native-modalize"; // Thêm import Modalize

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
  const selectedPackage = params.selectedPackage ? JSON.parse(params.selectedPackage) : null;
  const chefId = params.chefId;
  const numPeople = params.numPeople ? parseInt(params.numPeople) : null;
  const address = params.address || "";

  const [selectedDates, setSelectedDates] = useState(
    params.selectedDates ? JSON.parse(params.selectedDates) : {}
  );
  const [menuItems, setMenuItems] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentDishId, setCurrentDishId] = useState(null);
  const [currentDate, setCurrentDate] = useState(null);
  const [noteText, setNoteText] = useState("");
  const modalizeRef = useRef(null); // Thêm ref cho Modalize
  const lastProcessedParams = useRef(null);

  const today = new Date();
  const todayString = today.toISOString().split("T")[0];
  const timeSlots = generateTimeSlots();

  useEffect(() => {
    handleMenu();
    fetchDishes();
  }, []);

  useEffect(() => {
    const paramsString = JSON.stringify(params);
    if (
      params.date &&
      (params.selectedMenu || params.selectedDishes) &&
      paramsString !== lastProcessedParams.current
    ) {
      const date = params.date;

      const selectedMenuData =
        typeof params.selectedMenu === "string" && params.selectedMenu !== "null" && params.selectedMenu !== ""
          ? JSON.parse(params.selectedMenu)
          : {};
      const selectedDishesData =
        typeof params.selectedDishes === "string" && params.selectedDishes !== "null" && params.selectedDishes !== ""
          ? JSON.parse(params.selectedDishes)
          : [];
      const newDishNotes =
        typeof params.dishNotes === "string" && params.dishNotes !== "null" && params.dishNotes !== ""
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
                selectedMenuData?.menuItems?.some((item) => item.dishId === parseInt(dishId))
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

  const fetchDishes = async () => {
    try {
      const response = await AXIOS_API.get(`/dishes?chefId=${chefId}`);
      setDishes(response.data.content || []);
    } catch (error) {
      console.log("Error fetching dishes:", error);
    }
  };

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
    modalizeRef.current?.open(); // Mở Modalize
  };

  const saveNote = () => {
    if (!currentDate || !currentDishId) return;

    setSelectedDates((prev) => {
      const isMenuDish = prev[currentDate].menuId && menuItems
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
    modalizeRef.current?.close(); // Đóng Modalize
    setModalVisible(false);
    setNoteText("");
    setCurrentDishId(null);
    setCurrentDate(null);
  };

  const handleConfirm = async () => {
    if (Object.keys(selectedDates).length !== selectedPackage.durationDays) {
      alert(
        `Vui lòng chọn đúng ${selectedPackage.durationDays} ngày cho gói ${selectedPackage.name}`
      );
      return;
    }

    if (!numPeople || !address) {
      alert("Số lượng khách hoặc địa điểm không hợp lệ.");
      return;
    }

    const bookingDetails = Object.keys(selectedDates).map((date) => {
      const menuDishes = Object.entries(selectedDates[date].menuDishNotes || {}).map(
        ([dishId, notes]) => ({
          dishId: parseInt(dishId),
          notes,
        })
      );
      const extraDishesNotes = Object.entries(selectedDates[date].extraDishNotes || {}).map(
        ([dishId, notes]) => ({
          dishId: parseInt(dishId),
          notes,
        })
      );
      const allDishes = [...menuDishes, ...extraDishesNotes];

      return {
        sessionDate: date,
        startTime: `${selectedDates[date].startTime}:00`,
        menuId: selectedDates[date].showMenu ? selectedDates[date].menuId : null,
        extraDishIds:
          selectedDates[date].showMenu && selectedDates[date].extraDishIds?.length > 0
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
      const response = await AXIOS_API.post(
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
      alert("Có lỗi khi tính toán giá đặt chỗ dài hạn.");
    }
  };

  const handleMenu = async () => {
    try {
      const response = await AXIOS_API.get(`/menus?chefId=${chefId}`);
      if (response.status === 200) {
        setMenuItems(response.data.content || response.data || []);
      }
    } catch (error) {
      console.log("Error fetching menus:", error);
      alert("Không thể lấy danh sách menu.");
      setMenuItems([]);
    }
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
            Chọn Ngày (Cần chọn đúng {selectedPackage?.durationDays || 0} ngày):
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
                  <TouchableOpacity
                    style={styles.selectFoodButton}
                    onPress={() => {
                      router.push({
                        pathname: "/screen/selectFood",
                        params: {
                          chefId,
                          date,
                          isLongTerm: "true",
                          currentStep: "3",
                          totalSteps: "4",
                          selectedPackage: JSON.stringify(selectedPackage),
                          selectedDates: JSON.stringify(selectedDates),
                          selectedMenu: selectedDates[date].menuId
                            ? JSON.stringify(
                                menuItems.find((item) => item.id === selectedDates[date].menuId)
                              )
                            : "",
                          selectedDishes: selectedDates[date].extraDishIds?.length > 0
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
                    }}
                  >
                    <Text style={styles.selectFoodButtonText}>Chọn Menu/Món ăn</Text>
                  </TouchableOpacity>

                  {selectedDates[date].menuId && (
                    <>
                      <Text style={styles.summaryText}>
                        Menu: {menuItems.find((m) => m.id === selectedDates[date].menuId)?.name}
                      </Text>
                      <Text style={styles.subTitle}>Món trong menu:</Text>
                      {menuItems
                        .find((m) => m.id === selectedDates[date].menuId)
                        ?.menuItems.map((item) => (
                          <View key={item.dishId} style={styles.dishItem}>
                            <Text style={styles.dishText}>
                              {item.dishName} {selectedDates[date].menuDishNotes[item.dishId] && `(Ghi chú: ${selectedDates[date].menuDishNotes[item.dishId]})`}
                            </Text>
                            <TouchableOpacity
                              style={styles.editButton}
                              onPress={() => handleEditNote(date, item.dishId, true)}
                            >
                              <Text style={styles.editButtonText}>Edit Note</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                    </>
                  )}
                  {selectedDates[date].extraDishIds?.length > 0 && (
                    <>
                      <Text style={styles.subTitle}>Món thêm:</Text>
                      {selectedDates[date].extraDishIds.map((dishId) => (
                        <View key={dishId} style={styles.dishItem}>
                          <Text style={styles.dishText}>
                            {dishes.find((d) => d.id === dishId)?.name || "Unknown Dish"} {selectedDates[date].extraDishNotes[dishId] && `(Ghi chú: ${selectedDates[date].extraDishNotes[dishId]})`}
                          </Text>
                          <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => handleEditNote(date, dishId, false)}
                          >
                            <Text style={styles.editButtonText}>Edit Note</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </>
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

      {/* Modalize để chỉnh sửa ghi chú */}
      <Modalize
        ref={modalizeRef}
        adjustToContentHeight={true} // Tự động điều chỉnh chiều cao theo nội dung
        handlePosition="outside" // Thanh kéo nằm ngoài modal
        modalStyle={styles.modalContent}
        onClose={() => setModalVisible(false)}
      >
        <View style={styles.modalInner}>
          <Text style={styles.modalTitle}>Ghi chú</Text>
          <TextInput
            style={styles.noteInput}
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
            <TouchableOpacity
              style={styles.modalButton}
              onPress={saveNote}
            >
              <Text style={styles.modalButtonText}>Lưu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modalize>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#EBE5DD" },
  container: { flex: 1 },
  scrollView: { flex: 1, padding: 20 },
  scrollViewContent: { paddingBottom: 100 },
  title: { fontSize: 20, fontWeight: "bold", color: "#333", marginBottom: 15 },
  calendar: {
    backgroundColor: "#EBE5DD",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D1D1",
    elevation: 3,
  },
  dateCard: {
    marginTop: 20,
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D1D1",
    elevation: 3,
  },
  dateTitle: { fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 10 },
  switchContainer: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  label: { fontSize: 16, fontWeight: "600", color: "#333", marginTop: 15, marginBottom: 5 },
  switchText: { marginLeft: 10, fontSize: 16, color: "#555" },
  selectFoodButton: {
    backgroundColor: "#1E90FF",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  selectFoodButtonText: { color: "white", fontWeight: "bold", fontSize: 16 },
  summaryText: { fontSize: 14, color: "#333", marginTop: 5 },
  subTitle: { fontSize: 16, fontWeight: "600", color: "#333", marginTop: 10 },
  dishItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 5 },
  dishText: { fontSize: 14, color: "#555", flex: 1 },
  editButton: { backgroundColor: "#FF9800", padding: 5, borderRadius: 5 },
  editButtonText: { color: "white", fontSize: 12 },
  timeButton: { padding: 10, marginHorizontal: 5, borderRadius: 8, backgroundColor: "#E5E5E5" },
  timeButtonSelected: { backgroundColor: "#A64B2A" },
  timeButtonText: { color: "#333", fontSize: 14 },
  timeButtonTextSelected: { color: "white", fontSize: 14 },
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
  },
  buttonText: { color: "white", fontWeight: "bold", fontSize: 18 },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
  },
  modalInner: {
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10, textAlign: "center" },
  noteInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    height: 100,
    textAlignVertical: "top",
    marginBottom: 10,
  },
  modalButtons: { flexDirection: "row", justifyContent: "space-between" },
  modalButton: {
    backgroundColor: "#A64B2A",
    padding: 10,
    borderRadius: 5,
    width: "45%",
    alignItems: "center",
  },
  modalButtonText: { color: "white", fontWeight: "bold" },
});

export default LongTermSelectBooking;