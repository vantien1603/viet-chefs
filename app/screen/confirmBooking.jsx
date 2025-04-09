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
import AsyncStorage from "@react-native-async-storage/async-storage";

const ConfirmBookingScreen = () => {
  const axiosInstance = useAxios();
  const [loading, setLoading] = useState(false);
  const params = useLocalSearchParams();

  // Parse bookingData and other params
  const bookingData = JSON.parse(params.bookingData || "{}");
  const selectedMenu = JSON.parse(params.selectedMenu || "null");
  const selectedDishes = JSON.parse(params.selectedDishes || "[]");
  const sessionDate = params.sessionDate || "N/A";
  const startTime = params.startTime || "N/A";
  const chefId = parseInt(params.chefId);
  const location = params.address || "N/A";
  const requestDetails = params.requestDetails || "N/A";
  const dishNotes = JSON.parse(params.dishNotes || "{}");
  const numPeople = parseInt(params.numPeople) || 1;
  const menuId = params.menuId || null; // Lấy menuId từ params

  // Extract dishes from selectedMenu (menu items) and selectedDishes (extra dishes)
  const menuDishes = selectedMenu?.menuItems?.map((item) => ({
    id: item.dishId || item.id,
    name: item.dishName || item.name || "Unnamed Dish",
  })) || [];

  const extraDishes = selectedDishes.map((dish) => ({
    id: dish.id,
    name: dish.name || "Unnamed Dish",
  }));

  // Combine all dishes for the total count
  const allDishes = [...menuDishes, ...extraDishes];
  const numberOfDishes = allDishes.length;

  // Format the dish list: "Menu Name: Dish 1, Dish 2, ..." + extra dishes
  const menuDishList = menuDishes.length > 0
    ? `${selectedMenu?.name || "Menu"}: ${menuDishes
        .map((dish) => {
          const note = dishNotes[dish.id] ? ` (${dishNotes[dish.id]})` : "";
          return `${dish.name}${note}`;
        })
        .join(", ")}`
    : "";

  const extraDishList = extraDishes.length > 0
    ? `${extraDishes
        .map((dish) => {
          const note = dishNotes[dish.id] ? ` (${dishNotes[dish.id]})` : "";
          return `${dish.name}${note}`;
        })
        .join(", ")}`
    : "";

  const dishList = [menuDishList, extraDishList].filter(Boolean).join(" | ") || "N/A";

  const numberOfMenuDishes = menuDishes.length;

  const handleConfirmBooking = async () => {
    try {
      const customerId = await AsyncStorage.getItem("@userId");
      if (!customerId) {
        throw new Error(
          "Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại."
        );
      }

      const selectedDishIds = allDishes.map((dish) => dish.id);

      const payload = {
        customerId: parseInt(customerId),
        chefId: parseInt(chefId),
        requestDetails: requestDetails,
        guestCount: numPeople,
        bookingDetails: [
          {
            sessionDate: sessionDate,
            startTime: `${startTime}:00`,
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
            totalCookTime: (bookingData.cookTimeMinutes || 0)/60,
            isUpdated: false,
            menuId: menuId,
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
          <Text style={{ fontSize: 18, fontWeight: "500", marginBottom: 10 }}>
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
            {/* Subsection: Thời Gian Làm Việc */}
            <Text style={styles.subSectionTitle}>Thời Gian Làm Việc</Text>
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>Date</Text>
              <Text style={styles.details}>{sessionDate}</Text>
            </View>
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>Time</Text>
              <Text style={styles.details}>{`${startTime}`}</Text>
            </View>
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>Time Begin Travel</Text>
              <Text style={styles.details}>
                {bookingData.timeBeginTravel || "N/A"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>Time Begin Cook</Text>
              <Text style={styles.details}>
                {bookingData.timeBeginCook || "N/A"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>Cook Time</Text>
              <Text style={styles.details}>
                {bookingData.cookTimeMinutes
                  ? `${bookingData.cookTimeMinutes} minutes`
                  : "N/A"}
              </Text>
            </View>

            {/* Subsection: Chi Tiết Công Việc */}
            <Text style={[styles.subSectionTitle, { marginTop: 20 }]}>
              Chi Tiết Công Việc
            </Text>
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>Số Người Ăn</Text>
              <Text style={styles.details}>{numPeople}</Text>
            </View>
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>Tổng Số Món Ăn</Text>
              <Text style={styles.details}>{numberOfDishes}</Text>
            </View>
            {selectedMenu && (
              <View style={styles.row}>
                <Text style={{ fontSize: 14, flex: 1 }}>Số Món Trong Menu</Text>
                <Text style={styles.details}>{numberOfMenuDishes}</Text>
              </View>
            )}
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>Danh Sách Món Ăn</Text>
              <Text style={[styles.details, { flex: 2 }]}>{dishList}</Text> 
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
  subSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
});