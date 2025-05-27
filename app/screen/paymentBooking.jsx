import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Header from "../../components/header";
import useAxios from "../../config/AXIOS_API";
import { t } from "i18next";
import useRequireAuthAndNetwork from "../../hooks/useRequireAuthAndNetwork";
import { useConfirmModal } from "../../context/commonConfirm";
import { useCommonNoification } from "../../context/commonNoti";
import axios from "axios";
import { useSelectedItems } from "../../context/itemContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Modalize } from "react-native-modalize";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

const PaymentBookingScreen = () => {
  const params = useLocalSearchParams();
  const bookingId = params.bookingId;
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [balance, setBalance] = useState(0);
  const [pinValues, setPinValues] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const axiosInstance = useAxios();
  const [isPaySuccess, setIsPaySuccess] = useState(false);
  const requireAuthAndNetwork = useRequireAuthAndNetwork();
  const { showConfirm } = useConfirmModal();
  const { showModal } = useCommonNoification();
  const { totalPrice, clearSelection } = useSelectedItems();
  const [hasPassword, setHasPassword] = useState(false);
  const router = useRouter();
  const modalizeRef = useRef(null);
  const pinInputRefs = useRef([
    React.createRef(),
    React.createRef(),
    React.createRef(),
    React.createRef(),
  ]).current;
  const pin = pinValues.join("");
  const [showBalance, setShowBalance] = useState(false);
  const toggleBalance = () => setShowBalance((prev) => !prev);
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

  const accessWallet = async () => {
    if (pin.length !== 4) {
      setError(t("pinMustBe4Digits"));
      return;
    }
    setLoading(true);
    try {
      const response = await axiosInstance.post(
        `/users/profile/my-wallet/access?password=${pin}`
      );
      setError("");
      if (response.data === true) {
        await handleCompletePayment();
        modalizeRef.current?.close();
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
    }
  };

  const handleCompletePayment = async () => {
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
        `/bookings/${bookingId}/payment`,
        {}
      );
      console.log("Payment Response:", response.data);
      if (response.status === 200) {
        await fetchBalanceInWallet();
        showModal(t("modal.success"), t("success.paymentSuccess"), t("modal.succeeded"));
        setIsPaySuccess(true);
        // clearSelection();
      }
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      showModal(t("modal.error"), t("errors.paymentFailed"), "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleBackHome = () => {
    router.replace("(tabs)/home");
  };

  const confirmPayment = () => {
    // setModalVisible(false);
    // handleCompletePayment();
    setModalVisible(false);
    setPinValues(["", "", "", ""]);
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

  const handleBack = () => {
    router.replace("/screen/confirmBooking");
  };

  return (
    <GestureHandlerRootView>
      <SafeAreaView style={styles.container}>
        <Header
          title={t("confirmAndPayment")}
          onLeftPress={() => handleBack()}
        />
        <View style={styles.content}>
          <Text style={styles.title}>{t("bookingPayment")}</Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={styles.priceLabel}>
              Số dư: {showBalance ? balance : "***"}
            </Text>
            <TouchableOpacity onPress={toggleBalance} style={{ marginLeft: 8 }}>
              <MaterialIcons
                name={showBalance ? "visibility" : "visibility-off"}
                size={20}
                color="#555"
              />
            </TouchableOpacity>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>{t("totalAmount")}:</Text>
            <Text style={styles.priceValue}>
              {totalPrice &&
                totalPrice.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                })}
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                isPaySuccess ? styles.paymentButton : styles.backButton,
              ]}
              onPress={handleBackHome}
              disabled={loading}
            >
              <Text style={styles.buttonText}>{t("backHome")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                isPaySuccess ? styles.backButton : styles.paymentButton,
              ]}
              onPress={() =>
                showConfirm(
                  t("completePaymentTitle"),
                  t("completePaymentMessage"),
                  () => requireAuthAndNetwork(hasPassword ? confirmPayment : handleCompletePayment)
                )
              }
              disabled={loading || isPaySuccess}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.buttonText}>{t(`completePayment`)}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

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
                style={{ fontSize: 16, color: "white", fontWeight: "bold" }}
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
  container: {
    flex: 1,
    backgroundColor: "#EBE5DD",
  },
  content: {
    padding: 20,
    paddingTop: 40,
    justifyContent: "flex-start",
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
    marginBottom: 10,
  },
  priceContainer: {
    flexDirection: "row",
    gap: 10,
    // justifyContent: "space-around",
    alignItems: "center",
    width: "100%",
    justifyContent: "center",
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
    textAlign: "center",
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
    // position: "relative",
    paddingBottom: 20,
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
