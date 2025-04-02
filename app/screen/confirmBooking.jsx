import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { commonStyles } from "../../style";
import Header from "../../components/header";
import { Ionicons } from "@expo/vector-icons";
import AXIOS_API from "../../config/AXIOS_API";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage"; // Import AsyncStorage

const ConfirmBookingScreen = () => {
  const [loading, setLoading] = useState(false);
  const params = useLocalSearchParams();

  // Parse bookingData and other params
  const bookingData = JSON.parse(params.bookingData || "{}");
  const selectedMenus = JSON.parse(params.selectedMenus || "[]");
  const sessionDate = params.sessionDate || "N/A";
  const startTime = params.startTime || "N/A";
  const endTime = params.endTime || "N/A";
  const chefId = parseInt(params.chefId);
  const location = params.address || "N/A";
  const requestDetails = params.requestDetails || "N/A";
  const dishNotes = JSON.parse(params.dishNotes || "{}");

  // Hàm gọi API để xác nhận booking
  const handleConfirmBooking = async () => {
    try {
      const customerId = await AsyncStorage.getItem("@userId");
      if (!customerId) {
        throw new Error(
          "Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại."
        );
      }

      const selectedDishIds = selectedMenus.flatMap((menu) =>
        menu.menuItems.map((item) => item.dishId || item.id)
      );

      const payload = {
        customerId: parseInt(customerId),
        chefId: parseInt(chefId),
        requestDetails: requestDetails,
        guestCount: 1,
        bookingDetails: [
          {
            sessionDate: sessionDate,
            startTime: `${startTime}:00`,
            endTime: `${endTime}:00`,
            location: location,
            totalPrice: bookingData.totalPrice || 0,
            chefCookingFee: bookingData.chefCookingFee || 0,
            priceOfDishes: bookingData.priceOfDishes || 0,
            arrivalFee: bookingData.arrivalFee || 0,
            chefServingFee: bookingData.chefServingFee || 0,
            timeBeginCook: bookingData.timeBeginCook || null,
            timeBeginTravel: bookingData.timeBeginTravel || null,
            platformFee: bookingData.platformFee || 0,
            totalChefFeePrice: bookingData.totalChefFeePrice || 0,
            isServing: bookingData.chefServingFee > 0,
            isUpdated: false,
            dishes: selectedDishIds.map((dishId) => ({
              dishId: dishId,
              notes: dishNotes[dishId] || null,
            })),
          },
        ],
      };
      console.log("Payload for booking confirmation:", payload);

      const response = await AXIOS_API.post("/bookings", payload);
      console.log("API Response:", response.data);

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Booking confirmed successfully!",
      });

      router.push("(tabs)/home");
    } catch (error) {
      console.error("Error creating booking:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2:
          error.response?.data?.message ||
          error.message ||
          "Failed to confirm booking. Please try again.",
      });
      throw error;
    }
  };

  const handleKeepBooking = async () => {
    setLoading(true);
    try {
      await handleConfirmBooking();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title="Confirm & payment" />
      <ScrollView
        style={{ paddingTop: 20, paddingHorizontal: 20 }}
        contentContainerStyle={{ paddingBottom: 170 }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text style={{ fontSize: 18, fontWeight: 500, marginBottom: 10 }}>
            Location
          </Text>
          <View
            style={{
              borderColor: "#BBBBBB",
              borderWidth: 2,
              borderRadius: 10,
              padding: 20,
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>{location}</Text>
          </View>
        </View>

        <View>
          <Text style={{ fontSize: 18, fontWeight: 500, marginBottom: 10 }}>
            Information
          </Text>
          <View
            style={{
              borderColor: "#BBBBBB",
              borderWidth: 2,
              borderRadius: 10,
              padding: 20,
              marginBottom: 20,
            }}
          >
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>Date</Text>
              <Text style={styles.details}>{sessionDate}</Text>
            </View>
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>Time</Text>
              <Text style={styles.details}>{`${startTime} - ${endTime}`}</Text>
            </View>
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>Time begin travel</Text>
              <Text style={styles.details}>
                {bookingData.timeBeginTravel || "N/A"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>Time begin cook</Text>
              <Text style={styles.details}>
                {bookingData.timeBeginCook || "N/A"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>Cook time</Text>
              <Text style={styles.details}>
                {bookingData.cookTimeMinutes
                  ? `${bookingData.cookTimeMinutes} minutes`
                  : "N/A"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>Chef cooking fee</Text>
              <Text style={styles.details}>
                {bookingData.chefCookingFee?.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                }) || "$0"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>Price of dishes</Text>
              <Text style={styles.details}>
                {bookingData.priceOfDishes?.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                }) || "$0"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>Arrival fee</Text>
              <Text style={styles.details}>
                {bookingData.arrivalFee?.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                }) || "$0"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>Chef serving fee</Text>
              <Text style={styles.details}>
                {bookingData.chefServingFee?.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                }) || "$0"}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 500, marginBottom: 10 }}>
            Payment methods
          </Text>
          <View
            style={{
              borderColor: "#BBBBBB",
              borderWidth: 2,
              borderRadius: 10,
              padding: 20,
              marginBottom: 20,
            }}
          >
            <View style={styles.row}>
              <View style={{ flexDirection: "row" }}>
                <Ionicons
                  name="logo-paypal"
                  size={24}
                  color="black"
                  style={{ marginRight: 10 }}
                />
                <Text style={{ fontSize: 16 }}>Paypal</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="gray" />
            </View>
          </View>
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
        <View
          style={{
            width: "100%",
            borderColor: "#BBBBBB",
            borderWidth: 2,
            borderRadius: 10,
            padding: 15,
            marginBottom: 20,
          }}
        >
          <View style={styles.costRow}>
            <Text style={{ flex: 1, fontSize: 18, fontWeight: "bold" }}>
              Total:
            </Text>
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>
              {bookingData.totalPrice?.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              }) || "$0"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={{
            width: "100%",
            backgroundColor: "#A64B2A",
            padding: 15,
            borderRadius: 10,
            alignItems: "center",
          }}
          onPress={handleKeepBooking}
          disabled={loading}
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
    </SafeAreaView>
  );
};

export default ConfirmBookingScreen;

const styles = StyleSheet.create({
  row: {
    margin: 5,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  details: {
    textAlign: "right",
    fontSize: 14,
  },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 5,
  },
});
