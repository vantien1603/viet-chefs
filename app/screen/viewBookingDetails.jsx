import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Image,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Header from "../../components/header";
import { commonStyles } from "../../style";
import useAxios from "../../config/AXIOS_API";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Modalize } from "react-native-modalize";
import { t } from "i18next";
import { useCommonNoification } from "../../context/commonNoti";

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
  const [hasPassword, setHasPassword] = useState(true);
  const modalizeRef = useRef(null);
  const pinInputRefs = useRef([
    React.createRef(),
    React.createRef(),
    React.createRef(),
    React.createRef(),
  ]).current;
  const { showModal } = useCommonNoification();

  const pin = pinValues.join("");

  useEffect(() => {
    checkWalletPassword();
    fetchBookingDetails();
    fetchBookingStatus();
  }, [bookingId, refreshing]);

  const checkWalletPassword = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/users/profile/my-wallet/has-password");
      console.log(response.data);
      setHasPassword(response.data);
    } catch (error) {
      if (axios.isCancel(error) || error.response?.status === 401) return;
    } finally {
      setLoading(false);
    }
  }

  const fetchBookingDetails = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `/bookings/${bookingId}/booking-details`
      );
      setBookingDetails(response.data.content || []);
    } catch (error) {
      if (axios.isCancel(error) || error.response?.status === 401) return;
      showModal(t("modal.error"), t("fetchBookingFailed"), "Failed");
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingStatus = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/bookings/${bookingId}`);
      setBookingStatus(response.data.status);
    } catch (error) {
      if (axios.isCancel(error) || error.response?.status === 401) return;
      showModal(t("modal.error"), t("fetchStatusFailed"), "Failed");
    } finally {
      setLoading(false);
    }
  };

  const accessWallet = async () => {
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
      if (bookingType === "LONG_TERM") {
        console.log("1")
        await handleDeposit();

      } else {
        console.log("2")
        await handlePay();
        console.log("3");
      }
      console.log(pin);

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
      if (response.status === 200) {
        showModal(t("modal.success"), t("depositSuccessMsg"),);
        fetchBookingDetails();
      }
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      // showModal(t("modal.error"), "Failed to process deposit", "Failed");
      showModal(t("modal.error"), error.response.data.message, "Failed");
    } finally {
      setPayLoading(false);
    }
  };

  const handlePay = async () => {
    console.log("Roi")
    setPayLoading(true);
    try {
      const response = await axiosInstance.post(
        `/bookings/${bookingId}/payment`
      );
      if (response.status === 200) {
        showModal(t("modal.success"), t("paymentSuccessful"),);
        fetchBookingDetails();
      }
    } catch (error) {
      if (axios.isCancel(error) || error.response?.status === 401) return;
      if (error.response.data.message === "Insufficient balance in the wallet.") {
        showModal(t("modal.error"), error.response?.data.message, "Failed", null, [
          {
            label: "Cancel",
            onPress: () => console.log("Cancel pressed"),
            style: { backgroundColor: "#ccc" }
          },
          {
            label: "Top up",
            onPress: () => router.push("/screen/wallet"),
            style: { backgroundColor: "#A64B2A" }
          }
        ])
      } else {
        showModal(t(t("modal.error")), error.response?.data.message, "Failed");
      }

    } finally {
      setPayLoading(false);
    }
  };

  const handleOpenPinModal = () => {
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



  if (loading) {
    return (
      <SafeAreaView style={[commonStyles.container]}>
        <Header title={t("bookingDetails")} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="white" />
        </View>
      </SafeAreaView>
    );
  }

  if (!bookingDetails || bookingDetails.length === 0) {
    return (
      <SafeAreaView style={[commonStyles.container]}>
        <Header title={t("bookingDetails")} />
        <View style={styles.noDataContainer}>
          <MaterialIcons name="error-outline" size={40} color="#A64B2A" />
          <Text style={styles.noDataText}>{t("noBookingDetails")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView>
      <SafeAreaView style={[commonStyles.container]}>
        <Header title={t("bookingDetails")} />
        <ScrollView style={commonStyles.containerContent} contentContainerStyle={styles.scrollContent}>
          {bookingDetails.map((detail, index) => (
            <React.Fragment key={detail.id || index}>
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>{t("bookingInfo")}</Text>
                <View style={styles.detailRow}>
                  <MaterialIcons
                    name="calendar-today"
                    size={18}
                    color="#A64B2A"
                  />
                  <Text style={styles.detailLabel}>{t("sessionDate")}:</Text>
                  <Text style={styles.detailValue}>
                    {detail.sessionDate || "N/A"}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <MaterialIcons name="access-time" size={18} color="#A64B2A" />
                  <Text style={styles.detailLabel}>{t("startTime")}:</Text>
                  <Text style={styles.detailValue}>
                    {formatTime(detail.startTime)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <MaterialIcons name="location-on" size={18} color="#A64B2A" />
                  <Text style={styles.detailLabel}>{t("location")}:</Text>
                  <Text style={styles.detailValue}>
                    {detail.location || "N/A"}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <MaterialIcons name="info" size={18} color="#A64B2A" />
                  <Text style={styles.detailLabel}>{t("status")}:</Text>
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
                  <Text style={styles.detailLabel}>{t("totalPrice")}:</Text>
                  <Text style={styles.detailValue}>
                    ${detail.totalPrice || 0}
                  </Text>
                </View>
              </View>

              {/* Schedule */}
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>{t("schedule")}</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t("timeBeginCook")}:</Text>
                  <Text style={styles.detailValue}>
                    {formatTime(detail.timeBeginCook)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t("timeBeginTravel")}:</Text>
                  <Text style={styles.detailValue}>
                    {formatTime(detail.timeBeginTravel)}
                  </Text>
                </View>
              </View>

              {/* Dishes */}
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>{t("dishes")}</Text>
                {!detail.dishes || detail.dishes.length === 0 ? (
                  <View style={styles.noDataContainer}>
                    <Text style={[styles.detailValue, { color: "#A64B2A" }]}>
                      {t("noDishSelect")}
                    </Text>
                  </View>
                ) : (
                  detail.dishes.map((dishItem, dishIndex) => (
                    <View
                      key={dishItem.id || dishIndex}
                      style={styles.dishItem}
                    >
                      <Image
                        source={{
                          uri: dishItem.dish?.imageUrl,
                        }}
                        style={{ width: 30, height: 30, borderRadius: 6 }}
                      />
                      <Text style={styles.detailValue}>
                        {dishItem.dish?.name || "N/A"}
                        {dishItem.notes ? ` (${dishItem.notes})` : ""}
                      </Text>
                    </View>
                  ))
                )}
              </View>

              {/* Fee Details */}
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>{t("feeDetails")}</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t("chefCookingFee")}:</Text>
                  <Text style={styles.detailValue}>
                    ${detail.chefCookingFee || 0}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t("priceOfDishes")}:</Text>
                  <Text style={styles.detailValue}>
                    ${detail.priceOfDishes || 0}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t("arrivalFee")}:</Text>
                  <Text style={styles.detailValue}>
                    ${detail.arrivalFee || 0}
                  </Text>
                </View>
                {detail.chefServingFee !== undefined && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{t("chefServingFee")}:</Text>
                    <Text style={styles.detailValue}>
                      ${detail.chefServingFee || 0}
                    </Text>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t("platformFee")}:</Text>
                  <Text style={styles.detailValue}>
                    ${detail.platformFee || 0}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t("totalChefFee")}:</Text>
                  <Text style={styles.detailValue}>
                    ${detail.totalChefFeePrice || 0}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t("discountAmount")}:</Text>
                  <Text style={styles.detailValue}>
                    ${detail.discountAmout || 0}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t("totalPrice")}:</Text>
                  <Text style={styles.detailValue}>
                    ${detail.totalPrice || 0}
                  </Text>
                </View>
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
            onPress={() => hasPassword ? handleOpenPinModal() : handleDeposit()}
            disabled={depositLoading}
          >
            {depositLoading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <View style={styles.depositButtonContent}>
                <MaterialIcons name="payment" size={18} color="#FFF" />
                <Text style={styles.depositButtonText}>{t("deposit")}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        {bookingStatus === "PENDING" && bookingType === "SINGLE" && (
          <TouchableOpacity
            style={[styles.depositButton, payLoading && styles.disabledButton]}
            onPress={() => hasPassword ? handleOpenPinModal() : handlePay()}
            disabled={payLoading}
          >
            {payLoading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <View style={styles.depositButtonContent}>
                <MaterialIcons name="attach-money" size={18} color="#FFF" />
                <Text style={styles.depositButtonText}>{t("pay")}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        <Modalize
          ref={modalizeRef}
          adjustToContentHeight={true}
          modalStyle={styles.modalStyle}
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
            <Text style={styles.modalTitle}>{t("enterPin")}</Text>
            <Text style={styles.modalSubtitle}>{t("pleaseEnterPin")}</Text>
            <View style={styles.pinContainer}>
              {[0, 1, 2, 3].map((index) => (
                <View key={index} style={styles.pinBox}>
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
                </View>))}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
            <TouchableOpacity onPress={() => accessWallet()}>
              <Text>{t("confirm")}</Text>
            </TouchableOpacity>
          </View>
        </Modalize>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    // padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: "#F9F5F0",
    borderRadius: 12,
    padding: 15,
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
    marginLeft: 10,
    alignItems: 'center',
    paddingVertical: 8,
    flexDirection: 'row',
    gap: 10
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
