import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Image,
  ScrollView,
  FlatList,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { commonStyles } from "../../style";
import Header from "../../components/header";
import moment from "moment";
import AntDesign from "@expo/vector-icons/AntDesign";
import { Ionicons } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Modalize } from "react-native-modalize";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Checkbox } from "react-native-paper";
import Toast from "react-native-toast-message";

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

// Data test
const totalTimeRange = { min: 7, max: 19 };
const bookedSlots = [
  { start: 7, end: 9 },
  { start: 14, end: 15 },
];

const foodList = [
  { id: 1, name: "Pizza" },
  { id: 2, name: "Sushi" },
  { id: 3, name: "Burger" },
  { id: 4, name: "Pasta" },
  { id: 5, name: "Pasta" },
  { id: 6, name: "Pasta" },
  { id: 7, name: "Pasta" },
  { id: 8, name: "Pasta" },
  { id: 9, name: "Pasta" },
  { id: 10, name: "Pasta" },
  { id: 11, name: "Pasta" },
];

const getAvailableSlots = () => {
  let slots = [];
  let lastEnd = totalTimeRange.min;

  bookedSlots.forEach((slot) => {
    if (slot.start > lastEnd) {
      for (let i = lastEnd; i < slot.start; i++) {
        slots.push({ hour: i, booked: false });
      }
    }
    for (let i = slot.start; i < slot.end; i++) {
      slots.push({ hour: i, booked: true });
    }
    lastEnd = slot.end;
  });

  for (let i = lastEnd; i < totalTimeRange.max; i++) {
    slots.push({ hour: i, booked: false });
  }

  return slots;
};

const getValidEndTimes = (start) => {
  for (let slot of bookedSlots) {
    if (start < slot.start) return slot.start;
  }
  return totalTimeRange.max;
};

