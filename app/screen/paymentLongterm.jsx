import React, { useContext } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Header from "../../components/header";
import useAxios from "../../config/AXIOS_API";
import { AuthContext } from "../../config/AuthContext";
import Toast from "react-native-toast-message";

const PaymentLongterm = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const axiosInstance = useAxios();
  const { user } = useContext(AuthContext);

  const bookingId = params.bookingId;
  const bookingData = JSON.parse(params.bookingData || "{}");
  const totalPrice = bookingData.totalPrice || 0;
  const depositAmount = totalPrice * 0.05;

  const handleConfirmDeposit = async () => {
    try {
      if (!user) {
        throw new Error("Vui lòng đăng nhập để tiếp tục.");
      }
      if (!bookingId) {
        throw new Error("Không tìm thấy ID đặt chỗ.");
      }

      // Gọi API đặt cọc
      const response = await axiosInstance.post(
        `/bookings/${bookingId}/deposit`
      );

      if (response.status === 200 || response.status === 201) {
        Toast.show({
          type: "success",
          text1: "Thành công",
          text2: "Đặt cọc đã được xác nhận!",
        });
        router.push("(tabs)/home");
      }
    } catch (error) {
      console.error("Error confirming deposit:", error?.response?.data);
      const errorMessage =
        error.response?.data?.message ||
        "Có lỗi khi xác nhận đặt cọc. Vui lòng thử lại.";
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: errorMessage,
      });
    }
  };

  // const handleBackPress = () => {
  //   Toast.show({
  //     type: "info",
  //     text1: "Quay lại",
  //     text2: "Đã quay lại màn hình xác nhận đặt chỗ.",
  //     visibilityTime: 2000,
  //   });
  //   router.push({
  //     pathname: "/screen/reviewBooking",
  //     params: {
  //       bookingData: JSON.stringify(bookingData),
  //       chefId: params.chefId,
  //       selectedPackage: params.selectedPackage,
  //       numPeople: params.numPeople,
  //       selectedDates: params.selectedDates,
  //     },
  //   });
  // };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Thanh toán đặt cọc" />
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Xác nhận đặt cọc</Text>

        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tổng tiền đặt chỗ:</Text>
            <Text style={styles.summaryValue}>${totalPrice.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Số tiền đặt cọc (5%):</Text>
            <Text style={[styles.summaryValue, styles.depositValue]}>
              ${depositAmount.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Số tiền còn lại:</Text>
            <Text style={styles.summaryValue}>
              ${(totalPrice - depositAmount).toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Thông tin đặt chỗ:</Text>
          <Text style={styles.infoValue}>
            Địa điểm: {bookingData.bookingDetails?.[0]?.location || "N/A"}
          </Text>
          <Text style={styles.infoValue}>
            Số ngày: {bookingData.bookingDetails?.length || 0}
          </Text>
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      <View style={styles.buttonArea}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => router.push("/(tabs)/home")}
        >
          <Text style={styles.confirmButtonText}>Quay về trang chủ</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirmDeposit}
        >
          <Text style={styles.confirmButtonText}>Xác nhận đặt cọc</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
    borderColor: "#ccc",
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
    borderColor: "#ccc",
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
    borderTopColor: "#ccc",
    flexDirection: "row", // Sắp xếp nút theo hàng ngang
    justifyContent: "space-between", // Các nút cách đều nhau
  },
  confirmButton: {
    backgroundColor: "#A64B2A",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    flex: 1, // Mỗi nút chiếm không gian đều
    marginHorizontal: 5, // Khoảng cách giữa các nút
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  spacer: {
    height: 100,
  },
});

export default PaymentLongterm;
