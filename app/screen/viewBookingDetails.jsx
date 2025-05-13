import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  TextInput,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Header from "../../components/header";
import { commonStyles } from "../../style";
import useAxios from "../../config/AXIOS_API";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { Modalize } from "react-native-modalize";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";

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
  const [bookingStatus, setBookingStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [depositLoading, setDepositLoading] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const axiosInstance = useAxios();
  const [pinValues, setPinValues] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [hasPassword, setHasPassword] = useState(true); // Giả sử ví đã có mật khẩu
  const modalizeRef = useRef(null);
  const pinInputRefs = useRef([
    React.createRef(),
    React.createRef(),
    React.createRef(),
    React.createRef(),
  ]).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;

  const pin = pinValues.join("");

  useEffect(() => {
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.3,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    blink.start();
    return () => blink.stop();
  }, [blinkAnim]);

  const fetchBookingDetails = async () => {
    try {
      const response = await axiosInstance.get(
        `/bookings/${bookingId}/booking-details`
      );
      setBookingDetails(response.data.content || []);
    } catch (error) {
      console.log("Error fetching booking details:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to fetch booking details",
      });
    }
  };

  const fetchBookingStatus = async () => {
    try {
      const response = await axiosInstance.get(`/bookings/${bookingId}`);
      setBookingStatus(response.data.status);
    } catch (error) {
      console.log("Error fetching booking status:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to fetch booking status",
      });
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchBookingDetails(), fetchBookingStatus()]);
    } finally {
      setLoading(false);
    }
  };

  const accessWallet = async (action) => {
    if (pin.length !== 4) {
      setError("PIN must be 4 digits");
      return;
    }
    try {
      await axiosInstance.post(
        `/users/profile/my-wallet/access?password=${pin}`
      );
      setError("");
      modalizeRef.current?.close();
      if (action === "deposit") {
        await handleDeposit();
      } else if (action === "pay") {
        await handlePay();
      }
    } catch (error) {
      console.error("Error accessing wallet:", error.response?.data);
      setError("Invalid PIN");
      setPinValues(["", "", "", ""]);
      pinInputRefs[0].current?.focus();
    }
  };

  const handleDeposit = async () => {
    setDepositLoading(true);
    try {
      const response = await axiosInstance.post(
        `/bookings/${bookingId}/deposit`
      );

      const depositSuccessful = response.status === 200;

      if (depositSuccessful) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Deposit successful",
        });
        await fetchData();

        if (depositSuccessful) {
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
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Payment successful",
        });
        await fetchData();
        router.push("/(tabs)/home");
      }
    } catch (error) {
      console.log("Error making payment:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to make payment",
      });
    } finally {
      setPayLoading(false);
    }
  };

  const handleOpenPinModal = (action) => {
    modalizeRef.current?.open();
    setTimeout(() => pinInputRefs[0].current?.focus(), 100);
  };

  const handlePinChange = (text, index) => {
    const firstEmptyIndex = pinValues.findIndex((val) => val === "");
    const validIndex = firstEmptyIndex === -1 ? 3 : firstEmptyIndex;

    if (index !== validIndex) {
      pinInputRefs[validIndex].current?.focus();
      return;
    }

    const newPinValues = [...pinValues];
    newPinValues[index] = text.replace(/[^0-9]/g, "").slice(0, 1);
    setPinValues(newPinValues);

    if (text && index < 3) {
      pinInputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyPress = ({ nativeEvent }, index) => {
    if (nativeEvent.key === "Backspace") {
      const lastFilledIndex = pinValues
        .slice(0, 4)
        .reduce((last, val, i) => (val !== "" ? i : last), -1);

      if (lastFilledIndex >= 0) {
        const newPinValues = [...pinValues];
        newPinValues[lastFilledIndex] = "";
        setPinValues(newPinValues);
        pinInputRefs[lastFilledIndex].current?.focus();
      }
    }
  };

  useEffect(() => {
    if (bookingId) {
      fetchData();
    }
  }, [bookingId, refreshing]);

  useEffect(() => {
    if (pin.length === 4) {
      accessWallet(bookingType === "LONG_TERM" ? "deposit" : "pay");
    }
  }, [pin]);

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
    <GestureHandlerRootView style={{ flex: 1 }}>
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
                  <Text style={styles.detailLabel}>Detail Status:</Text>
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
                  <MaterialIcons
                    name="attach-money"
                    size={18}
                    color="#A64B2A"
                  />
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
                    <View
                      key={dishItem.id || dishIndex}
                      style={styles.dishItem}
                    >
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

        {/* Nút Make Deposit hoặc Pay (chỉ hiển thị nếu booking status là PENDING) */}
        {bookingStatus === "PENDING" && bookingType === "LONG_TERM" && (
          <TouchableOpacity
            style={[
              styles.depositButton,
              depositLoading && styles.disabledButton,
            ]}
            onPress={() => handleOpenPinModal("deposit")}
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
        {bookingStatus === "PENDING" && bookingType === "SINGLE" && (
          <TouchableOpacity
            style={[styles.depositButton, payLoading && styles.disabledButton]}
            onPress={() => handleOpenPinModal("pay")}
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

        {/* Modal nhập PIN */}
        <Modalize
          ref={modalizeRef}
          adjustToContentHeight={true}
          handlePosition="outside"
          modalStyle={styles.modalStyle}
          handleStyle={styles.handleStyle}
          onOpened={() => {
            const firstEmptyIndex = pinValues.findIndex((val) => val === "");
            const focusIndex = firstEmptyIndex === -1 ? 0 : firstEmptyIndex;
            pinInputRefs[focusIndex].current?.focus();
          }}
          closeOnOverlayTap={false}
          panGestureEnabled={false}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                modalizeRef.current?.close();
                setPinValues(["", "", "", ""]);
                setError("");
              }}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Enter Wallet PIN</Text>
            <Text style={styles.modalSubtitle}>
              Please enter your 4-digit PIN
            </Text>
            <View style={styles.pinContainer}>
              {[0, 1, 2, 3].map((index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.pinBox,
                    pinValues[index] === "" &&
                    index === pinValues.join("").length
                      ? { opacity: blinkAnim }
                      : {},
                  ]}
                >
                  <TextInput
                    ref={pinInputRefs[index]}
                    style={styles.pinInput}
                    value={pinValues[index]}
                    onChangeText={(text) => handlePinChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="numeric"
                    maxLength={1}
                    secureTextEntry={true}
                    textAlign="center"
                    selectionColor="transparent"
                  />
                </Animated.View>
              ))}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        </Modalize>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
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
    width: 150,
  },
  detailValue: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  dishItem: {
    paddingVertical: 8,
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
  modalStyle: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  handleStyle: {
    backgroundColor: "#A64B2A",
    width: 40,
    height: 5,
    borderRadius: 5,
  },
  modalContent: {
    alignItems: "center",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    marginTop: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  pinContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
    marginBottom: 20,
  },
  pinBox: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  pinInput: {
    width: "100%",
    height: "100%",
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    borderWidth: 0,
    backgroundColor: "transparent",
  },
  errorText: {
    color: "red",
    fontSize: 16,
    marginBottom: 10,
  },
  forgotPinText: {
    color: "#FF69B4",
    fontSize: 16,
    textDecorationLine: "underline",
  },
});

export default ViewBookingDetailsScreen;
