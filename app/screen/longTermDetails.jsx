import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Header from "../../components/header";
import { commonStyles } from "../../style";
import useAxios from "../../config/AXIOS_API";
import { t } from "i18next";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { Modalize } from "react-native-modalize";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import axios from "axios";
import { useCommonNoification } from "../../context/commonNoti";
import { useSelectedItems } from "../../context/itemContext";

const formatStatus = (status) => {
  if (!status) return "";
  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const LongTermDetailsScreen = () => {
  // const { bookingId, chefId } = useLocalSearchParams();
  const { bookingId, chefId, setBookingDetailId, setChefId, clearSelectionLate } = useSelectedItems();
  const [longTermDetails, setLongTermDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showModal } = useCommonNoification();
  const [bookingStatus, setBookingStatus] = useState(null);
  const axiosInstance = useAxios();
  const [pinValues, setPinValues] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [hasPassword, setHasPassword] = useState(true);
  const [selectedPaymentCycleId, setSelectedPaymentCycleId] = useState(null);
  const [selectedPaymentCyclePrice, setSelectedPaymentCyclePrice] = useState(null);
  const [balance, setBalance] = useState(0);
  const [expandedDates, setExpandedDates] = useState({});
  const modalizeRef = useRef(null);
  const pinInputRefs = useRef([
    React.createRef(),
    React.createRef(),
    React.createRef(),
    React.createRef(),
  ]).current;

  const pin = pinValues.join("");

  useEffect(() => {
    console.log("ashjdhj boking", bookingId);
    if (bookingId) {
      clearSelectionLate();
      fetchLongTermDetails();
    }
  }, []);
  useEffect(() => {
    checkWalletPassword();
    fetchBalanceInWallet();
  }, []);



  const checkWalletPassword = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        "/users/profile/my-wallet/has-password"
      );
      console.log(response.data);
      setHasPassword(response.data);
    } catch (error) {
      if (axios.isCancel(error) || error.response?.status === 401) return;
    } finally {
      setLoading(false);
    }
  };

  const fetchBalanceInWallet = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/users/profile/my-wallet");
      const wallet = response.data;
      setBalance(wallet.balance);
    } catch (error) {
      if (axios.isCancel(error) || error.response?.status === 401) return;
      showModal(
        t("modal.error"),
        t("errors.fetchBalanceFailed"),
        "Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchLongTermDetails = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `/bookings/${bookingId}/payment-cycles`
      );
      setLongTermDetails(response.data || []);

      const bookingResponse = await axiosInstance.get(`/bookings/${bookingId}`);
      console.log(bookingResponse.data);
      setBookingStatus(bookingResponse.data.status);
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      showModal(
        t("modal.error"),
        error.response?.data?.message || t("errors.fetchDetailsFailed"),
        "Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const accessWallet = async () => {
    if (pin.length !== 4) {
      showModal(
        t("modal.error"),
        t("errors.pinLengthInvalid"),
        "Failed"
      );
      return;
    }
    setLoading(true);
    try {
      const response = await axiosInstance.post(
        `/users/profile/my-wallet/access?password=${pin}`
      );
      if (response.data === true) {
        setError("");
        modalizeRef.current?.close();
        await handlePayment(selectedPaymentCycleId, selectedPaymentCyclePrice);
      } else {
        setError(t("invalidPin"));
        setPinValues(["", "", "", ""]);
        pinInputRefs[0].current?.focus();
      }

    } catch (error) {
      if (axios.isCancel(error) || error.response?.status === 401) return;
      setError(t("invalidPin"));
      setPinValues(["", "", "", ""]);
      pinInputRefs[0].current?.focus();
    } finally {
      setLoading(false);
      setPinValues(["", "", "", ""]);
    }
  };

  const handlePayment = async (paymentCycleId, totalPrice) => {
    if (balance < totalPrice) {
      showModal(
        t("modal.error"),
        t("errors.notEnoughBalance"),
        "Failed",
        null,
        [
          {
            label: t("cancel"),
            onPress: () => console.log("Cancel pressed"),
            style: { backgroundColor: "#ccc", borderColor: "#ccc" },
          },
          {
            label: t("deposit"),
            onPress: () => router.push("/screen/wallet"),
            style: { backgroundColor: "#383737", borderColor: "#383737" },
          },
        ]
      );
      return;
    }
    setLoading(true);
    try {
      const response = await axiosInstance.post(
        `/bookings/payment-cycles/${paymentCycleId}/pay`
      );

      const paymentSuccessful =
        response.status === 200 || response.data?.status === "PAID";

      if (paymentSuccessful) {
        showModal(t("modal.success"),
          t("paymentSuccess"),
        );
        await fetchLongTermDetails();
      } else {
        showModal(
          t("modal.error"),
          t("errors.paymentFailed"),
          "Failed"
        );
      }
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      showModal(
        t("modal.error"),
        error.response?.data?.message || t("errors.paymentProcessingFailed"),
        "Failed"
      );
    } finally {
      setLoading(false);
      setSelectedPaymentCycleId(null);
      setSelectedPaymentCyclePrice(null);
    }
  };

  const handleOpenPinModal = (paymentCycleId, totalPrice) => {
    setSelectedPaymentCycleId(paymentCycleId);
    setSelectedPaymentCyclePrice(totalPrice);
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

  const groupByDate = (details) => {
    return details.reduce((acc, item) => {
      const date = item.sessionDate;
      if (!acc[date]) acc[date] = [];
      acc[date].push(item);
      return acc;
    }, {});
  };


  // const groupByDate = (details) => {
  //   return details.reduce((acc, item) => {
  //     const date = item.sessionDate;

  //     // Thêm isUpdated nếu updatedAt khác createdAt
  //     const isUpdated = item.isUpdated;
  //     const newItem = { ...item, isUpdated };

  //     if (!acc[date]) acc[date] = [];
  //     acc[date].push(newItem);

  //     return acc;
  //   }, {});
  // };


  const toggleDate = (date) => {
    setExpandedDates(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };





  const renderCycleItem = (cycle) => {
    const groupedDetails = groupByDate(cycle.bookingDetails);

    return (
      <View key={cycle.id} style={styles.cycleCard}>
        <Text style={styles.cycleTitle}>{t("cycle")} {cycle.cycleOrder}</Text>
        <View style={styles.cycleHeader}>
          <Text style={styles.dateRange}>{cycle.startDate} ~ {cycle.endDate}</Text>
          <Text
            style={[
              styles.statusText,
              {
                color:
                  cycle.status === "PAID"
                    ? "#2ECC71"
                    : cycle.status === "CONFIRMED" || cycle.status === "PENDING_FIRST_CYCLE"
                      ? "#A64B2A"
                      : "#E74C3C",
              },
            ]}
          >
            {formatStatus(cycle.status)}
          </Text>
        </View>

        {/* <Text style={styles.cycleInfoText}>
          {t("amountDue")}: <Text style={styles.amount}>${cycle.amountDue}</Text>
        </Text> */}
        <Text style={styles.sectionTitle}>{t("bookingDetails")}</Text>

        <View style={styles.bookingDetailsContainer}>
          {Object.entries(groupedDetails).map(([date, details]) => (
            <View key={date} style={[styles.dateCard, { borderWidth: 1, borderColor: details.some(detail => detail.isUpdated) ? 'green' : 'red' }]}>
              <TouchableOpacity
                onPress={() => toggleDate(date)}
                style={styles.dateCardHeader}
              >
                <Text style={styles.dateTitle}>{t("sessionDate")}: {date}</Text>
                <Ionicons
                  name={expandedDates[date] ? "chevron-up" : "chevron-down"}
                  size={24}
                  color="#333"
                />
              </TouchableOpacity>

              {expandedDates[date] && (
                <View style={styles.detailsList}>
                  {details.map((detail) => (
                    <TouchableOpacity
                      key={detail.id}
                      style={styles.detailItem}
                      onPress={() => {
                        setBookingDetailId(detail.id);
                        setChefId(chefId);
                        router.replace("/screen/bookingDetails");
                      }
                        //   router.replace({
                        //   pathname: "/screen/bookingDetails",
                        //   params: { bookingDetailId: detail.id, chefId },
                        // })
                      }
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={styles.detailText}>{t("startTime")}: {detail.startTime}</Text>
                        <Text style={[
                          styles.detailStatus,
                          {
                            color:
                              detail.status === "COMPLETED"
                                ? "#2ECC71"
                                : detail.status === "PENDING"
                                  ? "#A64B2A"
                                  : "#E74C3C",
                          },
                        ]}>
                          {formatStatus(detail.status)}
                        </Text>
                      </View>
                      <Text style={styles.detailText}>{t("location")}: {detail.location}</Text>
                      <Text style={styles.detailTotal}>{t("totalPrice")}: ${detail.totalPrice}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        {
          (bookingStatus === "PENDING_FIRST_CYCLE" || bookingStatus === "CONFIRMED") && (
            <TouchableOpacity
              style={[styles.paymentButton, loading && styles.disabledButton]}
              onPress={() => hasPassword ? handleOpenPinModal(cycle.id, cycle.amountDue) : handlePayment()}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <View style={styles.paymentButtonContent}>
                  {/* <MaterialIcons name="payment" size={16} color="#FFF" /> */}
                  {/* <Text style={styles.paymentButtonText}>{t("payCycle")}</Text> */}
                  <Text style={styles.paymentButtonText}>{t("payment")}</Text>
                  <Text style={styles.paymentButtonText}>${cycle.amountDue}</Text>
                </View>
              )}
            </TouchableOpacity>
          )
        }
      </View >
    );
  };



  return (
    <GestureHandlerRootView>
      <SafeAreaView style={commonStyles.container}>
        <Header title={t("paymentCycles")} />
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#A64B2A" />
            <Text style={styles.loadingText}>{t("loading")}</Text>
          </View>
        ) : (
          <ScrollView
            style={commonStyles.containerContent}
            contentContainerStyle={styles.scrollContainer}
          >
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
            <Text style={styles.modalTitle}>{t("enterWalletPin")}</Text>
            <Text style={styles.modalSubtitle}>{t("enter4DigitPin")}</Text>
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
                </View>
              ))}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
            <TouchableOpacity
              style={{
                paddingHorizontal: 20,
                paddingVertical: 10,
                backgroundColor: "#A64B2A",
                borderRadius: 20,
              }}
              onPress={() => accessWallet()}
            >
              <Text
                style={{ fontSize: 16, color: "white", fontFamily: "nunito-bold" }}
              >
                {t("pay")}
              </Text>
            </TouchableOpacity>
          </View>
        </Modalize>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    // paddingHorizontal: 10,
    // paddingVertical: 20,
    paddingBottom: 50,
  },
  cycleCard: {
    backgroundColor: "#F9F5F0",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 20,
    // borderWidth: 1,
    // borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cycleTitle: {
    fontSize: 22,
    fontFamily: "nunito-bold",
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
    fontFamily: "nunito-bold",
  },
  dateRange: {
    fontSize: 14,
    color: "#64748B",
    fontFamily: "nunito-regular",
  },
  cycleInfo: {
    marginBottom: 20,
  },
  cycleInfoText: {
    fontSize: 16,
    color: "#334155",
    fontFamily: "nunito-regular",
  },
  amount: {
    fontFamily: "nunito-bold",
    color: "#A64B2A",
  },
  bookingDetailsContainer: {
    backgroundColor: "#F9F5F0",
    borderRadius: 8,
    // padding: 10,
    // borderWidth: 1,
    // borderColor: "#E0E0E0",
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "nunito-bold",
    color: "#1E293B",
    marginBottom: 10,
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
    marginBottom: 5,
    fontFamily: "nunito-regular",
  },
  detailStatus: {
    fontSize: 14,
    fontFamily: "nunito-bold",
  },
  detailTotal: {
    fontSize: 15,
    fontFamily: "nunito-bold",
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
    fontFamily: "nunito-bold",
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
    fontFamily: "nunito-regular",
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
    fontFamily: "nunito-regular",
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
    fontFamily: "nunito-bold",
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
    fontFamily: "nunito-bold",
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

  dateCard: {
    marginBottom: 12,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#ddd",
    backgroundColor: "#fafafa",
  },
  dateCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#f0f0f0",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  dateTitle: {
    fontWeight: "600",
    fontSize: 15,
  },
  detailsList: {
    padding: 10,
    gap: 6,
  },

});

export default LongTermDetailsScreen;
