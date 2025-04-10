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
import { Ionicons } from "@expo/vector-icons";
import WebView from "react-native-webview";
import Toast from "react-native-toast-message";
import { router, useLocalSearchParams } from "expo-router";
import useAxios from "../../config/AXIOS_API";

const DepositScreen = () => {
  const [amount, setAmount] = useState("");
  const [showWebView, setShowWebView] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");
  const params = useLocalSearchParams();
  const walletId = params.id;
  const balance = params.balance;
  const axiosInstance = useAxios();

  const handleDeposit = async () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Vui lòng nhập số tiền hợp lệ!",
      });
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
        throw new Error("Không nhận được URL thanh toán từ server");
      }
    } catch (error) {
      console.error("Error creating PayPal deposit:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: error.response?.data?.message || "Không thể tạo giao dịch PayPal",
      });
    } finally {
      setLoading(false);
    }
  };

  const onNavigationStateChange = (navState) => {
    const { url } = navState;
    if (url.includes("success")) {
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Nạp tiền thành công!",
      });
      setShowWebView(false);
      router.push({
        pathname: "/screen/wallet",
        params: { 
          depositAmount: amount,
          refresh: "true"
        },
      });
    } else if (url.includes("cancel")) {
      Toast.show({
        type: "info",
        text1: "Đã hủy",
        text2: "Giao dịch đã bị hủy.",
      });
      setShowWebView(false);
    }
  };

  const handleBack = async () => {
    router.push("/screen/wallet");
  };

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title="Deposit in VietPay" onLeftPress={handleBack} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.balanceContainer}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={styles.sectionTitle}>Số dư hiện tại</Text>
            <Text style={styles.sectionTitle}>{balance}</Text>
          </View>
          <View style={styles.separator} />
          <TextInput
            placeholder="Nhập số tiền cần nạp"
            keyboardType="numeric"
            style={styles.input}
            placeholderTextColor="#999"
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        <View style={styles.paymentContainer}>
          <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
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
      </ScrollView>

      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={[styles.depositButton, loading && styles.disabledButton]}
          onPress={handleDeposit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.depositText}>Nạp tiền</Text>
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
            <Text style={styles.webViewTitle}>Thanh toán qua PayPal</Text>
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
            <Text style={styles.errorText}>Đang tải thanh toán...</Text>
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
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  balanceContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
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
  },
  paymentContainer: {
    marginBottom: 20,
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
    fontWeight: "600",
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
    fontWeight: "600",
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
  },
});

export default DepositScreen;