const BookingScreen = () => {
  // Nhận danh sách món ăn đã chọn từ query params
  const { selectedDishes } = useLocalSearchParams();
  const parsedSelectedDishes = selectedDishes ? JSON.parse(selectedDishes) : [];

  const [month, setMonth] = useState(moment().format("MM"));
  const [year, setYear] = useState(moment().format("YYYY"));
  const [selectedDay, setSelectedDay] = useState(null);
  const [specialRequest, setSpecialRequest] = useState("");
  const today = moment();
  const days = getDaysInMonth(month, year);

  const isBeforeToday = (date) => date.isBefore(today, "day");
  const isSelectedDay = (day) => selectedDay && selectedDay.isSame(day, "day");
  const isToday = (date) => moment(date).isSame(today, "day");

  // Phần thời gian
  const [selectedStart, setSelectedStart] = useState(null);
  const [selectedEnd, setSelectedEnd] = useState(null);
  const slots = getAvailableSlots();
  const [loading, setLoading] = useState(false);

  const handleSelectTime = (hour) => {
    if (selectedStart === null || selectedEnd !== null) {
      setSelectedStart(hour);
      setSelectedEnd(null);
    } else if (selectedStart === hour) {
      setSelectedStart(null);
      setSelectedEnd(null);
    } else {
      let maxEnd = getValidEndTimes(selectedStart);
      if (hour > selectedStart && hour < maxEnd) {
        setSelectedEnd(hour);
      } else {
        setSelectedStart(hour);
        setSelectedEnd(null);
      }
    }
  };

  const modalRef = useRef(null);
  const [selectedItems, setSelectedItems] = useState(
    parsedSelectedDishes.map((dish, index) => index)
  );

  const toggleSelection = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Tách biệt state cho Meal time và End time
  const [mealTime, setMealTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showMealPicker, setShowMealPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const handleMealTimeChange = (event, selectedTime) => {
    setShowMealPicker(false);
    if (selectedTime) {
      setMealTime(selectedTime);
    }
  };

  const handleEndTimeChange = (event, selectedTime) => {
    setShowEndPicker(false);
    if (selectedTime) {
      setEndTime(selectedTime);
    }
  };

  const [checked, setChecked] = useState(false);

  // State để quản lý địa chỉ
  const [address, setAddress] = useState("8592 Preston Rd. Inglewood");

  // Hàm định dạng thời gian
  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };
  const handleConfirmBooking = () => {
    if (checked && endTime <= mealTime) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "End time must be later than meal time.",
      });
      return;
    }
    setLoading(true);
    router.push("screen/confirmBooking");
    setLoading(false);
  };

  return (
    <GestureHandlerRootView style={commonStyles.containerContent}>
      <Header title="Booking" />

      <ScrollView
        style={{ paddingTop: 20 }}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <View>
          <Text style={styles.sectionTitle}>Chef information</Text>
          <View style={[styles.profileContainer, { marginVertical: 20 }]}>
            <View style={styles.profileContainer}>
              <Image
                source={{
                  uri: "https://images.pexels.com/photos/39866/entrepreneur-startup-start-up-man-39866.jpeg?auto=compress&cs=tinysrgb&w=600",
                }}
                style={styles.profileImage}
              />
              <View>
                <Text style={styles.profileName}>John Doe</Text>
                <Text style={{ fontSize: 14 }}>20 year old</Text>
              </View>
            </View>
            <AntDesign name="message1" size={24} color="black" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date & Time</Text>
          <FlatList
            data={days}
            keyExtractor={(item) => item.day.toString()}
            horizontal
            initialScrollIndex={days.findIndex((item) => isToday(item.date))}
            showsHorizontalScrollIndicator={false}
            getItemLayout={(data, index) => ({
              length: 80,
              offset: 80 * index,
              index,
            })}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.dayContainer,
                  isBeforeToday(item.date) && styles.disabledDay,
                  isSelectedDay(item.date) && styles.selectedDay,
                ]}
                disabled={isBeforeToday(item.date)}
                onPress={() => setSelectedDay(item.date)}
              >
                <Text
                  style={[
                    styles.dayOfWeek,
                    isSelectedDay(item.date) && styles.selectedText,
                  ]}
                >
                  {item.dayOfWeek}
                </Text>
                <Text
                  style={[
                    styles.day,
                    isSelectedDay(item.date) && styles.selectedText,
                  ]}
                >
                  {item.day}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        <View style={styles.timeContainer}>
          <Text style={styles.label}>Meal time</Text>
          <TouchableOpacity
            onPress={() => setShowMealPicker(true)}
            style={styles.timeBox}
          >
            <Ionicons
              name="time-outline"
              size={20}
              color="#A9411D"
              style={{ marginRight: 5 }}
            />
            <Text style={styles.timeText}>{formatTime(mealTime)}</Text>
          </TouchableOpacity>
          {showMealPicker && (
            <DateTimePicker
              value={mealTime}
              mode="time"
              display="spinner"
              onChange={handleMealTimeChange}
            />
          )}
        </View>

        {checked && (
          <View style={styles.timeContainer}>
            <Text style={styles.label}>End time</Text>
            <TouchableOpacity
              onPress={() => setShowEndPicker(true)}
              style={styles.timeBox}
            >
              <Ionicons
                name="time-outline"
                size={20}
                color="#A9411D"
                style={{ marginRight: 5 }}
              />
              <Text style={styles.timeText}>{formatTime(endTime)}</Text>
            </TouchableOpacity>
            {showEndPicker && (
              <DateTimePicker
                value={endTime}
                mode="time"
                display="spinner"
                onChange={handleEndTimeChange}
              />
            )}
          </View>
        )}

        <Checkbox.Item
          labelStyle={{ fontSize: 16 }}
          label="After-meal cleaning service"
          status={checked ? "checked" : "unchecked"}
          onPress={() => setChecked(!checked)}
        />

        <View style={styles.section}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={[styles.sectionTitle, { flex: 1 }]}>Food list</Text>
            <TouchableOpacity onPress={() => modalRef.current?.open()}>
              <AntDesign name="plus" size={20} color="black" />
            </TouchableOpacity>
          </View>

          <View>
            {parsedSelectedDishes.length > 0 ? (
              parsedSelectedDishes.map((dish, index) => (
                <Text
                  key={index}
                  style={{ fontSize: 16, color: "#333", marginVertical: 2 }}
                >
                  {dish}
                </Text>
              ))
            ) : (
              <Text style={{ fontSize: 16, color: "#777" }}>
                No dishes selected.
              </Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address</Text>
          <TextInput
            style={styles.addressText}
            value={address}
            onChangeText={setAddress}
            placeholder="Enter your address"
          />
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

        <View style={[styles.section, { marginBottom: 100 }]}>
          <Text style={styles.sectionTitle}>Cost details</Text>
          <Text>Total hourly rent</Text>
          <Text>Total additional charges</Text>
          <Text>Total payment</Text>
        </View>
      </ScrollView>

      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#EBE5DD",
          padding: 20,
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          style={{
            width: "100%",
            bottom: 10,
            backgroundColor: "#A64B2A",
            padding: 15,
            borderRadius: 10,
            alignItems: "center",
          }}
          onPress={handleConfirmBooking}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
              Confirm booking
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <Modalize ref={modalRef} adjustToContentHeight>
        <View style={{ padding: 10, backgroundColor: "#EBE5DD" }}>
          {foodList.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 15,
                backgroundColor: "#EBE5DD",
                borderRadius: 12,
                marginBottom: 10,
                padding: 5,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.1,
                shadowRadius: 5,
                elevation: 1,
              }}
              onPress={() => toggleSelection(item.id)}
            >
              <Checkbox.Android
                status={
                  selectedItems.includes(item.id) ? "checked" : "unchecked"
                }
                onPress={() => toggleSelection(item.id)}
                color="#4CAF50"
              />
              <Image
                source={{
                  uri: "https://images.pexels.com/photos/39866/entrepreneur-startup-start-up-man-39866.jpeg?auto=compress&cs=tinysrgb&w=600",
                }}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  marginRight: 12,
                }}
              />
              <View>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: "#333",
                  }}
                >
                  {item.name}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: "#777",
                  }}
                >
                  Thoi gian nau
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Modalize>
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
  profileContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 45,
    marginRight: 20,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
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
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingVertical: 10,
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
  },
  timeBox: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#D1D1D1",
  },
  timeText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#A9411D",
  },
  separator: {
    fontSize: 16,
    fontWeight: "bold",
    marginHorizontal: 5,
  },
  addressText: {
    fontSize: 16,
    color: "#333",
    padding: 10,
    borderWidth: 1,
    borderColor: "#D1D1D1",
    borderRadius: 10,
    backgroundColor: "#FFF",
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
});

export default BookingScreen;
