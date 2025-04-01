import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, Platform, Alert } from "react-native";
import { Calendar } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import DateTimePicker from '@react-native-community/datetimepicker';

const ChefScheduleScreen = () => {
  const [selectedDate, setSelectedDate] = useState({});
  const [workSlots, setWorkSlots] = useState({});
  const [maxSlotsPerDay, setMaxSlotsPerDay] = useState(3);
  const [hourlyRate, setHourlyRate] = useState("");
  const [tempTimes, setTempTimes] = useState({});

  const onDayPress = (day) => {
    const dateString = day.dateString;
    const newSelection = { ...selectedDate };

    if (newSelection[dateString]) {
      delete newSelection[dateString];
      const newWorkSlots = { ...workSlots };
      delete newWorkSlots[dateString];
      setWorkSlots(newWorkSlots);
      const newTempTimes = { ...tempTimes };
      delete newTempTimes[dateString];
      setTempTimes(newTempTimes);
    } else {
      newSelection[dateString] = {
        selected: true,
        marked: true,
        selectedColor: workSlots[dateString]?.length >= maxSlotsPerDay ? '#FF6B6B' : '#6C63FF'
      };
      setTempTimes({
        ...tempTimes,
        [dateString]: {
          startTime: new Date(),
          endTime: new Date(),
          showStartPicker: false,
          showEndPicker: false,
        }
      });
    }
    setSelectedDate(newSelection);
  };

  // Hàm kiểm tra xem khung giờ đã được chọn chưa
  const isTimeSlotTaken = (date, startTime, endTime) => {
    const slots = workSlots[date] || [];
    const start = new Date(startTime);
    const end = new Date(endTime);

    return slots.some(slot => {
      const slotStart = new Date(`${date} ${slot.startTime}`);
      const slotEnd = new Date(`${date} ${slot.endTime}`);
      return (
        (start >= slotStart && start < slotEnd) || // start nằm trong khung giờ đã chọn
        (end > slotStart && end <= slotEnd) || // end nằm trong khung giờ đã chọn
        (start <= slotStart && end >= slotEnd) // khung giờ mới bao phủ khung giờ đã chọn
      );
    });
  };

  const addWorkSlot = (date) => {
    const { startTime, endTime } = tempTimes[date] || {};
    if (!startTime || !endTime) return;

    // Kiểm tra endTime < startTime
    if (endTime <= startTime) {
      Alert.alert("Error", "End time must be greater than start time.");
      return;
    }

    // Kiểm tra startTime < thời gian hiện tại (nếu là ngày hôm nay)
    const today = new Date();
    const selectedDateObj = new Date(date);
    const isToday = selectedDateObj.toDateString() === today.toDateString();
    if (isToday && startTime < today) {
      Alert.alert("Error", "Start time cannot be earlier than the current time.");
      return;
    }


    if (isTimeSlotTaken(date, startTime, endTime)) {
      Alert.alert("Error", "This time slot has already been picked.");
      return;
    }

    const newSlot = {
      startTime: startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      endTime: endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    };
    const currentSlots = workSlots[date] || [];

    if (currentSlots.length < maxSlotsPerDay) {
      setWorkSlots({
        ...workSlots,
        [date]: [...currentSlots, newSlot]
      });
      setTempTimes({
        ...tempTimes,
        [date]: {
          startTime: new Date(),
          endTime: new Date(),
          showStartPicker: false,
          showEndPicker: false,
        }
      });
    } else {
      Alert.alert("Error", `Maximum ${maxSlotsPerDay} slots per day reached!`);
    }
  };

  const removeWorkSlot = (date, index) => {
    const currentSlots = workSlots[date] || [];
    const updatedSlots = currentSlots.filter((_, i) => i !== index);
    setWorkSlots({
      ...workSlots,
      [date]: updatedSlots
    });
  };

  const handleTimeChange = (date, type, event, selected) => {
    if (event.type === "dismissed") {
      setTempTimes({
        ...tempTimes,
        [date]: {
          ...tempTimes[date],
          [`show${type}Picker`]: false,
        }
      });
      return;
    }

    setTempTimes({
      ...tempTimes,
      [date]: {
        ...tempTimes[date],
        [type.toLowerCase() + "Time"]: selected || new Date(),
        [`show${type}Picker`]: false,
      }
    });
  };

  const showTimePicker = (date, type) => {
    setTempTimes({
      ...tempTimes,
      [date]: {
        ...tempTimes[date],
        [`show${type}Picker`]: true,
      }
    });
  };

  const handleSave = () => {
    // Kiểm tra maxSlotsPerDay
    if (maxSlotsPerDay <= 0) {
      Alert.alert("Error", "Max slots per day must be greater than 0.");
      return;
    }

    // Kiểm tra hourlyRate
    const rate = parseFloat(hourlyRate);
    if (isNaN(rate) || rate <= 0) {
      Alert.alert("Error", "Cost per hour must be greater than 0.");
      return;
    }

    // Nếu tất cả hợp lệ, lưu dữ liệu
    console.log({
      schedule: workSlots,
      maxSlots: maxSlotsPerDay,
      rate: hourlyRate
    });
    Alert.alert("Success", "Schedule saved successfully!");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: 80,
          backgroundColor: '#EBE5DD',
        }}
      >
        {/* Lịch */}
        <View style={styles.calendarContainer}>
          <Calendar
            markedDates={selectedDate}
            onDayPress={onDayPress}
            theme={{
              textMonthFontSize: 24,
              backgroundColor: '#EBE5DD',
              calendarBackground: '#EBE5DD',
              selectedDayBackgroundColor: "#A64B2A",
              todayTextColor: "#6C63FF",
              arrowColor: "#6C63FF",
            }}
          />
        </View>

        {/* Thiết lập số buổi tối đa */}
        <View style={styles.section}>
          <Text style={styles.label}>Max slots per day</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={maxSlotsPerDay.toString()}
            onChangeText={(value) => {
              const num = parseInt(value);
              setMaxSlotsPerDay(isNaN(num) ? 1 : num);
            }}
          />
        </View>

        {/* Hiển thị và thêm khung giờ */}
        {Object.keys(selectedDate).map((date) => (
          <View key={date} style={styles.slotContainer}>
            <Text style={styles.dateText}>{date}</Text>
            
            {workSlots[date]?.map((slot, index) => (
              <View key={index} style={styles.slotItem}>
                <Text style={styles.slotText}>{slot.startTime} - {slot.endTime}</Text>
                <TouchableOpacity onPress={() => removeWorkSlot(date, index)}>
                  <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
            ))}

            {(!workSlots[date] || workSlots[date].length < maxSlotsPerDay) && (
              <View style={styles.timePicker}>
                {/* Chọn giờ bắt đầu */}
                <TouchableOpacity
                  style={styles.timeInput}
                  onPress={() => showTimePicker(date, "Start")}
                >
                  <Text>
                    {tempTimes[date]?.startTime
                      ? tempTimes[date].startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                      : "HH:MM"}
                  </Text>
                </TouchableOpacity>
                {tempTimes[date]?.showStartPicker && (
                  <DateTimePicker
                    value={tempTimes[date]?.startTime || new Date()}
                    mode="time"
                    display="spinner"
                    onChange={(event, selected) => handleTimeChange(date, "Start", event, selected)}
                  />
                )}

                <Text style={styles.toText}>to</Text>

                {/* Chọn giờ kết thúc */}
                <TouchableOpacity
                  style={styles.timeInput}
                  onPress={() => showTimePicker(date, "End")}
                >
                  <Text>
                    {tempTimes[date]?.endTime
                      ? tempTimes[date].endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                      : "HH:MM"}
                  </Text>
                </TouchableOpacity>
                {tempTimes[date]?.showEndPicker && (
                  <DateTimePicker
                    value={tempTimes[date]?.endTime || new Date()}
                    mode="time"
                    display="spinner"
                    onChange={(event, selected) => handleTimeChange(date, "End", event, selected)}
                  />
                )}

                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => addWorkSlot(date)}
                >
                  <Ionicons name="add" size={20} color="white" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}

        {/* Giá mỗi giờ */}
        <View style={styles.section}>
          <Text style={styles.label}>Cost per hour</Text>
          <View style={styles.rateContainer}>
            <TextInput
              style={styles.rateInput}
              value={hourlyRate}
              onChangeText={setHourlyRate}
              keyboardType="numeric"
            />
            <FontAwesome
              name="dollar"
              size={20}
              color="#B08458"
              style={styles.dollarIcon}
            />
          </View>
        </View>
      </ScrollView>

      {/* Nút Save cố định */}
      <View style={styles.saveButtonContainer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Save Schedule</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EBE5DD',
  },
  calendarContainer: {
    borderBottomColor: '#e0e0e0',
    borderBottomWidth: 1.5,
    marginBottom: 10,
  },
  section: {
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#B08458",
    borderRadius: 8,
    padding: 10,
    width: 100,
    backgroundColor: '#fff',
  },
  slotContainer: {
    paddingHorizontal: 20,
    marginVertical: 15,
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    padding: 10,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  slotItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  slotText: {
    fontSize: 14,
  },
  timePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    elevation: 2,
  },
  timeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#B08458",
    borderRadius: 6,
    padding: 8,
    marginHorizontal: 5,
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  toText: {
    marginHorizontal: 5,
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#6C63FF',
    padding: 8,
    borderRadius: 6,
  },
  rateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 120,
  },
  rateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#B08458",
    borderRadius: 8,
    padding: 10,
    paddingRight: 30,
    backgroundColor: '#fff',
  },
  dollarIcon: {
    position: 'absolute',
    right: 10,
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  saveButton: {
    backgroundColor: "#A64B2A",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    elevation: 5,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default ChefScheduleScreen;