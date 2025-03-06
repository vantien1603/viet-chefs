import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { Calendar } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { commonStyles } from "../../style";
import FontAwesome from '@expo/vector-icons/FontAwesome';
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
      <View style={{ borderBottomColor: '#e0e0e0', borderBottomWidth: 1.5, marginBottom: 10 }}>
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
      <View>
        <Text style={{ fontSize: 16, fontWeight: 400 }}>Choose your available work time range</Text>
      </View>

      <View style={{ flexDirection: "row", alignItems: 'center', justifyContent: "space-between", marginTop: 20, marginBottom: 20 }}>
        <Text style={{ marginRight: 20, marginLeft: 10 }}>From</Text>

        <View style={{ position: "relative", flex: 1 }}>
          <TextInput
            style={{
              borderWidth: 1,
              borderRadius: 8,
              padding: 10,
              paddingRight: 35,
              borderColor: "#B08458",
            }}
          />
          <Ionicons
            name="time-outline"
            size={20}
            color="#B08458"
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: [{ translateY: -10 }],
            }}
          />
        </View>
        <Text style={{ marginRight: 20, marginLeft: 20 }}>to</Text>

        <View style={{ position: "relative", flex: 1 }}>
          <TextInput
            style={{
              borderWidth: 1,
              borderRadius: 8,
              padding: 10,
              paddingRight: 35,
              borderColor: "#B08458",
            }}
          />

          <Ionicons
            name="time-outline"
            size={20}
            color="#B08458"
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: [{ translateY: -10 }],
            }}
          />
        </View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, fontWeight: 400, flex: 1 }}>Cost per hour</Text>
        <View style={{ position: "relative", flex: 1 }}>
          <TextInput
            style={{
              borderWidth: 1,
              borderRadius: 8,
              padding: 10,
              paddingRight: 35,
              borderColor: "#B08458",
            }}
          />
          <FontAwesome name="dollar" size={20}
            color="#B08458"
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: [{ translateY: -10 }],
            }} />
        </View>
        {/* <TextInput
          style={{ borderColor: '#B08458', borderWidth: 1.5 , borderRadius:8,flex:1}}
          placeholder="20$" /> */}
      </View>

      <TouchableOpacity
        style={{
          position: "absolute",
          bottom: 50,
          left: 20,
          right: 20,
          backgroundColor: "#A64B2A",
          padding: 15,
          borderRadius: 10,
          alignItems: "center",
          elevation: 5,
        }}
      >

        <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
          Save
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default CalendarScreen;
