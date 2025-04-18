import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Toast from "react-native-toast-message";
import Header from "../../components/header";
import { commonStyles } from "../../style";
import useAxios from "../../config/AXIOS_API";

// Hàm chuyển đổi thời gian từ object thành chuỗi (nếu cần)
const formatTime = (timeObj) => {
  if (!timeObj || typeof timeObj !== "object") return timeObj || "N/A";
  const { hour, minute, second } = timeObj;
  return `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}:${second.toString().padStart(2, "0")}`;
};

const ViewBookingDetailsScreen = () => {
  const { bookingId, bookingType, refreshing } = useLocalSearchParams();
  const [bookingDetails, setBookingDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [depositLoading, setDepositLoading] = useState(false);
  const axiosInstance = useAxios();

  console.log("bookingType:", bookingType);
  console.log("bookingId:", bookingId);
  console.log("refreshing:", refreshing);

  const fetchBookingDetails = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/bookings/${bookingId}/booking-details`);
      console.log("Booking details:", JSON.stringify(response.data, null, 2));
      setBookingDetails(response.data.content || []);
    } catch (error) {
      console.error("Error fetching booking details:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load booking details",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    setDepositLoading(true);
    try {
      const response = await axiosInstance.post(`/bookings/${bookingId}/deposit`);
      console.log("Deposit response:", JSON.stringify(response.data, null, 2));

      // Kiểm tra xem deposit có thành công không (dựa trên status hoặc response)
      const depositSuccessful = response.status === 200 || response.data?.status === "DEPOSITED";

      if (depositSuccessful) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Deposit successful",
        });

        // Refetch booking details to confirm the status update
        await fetchBookingDetails();

        // Kiểm tra lại trạng thái sau khi refetch
        const updatedDetails = bookingDetails.some((detail) => detail.status === "DEPOSITED");
        if (updatedDetails || depositSuccessful) {
          // Chỉ navigate nếu deposit được xác nhận
          router.push("/(tabs)/home");
        } else {
          Toast.show({
            type: "info",
            text1: "Info",
            text2: "Deposit processed but status not updated yet. Please wait.",
          });
        }
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Deposit failed. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error making deposit:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.response?.data?.message || "Failed to process deposit",
      });
    } finally {
      setDepositLoading(false);
    }
  };

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  if (loading) {
    return (
      <SafeAreaView style={commonStyles.containerContent}>
        <Header title="View Booking Details" />
        <ActivityIndicator
          size="large"
          color="#A64B2A"
          style={{ marginTop: 20 }}
        />
      </SafeAreaView>
    );
  }

  if (!bookingDetails || bookingDetails.length === 0) {
    return (
      <SafeAreaView style={commonStyles.containerContent}>
        <Header title="View Booking Details" />
        <Text style={styles.noDataText}>No booking details available</Text>
      </SafeAreaView>
    );
  }

  console.log("Can show deposit button:", bookingType === "LONG_TERM");
  console.log("bookingDetails statuses:", bookingDetails.map((detail) => detail.status));

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title="View Booking Details" />
      <ScrollView style={{ padding: 20 }}>
        {bookingDetails.map((detail, index) => (
          <View key={detail.id || index} style={styles.detailCard}>
            {/* Booking Information */}
            <Text style={styles.sectionTitle}>Booking Information</Text>
            <Text style={styles.detailText}>
              Session Date: {detail.sessionDate || "N/A"}
            </Text>
            <Text style={styles.detailText}>
              Start Time: {formatTime(detail.startTime)}
            </Text>
            <Text style={styles.detailText}>
              Location: {detail.location || "N/A"}
            </Text>
            <Text style={styles.detailText}>Status: {detail.status || "N/A"}</Text>
            <Text style={styles.detailText}>
              Total Price: ${detail.totalPrice || 0}
            </Text>

            {/* Fee Details */}
            <Text style={styles.sectionTitle}>Fee Details</Text>
            <Text style={styles.detailText}>
              Chef Cooking Fee: ${detail.chefCookingFee || 0}
            </Text>
            <Text style={styles.detailText}>
              Price of Dishes: ${detail.priceOfDishes || 0}
            </Text>
            <Text style={styles.detailText}>
              Arrival Fee: ${detail.arrivalFee || 0}
            </Text>
            {detail.chefServingFee !== undefined && (
              <Text style={styles.detailText}>
                Chef Serving Fee: ${detail.chefServingFee}
              </Text>
            )}
            <Text style={styles.detailText}>
              Platform Fee: ${detail.platformFee || 0}
            </Text>
            <Text style={styles.detailText}>
              Total Chef Fee: ${detail.totalChefFeePrice || 0}
            </Text>
            <Text style={styles.detailText}>
              Discount Amount: ${detail.discountAmout || 0}
            </Text>

            {/* Schedule */}
            <Text style={styles.sectionTitle}>Schedule</Text>
            <Text style={styles.detailText}>
              Time Begin Cook: {formatTime(detail.timeBeginCook)}
            </Text>
            <Text style={styles.detailText}>
              Time Begin Travel: {formatTime(detail.timeBeginTravel)}
            </Text>

            {/* Dishes */}
            <Text style={styles.sectionTitle}>Dishes</Text>
            {!detail.dishes || detail.dishes.length === 0 ? (
              <Text style={styles.detailText}>No dishes selected</Text>
            ) : (
              detail.dishes.map((dishItem, dishIndex) => (
                <View key={dishItem.id || dishIndex} style={styles.dishItem}>
                  <Text style={styles.detailText}>
                    Dish Name: {dishItem.dish?.name || "N/A"}
                  </Text>
                  <Text style={styles.detailText}>
                    Description: {dishItem.dish?.description || "N/A"}
                  </Text>
                  <Text style={styles.detailText}>
                    Cuisine Type: {dishItem.dish?.cuisineType || "N/A"}
                  </Text>
                  <Text style={styles.detailText}>
                    Service Type: {dishItem.dish?.serviceType || "N/A"}
                  </Text>
                  <Text style={styles.detailText}>
                    Base Price: ${dishItem.dish?.basePrice || 0}
                  </Text>
                  {dishItem.notes && (
                    <Text style={styles.detailText}>Notes: {dishItem.notes}</Text>
                  )}
                </View>
              ))
            )}
          </View>
        ))}
      </ScrollView>

      {/* Nút Make Deposit */}
      {bookingType === "LONG_TERM" && (
        <TouchableOpacity
          style={styles.depositButton}
          onPress={handleDeposit}
          disabled={depositLoading}
        >
          {depositLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.depositButtonText}>Make Deposit</Text>
          )}
        </TouchableOpacity>
      )}

      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  detailCard: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
    marginBottom: 10,
  },
  detailText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  dishItem: {
    borderTopWidth: 1,
    borderTopColor: "#DDD",
    paddingTop: 10,
    marginTop: 5,
  },
  noDataText: {
    fontSize: 16,
    color: "#9C583F",
    textAlign: "center",
    marginTop: 20,
  },
  depositButton: {
    backgroundColor: "#A64B2A",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 20,
    marginHorizontal: 20,
  },
  depositButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default ViewBookingDetailsScreen;