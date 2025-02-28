import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Image, ScrollView, FlatList } from 'react-native';
import Slider from '@react-native-community/slider';
import { router, useNavigation } from 'expo-router';
import { commonStyles } from '../../style';
import Header from '../../components/header';
import moment from 'moment';
import MultiSlider from "@ptomasroos/react-native-multi-slider";

const getDaysInMonth = (month, year) => {
  const daysInMonth = moment(`${year}-${month}`, 'YYYY-MM').daysInMonth();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const date = moment(`${year}-${month}-${i + 1}`, 'YYYY-MM-DD');
    return {
      day: i + 1,
      dayOfWeek: date.format('ddd'),
      date,
    };
  });
};


//data test
const totalTimeRange = { min: 7, max: 19 };
const bookedSlots = [
  { start: 7, end: 9 },
  { start: 14, end: 15 },
];
//

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
  const [month, setMonth] = useState(moment().format('MM'));
  const [year, setYear] = useState(moment().format('YYYY'));
  const [selectedDay, setSelectedDay] = useState(null);
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [specialRequest, setSpecialRequest] = useState("");
  const today = moment();
  const days = getDaysInMonth(month, year);

  const isBeforeToday = (date) => date.isBefore(today, 'day');
  const isSelectedDay = (day) => selectedDay && selectedDay.isSame(day, 'day');
  const isToday = (date) => moment(date).isSame(today, "day");

  // phan thoi gian
  const [selectedStart, setSelectedStart] = useState(null);
  const [selectedEnd, setSelectedEnd] = useState(null);
  const slots = getAvailableSlots();

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



  return (
    <ScrollView style={commonStyles.containerContent}>
      <Header title="Booking" />

      <View style={styles.profileContainer}>
        <Image source={{ uri: "https://images.pexels.com/photos/39866/entrepreneur-startup-start-up-man-39866.jpeg?auto=compress&cs=tinysrgb&w=600" }} style={styles.profileImage} />
        <Text style={styles.profileName}>John Doe</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Date & Time</Text>
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
              onPress={() => setSelectedDay(item.date)}
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

      {/* thoi gian */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {selectedStart !== null && selectedEnd !== null
            ? `Đã chọn: ${selectedStart}h - ${selectedEnd}h`
            : selectedStart !== null
              ? "Chọn giờ kết thúc"
              : "Chọn giờ bắt đầu"}
        </Text>
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
                slot.hour <= selectedEnd &&
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
      </View>



      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Number of People</Text>
        <Text style={styles.peopleCount}>{numberOfPeople}</Text>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={10}
          step={1}
          value={numberOfPeople}
          onValueChange={setNumberOfPeople}
          minimumTrackTintColor="#A9411D"
          maximumTrackTintColor="#D3D3D3"
          thumbTintColor="#A9411D"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Address</Text>
        <TextInput style={styles.addressText} value="8592 Preston Rd. Inglewood" editable={false} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Special Request</Text>
        <TextInput
          style={styles.specialRequestInput}
          placeholder="Enter your request"
          value={specialRequest}
          onChangeText={setSpecialRequest}
          multiline
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment details</Text>
        <Text>Total hourly rent</Text>
        <Text>Total additional charges</Text>
        <Text>Total payment</Text>
      </View>

      <TouchableOpacity style={styles.bookButton} onPress={() => router.push('screen/Booking/confirmBooking')}>
        <Text style={styles.bookButtonText}>Book</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  section: {
    borderTopColor: '#D1D1D1',
    borderTopWidth: 0.5,
    paddingVertical: 20,
    // paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  profileContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 10,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  dayContainer: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginRight: 10,
    alignItems: 'center',
    // backgroundColor: '#E2AA97',
    backgroundColor: '#519254',
    borderRadius: 20,
  },
  disabledDay: {
    backgroundColor: '#BAB8B8',
  },
  selectedDay: {
    backgroundColor: '#A9411D',
  },
  selectedText: {
    color: "white",
    fontWeight: "bold",
  },
  peopleCount: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  slider: {
    width: "90%",
    alignSelf: "center",
    transform: [{ scaleY: 1.5 }],
  },
  bookButton: {
    backgroundColor: "#A9411D",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    margin: 20,
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  bookButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },


  //thoi gian
  timeContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  timeBox: {
    width: 50,
    height: 50,
    margin: 5,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#519254",
  },
  bookedTime: { backgroundColor: "gray" },
  selectedTime: { backgroundColor: "#FF9800" },
  timeText: { fontSize: 16, color: "white", fontWeight: "bold" },
  bookedText: { color: "#CCC" },
  // selectedText: { fontSize: 18, fontWeight: "bold", marginTop: 20 },

  //
});

export default BookingScreen;
