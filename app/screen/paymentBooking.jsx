import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import Header from "../../components/header";
import Toast from "react-native-toast-message";
import useAxios from "../../config/AXIOS_API";
import { t } from "i18next";

const PaymentBookingScreen = () => {
  const params = useLocalSearchParams();
  const bookingId = params.bookingId;
  const bookingData = JSON.parse(params.bookingData || "{}");
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const axiosInstance = useAxios();

  const totalPrice = bookingData?.totalPrice || 0;
  console.log("Booking Data:", bookingData);

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
        text1: "Success",
        text2: "Payment completed successfully!",
      });

      router.push("(tabs)/home"); // Quay về màn hình chính sau khi thanh toán
    } catch (error) {
      console.error("Error completing payment:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2:
          error.response?.data?.message ||
          error.message ||
          "Failed to complete payment. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = () => {
    setModalVisible(true); // Mở modal xác nhận
  };

  const handleBackHome = () => {
    router.push("(tabs)/home"); // Quay về màn hình chính mà không thanh toán
  };

  const confirmPayment = () => {
    setModalVisible(false); // Đóng modal
    handleCompletePayment(); // Thực hiện thanh toán
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title={t("confirmAndPayment")} />
      <View style={styles.content}>
        <Text style={styles.title}>{t("bookingPayment")}</Text>
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
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t("confirmPayment")}</Text>
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
    </SafeAreaView>
  );
};

export default PaymentBookingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EBE5DD",
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 40, // Đưa nội dung lên cao hơn một chút
    justifyContent: "flex-start", // Đưa nội dung lên trên
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  priceContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  priceLabel: {
    fontSize: 18,
    color: "#555",
  },
  priceValue: {
    fontSize: 32,
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
    padding: 15,
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
  modalContent: {
    width: "80%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  modalTitle: {
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
});
