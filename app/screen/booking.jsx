import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  FlatList,
  Switch,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { commonStyles } from "../../style";
import Header from "../../components/header";
import moment from "moment";
import Toast from "react-native-toast-message";
import ProgressBar from "../../components/progressBar";
import AXIOS_API from "../../config/AXIOS_API";

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
    for (let minute = 0; minute < 60; minute += 30) {
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
  const selectedMenus = params.selectedMenus;
  const chefId = params.chefId;
  const parsedSelectedMenus = selectedMenus ? JSON.parse(selectedMenus) : [];

  const [month, setMonth] = useState(moment().format("MM"));
  const [year, setYear] = useState(moment().format("YYYY"));
  const [selectedDay, setSelectedDay] = useState(null);
  const [specialRequest, setSpecialRequest] = useState("");
  const [address, setAddress] = useState("");
  const [isServing, setIsServing] = useState(false);
  const today = moment();
  const days = getDaysInMonth(month, year);

  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [loading, setLoading] = useState(false);

  const isBeforeToday = (date) => date.isBefore(today, "day");
  const isSelectedDay = (day) => selectedDay && selectedDay.isSame(day, "day");
  const isToday = (date) => moment(date).isSame(today, "day");

  const [dishNotes, setDishNotes] = useState({});

  const isTimeAfter = (time1, time2) => {
    const [hour1, min1] = time1.split(":").map(Number);
    const [hour2, min2] = time2.split(":").map(Number);
    return hour1 > hour2 || (hour1 === hour2 && min1 > min2);
  };

  const handleDishNoteChange = (dishId, note) => {
    setDishNotes((prev) => ({
      ...prev,
      [dishId]: note,
    }));
  };

  const handleConfirmBooking = async () => {
    if (!selectedDay) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please select a date.",
      });
      return;
    }

    if (!startTime) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please select a start time.",
      });
      return;
    }

    if (!endTime || !isTimeAfter(endTime, startTime)) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "End time must be later than start time.",
      });
      return;
    }

    if (!address) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please enter an address.",
      });
      return;
    }

    setLoading(true);

    const selectedDishIds = parsedSelectedMenus.flatMap((menu) =>
      menu.menuItems.map((item) => item.dishId || item.id)
    );

    const payload = {
      chefId: parseInt(chefId),
      guestCount: 1,
      bookingDetail: {
        sessionDate: selectedDay.format("YYYY-MM-DD"),
        isServing: isServing,
        startTime: `${startTime}:00`,
        endTime: `${endTime}:00`,
        location: address,
        menuId:
          parsedSelectedMenus.length > 0 ? parsedSelectedMenus[0].id : null,
        extraDishIds: selectedDishIds.length > 0 ? selectedDishIds : null,
        dishes: selectedDishIds.map((dishId) => ({
          dishId: dishId,
          notes: dishNotes[dishId] || "",
        })),
      },
    };

    console.log("Payload to API:", JSON.stringify(payload, null, 2));

    try {
      const response = await AXIOS_API.post(
        "/bookings/calculate-single-booking",
        payload
      );
      router.push({
        pathname: "screen/confirmBooking",
        params: {
          bookingData: JSON.stringify(response.data),
          chefId: chefId,
          selectedMenus: JSON.stringify(parsedSelectedMenus),
          address,
          sessionDate: selectedDay.format("YYYY-MM-DD"),
          startTime: startTime, 
          endTime: endTime,
          isServing: isServing,
          requestDetails: specialRequest,
          dishNotes: JSON.stringify(dishNotes),
        },
      });
      console.log("Booking response:", JSON.stringify(response.data));
    } catch (error) {
      console.error("Error calling calculate-single-booking:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2:
          error.response?.data?.message ||
          "Failed to calculate booking. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={commonStyles.containerContent}>
      <Header title="Booking" />
      <ProgressBar title="Chọn ngày" currentStep={3} totalSteps={4} />
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 20 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
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
          <Text style={styles.label}>Start time</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {timeSlots.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeButton,
                  startTime === time && styles.timeButtonSelected,
                ]}
                onPress={() => setStartTime(time)}
              >
                <Text
                  style={[
                    styles.timeButtonText,
                    startTime === time && styles.timeButtonTextSelected,
                  ]}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.timeContainer}>
          <Text style={styles.label}>End time</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {timeSlots.map((time) => {
              const isDisabled = startTime && !isTimeAfter(time, startTime);
              return (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeButton,
                    endTime === time && styles.timeButtonSelected,
                    isDisabled && styles.timeButtonDisabled,
                  ]}
                  onPress={() => !isDisabled && setEndTime(time)}
                  disabled={isDisabled}
                >
                  <Text
                    style={[
                      styles.timeButtonText,
                      endTime === time && styles.timeButtonTextSelected,
                      isDisabled && styles.timeButtonTextDisabled,
                    ]}
                  >
                    {time}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.switchContainer}>
          <Text style={styles.label}>Phục vụ:</Text>
          <Switch
            value={isServing}
            onValueChange={(value) => setIsServing(value)}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={isServing ? "#f5dd4b" : "#f4f3f4"}
          />
          <Text style={styles.switchText}>{isServing ? "Có" : "Không"}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Menu</Text>
          {parsedSelectedMenus.length > 0 ? (
            parsedSelectedMenus.map((menu, index) => (
              <View key={index} style={{ marginBottom: 15 }}>
                <Text style={styles.menuTitle}>{menu.name}</Text>
                {menu.menuItems.map((item, idx) => (
                  <View key={idx} style={{ marginVertical: 2 }}>
                  <Text style={{ fontSize: 16, color: "#333" }}>
                    - {item.dishName || "Unnamed Dish"}
                  </Text>
                  <TextInput
                    style={{
                      fontSize: 14,
                      color: "#777",
                      marginLeft: 10,
                      borderWidth: 1,
                      borderColor: "#D1D1D1",
                      borderRadius: 5,
                      padding: 5,
                      marginTop: 5,
                    }}
                    placeholder="Enter note for this dish"
                    value={dishNotes[item.dishId || item.id] || ""}
                    onChangeText={(text) =>
                      handleDishNoteChange(item.dishId || item.id, text)
                    }
                  />
                </View>
                ))}
              </View>
            ))
          ) : (
            <Text style={{ fontSize: 16, color: "#777" }}>
              No menus selected.
            </Text>
          )}
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
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirmBooking}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.confirmButtonText}>Confirm booking</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
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
  menuTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#A9411D",
    marginBottom: 5,
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
  timeButtonDisabled: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 6,
    backgroundColor: "#d3d3d3",
    opacity: 0.5,
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
  timeButtonTextDisabled: {
    fontSize: 16,
    color: "#888",
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
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  switchText: {
    marginLeft: 10,
    fontSize: 16,
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
});

export default BookingScreen;
