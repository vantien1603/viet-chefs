import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  TextInput,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Toast from "react-native-toast-message";
import Header from "../../components/header";
import { commonStyles } from "../../style";
import useAxios from "../../config/AXIOS_API";
import { t } from "i18next";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { Modalize } from "react-native-modalize";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Hàm chuyển đổi status có dấu "_" thành dạng dễ đọc
const formatStatus = (status) => {
  if (!status) return "";
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const LongTermDetailsScreen = () => {
  const { bookingId, chefId } = useLocalSearchParams();
  const [longTermDetails, setLongTermDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookingStatus, setBookingStatus] = useState(null);
  const axiosInstance = useAxios();
  const [pinValues, setPinValues] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [hasPassword, setHasPassword] = useState(true); // Giả sử ví đã có mật khẩu
  const [selectedPaymentCycleId, setSelectedPaymentCycleId] = useState(null);
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

  const fetchLongTermDetails = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `/bookings/${bookingId}/payment-cycles`
      );
      setLongTermDetails(response.data || []);

      const bookingResponse = await axiosInstance.get(`/bookings/${bookingId}`);
      setBookingStatus(bookingResponse.data.status);
    } catch (error) {
      console.error("Error fetching payment cycles:", error);
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: t("failedToLoadPaymentCycles"),
      });
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
      const response = await axiosInstance.post(
        `/users/profile/my-wallet/access?password=${pin}`
      );
      console.log("Access wallet response:", response.data);
      setError("");
      modalizeRef.current?.close();
      await handlePayment(selectedPaymentCycleId);
    } catch (error) {
      console.error("Error accessing wallet:", error.response?.data);
      setError("Invalid PIN");
      setPinValues(["", "", "", ""]);
      pinInputRefs[0].current?.focus();
    }
  };

  const handlePayment = async (paymentCycleId) => {
    setLoading(true);
    try {
      const response = await axiosInstance.post(
        `/bookings/payment-cycles/${paymentCycleId}/pay`
      );

      const paymentSuccessful =
        response.status === 200 || response.data?.status === "PAID";

      if (paymentSuccessful) {
        Toast.show({
          type: "success",
          text1: t("success"),
          text2: t("paymentSuccessful"),
        });
        await fetchLongTermDetails();
        router.push("/screen/history");
      } else {
        Toast.show({
          type: "error",
          text1: t("error"),
          text2: t("paymentFailed"),
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: error.response?.data?.message || t("failedToProcessPayment"),
      });
    } finally {
      setLoading(false);
      setSelectedPaymentCycleId(null);
    }
  };

  const handleOpenPinModal = (paymentCycleId) => {
    setSelectedPaymentCycleId(paymentCycleId);
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
      fetchLongTermDetails();
    }
  }, [bookingId]);

  useEffect(() => {
    if (pin.length === 4) {
      accessWallet();
    }
  }, [pin]);

  const renderCycleItem = (cycle) => {
    return (
      <View key={cycle.id} style={styles.cycleCard}>
        <Text style={styles.cycleTitle}>
          {t("cycle")} {cycle.cycleOrder}
        </Text>
        <View style={styles.cycleHeader}>
          <Text
            style={[
              styles.statusText,
              {
                color:
                  cycle.status === "PAID"
                    ? "#2ECC71"
                    : cycle.status === "CONFIRMED" ||
                      cycle.status === "PENDING_FIRST_CYCLE"
                    ? "#A64B2A"
                    : "#E74C3C",
              },
            ]}
          >
            {formatStatus(cycle.status)}
          </Text>
          <Text style={styles.dateRange}>
            {cycle.startDate} ~ {cycle.endDate}
          </Text>
        </View>

        <View style={styles.cycleInfo}>
          <Text style={styles.cycleInfoText}>
            {t("amountDue")}:{" "}
            <Text style={styles.amount}>${cycle.amountDue}</Text>
          </Text>
        </View>

        <View style={styles.bookingDetailsContainer}>
          <Text style={styles.sectionTitle}>{t("bookingDetails")}</Text>
          {cycle.bookingDetails.map((detail) => (
            <TouchableOpacity
              key={detail.id}
              style={styles.detailItem}
              onPress={() =>
                router.push({
                  pathname: "/screen/bookingDetails",
                  params: { bookingDetailId: detail.id, chefId },
                })
              }
            >
              <View style={styles.detailHeader}>
                <Text style={styles.detailText}>
                  {t("sessionDate")}: {detail.sessionDate}
                </Text>
                <Text
                  style={[
                    styles.detailStatus,
                    {
                      color:
                        detail.status === "COMPLETED"
                          ? "#2ECC71"
                          : detail.status === "PENDING"
                          ? "#A64B2A"
                          : "#E74C3C",
                    },
                  ]}
                >
                  {formatStatus(detail.status)}
                </Text>
              </View>
              <Text style={styles.detailText}>
                {t("startTime")}: {detail.startTime}
              </Text>
              <Text style={styles.detailText}>
                {t("location")}: {detail.location}
              </Text>
              <Text style={styles.detailTotal}>
                {t("totalPrice")}: ${detail.totalPrice}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {(bookingStatus === "PENDING_FIRST_CYCLE" ||
          bookingStatus === "CONFIRMED") && (
          <TouchableOpacity
            style={[styles.paymentButton, loading && styles.disabledButton]}
            onPress={() => handleOpenPinModal(cycle.id)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <View style={styles.paymentButtonContent}>
                <MaterialIcons name="payment" size={16} color="#FFF" />
                <Text style={styles.paymentButtonText}>{t("payCycle")}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={commonStyles.containerContent}>
        <Header title={t("paymentCycles")} />
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#A64B2A" />
            <Text style={styles.loadingText}>{t("loading")}</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            {longTermDetails.length > 0 ? (
              <>{longTermDetails.map(renderCycleItem)}</>
            ) : (
              <View style={styles.noDataContainer}>
                <MaterialIcons name="error-outline" size={36} color="#A64B2A" />
                <Text style={styles.noDataText}>
                  {t("noPaymentCyclesAvailable")}
                </Text>
              </View>
            )}
          </ScrollView>
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
                setSelectedPaymentCycleId(null);
              }}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t("enterWalletPin")}</Text>
            <Text style={styles.modalSubtitle}>{t("pleaseEnter4DigitPin")}</Text>
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
  scrollContainer: {
    paddingHorizontal: 10,
    paddingVertical: 20,
    paddingBottom: 100, // Đảm bảo không bị che bởi Toast
  },
  cycleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cycleTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E293B",
    textAlign: "center",
    marginBottom: 16,
  },
  cycleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
  },
  dateRange: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "400",
  },
  cycleInfo: {
    marginBottom: 20,
  },
  cycleInfoText: {
    fontSize: 16,
    color: "#334155",
    fontWeight: "500",
  },
  amount: {
    fontWeight: "700",
    color: "#A64B2A",
  },
  bookingDetailsContainer: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 12,
  },
  detailItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 8,
    fontWeight: "400",
  },
  detailStatus: {
    fontSize: 14,
    fontWeight: "600",
  },
  detailTotal: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 8,
  },
  paymentButton: {
    backgroundColor: "#A64B2A",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: "#B0B0B0",
  },
  paymentButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 6,
  },
  noDataContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  noDataText: {
    fontSize: 16,
    color: "#A64B2A",
    textAlign: "center",
    marginTop: 8,
    fontWeight: "500",
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
    fontWeight: "500",
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
});

export default LongTermDetailsScreen;