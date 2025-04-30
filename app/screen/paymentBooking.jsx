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
import useAxios from "../../config/AXIOS_API";
import { t } from "i18next";
import useRequireAuthAndNetwork from "../../hooks/useRequireAuthAndNetwork";
import { useConfirmModal } from "../../context/commonConfirm";
import { useCommonNoification } from "../../context/commonNoti";
import axios from "axios";
import { useSelectedItems } from "../../context/itemContext";

const PaymentBookingScreen = () => {
  const params = useLocalSearchParams();
  const bookingId = params.bookingId;
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const axiosInstance = useAxios();
  const [isPaySuccess, setIsPaySuccess] = useState(false);
  const requireAuthAndNetwork = useRequireAuthAndNetwork();
  const { showConfirm } = useConfirmModal();
  const { showModal } = useCommonNoification();
  const { totalPrice } = useSelectedItems();

  const handleCompletePayment = async () => {
    console.log("press nef")
    setLoading(true);
    try {
      const response = await axiosInstance.post(
        `/bookings/${bookingId}/payment`,
        {}
      );
      console.log("Payment Response:", response.data);
      if (response.status === 200) {
        showModal("Success", "Payment successfully", "Success");
        setIsPaySuccess(true);
      }

      // router.push("(tabs)/home");
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      showModal("Error", "Có lỗi xảy ra trong quá trình thanh toán", "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleBackHome = () => {
    router.push("(tabs)/home");
  };

  const confirmPayment = () => {
    setModalVisible(false);
    handleCompletePayment();
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
            style={[styles.button, isPaySuccess ? styles.paymentButton : styles.backButton]}
            onPress={handleBackHome}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{t("backHome")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, isPaySuccess ? styles.backButton : styles.paymentButton]}
            onPress={() =>
              showConfirm("Complete payment", "Are you sure you want to pay this booking?", () => requireAuthAndNetwork(handleCompletePayment))
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
    paddingTop: 40, 
    justifyContent: "flex-start", 
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
    textAlign: 'center'
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
