import React, { useContext, useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Header from "../../components/header";
import useAxios from "../../config/AXIOS_API";
import { useCommonNoification } from "../../context/commonNoti";
import axios from "axios";
import { useSelectedItems } from "../../context/itemContext";
import { commonStyles } from "../../style";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Modalize } from "react-native-modalize";
import { t } from "i18next";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useConfirmModal } from "../../context/commonConfirm";

const PaymentLongterm = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const axiosInstance = useAxios();
  const bookingId = params.bookingId;
  // const platformFeeModalRef = useRef(null);
  const { location, totalPrice, selectedDates } = useSelectedItems();
  const depositAmount = totalPrice * 0.05;
  const { showModal } = useCommonNoification();
  const { showConfirm } = useConfirmModal();
  const [isPaySuccess, setIsPaySuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);
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
      const response = await axiosInstance.get("/users/profile/my-wallet");
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
      if (axios.isCancel(error) || error.response.status === 401) return;
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
    console.log("voo")
    if (pin.length !== 4) {
      setError(t("pinMustBe4Digits"));
      return;
    }
    try {
      const response = await axiosInstance.post(
        `/users/profile/my-wallet/access?password=${pin}`
      );
      setError("");
      modalizeRef.current?.close();
      if (response.status === 200) await handleConfirmDeposit();
    } catch (error) {
      setError(t("invalidPin"));
      setPinValues(["", "", "", ""]);
      pinInputRefs[0].current?.focus();
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

  const handleConfirmDeposit = async () => {
    if (balance < totalPrice) {
      showModal(
        t("modal.error"),
        t("errors.notEnoughBalance"),
        "Failed",
        null,
        [
          {
            label: "Cancel",
            onPress: () => console.log("Cancel pressed"),
            style: { backgroundColor: "#ccc", borderColor: "#ccc" },
          },
          {
            label: "Deposit",
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
        `/bookings/${bookingId}/deposit`
      );
      console.log("dat coc reponse", response.data)
      if (response.status === 200 || response.status === 201) {
        await fetchBalanceInWallet();
        showModal(t("modal.success"), t("depositSuccess"));
        setIsPaySuccess(true);
      }
    } catch (error) {
      if (error.response?.status === 401 || axios.isCancel(error)) {
        return;
      }
      if (
        error.response.data.message === "Insufficient balance in the wallet."
      ) {
        showModal(
          t("modal.error"),
          t("errors.insufficientBalance"),
          "Failed",
          null,
          [
            {
              label: t("cancel"),
              onPress: () => console.log("Cancel pressed"),
              style: { backgroundColor: "#ccc" },
            },
            {
              label: t("topUp"),
              onPress: () => router.push("/screen/wallet"),
              style: { backgroundColor: "#A64B2A" },
            },
          ]
        );
      } else {
        showModal(t("modal.error"), t("errors.depositFailed"), "Failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.replace("/screen/reviewBooking");
  };

  return (
    <GestureHandlerRootView>
      <SafeAreaView style={commonStyles.container}>
        <Header title={t("depositPayment")} onLeftPress={() => handleBack()} />

        <View style={styles.content}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={styles.priceLabel}>
              {t("balance")}: {showBalance ? balance : "***"}
            </Text>
            <TouchableOpacity onPress={toggleBalance} style={{ marginLeft: 8 }}>
              <MaterialIcons
                name={showBalance ? "visibility" : "visibility-off"}
                size={20}
                color="#555"
              />
            </TouchableOpacity>
          </View>
          <View style={{ alignItems: 'center' }}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t("totalBookingAmount")}:</Text>
              <Text style={[styles.summaryValue, styles.depositValue]}>
                {totalPrice &&
                  totalPrice.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                  })}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t("depositAmount")}:</Text>
              <Text style={[styles.summaryValue, styles.depositValue]}>
                ${depositAmount.toFixed(2)}
              </Text>
            </View>
            <View style={[styles.summaryRow, { marginBottom: 10 }]}>
              <Text style={styles.summaryLabel}>{t("remainingAmount")}:</Text>
              <Text style={styles.summaryValue}>
                ${(totalPrice - depositAmount).toFixed(2)}
              </Text>
            </View>
          </View>


          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                isPaySuccess ? styles.paymentButton : styles.backButton,
              ]}
              onPress={() => router.replace("/(tabs)/home")}
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
                  t("confirmDepositTitle"),
                  t("confirmDepositMessage"),
                  () => (hasPassword ? handleOpenPinModal() : handleConfirmDeposit())
                )
              }
              disabled={loading || isPaySuccess}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.buttonText}>{t(`confirmDepositButton`)}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* <View style={styles.buttonArea}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={() => router.replace("/(tabs)/home")}
          >
            <Text style={styles.confirmButtonText}>{t("backToHome")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.confirmButton}
            // onPress={handleConfirmDeposit}
            onPress={() =>
              showConfirm(
                t("confirmDepositTitle"),
                t("confirmDepositMessage"),
                () => (hasPassword ? handleOpenPinModal() : handleConfirmDeposit())
              )
            }
            disabled={loading || isPaySuccess}
          >
            <Text style={styles.confirmButtonText}>{t("confirmDepositButton")}</Text>
          </TouchableOpacity>
        </View> */}

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
                marginBottom:20
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
  safeArea: {
    flex: 1,
    backgroundColor: "#EBE5DD",
  },
  container: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: "nunito-bold",
    marginBottom: 20,
  },
  summaryContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CCCCCC",
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    // justifyContent: "space-evenly",
    // marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    fontFamily: "nunito-regular"
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: "nunito-bold",
  },
  depositValue: {
    color: "#A64B2A",
  },
  infoContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CCCCCC",
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 16,
    fontFamily: "nunito-bold",
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 16,
    marginBottom: 10,
    fontFamily: "nunito-regular"
  },
  buttonArea: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#EBE5DD",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: "#CCCCCC",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  confirmButton: {
    backgroundColor: "#A64B2A",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "nunito-bold",
  },
  spacer: {
    height: 100,
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
    fontFamily: "nunito-regular"
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
  forgotPinText: {
    color: "#FF69B4",
    fontSize: 16,
    textDecorationLine: "underline",
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
    fontFamily: "nunito-bold",
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
    fontFamily: "nunito-regular"
  },
  priceValue: {
    fontSize: 20,
    fontFamily: "nunito-bold",
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
    fontFamily: "nunito-bold",
    fontSize: 16,
    textAlign: "center",
  },
});

export default PaymentLongterm;
