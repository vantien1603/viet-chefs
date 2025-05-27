import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/header";
import { commonStyles } from "../../style";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import WebView from "react-native-webview";
import { router, useLocalSearchParams } from "expo-router";
import useAxios from "../../config/AXIOS_API";
import { t } from "i18next";
import { useCommonNoification } from "../../context/commonNoti";
import axios from "axios";

const DepositScreen = () => {
  const [amount, setAmount] = useState("");
  const [showWebView, setShowWebView] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");
  const params = useLocalSearchParams();
  const walletId = params.id;
  const balance = params.balance;
  const axiosInstance = useAxios();
  const { showModal } = useCommonNoification();
  const predefinedAmounts = [5, 10, 20, 50, 100, 500];

  const handleDeposit = async () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      showModal(t("modal.error"), t("errors.invalidAmount"), t("modal.failed"))
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post(
        `/payment/deposit?walletId=${walletId}&amount=${amount}`
      );

      if (response.data) {
        setPaymentUrl(response.data);
        setShowWebView(true);
      } else {
        showModal(t("modal.error"), t("errors.noPaymentUrl"), t("modal.failed"))
        return;
      }
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      showModal(t("modal.error"), t("errors.createTransactionFailed"), t("modal.failed"));
    } finally {
      setLoading(false);
    }
  };

  const onNavigationStateChange = (navState) => {
    const { url } = navState;
    if (url.includes(t("modal.success"))) {
      showModal(t("modal.success"), t("topUpSuccess"), t("modal.success"));
      setShowWebView(false);
      router.replace({
        pathname: "/screen/wallet",
        params: {
          depositAmount: amount,
          refresh: "true",
        },
      });
    } else if (url.includes("cancel")) {
      showModal(t("modal.error"), t("errors.transactionCancelled"), t("modal.failed"));

      setShowWebView(false);
    }
  };

  const handleAmountPress = (amount) => {
    const text = String(amount);
    setAmount(text); // Cập nhật amount thay vì depositAmount
  };

  const handleBack = () => {
    router.replace("/screen/wallet");
  }

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title={t("topUp")} onLeftPress={() => handleBack()} />
      <View style={styles.balanceContainer}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={styles.sectionTitle}>{t("currentBalance")}</Text>
          <Text style={styles.sectionTitle}>${balance}</Text>
        </View>
        <View style={styles.separator} />
        <View style={{ position: "relative" }}>
          <TextInput
            placeholder={t("enterDepositAmount")}
            keyboardType="numeric"
            style={styles.input}
            placeholderTextColor="#999"
            value={amount} // Sử dụng amount thay vì depositAmount
            onChangeText={(text) => {
              setAmount(text);
            }}
          />
          {amount.length > 0 && (
            <TouchableOpacity
              onPress={() => setAmount("")} // Cập nhật amount
              style={styles.clearIcon}
            >
              <MaterialIcons name="highlight-remove" size={24} color="black" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <View style={styles.amountButtonsContainer}>
        {predefinedAmounts.map((amount, index) => (
          <TouchableOpacity
            key={index}
            style={styles.amountButton}
            onPress={() => handleAmountPress(amount)}
          >
            <Text style={styles.amountText}>${amount}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.paymentContainer}>
        <Text style={styles.sectionTitle}>{t("paymentMethod")}</Text>
        <View style={styles.paymentMethod}>
          <View style={styles.paymentRow}>
            <View style={styles.paymentIconText}>
              <Ionicons
                name="logo-paypal"
                size={24}
                color="#003087"
                style={{ marginRight: 10 }}
              />
              <Text style={styles.paymentText}>Paypal</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={[styles.depositButton, loading && styles.disabledButton]}
          onPress={handleDeposit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.depositText}>{t("deposit")}</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={showWebView}
        animationType="slide"
        onRequestClose={() => setShowWebView(false)}
      >
        <View style={styles.webViewContainer}>
          <View style={styles.webViewHeader}>
            <TouchableOpacity
              onPress={() => setShowWebView(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#A9411D" />
            </TouchableOpacity>
            <Text style={styles.webViewTitle}>{t("payWithPaypal")}</Text>
          </View>
          {paymentUrl ? (
            <WebView
              source={{ uri: paymentUrl }}
              style={{ flex: 1 }}
              onNavigationStateChange={onNavigationStateChange}
              javaScriptEnabled={true}
              domStorageEnabled={true}
            />
          ) : (
            <Text style={styles.errorText}>{t("loadingPayment")}</Text>
          )}
          {loading && (
            <ActivityIndicator
              size="large"
              color="#A9411D"
              style={styles.loading}
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  balanceContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginHorizontal: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "nunito-bold",
    marginBottom: 8,
  },
  separator: {
    height: 1,
    backgroundColor: "#EEE",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: "#333",
    fontFamily: "nunito-regular"
  },
  paymentContainer: {
    marginHorizontal: 5,
    marginVertical: 10,
  },
  paymentMethod: {
    borderColor: "#DDD",
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
    backgroundColor: "#FAFAFA",
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paymentIconText: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentText: {
    fontSize: 16,
    color: "#333",
    fontFamily: "nunito-regular"
  },
  bottomButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "#EBE5DD",
    borderTopWidth: 1,
    borderColor: "#EEE",
  },
  depositButton: {
    backgroundColor: "#A9411D",
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#A9411D80",
  },
  depositText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "nunito-bold",
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  webViewHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  closeButton: {
    padding: 10,
  },
  webViewTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontFamily: "nunito-bold",
    color: "#333",
  },
  loading: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -15 }, { translateY: -15 }],
  },
  errorText: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    color: "#A9411D",
    marginTop: 20,
    fontFamily: "nunito-regular"
  },
  amountButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    backgroundColor: "#fff",
    padding: 10,
    marginHorizontal: 5,
  },
  amountButton: {
    width: "30%",
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 10,
    padding: 10,
    marginVertical: 5,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
  },
  amountText: {
    fontSize: 14,
    color: "#333",
    fontFamily: "nunito-bold"
  },
  clearIcon: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: [{ translateY: -12 }],
    zIndex: 1,
  },
});

export default DepositScreen;