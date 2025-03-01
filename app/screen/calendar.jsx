import React, { useState } from "react";
import { View, Text, TouchableOpacity, Switch } from "react-native";
import { Calendar } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { commonStyles } from "../../style";

const CalendarScreen = () => {
  const [selectedDate, setSelectedDate] = useState({});
  const [multiSelect, setMultiSelect] = useState(false);
  const [startTime, setStartTime] = useState("Start time");
  const [endTime, setEndTime] = useState("End time");

  const onDayPress = (day) => {
    const newSelection = { ...selectedDate };

    if (multiSelect) {
      if (newSelection[day.dateString]) {
        delete newSelection[day.dateString];
      } else {
        newSelection[day.dateString] = { selected: true, selectedColor: "#6C63FF" };
      }
    } else {
      newSelection[day.dateString] = { selected: true, selectedColor: "#6C63FF" };
    }
    setSelectedDate(newSelection);
  };

  return (
    <SafeAreaView style={commonStyles.containerContent}>


      <Calendar
        markedDates={selectedDate}
        onDayPress={onDayPress}
        theme={{          textMonthFontSize: 24,

          backgroundColor:'#EBE5DD',
          calendarBackground:'#EBE5DD',
          selectedDayBackgroundColor: "#6C63FF",
          todayTextColor: "#6C63FF",
          arrowColor: "#6C63FF",
        }}
      />

      {/* Time Selection */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20 }}>
        <TouchableOpacity
          style={{
            borderWidth: 1,
            borderRadius: 8,
            padding: 10,
            flex: 1,
            alignItems: "center",
            marginRight: 10,
            borderColor: "#B08458",
          }}
          onPress={() => setStartTime("10:00 AM")}
        >
          <Text>{startTime}</Text>
          <Ionicons name="time-outline" size={16} />
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            borderWidth: 1,
            borderRadius: 8,
            padding: 10,
            flex: 1,
            alignItems: "center",
            marginLeft: 10,
            borderColor: "#B08458",
          }}
          onPress={() => setEndTime("6:00 PM")}
        >
          <Text>{endTime}</Text>
          <Ionicons name="time-outline" size={16} />
        </TouchableOpacity>
      </View>

      {/* Toggle Multi-Select
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 15 }}>
        <Text style={{ flex: 1 }}>Chọn cho nhiều ngày</Text>
        <Switch value={multiSelect} onValueChange={setMultiSelect} />
      </View> */}
    </SafeAreaView>
  );
};

export default CalendarScreen;
