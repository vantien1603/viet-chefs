import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import Header from "../../components/header";
import Toast from "react-native-toast-message";
import useAxios from "../../config/AXIOS_API";
import { t } from "i18next";
import { Modalize } from "react-native-modalize";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";

const PaymentBookingScreen = () => {
  const params = useLocalSearchParams();
  const bookingId = params.bookingId;
  const bookingData = JSON.parse(params.bookingData || "{}");
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [balance, setBalance] = useState(0);
  const [pinValues, setPinValues] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [hasPassword, setHasPassword] = useState(true); // Giả sử ví đã có mật khẩu
  const axiosInstance = useAxios();
  const modalizeRef = useRef(null);
  const pinInputRefs = useRef([
    React.createRef(),
    React.createRef(),
    React.createRef(),
    React.createRef(),
  ]).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;

  const totalPrice = bookingData?.totalPrice || 0;
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

  const fetchBalanceInWallet = async () => {
    try {
      const response = await axiosInstance.get("/users/profile/my-wallet");
      console.log("Wallet Balance:", response.data);
      const wallet = response.data;
      setBalance(wallet.balance);
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
      Toast.show({
        type: "error",
        text1: t("errorFetchingBalance"),
      });
    }
  };

  const accessWallet = async () => {
    if (pin.length !== 4) {
      setError(t("pinMustBe4Digits"));
      return;
    }
    try {
      const response = await axiosInstance.post(
        `/users/profile/my-wallet/access?password=${pin}`
      );
      console.log("Access wallet response:", response.data);
      setError("");
      modalizeRef.current?.close();
      await handleCompletePayment();
    } catch (error) {
      console.error("Error accessing wallet:", error.response?.data);
      setError(t("invalidPin"));
      setPinValues(["", "", "", ""]);
      pinInputRefs[0].current?.focus();
    }
  };

  const handleCompletePayment = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.post(
        `/bookings/${bookingId}/payment`,
        {}
      );
      console.log("Payment Response:", response.data);
      Toast.show({
        type: "success",
        text1: t("paymentSuccess"),
      });
      router.push("(tabs)/home");
    } catch (error) {
      console.log("Error completing payment:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = () => {
    if (balance < totalPrice) {
      Toast.show({
        type: "error",
        text1: t("notEnoughBalance"),
      });
      return;
    }
    setModalVisible(true);
  };

  const handleBackHome = () => {
    router.push("(tabs)/home");
  };

  const confirmPayment = () => {
    setModalVisible(false);
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
    fetchBalanceInWallet();
  }, []);

  useEffect(() => {
    if (pin.length === 4) {
      accessWallet();
    }
  }, [pin]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <Header title={t("confirmAndPayment")} />
        <View style={styles.content}>
          <Text style={styles.title}>{t("bookingPayment")}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>{t("walletBalance")}:</Text>
            <Text style={styles.priceValue}>
              {balance.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              })}
            </Text>
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>{t("totalAmount")}:</Text>
            <Text style={styles.priceValue}>
              {totalPrice.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              })}
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.backButton]}
              onPress={handleBackHome}
              disabled={loading}
            >
              <Text style={styles.buttonText}>{t("backHome")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.paymentButton]}
              onPress={handleConfirmPayment}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.buttonText}>{t("completePayment")}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Modal xác nhận thanh toán */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContentC}>
              <Text style={styles.modalTitleC}>{t("confirmPayment")}</Text>
              <Text style={styles.modalText}>
                {t("confirmPaymentWithAmount", {
                  amount: totalPrice.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                  }),
                })}
              </Text>
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>{t("cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={confirmPayment}
                >
                  <Text style={styles.modalButtonText}>{t("confirm")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

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
            <Text style={styles.modalTitle}>{t("enterWalletPin")}</Text>
            <Text style={styles.modalSubtitle}>{t("enter4DigitPin")}</Text>
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
  container: {
    flex: 1,
    backgroundColor: "#EBE5DD",
  },
  content: {
    padding: 20,
    paddingTop: 40,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    margin: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  priceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  priceLabel: {
    fontSize: 18,
    color: "#555",
  },
  priceValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#A64B2A",
    marginTop: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 5,
  },
  backButton: {
    backgroundColor: "#6C757D",
  },
  paymentButton: {
    backgroundColor: "#A64B2A",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContentC: {
    width: "80%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  modalTitleC: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#6C757D",
  },
  confirmButton: {
    backgroundColor: "#A64B2A",
  },
  modalButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
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

export default PaymentBookingScreen;