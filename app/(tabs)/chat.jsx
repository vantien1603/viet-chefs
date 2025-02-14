import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const totalTimeRange = { min: 7, max: 19 };
const bookedSlots = [
  { start: 7, end: 9 },
  { start: 14, end: 15 },
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

const Chat = () => {
  const [selectedStart, setSelectedStart] = useState(null);
  const [selectedEnd, setSelectedEnd] = useState(null);
  const slots = getAvailableSlots();

  const handleSelectTime = (hour) => {
    if (selectedStart === null || selectedEnd !== null) {
      // Nếu chưa chọn giờ bắt đầu, hoặc đã có giờ kết thúc, thì đặt lại giờ bắt đầu
      setSelectedStart(hour);
      setSelectedEnd(null);
    } else if (selectedStart === hour) {
      // Nếu bấm vào chính giờ bắt đầu -> bỏ chọn
      setSelectedStart(null);
      setSelectedEnd(null);
    } else {
      // Chọn giờ kết thúc nếu chưa có
      let maxEnd = getValidEndTimes(selectedStart);
      if (hour > selectedStart && hour < maxEnd) {
        setSelectedEnd(hour);
      } else {
        // Nếu chọn giờ không hợp lệ, đổi giờ bắt đầu
        setSelectedStart(hour);
        setSelectedEnd(null);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Chọn thời gian</Text>
      <View style={styles.timeContainer}>
        {slots.map((slot, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.timeBox,
              slot.booked && styles.bookedTime,
              selectedStart !== null &&
                selectedEnd === null &&
                slot.hour === selectedStart &&
                styles.selectedTime,
              selectedStart !== null &&
                selectedEnd !== null &&
                slot.hour >= selectedStart &&
                slot.hour < selectedEnd &&
                styles.selectedTime,
            ]}
            disabled={slot.booked}
            onPress={() => handleSelectTime(slot.hour)}
          >
            <Text style={[styles.timeText, slot.booked && styles.bookedText]}>
              {slot.hour}h
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.selectedText}>
        {selectedStart !== null && selectedEnd !== null
          ? `Đã chọn: ${selectedStart}h - ${selectedEnd}h`
          : selectedStart !== null
          ? "Chọn giờ kết thúc"
          : "Chọn giờ bắt đầu"}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF", padding: 20, alignItems: "center", justifyContent: "center" },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 20, color: "#333" },
  timeContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  timeBox: {
    width: 50,
    height: 50,
    margin: 5,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#4CAF50",
  },
  bookedTime: { backgroundColor: "gray" },
  selectedTime: { backgroundColor: "#FF9800" },
  timeText: { fontSize: 16, color: "white", fontWeight: "bold" },
  bookedText: { color: "#CCC" },
  selectedText: { fontSize: 18, fontWeight: "bold", marginTop: 20 },
});

export default Chat;
