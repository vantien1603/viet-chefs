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
import { MaterialIcons } from "@expo/vector-icons";
import axios from "axios";

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

  const fetchBookingDetails = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/bookings/${bookingId}/booking-details`);
      console.log("Booking details:", JSON.stringify(response.data, null, 2));
      setBookingDetails(response.data.content || []);
    } catch (error) {
      showModal("Error", "Failed to load booking details", "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    setDepositLoading(true);
    try {
      const response = await axiosInstance.post(`/bookings/${bookingId}/deposit`);
      console.log("Deposit response:", JSON.stringify(response.data, null, 2));

      const depositSuccessful = response.status === 200 || response.data?.status === "DEPOSITED";

      if (depositSuccessful) {
        showModal("Success", "Deposit successful", "Success");
        await fetchBookingDetails();

        const updatedDetails = bookingDetails.some((detail) => detail.status === "DEPOSITED");
        if (updatedDetails || depositSuccessful) {
          router.push("/(tabs)/home");
        } else {
          showModal("Error", "Deposit processed but status not updated yet. Please wait...", "Failed");

        }
      } else {
        showModal("Error", "Deposit failed. Please try again.", "Failed");
      }
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      showModal("Error", "Failed to process deposit", "Failed");
    } finally {
      setDepositLoading(false);
    }
  };

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId, refreshing]);

  if (loading) {
    return (
      <SafeAreaView style={[commonStyles.container]}>
        <Header title="Booking Details" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!bookingDetails || bookingDetails.length === 0) {
    return (
      <SafeAreaView style={[commonStyles.container]}>
        <Header title="Booking Details" />
        <View style={styles.noDataContainer}>
          <MaterialIcons name="error-outline" size={40} color="#A64B2A" />
          <Text style={styles.noDataText}>No booking details available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[commonStyles.containerContent]}>
      <Header title="Booking Details" />
      <ScrollView style={commonStyles.containerContent} contentContainerStyle={styles.scrollContent}>
        {bookingDetails.map((detail, index) => (
          <React.Fragment key={detail.id || index}>
            {/* Booking Information */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Booking Information</Text>
              <View style={styles.detailRow}>
                <MaterialIcons name="calendar-today" size={18} color="#A64B2A" />
                <Text style={styles.detailLabel}>Session Date:</Text>
                <Text style={styles.detailValue}>{detail.sessionDate || "N/A"}</Text>
              </View>
              <View style={styles.detailRow}>
                <MaterialIcons name="access-time" size={18} color="#A64B2A" />
                <Text style={styles.detailLabel}>Start Time:</Text>
                <Text style={styles.detailValue}>{formatTime(detail.startTime)}</Text>
              </View>
              <View style={styles.detailRow}>
                <MaterialIcons name="location-on" size={18} color="#A64B2A" />
                <Text style={styles.detailLabel}>Location:</Text>
                <Text style={styles.detailValue}>{detail.location || "N/A"}</Text>
              </View>
              <View style={styles.detailRow}>
                <MaterialIcons name="info" size={18} color="#A64B2A" />
                <Text style={styles.detailLabel}>Status:</Text>
                <Text
                  style={[
                    styles.detailValue,
                    {
                      color:
                        detail.status === "CONFIRMED" || detail.status === "DEPOSITED"
                          ? "#2ECC71"
                          : detail.status === "PENDING"
                            ? "#A64B2A"
                            : "#E74C3C",
                    },
                  ]}
                >
                  {detail.status || "N/A"}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <MaterialIcons name="attach-money" size={18} color="#A64B2A" />
                <Text style={styles.detailLabel}>Total Price:</Text>
                <Text style={styles.detailValue}>${detail.totalPrice || 0}</Text>
              </View>
            </View>

            {/* Fee Details */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Fee Details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>- Chef Cooking Fee:</Text>
                <Text style={styles.detailValue}>${detail.chefCookingFee || 0}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>- Price of Dishes:</Text>
                <Text style={styles.detailValue}>${detail.priceOfDishes || 0}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>- Arrival Fee:</Text>
                <Text style={styles.detailValue}>${detail.arrivalFee || 0}</Text>
              </View>
              {detail.chefServingFee !== undefined && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>- Chef Serving Fee:</Text>
                  <Text style={styles.detailValue}>${detail.chefServingFee || 0}</Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>- Platform Fee:</Text>
                <Text style={styles.detailValue}>${detail.platformFee || 0}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>- Total Chef Fee:</Text>
                <Text style={styles.detailValue}>${detail.totalChefFeePrice || 0}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>- Discount Amount:</Text>
                <Text style={styles.detailValue}>${detail.discountAmout || 0}</Text>
              </View>
            </View>

            {/* Schedule */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Schedule</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Time Begin Cook:</Text>
                <Text style={styles.detailValue}>{formatTime(detail.timeBeginCook)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Time Begin Travel:</Text>
                <Text style={styles.detailValue}>{formatTime(detail.timeBeginTravel)}</Text>
              </View>
            </View>

            {/* Dishes */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Dishes</Text>
              {!detail.dishes || detail.dishes.length === 0 ? (
                <View style={styles.noDataContainer}>
                  <Text style={[styles.detailValue, { color: "#A64B2A" }]}>No dishes selected</Text>
                </View>
              ) : (
                detail.dishes.map((dishItem, dishIndex) => (
                  <View key={dishItem.id || dishIndex} style={styles.dishItem}>
                    <View style={styles.dishRow}>
                      <Text style={styles.detailLabel}>Dish Name:</Text>
                      <Text style={styles.detailValue}>{dishItem.dish?.name || "N/A"}</Text>
                    </View>
                    {dishItem.notes && (
                      <View style={[styles.dishRow, { marginLeft: 20 }]}>
                        <Text style={styles.detailLabel}>Notes:</Text>
                        <Text style={styles.detailValue}>{dishItem.notes}</Text>
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>
          </React.Fragment>
        ))}
      </ScrollView>

      {/* Nút Make Deposit */}
      {bookingType === "LONG_TERM" && (
        <TouchableOpacity
          style={[styles.depositButton, depositLoading && styles.disabledButton]}
          onPress={handleDeposit}
          disabled={depositLoading}
        >
          {depositLoading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <View style={styles.depositButtonContent}>
              <MaterialIcons name="payment" size={18} color="#FFF" />
              <Text style={styles.depositButtonText}>Make Deposit</Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    // padding: 16,
    paddingBottom: 100, // Đảm bảo nút Deposit không che nội dung
  },
  card: {
    backgroundColor: "#F9F5F0",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
    width: 150, // Căn chỉnh nhãn
  },
  detailValue: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  dishItem: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    marginTop: 8,
  },
  dishRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  noDataContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  noDataText: {
    fontSize: 16,
    color: "#A64B2A",
    textAlign: "center",
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#A64B2A",
    marginTop: 8,
  },
  depositButton: {
    backgroundColor: "#A64B2A",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    margin: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: "#B0B0B0",
  },
  depositButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  depositButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 8,
  },
});

export default ViewBookingDetailsScreen;