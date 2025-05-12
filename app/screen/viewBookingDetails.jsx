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
import Header from "../../components/header";
import { commonStyles } from "../../style";
import useAxios from "../../config/AXIOS_API";
import { MaterialIcons } from "@expo/vector-icons";

// Hàm chuyển đổi thời gian từ object thành chuỗi
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
  const [payLoading, setPayLoading] = useState(false);
  const axiosInstance = useAxios();

  const fetchBookingDetails = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `/bookings/${bookingId}/booking-details`
      );
      // console.log("Booking details:", JSON.stringify(response.data, null, 2));
      setBookingDetails(response.data.content || []);
    } catch (error) {
      console.log("Error fetching booking details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    setDepositLoading(true);
    try {
      const response = await axiosInstance.post(
        `/bookings/${bookingId}/deposit`
      );

      const depositSuccessful =
        response.status === 200 || response.data?.status === "DEPOSITED";

      if (depositSuccessful) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Deposit successful",
        });
        await fetchBookingDetails();

        const updatedDetails = bookingDetails.some(
          (detail) => detail.status === "DEPOSITED"
        );
        if (updatedDetails || depositSuccessful) {
          router.push("/(tabs)/home");
        } else {
          Toast.show({
            type: "info",
            text1: "Info",
            text2: "Deposit processed but status not updated yet. Please wait.",
          });
        }
      }
    } catch (error) {
      console.log("Error making deposit:", error);
    } finally {
      setDepositLoading(false);
    }
  };

  const handlePay = async () => {
    setPayLoading(true);
    try {
      const response = await axiosInstance.post(
        `/bookings/${bookingId}/payment`
      );
      if (response.status === 200) {
        await fetchBookingDetails();
        router.push("/(tabs)/home");
      }
    } catch (error) {
      console.log("Error making payment:", error);
    } finally {
      setPayLoading(false);
    }
  };

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId, refreshing]);

  if (loading) {
    return (
      <SafeAreaView
        style={[commonStyles.containerContent, { backgroundColor: "#EBE5DD" }]}
      >
        <Header title="Booking Details" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A64B2A" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!bookingDetails || bookingDetails.length === 0) {
    return (
      <SafeAreaView
        style={[commonStyles.containerContent, { backgroundColor: "#EBE5DD" }]}
      >
        <Header title="Booking Details" />
        <View style={styles.noDataContainer}>
          <MaterialIcons name="error-outline" size={40} color="#A64B2A" />
          <Text style={styles.noDataText}>No booking details available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[commonStyles.containerContent, { backgroundColor: "#EBE5DD" }]}
    >
      <Header title="Booking Details" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {bookingDetails.map((detail, index) => (
          <React.Fragment key={detail.id || index}>
            {/* Booking Information */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Booking Information</Text>
              <View style={styles.detailRow}>
                <MaterialIcons
                  name="calendar-today"
                  size={18}
                  color="#A64B2A"
                />
                <Text style={styles.detailLabel}>Session Date:</Text>
                <Text style={styles.detailValue}>
                  {detail.sessionDate || "N/A"}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <MaterialIcons name="access-time" size={18} color="#A64B2A" />
                <Text style={styles.detailLabel}>Start Time:</Text>
                <Text style={styles.detailValue}>
                  {formatTime(detail.startTime)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <MaterialIcons name="location-on" size={18} color="#A64B2A" />
                <Text style={styles.detailLabel}>Location:</Text>
                <Text style={styles.detailValue}>
                  {detail.location || "N/A"}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <MaterialIcons name="info" size={18} color="#A64B2A" />
                <Text style={styles.detailLabel}>Status:</Text>
                <Text
                  style={[
                    styles.detailValue,
                    {
                      color:
                        detail.status === "CONFIRMED" ||
                        detail.status === "DEPOSITED"
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
                <Text style={styles.detailValue}>
                  ${detail.totalPrice || 0}
                </Text>
              </View>
            </View>

            {/* Fee Details */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Fee Details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>- Chef Cooking Fee:</Text>
                <Text style={styles.detailValue}>
                  ${detail.chefCookingFee || 0}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>- Price of Dishes:</Text>
                <Text style={styles.detailValue}>
                  ${detail.priceOfDishes || 0}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>- Arrival Fee:</Text>
                <Text style={styles.detailValue}>
                  ${detail.arrivalFee || 0}
                </Text>
              </View>
              {detail.chefServingFee !== undefined && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>- Chef Serving Fee:</Text>
                  <Text style={styles.detailValue}>
                    ${detail.chefServingFee || 0}
                  </Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>- Applicable Fee:</Text>
                <Text style={styles.detailValue}>
                  ${detail.platformFee || 0}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>- Total Chef Fee:</Text>
                <Text style={styles.detailValue}>
                  ${detail.totalChefFeePrice || 0}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>- Discount Amount:</Text>
                <Text style={styles.detailValue}>
                  ${detail.discountAmout || 0}
                </Text>
              </View>
            </View>

            {/* Schedule */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Schedule</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Time Begin Cook:</Text>
                <Text style={styles.detailValue}>
                  {formatTime(detail.timeBeginCook)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Time Begin Travel:</Text>
                <Text style={styles.detailValue}>
                  {formatTime(detail.timeBeginTravel)}
                </Text>
              </View>
            </View>

            {/* Dishes */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Dishes</Text>
              {!detail.dishes || detail.dishes.length === 0 ? (
                <View style={styles.noDataContainer}>
                  <Text style={[styles.detailValue, { color: "#A64B2A" }]}>
                    No dishes selected
                  </Text>
                </View>
              ) : (
                detail.dishes.map((dishItem, dishIndex) => (
                  <View key={dishItem.id || dishIndex} style={styles.dishItem}>
                    <Text style={styles.detailValue}>
                      - {dishItem.dish?.name || "N/A"}
                      {dishItem.notes ? ` (${dishItem.notes})` : ""}
                    </Text>
                  </View>
                ))
              )}
            </View>
            <View
              style={{
                borderColor: "#CCCCCC",
                marginBottom: 15,
                borderWidth: 1,
                borderRadius: 10,
              }}
            />
          </React.Fragment>
        ))}
      </ScrollView>

      {/* Nút Make Deposit */}
      {bookingType === "LONG_TERM" && (
        <TouchableOpacity
          style={[
            styles.depositButton,
            depositLoading && styles.disabledButton,
          ]}
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
      {bookingType === "SINGLE" &&
        bookingDetails.some((detail) => detail.status === "PENDING") && (
          <TouchableOpacity
            style={[styles.depositButton, payLoading && styles.disabledButton]}
            onPress={handlePay}
            disabled={payLoading}
          >
            {payLoading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <View style={styles.depositButtonContent}>
                <MaterialIcons name="attach-money" size={18} color="#FFF" />
                <Text style={styles.depositButtonText}>Pay</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Đảm bảo nút Deposit không che nội dung
  },
  card: {
    backgroundColor: "#FFFFFF",
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
