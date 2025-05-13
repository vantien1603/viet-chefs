import React, { useContext, useEffect, useState, useRef } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Header from "../../components/header";
import useAxios from "../../config/AXIOS_API";
import { AuthContext } from "../../config/AuthContext";
import Toast from "react-native-toast-message";
import { t } from "i18next";
import { Modalize } from "react-native-modalize";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";

const PaymentLongterm = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const axiosInstance = useAxios();
  const { user } = useContext(AuthContext);

  const bookingId = params.bookingId;
  const bookingData = JSON.parse(params.bookingData || "{}");
  const totalPrice = bookingData.totalPrice || 0;
  const depositAmount = totalPrice * 0.05;
  const [balance, setBalance] = useState(0);
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
      await handleConfirmDeposit();
    } catch (error) {
      console.error("Error accessing wallet:", error.response?.data);
      setError(t("invalidPin"));
      setPinValues(["", "", "", ""]);
      pinInputRefs[0].current?.focus();
    }
  };

  const handleConfirmDeposit = async () => {
    try {
      if (!user) {
        throw new Error("Vui lòng đăng nhập để tiếp tục.");
      }
      if (!bookingId) {
        throw new Error("Không tìm thấy ID đặt chỗ.");
      }

      const response = await axiosInstance.post(
        `/bookings/${bookingId}/deposit`
      );

      if (response.status === 200 || response.status === 201) {
        Toast.show({
          type: "success",
          text1: t("depositSuccess"),
        });
        router.push("(tabs)/home");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Có lỗi khi xác nhận đặt cọc. Vui lòng thử lại.";
      console.log("Error confirming deposit:", errorMessage);
      if (balance < depositAmount) {
        Toast.show({
          type: "error",
          text1: t("notEnoughBalance"),
        });
      } else {
        Toast.show({
          type: "error",
          text1: errorMessage,
        });
      }
    }
  };

  const handleOpenPinModal = () => {
    if (balance < depositAmount) {
      Toast.show({
        type: "error",
        text1: t("notEnoughBalance"),
      });
      return;
    }
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
      <SafeAreaView style={styles.safeArea}>
        <Header title={t("depositPayment")} />
        <ScrollView style={styles.container}>
          <Text style={styles.title}>{t("depositConfirmation")}</Text>

          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t("walletBalance")}:</Text>
              <Text style={styles.summaryValue}>${balance.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t("totalDeposit")}:</Text>
              <Text style={styles.summaryValue}>${totalPrice.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {t("depositAmount")} (5%):
              </Text>
              <Text style={[styles.summaryValue, styles.depositValue]}>
                ${depositAmount.toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t("remainingAmount")}:</Text>
              <Text style={styles.summaryValue}>
                ${(totalPrice - depositAmount).toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>{t("infor")}:</Text>
            <Text style={styles.infoValue}>
              {t("location")}:{" "}
              {bookingData.bookingDetails?.[0]?.location || "N/A"}
            </Text>
            <Text style={styles.infoValue}>
              {t("numberOfDays")}: {bookingData.bookingDetails?.length || 0}
            </Text>
          </View>

          <View style={styles.spacer} />
        </ScrollView>

        <View style={styles.buttonArea}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={() => router.push("(tabs)/home")}
          >
            <Text style={styles.confirmButtonText}>{t("backHome")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleOpenPinModal}
          >
            <Text style={styles.confirmButtonText}>
              {t("depositConfirmation")}
            </Text>
          </TouchableOpacity>
        </View>

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
  safeArea: {
    flex: 1,
    backgroundColor: "#EBE5DD",
  },
  container: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
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
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "bold",
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
    fontWeight: "bold",
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 16,
    marginBottom: 10,
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
    fontWeight: "600",
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

export default PaymentLongterm;
