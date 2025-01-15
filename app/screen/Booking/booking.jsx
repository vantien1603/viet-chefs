import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Image, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import { router, useNavigation } from 'expo-router';

const BookingScreen = () => {
  const [selectedDayIndex, setSelectedDayIndex] = useState(2);
  const [selectedTimeIndex, setSelectedTimeIndex] = useState(-1);
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [specialRequest, setSpecialRequest] = useState("");

  const days = ["17 Sun", "18 Mon", "19 Tue", "20 Wed", "21 Thu"];
  const times = ["10:00 am", "11:00 am", "01:30 pm", "03:00 pm", "07:00 pm", "05:00 pm"];

  const handleBooking = () => {
    router.push('screen/Booking/confirmBooking');
  };

  const navigate = useNavigation();

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Text style={styles.backText}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Booking</Text>
      </View>

      {/* Profile */}
      <View style={styles.profileContainer}>
        <Image source={{ uri: "https://images.pexels.com/photos/39866/entrepreneur-startup-start-up-man-39866.jpeg?auto=compress&cs=tinysrgb&w=600" }} style={styles.profileImage} />
        <Text style={styles.profileName}>John Doe</Text>
      </View>

      {/* Select Date & Time */}
      <Text style={styles.sectionTitle}>Select date & time</Text>
      <View style={styles.dayContainer}>
        {days.map((day, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayButton,
              selectedDayIndex === index && styles.selectedDayButton,
            ]}
            onPress={() => setSelectedDayIndex(index)}
          >
            <Text
              style={[
                styles.dayText,
                selectedDayIndex === index && styles.selectedDayText,
              ]}
            >
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.timeContainer}>
        {times.map((time, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.timeButton,
              selectedTimeIndex === index && styles.selectedTimeButton,
            ]}
            onPress={() => setSelectedTimeIndex(index)}
          >
            <Text
              style={[
                styles.timeText,
                selectedTimeIndex === index && styles.selectedTimeText,
              ]}
            >
              {time}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Number of People */}
      <Text style={styles.sectionTitle}>Number of people</Text>
      <Slider
        style={{ width: "100%", height: 40 }}
        minimumValue={1}
        maximumValue={10}
        step={1}
        value={numberOfPeople}
        onValueChange={(value) => setNumberOfPeople(value)}
        minimumTrackTintColor="#E17055"
        maximumTrackTintColor="#D3D3D3"
      />
      <Text style={styles.peopleCount}>{numberOfPeople}</Text>

      {/* Address */}
      <Text style={styles.sectionTitle}>Address</Text>
      <TextInput style={styles.addressText}>8592 Preston Rd. Inglewood</TextInput>

      {/* Special Request */}
      <Text style={styles.sectionTitle}>Special Request</Text>
      <TextInput
        style={styles.specialRequestInput}
        placeholder="Enter your request"
        value={specialRequest}
        onChangeText={setSpecialRequest}
        multiline
      />

      {/* Book Button */}
      <TouchableOpacity style={styles.bookButton} onPress={handleBooking}>
        <Text style={styles.bookButtonText}>Book</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9F9",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    marginRight: 10,
  },
  backText: {
    fontSize: 24,
    color: "#555",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  profileContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
    marginVertical: 10,
  },
  dayContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  dayButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: "#EEE",
    alignItems: "center",
  },
  selectedDayButton: {
    backgroundColor: "#E17055",
  },
  dayText: {
    color: "#555",
  },
  selectedDayText: {
    color: "#FFF",
  },
  timeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  timeButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: "#EEE",
    width: "30%",
    marginVertical: 5,
    alignItems: "center",
  },
  selectedTimeButton: {
    backgroundColor: "#E17055",
  },
  timeText: {
    color: "#555",
  },
  selectedTimeText: {
    color: "#FFF",
  },
  peopleCount: {
    textAlign: "center",
    fontSize: 16,
    color: "#333",
    marginVertical: 10,
  },
  addressText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 20,
  },
  specialRequestInput: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 5,
    padding: 10,
    textAlignVertical: "top",
    height: 80,
    marginBottom: 20,
  },
  bookButton: {
    backgroundColor: "#E17055",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  bookButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default BookingScreen;
