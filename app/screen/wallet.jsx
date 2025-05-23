import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  TextInput,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import Header from "../../components/header";
import { commonStyles } from "../../style";
import { router } from "expo-router";
import useAxios from "../../config/AXIOS_API";
import moment from "moment/moment";
import { t } from "i18next";
import { Modalize } from "react-native-modalize";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import axios from "axios";
import { useCommonNoification } from "../../context/commonNoti";

const WalletScreen = () => {
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const [walletId, setWalletId] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [paypalAccountEmail, setPaypalAccountEmail] = useState(null);
  const [pinInputs, setPinInputs] = useState(['', '', '', '']);
  const [oldPinInputs, setOldPinInputs] = useState(['', '', '', '']);
  const [newPinInputs, setNewPinInputs] = useState(['', '', '', '']);
  const pinRefs = useRef([]);
  const oldPinRefs = useRef([]);
  const newPinRefs = useRef([]);
  const [hasPassword, setHasPassword] = useState(null);
  const axiosInstance = useAxios();
  const modalizeRef = useRef(null);
  const changePinModalizeRef = useRef(null);
  const [error, setError] = useState("");
  const [changePinError, setChangePinError] = useState("");
  const { showModal } = useCommonNoification();
  const [modalKey, setModalKey] = useState(0);
  const [type, setType] = useState(0);
  const getPIN = (arr) => arr.join('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [refresh, setRefresh] = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  const toggleBalance = () => setShowBalance(prev => !prev);
  useEffect(() => {
    checkWalletPassword();
    fetchWalletData(0, true);
  }, []);

  const openModal = (tp) => {
    setType(tp);
    setModalKey((prev) => prev + 1);
    setPinInputs(['', '', '', '']);
    setTimeout(() => {
      modalizeRef.current?.open();
    }, 100)
  };

  const closeModal = () => {
    modalizeRef.current?.close();
    setPinInputs(['', '', '', '']);
    setError("");
  };

  const openChangePinModal = () => {
    setModalKey((prev) => prev + 1);
    setOldPinInputs(['', '', '', '']);
    setNewPinInputs(['', '', '', '']);
    setTimeout(() => {
      changePinModalizeRef.current?.open();
    }, 100)
  };

  const closeChangePinModal = () => {
    changePinModalizeRef.current?.close();
    setChangePinError("");

  };

  const fetchWalletData = async (page, isRefresh = false) => {
    if (loading && !isRefresh) return;
    setLoading(true);
    try {
      const response = await axiosInstance.get("/users/profile/my-wallet/all", {
        params: {
          pageNo: page,
          pageSize: 10,
          sortBy: "createdAt",
          sortDir: "desc",
        },
      });
      const walletData = response.data.wallet;
      setBalance(walletData.balance ?? 0);
      setWalletId(walletData.id);
      setPaypalAccountEmail(walletData.paypalAccountEmail);
      const trans = walletData.walletType === "CUSTOMER" ? response.data.customerTransactions?.content || [] : response.data.chefTransactions?.content || [];
      setTotalPages(walletData.walletType === "CUSTOMER" ? response.data.customerTransactions?.totalPages || 0 : response.data.chefTransactions?.totalPages || 0);
      console.log(totalPages);
      console.log(page);
      console.log(isRefresh);
      // setTransactions((prev) => {
      //   return isRefresh ? trans : [...prev, ...trans];
      // });
      setTransactions(prev => {
        const newData = trans.filter(tx => !prev.some(p => p.id === tx.id));
        return isRefresh ? trans : [...prev, ...newData];

      });

    } catch (error) {
      if (axios.isCancel(error) || error.response?.status === 401) return;
      console.log(t('error'), error.response.data.message || "Có lỗi xảy ra khi tải dữ liệu", "Failed");
    } finally {
      setLoading(false);
      if (isRefresh) setRefresh(false);
    }
  };


  console.log(transactions.length);

  const [isFetching, setIsFetching] = useState(false);

  const loadMoreData = async () => {
    if (!loading && !isFetching && page + 1 <= totalPages - 1) {
      setIsFetching(true);
      const nextPage = page + 1;
      try {
        await fetchWalletData(nextPage);
        setPage(nextPage);
      } finally {
        setIsFetching(false);
      }
    }
  };


  const handleRefresh = async () => {
    setRefresh(true);
    setPage(0);
    await fetchWalletData(0, true);
  };

  const checkWalletPassword = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        "/users/profile/my-wallet/has-password"
      );
      setHasPassword(response.data);
    } catch (error) {
      console.error("Error checking wallet password:", error);
    } finally {
      setLoading(false);
    }
  };

  const setWalletPassword = async () => {
    const pin = getPIN(pinInputs);
    if (pin.length !== 4) {
      setError(t("pinMustBe4Digits"));
      return;
    }
    setLoading(true);
    try {
      await axiosInstance.post(
        `/users/profile/my-wallet/set-password?password=${pin}`
      );
      closeModal();
      fetchWalletData(0, true);
    } catch (error) {
      if (axios.isCancel(error) || error.response?.status === 401) return;
      setError(
        error?.response?.data?.message || t("failedToSetPin")
      );
      setPinInputs(['', '', '', '']);
    } finally {
      setLoading(false);
    }
  };

  const accessWallet = async () => {
    const pin = getPIN(pinInputs);
    if (pin.length !== 4) {
      console.log("PIN length invalid:", pin.length);
      setError(t("pinMustBe4Digits"));
      return;
    }
    setLoading(true);
    try {
      const response = await axiosInstance.post(
        `/users/profile/my-wallet/access?password=${pin}`
      );
      console.log("Access wallet response:", response.data);
      console.log(type);
      if (response.data === true) {
        closeModal();
        if (type === 1) {
          handleDeposit()
        } else if (type === 2) {
          handleWithdrawal()
        }
      } else {
        setPinInputs(['', '', '', '']);
        setError(t("invalidPin"));
      }
    } catch (error) {
      if (axios.isCancel(error) || error.response?.status === 401) return;
      console.error("Error accessing wallet:", error.response?.data.message);
      setPinInputs(['', '', '', '']);
      setError(t("invalidPin"));
    } finally {
      setLoading(false);
      setType(0);
    }
  };

  const changeWalletPassword = async () => {
    const oldPin = getPIN(oldPinInputs);
    const newPin = getPIN(newPinInputs);
    if (oldPin.length !== 4 || newPin.length !== 4) {
      setChangePinError(t("pinMustBe4Digits"));
      return;
    }
    setLoading(true);
    try {
      const accessResponse = await axiosInstance.post(
        `/users/profile/my-wallet/access?password=${oldPin}`
      );
      if (accessResponse.data !== true) {
        showModal(t("error"), "Incorrect old PIN", "Failed");
        return;
      }

      const setResponse = await axiosInstance.post(
        `/users/profile/my-wallet/set-password?password=${newPin}`
      );
      if (setResponse.status === 200 || setResponse.status === 201) {
        closeChangePinModal();
        showModal(t("success"), t("pinChangedSuccessfully"), "Success");
        setError("");
      }
    } catch (error) {
      if (axios.isCancel(error) || error.response?.status === 401) return;
      showModal("Error", error.response.data.message, "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = () => {
    console.log("cung dau")
    if (walletId) {
      router.replace({
        pathname: "/screen/deposit",
        params: { id: walletId, balance },
      });
    } else {
      showModal(t("error"), t("walletIdNotFound"), "Failed");
    }
  };

  const handleWithdrawal = () => {
    if (walletId) {
      router.replace({
        pathname: "/screen/withdrawal",
        params: { id: walletId, balance, paypalAccountEmail },
      });
    }
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
            <Text style={styles.transactionDate}>{item.createdAt ? moment(item.createdAt).format("HH:mm - DD/MM/YYYY") : "Unknown date"} </Text>
            < Text style={[styles.transactionAmount, { color }]}>
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

  const handlePinChange = (text, index, state, setState, refs) => {

    const updated = [...state];
    const prevVal = updated[index];

    if (!/^\d*$/.test(text)) return;

    updated[index] = text;
    setState(updated);

    if (!text && prevVal && index > 0) {
      refs.current[index - 1].focus();
      return;
    }
    if (text && index < 3) refs.current[index + 1].focus();
  };

  const handleForgotPin = async () => {
    try {
      const response = await axiosInstance.post(
        "/users/profile/my-wallet/forgot-wallet-password"
      );
      showModal(t("success"), t("newPinSentToEmail"), "Success");
    } catch (error) {
      showModal(t("error"), t("failedToRequestNewPin"), "Failed");
    }
  };

  return (
    <GestureHandlerRootView style={commonStyles.container}>
      <Header title={t("myWallet")} />
      <View style={commonStyles.containerContent}>
        <View style={styles.balanceContainer}>
          <View style={styles.balanceHeader}>
            <Text style={styles.walletTitle}>{t("vietchefWallet")}</Text>
          </View>
          <View style={styles.balanceRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 20 }}>
              <Text style={styles.balanceText}>
                Số dư: {showBalance ? balance : '***'}
              </Text>
              <TouchableOpacity onPress={toggleBalance} style={{ marginLeft: 8 }}>
                <MaterialIcons
                  name={showBalance ? 'visibility' : 'visibility-off'}
                  size={20}
                  color="#555"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.depositContainer}
                onPress={() => hasPassword ? openModal(1) : handleDeposit()}
              >
                <Ionicons name="add-circle-outline" size={18} color="#fff" />
                <Text style={styles.depositText}>{t("topUp")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.depositContainer}
                onPress={() => hasPassword ? openModal(2) : handleWithdrawal()}
              >
                <Ionicons name="remove-circle-outline" size={18} color="#fff" />
                <Text style={styles.depositText}>{t("withdraw")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.changePinButton}
                onPress={hasPassword ? openChangePinModal : openModal}
              >
                <Ionicons name="lock-closed-outline" size={18} color="#fff" />
                <Text style={styles.depositText}>{hasPassword ? t("changePin") : t("setPin")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

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
          <FlatList
            data={transactions}
            renderItem={renderTransaction}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.transactionListContainer}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
            onEndReached={() => {
              loadMoreData();
            }}
            onEndReachedThreshold={0.2}
            refreshing={refresh}
            onRefresh={handleRefresh}
            ListEmptyComponent={<Text style={styles.noTransactions}>{t("noTransactions")}</Text>}
          />
        </View>
      </View>

      {/* Modal for Access/Set PIN */}
      <Modalize
        ref={modalizeRef}
        adjustToContentHeight={true}
        key={modalKey}
      >
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {hasPassword ? t("enterWalletPin") : t("setWalletPin")}
          </Text>
          <Text style={styles.modalSubtitle}>{t("enter4DigitPin")}</Text>
          <View style={styles.pinContainer}>
            {pinInputs.map((val, i) => (
              <View key={i} style={styles.pinBox}>
                <TextInput
                  ref={ref => pinRefs.current[i] = ref}
                  style={styles.pinInput}
                  keyboardType="numeric"
                  maxLength={1}
                  value={val}
                  secureTextEntry={true}
                  onChangeText={text => handlePinChange(text, i, pinInputs, setPinInputs, pinRefs)}
                // onKeyPress={e => handleKeyPress(e, i, pinInputs, pinRefs)}
                />
              </View>
            ))}
          </View>
          {error && <Text style={styles.errorText}>{error}</Text>}
          {hasPassword && (
            <TouchableOpacity onPress={handleForgotPin}>
              <Text style={styles.forgotPinText}>{t("forgotPin")}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={{ marginVertical: 20, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#A64B2A', borderRadius: 20 }} onPress={() => hasPassword ? accessWallet() : setWalletPassword()}>
            <Text style={{ fontSize: 16, color: 'white', fontWeight: 'bold' }}>{t('confirm')}</Text>
          </TouchableOpacity>
        </View>
      </Modalize>

      {/* Modal for Change PIN */}
      <Modalize
        ref={changePinModalizeRef}
        adjustToContentHeight={true}
        key={`change ${modalKey}`}
      >
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={closeChangePinModal}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {t("changePin")}
          </Text>
          <Text style={styles.modalSubtitle}>{t("enterOldPin")}</Text>
          <View style={styles.pinContainer}>
            {oldPinInputs.map((val, i) => (
              <View key={i} style={styles.pinBox}>
                <TextInput
                  ref={ref => oldPinRefs.current[i] = ref}
                  style={styles.pinInput}
                  keyboardType="numeric"
                  maxLength={1}
                  secureTextEntry={true}
                  value={val}
                  onChangeText={text => handlePinChange(text, i, oldPinInputs, setOldPinInputs, oldPinRefs)}
                />
              </View>
            ))}
          </View>
          <Text style={styles.modalSubtitle}>{t("enterNewPin")}</Text>
          <View style={styles.pinContainer}>
            {newPinInputs.map((val, i) => (
              <View key={i} style={styles.pinBox}>
                <TextInput
                  ref={ref => newPinRefs.current[i] = ref}
                  style={styles.pinInput}
                  keyboardType="numeric"
                  maxLength={1}
                  secureTextEntry={true}
                  value={val}
                  onChangeText={text => handlePinChange(text, i, newPinInputs, setNewPinInputs, newPinRefs)}
                />
              </View>
            ))}
          </View>
          {changePinError && <Text style={styles.errorText}>{changePinError}</Text>}
          <TouchableOpacity style={{ marginVertical: 20, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#A64B2A', borderRadius: 20 }} onPress={() => changeWalletPassword()}>
            <Text style={{ fontSize: 16, color: 'white', fontWeight: 'bold' }}>{t('confirm')}</Text>
          </TouchableOpacity>
        </View>
      </Modalize>
    </GestureHandlerRootView >
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
    // marginHorizontal: 20,
    // marginTop: 20,
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