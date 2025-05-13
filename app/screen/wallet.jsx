import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  BackHandler,
  TextInput,
  Keyboard,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../../components/header";
import { commonStyles } from "../../style";
import { router, useLocalSearchParams } from "expo-router";
import useAxios from "../../config/AXIOS_API";
import moment from "moment/moment";
import { t } from "i18next";
import { Modalize } from "react-native-modalize";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const WalletScreen = () => {
  const [balance, setBalance] = useState(0);
  const [walletId, setWalletId] = useState(null);
  const [walletType, setWalletType] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [depositAmount, setDepositAmount] = useState(0);
  const [paypalAccountEmail, setPaypalAccountEmail] = useState(null);
  const [pinValues, setPinValues] = useState(["", "", "", ""]);
  const [changePinValues, setChangePinValues] = useState({
    oldPin: ["", "", "", ""],
    newPin: ["", "", "", ""],
  });
  const pin = pinValues.join("");
  const changePin = {
    oldPin: changePinValues.oldPin.join(""),
    newPin: changePinValues.newPin.join(""),
  };
  const [hasPassword, setHasPassword] = useState(null);
  const params = useLocalSearchParams();
  const axiosInstance = useAxios();
  const modalizeRef = useRef(null);
  const changePinModalizeRef = useRef(null);
  const [error, setError] = useState("");
  const [changePinError, setChangePinError] = useState("");
  const pinInputRefs = useRef([
    React.createRef(),
    React.createRef(),
    React.createRef(),
    React.createRef(),
  ]).current;
  const oldPinInputRefs = useRef([
    React.createRef(),
    React.createRef(),
    React.createRef(),
    React.createRef(),
  ]).current;
  const newPinInputRefs = useRef([
    React.createRef(),
    React.createRef(),
    React.createRef(),
    React.createRef(),
  ]).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;

  // Hiệu ứng nhấp nháy
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

  const openModal = () => {
    modalizeRef.current?.open();
    setTimeout(() => pinInputRefs[0].current?.focus(), 100);
  };

  const closeModal = () => {
    modalizeRef.current?.close();
    setPinValues(["", "", "", ""]);
    setError("");
    Keyboard.dismiss();
  };

  const openChangePinModal = () => {
    changePinModalizeRef.current?.open();
    setTimeout(() => oldPinInputRefs[0].current?.focus(), 100);
  };

  const closeChangePinModal = () => {
    changePinModalizeRef.current?.close();
    setChangePinValues({ oldPin: ["", "", "", ""], newPin: ["", "", "", ""] });
    setChangePinError("");
    Keyboard.dismiss();
  };

  const fetchWalletData = async () => {
    try {
      const response = await axiosInstance.get("/users/profile/my-wallet/all");

      const walletData = response.data.wallet;
      const customerTransactions =
        response.data.customerTransactions?.content || [];
      const chefTransactions = response.data.chefTransactions?.content || [];

      setBalance(walletData.balance ?? 0);
      setWalletId(walletData.id);
      setWalletType(walletData.walletType);
      setDepositAmount(walletData.depositAmount ?? 0);
      setPaypalAccountEmail(walletData.paypalAccountEmail);

      let formattedTransactions = [];
      const txList =
        walletData.walletType === "CUSTOMER"
          ? customerTransactions
          : walletData.walletType === "CHEF"
          ? chefTransactions
          : [];
      formattedTransactions = txList.map((tx) => ({
        id: tx.id.toString(),
        transactionType: tx.transactionType,
        amount: tx.amount ?? 0,
        description: tx.description || "No description",
        date: tx.createdAt
          ? moment(tx.createdAt).format("HH:mm - DD/MM/YYYY")
          : "Unknown date",
        createdAt: tx.createdAt || new Date().toISOString(),
      }));
      setTransactions(formattedTransactions);
      setFilteredTransactions(formattedTransactions);
    } catch (error) {
      console.error("Error fetching wallet data:", error);
    }
  };

  const checkWalletPassword = async () => {
    try {
      const response = await axiosInstance.get(
        "/users/profile/my-wallet/has-password"
      );
      console.log("Has password:", response.data);
      setHasPassword(response.data);
      if (response.data === false) {
        Alert.alert(
          t("walletPasswordRequired"),
          t("pleaseSet4DigitPin"),
          [
            {
              text: t("ok"),
              onPress: () => openModal(),
            },
          ]
        );
      } else {
        openModal();
      }
    } catch (error) {
      console.error("Error checking wallet password:", error);
    }
  };

  const setWalletPassword = async () => {
    console.log("Attempting to set PIN:", pin);
    if (pin.length !== 4) {
      setError(t("pinMustBe4Digits"));
      return;
    }
    try {
      await axiosInstance.post(
        `/users/profile/my-wallet/set-password?password=${pin}`
      );
      closeModal();
      fetchWalletData();
    } catch (error) {
      console.error("Error setting wallet password:", error.response?.data);
      setError(
        error?.response?.data?.message || t("failedToSetPin")
      );
      setPinValues(["", "", "", ""]);
      pinInputRefs[0].current?.focus();
    }
  };

  const accessWallet = async () => {
    if (pin.length !== 4) {
      console.log("PIN length invalid:", pin.length);
      setError(t("pinMustBe4Digits"));
      return;
    }
    try {
      const response = await axiosInstance.post(
        `/users/profile/my-wallet/access?password=${pin}`
      );
      console.log("Access wallet response:", response.data);
      if (response.data === true) {
        closeModal();
        fetchWalletData();
      } else {
        setPinValues(["", "", "", ""]);
        setError(t("invalidPin"));
        pinInputRefs[0].current?.focus();
      }
    } catch (error) {
      console.error("Error accessing wallet:", error.response?.data);
      setPinValues(["", "", "", ""]);
      setError(t("invalidPin"));
      pinInputRefs[0].current?.focus();
    }
  };

  const changeWalletPassword = async () => {
    if (changePin.oldPin.length !== 4 || changePin.newPin.length !== 4) {
      setChangePinError(t("pinMustBe4Digits"));
      return;
    }
    try {
      // Verify old PIN
      const accessResponse = await axiosInstance.post(
        `/users/profile/my-wallet/access?password=${changePin.oldPin}`
      );
      if (accessResponse.data !== true) {
        throw new Error("Invalid old PIN");
      }

      // Set new PIN
      const setResponse = await axiosInstance.post(
        `/users/profile/my-wallet/set-password?password=${changePin.newPin}`
      );
      console.log("Set new PIN response:", setResponse.data);
      closeChangePinModal();
      Alert.alert(
        t("success"),
        t("pinChangedSuccessfully"),
        [
          {
            text: t("ok"),
            onPress: () => {},
          },
        ]
      );
    } catch (error) {
      console.error("Error changing PIN:", error.response?.data);
      setChangePinError(
        error?.response?.data?.message || t("failedToChangePin")
      );
      setChangePinValues({ oldPin: ["", "", "", ""], newPin: ["", "", "", ""] });
      oldPinInputRefs[0].current?.focus();
    }
  };

  useEffect(() => {
    checkWalletPassword();
  }, []);

  useEffect(() => {
    if (pin.length === 4 && hasPassword !== null) {
      console.log("PIN reached 4 digits:", pin);
      Keyboard.dismiss();
      if (hasPassword) {
        accessWallet();
      } else {
        setWalletPassword();
      }
    }
  }, [pin, hasPassword]);

  useEffect(() => {
    if (changePin.oldPin.length === 4 && changePin.newPin.length < 4) {
      newPinInputRefs[0].current?.focus();
    }
    if (changePin.oldPin.length === 4 && changePin.newPin.length === 4) {
      Keyboard.dismiss();
      changeWalletPassword();
    }
  }, [changePin]);

  useEffect(() => {
    const backAction = () => {
      router.push("/(tabs)/profile");
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const handleDeposit = () => {
    if (walletId) {
      router.push({
        pathname: "/screen/deposit",
        params: { id: walletId, balance },
      });
    } else {
      Alert.alert(t("error"), t("walletIdNotFound"));
    }
  };

  const handleWithdrawal = () => {
    if (walletId) {
      router.push({
        pathname: "/screen/withdrawal",
        params: { id: walletId, balance, paypalAccountEmail },
      });
    }
  };

  const handleBack = () => {
    router.push("/(tabs)/profile");
  };

  const handleStatistic = () => {
    router.push({
      pathname: "/screen/statistic",
      params: { transactions: JSON.stringify(transactions) },
    });
  };

  const renderTransaction = ({ item, index }) => {
    const isPositive = ["DEPOSIT", "REFUND"].includes(item.transactionType);
    const color = isPositive ? "green" : "red";
    const sign = isPositive ? "+" : "-";

    return (
      <View
        style={[
          styles.transactionItem,
          {
            backgroundColor:
              index % 2 === 0 ? "rgba(0,0,0,0.05)" : "rgba(0,0,255,0.05)",
          },
        ]}
      >
        <View style={styles.transactionIcon}>
          <Ionicons
            name={isPositive ? "arrow-up-circle" : "arrow-down-circle"}
            size={24}
            color={color}
          />
        </View>
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionDescription}>{item.description}</Text>
          <View style={styles.transactionBottomRow}>
            <Text style={styles.transactionDate}>{item.date}</Text>
            <Text style={[styles.transactionAmount, { color }]}>
              {sign}
              {(item.amount ?? 0).toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              })}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const handlePinChange = (text, index, type = "access") => {
    const isChangePin = type === "oldPin" || type === "newPin";
    const values = isChangePin ? changePinValues[type] : pinValues;
    const setValues = isChangePin ? setChangePinValues : setPinValues;
    const inputRefs = isChangePin
      ? type === "oldPin"
        ? oldPinInputRefs
        : newPinInputRefs
      : pinInputRefs;

    const firstEmptyIndex = values.findIndex((val) => val === "");
    const validIndex = firstEmptyIndex === -1 ? 3 : firstEmptyIndex;

    if (index !== validIndex) {
      inputRefs[validIndex].current?.focus();
      return;
    }

    const newValues = [...values];
    newValues[index] = text.replace(/[^0-9]/g, "").slice(0, 1);
    if (isChangePin) {
      setValues((prev) => ({ ...prev, [type]: newValues }));
    } else {
      setValues(newValues);
    }

    if (text && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
    if (!text && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleForgotPin = async () => {
    try {
      const response = await axiosInstance.post(
        "/users/profile/my-wallet/forgot-wallet-password"
      );
      Alert.alert(
        t("success"),
        t("newPinSentToEmail"),
        [
          {
            text: t("ok"),
            onPress: () => {
              router.push("/(tabs)/home");
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error requesting new PIN:", error);
      Alert.alert(t("error"), t("failedToRequestNewPin"));
    }
  };

  return (
    <GestureHandlerRootView style={commonStyles.containerContent}>
      <Header title={t("myWallet")} onLeftPress={handleBack} />
      <View style={styles.container}>
        <View style={styles.balanceContainer}>
          <View style={styles.balanceHeader}>
            <Text style={styles.walletTitle}>{t("vietchefWallet")}</Text>
          </View>
          <View style={styles.balanceRow}>
            <View style={styles.balanceInfo}>
              <Text style={styles.balanceText}>
                ${balance.toLocaleString("en-US")}
              </Text>
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.depositContainer}
                onPress={handleDeposit}
              >
                <Ionicons name="add-circle-outline" size={18} color="#fff" />
                <Text style={styles.depositText}>{t("topUp")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.depositContainer}
                onPress={handleWithdrawal}
              >
                <Ionicons name="remove-circle-outline" size={18} color="#fff" />
                <Text style={styles.depositText}>{t("withdraw")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.changePinButton}
                onPress={openChangePinModal}
              >
                <Ionicons name="lock-closed-outline" size={18} color="#fff" />
                <Text style={styles.depositText}>{t("changePin")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {transactions.length > 0 ? (
          <View style={styles.transactionHistory}>
            <View style={styles.headerRow}>
              <Text style={styles.monthYear}>{t("allTransactions")}</Text>
              <TouchableOpacity
                style={styles.statisticButton}
                onPress={handleStatistic}
              >
                <Text style={styles.statisticText}>{t("statistic")}</Text>
                <Ionicons name="chevron-forward" size={18} color="#FF69B4" />
              </TouchableOpacity>
            </View>
            {filteredTransactions.length > 0 ? (
              <FlatList
                data={filteredTransactions}
                renderItem={renderTransaction}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.transactionListContainer}
              />
            ) : (
              <Text style={styles.noTransactions}>{t("noTransactions")}</Text>
            )}
          </View>
        ) : (
          <Text style={styles.noTransactions}>{t("noTransactions")}</Text>
        )}
      </View>

      {/* Modal for Access/Set PIN */}
      <Modalize
        ref={modalizeRef}
        adjustToContentHeight={true}
        handlePosition="outside"
        modalStyle={styles.modalStyle}
        handleStyle={styles.handleStyle}
        onOpened={() => {
          const firstEmptyIndex = pinValues.findIndex((val) => val === "");
          const focusIndex = firstEmptyIndex === -1 ? 3 : firstEmptyIndex;
          pinInputRefs[focusIndex].current?.focus();
        }}
        closeOnOverlayTap={false}
        panGestureEnabled={false}
      >
        <View style={styles.modalContent}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              closeModal();
              router.push("/(tabs)/profile");
            }}
          >
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {hasPassword ? t("enterWalletPin") : t("setWalletPin")}
          </Text>
          <Text style={styles.modalSubtitle}>{t("enter4DigitPin")}</Text>
          <View style={styles.pinContainer}>
            {[0, 1, 2, 3].map((index) => (
              <Animated.View
                key={index}
                style={[
                  styles.pinBox,
                  pinValues[index] === "" && index === pinValues.join("").length
                    ? { opacity: blinkAnim }
                    : {},
                ]}
              >
                <TextInput
                  ref={pinInputRefs[index]}
                  style={styles.pinInput}
                  value={pinValues[index]}
                  onChangeText={(text) => handlePinChange(text, index)}
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
          <TouchableOpacity onPress={handleForgotPin}>
            <Text style={styles.forgotPinText}>{t("forgotPin")}</Text>
          </TouchableOpacity>
        </View>
      </Modalize>

      {/* Modal for Change PIN */}
      <Modalize
        ref={changePinModalizeRef}
        adjustToContentHeight={true}
        handlePosition="outside"
        modalStyle={styles.modalStyle}
        handleStyle={styles.handleStyle}
        onOpened={() => {
          const firstEmptyIndex = changePinValues.oldPin.findIndex((val) => val === "");
          const focusIndex = firstEmptyIndex === -1 ? 3 : firstEmptyIndex;
          oldPinInputRefs[focusIndex].current?.focus();
        }}
        closeOnOverlayTap={false}
        panGestureEnabled={false}
      >
        <View style={styles.modalContent}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={closeChangePinModal}
          >
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{t("changePin")}</Text>
          
          <Text style={styles.modalSubtitle}>{t("enterOldPin")}</Text>
          <View style={styles.pinContainer}>
            {[0, 1, 2, 3].map((index) => (
              <Animated.View
                key={`old-${index}`}
                style={[
                  styles.pinBox,
                  changePinValues.oldPin[index] === "" &&
                  index === changePinValues.oldPin.join("").length
                    ? { opacity: blinkAnim }
                    : {},
                ]}
              >
                <TextInput
                  ref={oldPinInputRefs[index]}
                  style={styles.pinInput}
                  value={changePinValues.oldPin[index]}
                  onChangeText={(text) => handlePinChange(text, index, "oldPin")}
                  keyboardType="numeric"
                  maxLength={1}
                  secureTextEntry={true}
                  textAlign="center"
                  selectionColor="transparent"
                />
              </Animated.View>
            ))}
          </View>

          <Text style={styles.modalSubtitle}>{t("enterNewPin")}</Text>
          <View style={styles.pinContainer}>
            {[0, 1, 2, 3].map((index) => (
              <Animated.View
                key={`new-${index}`}
                style={[
                  styles.pinBox,
                  changePinValues.newPin[index] === "" &&
                  index === changePinValues.newPin.join("").length &&
                  changePin.oldPin.length === 4
                    ? { opacity: blinkAnim }
                    : {},
                ]}
              >
                <TextInput
                  ref={newPinInputRefs[index]}
                  style={styles.pinInput}
                  value={changePinValues.newPin[index]}
                  onChangeText={(text) => handlePinChange(text, index, "newPin")}
                  keyboardType="numeric"
                  maxLength={1}
                  secureTextEntry={true}
                  textAlign="center"
                  selectionColor="transparent"
                />
              </Animated.View>
            ))}
          </View>

          {changePinError && <Text style={styles.errorText}>{changePinError}</Text>}
          <TouchableOpacity onPress={handleForgotPin}>
            <Text style={styles.forgotPinText}>{t("forgotPin")}</Text>
          </TouchableOpacity>
        </View>
      </Modalize>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 0,
  },
  balanceContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  balanceHeader: {
    marginBottom: 12,
  },
  walletTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  balanceRow: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  balanceInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  balanceText: {
    fontSize: 18,
    color: "#222",
    fontWeight: "600",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    flexWrap: "wrap",
    gap: 10,
  },
  depositContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00b894",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    width: "45%",
    justifyContent: "center",
  },
  changePinButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#A64B2A",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    width: "45%",
    justifyContent: "center",
  },
  depositText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 6,
    fontSize: 14,
  },
  transactionHistory: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: 20,
    borderRadius: 16,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  statisticButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  statisticText: {
    fontSize: 16,
    color: "#FF69B4",
    marginRight: 5,
    fontWeight: "500",
  },
  transactionListContainer: {
    paddingBottom: 10,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginHorizontal: 10,
    marginBottom: 10,
    position: "relative",
  },
  transactionIcon: {
    marginRight: 12,
    justifyContent: "center",
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  transactionDate: {
    fontSize: 12,
    color: "#777",
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: "600",
  },
  transactionBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  noTransactions: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 14,
    color: "#666",
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
    marginBottom: 10,
  },
  pinContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
    marginBottom: 10,
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

export default WalletScreen;